import {
  Injectable,
  NotFoundException,
  Inject,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transcription } from '../transcription/schemas/transcription.schema';
import { GeneratedMaterial } from './schemas/material.schema';
import { CourseMaterial } from './schemas/course-material.schema';
import { Course } from '../courses/schemas/course.schema';
import { User } from '../auth/schemas/user.schema';
import { Role } from '../auth/schemas/role.schema';
import {
  CONTENT_GENERATOR,
  IContentGenerator,
} from '../content-generation/adapters/content-generation.interface';
import {
  TRANSCRIPTOR_SERVICE,
  ITranscriptor,
} from '../transcription/transcription.interface';
import { EmailService } from '../auth/services/email.service';
import { StudentCourseMaterialDto } from './dto/student-course-material.dto';
import { FILE_STORAGE, IFileStorage } from './storage/file-storage.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MaterialsService {
  private readonly logger = new Logger(MaterialsService.name);

  constructor(
    @InjectModel(Transcription.name)
    private transcriptionModel: Model<Transcription>,
    @InjectModel(GeneratedMaterial.name)
    private materialModel: Model<GeneratedMaterial>,
    @InjectModel(CourseMaterial.name)
    private courseMaterialModel: Model<CourseMaterial>,
    @InjectModel(Course.name)
    private courseModel: Model<Course>,
    @InjectModel(User.name)
    private userModel: Model<User>,
    @Inject(CONTENT_GENERATOR) private contentGenerator: IContentGenerator,
    @Inject(TRANSCRIPTOR_SERVICE) private transcriptor: ITranscriptor,
    @Inject(FILE_STORAGE) private storage: IFileStorage,
    private emailService: EmailService,
  ) {}

  async processAudioForCourse(
    file: Express.Multer.File,
    courseId: string,
    userId: string,
  ) {
    // 1. Guardar archivo temporalmente
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, `${Date.now()}-${file.originalname}`);
    fs.writeFileSync(filePath, file.buffer);

    try {
      // 2. Transcribir
      const text = await this.transcriptor.transcribir(filePath, 'es');

      // 3. Guardar Transcripción
      const newTranscription = new this.transcriptionModel({
        userId: new Types.ObjectId(userId),
        courseId: new Types.ObjectId(courseId),
        text: text,
        originalFileName: file.originalname,
        fileSize: file.size,
        status: 'completed',
        language: 'es',
      });
      const savedTranscription = await newTranscription.save();

      // 4. Generar Materiales
      return this.generarTodoSecuencial(savedTranscription._id.toString());
    } finally {
      // 5. Limpiar archivo temporal
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  async generarTodoSecuencial(transcriptionId: string) {
    // 1. Buscar la transcripción existente
    const transcription = await this.transcriptionModel
      .findById(transcriptionId)
      .populate('userId')
      .populate('courseId');
    if (!transcription || !transcription.text) {
      throw new NotFoundException(
        'Transcripción no encontrada o sin texto listo',
      );
    }

    // 2. Crear material inicial
    const nuevoMaterial = new this.materialModel({
      transcriptionId: transcription._id,
      courseId: transcription.courseId,
      estado: 'GENERANDO',
    });
    await nuevoMaterial.save();

    const texto = transcription.text;
    const course = transcription.courseId as any;
    const syllabusContexto = course?.piaa_syllabus || '';

    try {
      // 3. Generar secuencialmente y guardar progreso
      const resumen = await this.contentGenerator.generarResumen(
        texto,
        syllabusContexto,
      );
      nuevoMaterial.resumen = resumen;
      await nuevoMaterial.save();

      const glosario = await this.contentGenerator.generarGlosario(
        texto,
        syllabusContexto,
      );
      nuevoMaterial.glosario = glosario;
      await nuevoMaterial.save();

      const quiz = await this.contentGenerator.generarQuiz(
        texto,
        syllabusContexto,
      );
      nuevoMaterial.quiz = quiz;
      await nuevoMaterial.save();

      const checklist = await this.contentGenerator.generarChecklist(
        texto,
        syllabusContexto,
      );
      nuevoMaterial.checklist = checklist;

      // Calcular alineación PIAA si existe syllabus
      if (syllabusContexto) {
        try {
          const alineacion = await this.contentGenerator.calcularAlineacion(
            texto,
            syllabusContexto,
          );
          nuevoMaterial.piaa_alignment = alineacion;
        } catch (e) {
          this.logger.warn('Error calculando alineación PIAA', e);
        }
      }

      nuevoMaterial.estado = 'PENDIENTE_REVISION';
      const savedMaterial = await nuevoMaterial.save();

      // --- 4. NUEVO: NOTIFICAR AL DOCENTE ---
      if (transcription.userId && (transcription.userId as any).email) {
        const teacherEmail = (transcription.userId as any).email;
        this.logger.log(`Enviando correo a: ${teacherEmail}`);
        await this.emailService.sendNotificationEmail(
          teacherEmail,
          '¡Tu material de estudio está listo! 📚',
          `Hemos terminado de procesar la clase. Ya puedes revisar el resumen, quiz y glosario generados.`,
        );
      }

      return savedMaterial;
    } catch (error) {
      nuevoMaterial.estado = 'ERROR_GENERACION';
      await nuevoMaterial.save();
      throw error;
    }
  }

  async generarSoloResumen(materialId: string) {
    const material = await this.materialModel
      .findById(materialId)
      .populate('transcriptionId');
    if (!material) throw new NotFoundException('Material no encontrado');

    const transcription = material.transcriptionId as any;
    const texto = transcription.text;

    const resumen = await this.contentGenerator.generarResumen(texto);
    material.resumen = resumen;
    return material.save();
  }

  async generarSoloQuiz(materialId: string) {
    const material = await this.materialModel
      .findById(materialId)
      .populate('transcriptionId');
    if (!material) throw new NotFoundException('Material no encontrado');

    const transcription = material.transcriptionId as any;
    const texto = transcription.text;

    const quiz = await this.contentGenerator.generarQuiz(texto);
    material.quiz = quiz;
    return material.save();
  }

  async findAll(transcriptionId?: string, user?: any) {
    const filter: any = {};
    if (transcriptionId) {
      filter.transcriptionId = transcriptionId;
    }

    // Filtro de privacidad para estudiantes
    if (user && user.roles && user.roles.includes('estudiante')) {
      filter.estado = 'PUBLICADO';
    }

    return this.materialModel.find(filter).exec();
  }

  async findByCourse(courseId: string, user: any) {
    const filter: any = { courseId };

    // Filtro de privacidad para estudiantes
    if (user && user.roles && user.roles.includes('estudiante')) {
      filter.estado = 'PUBLICADO';
    }

    return this.materialModel.find(filter).exec();
  }

  async findOne(id: string, user?: any) {
    const material = await this.materialModel.findById(id).exec();
    if (!material) {
      throw new NotFoundException(`Material con ID ${id} no encontrado`);
    }

    // Verificación de privacidad para estudiantes
    if (user && user.roles && user.roles.includes('estudiante')) {
      if (material.estado !== 'PUBLICADO') {
        throw new NotFoundException(`Material no disponible para estudiantes`);
      }
    }

    return material;
  }

  async publish(id: string) {
    const material = await this.materialModel.findById(id).populate({
      path: 'transcriptionId',
      populate: { path: 'userId' },
    });

    if (!material) {
      throw new NotFoundException(`Material con ID ${id} no encontrado`);
    }
    material.estado = 'PUBLICADO';
    const savedMaterial = await material.save();

    // Enviar correo al docente
    const transcription = material.transcriptionId as any;
    if (transcription && transcription.userId && transcription.userId.email) {
      await this.emailService.sendNotificationEmail(
        transcription.userId.email,
        'Material Publicado 🚀',
        `Has publicado el material para el curso. Ahora es visible para los estudiantes.`,
      );
    }

    return savedMaterial;
  }

  async update(id: string, updateMaterialDto: any) {
    const updatedMaterial = await this.materialModel
      .findByIdAndUpdate(id, updateMaterialDto, { new: true })
      .exec();
    if (!updatedMaterial) {
      throw new NotFoundException(`Material con ID ${id} no encontrado`);
    }
    return updatedMaterial;
  }

  async remove(id: string) {
    const deletedMaterial = await this.materialModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedMaterial) {
      throw new NotFoundException(`Material con ID ${id} no encontrado`);
    }
    return deletedMaterial;
  }

  async getStudentCourseMaterials(
    studentId: string,
    requestingUserId: string,
  ): Promise<StudentCourseMaterialDto[]> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('ID de estudiante inválido');
    }

    if (!Types.ObjectId.isValid(requestingUserId)) {
      throw new BadRequestException('ID de usuario solicitante inválido');
    }

    // Verificar que el usuario existe y obtener sus roles
    const student = await this.userModel
      .findById(studentId)
      .populate('roles', 'name')
      .exec();

    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    // Verificar que el usuario tiene el rol de estudiante
    const roles = student.roles as Role[];
    const isStudent = roles.some(
      (role) => role.name.toLowerCase() === 'estudiante',
    );

    if (!isStudent) {
      throw new BadRequestException(
        'El usuario especificado no tiene el rol de estudiante',
      );
    }

    // Verificar que el usuario solicitante es el mismo estudiante
    const studentIdStr = studentId.toString();
    const requestingUserIdStr = requestingUserId.toString();

    if (studentIdStr !== requestingUserIdStr) {
      throw new BadRequestException(
        'Solo puedes consultar tus propios materiales de curso',
      );
    }

    // Buscar todos los cursos en los que está inscrito el estudiante
    const courses = await this.courseModel
      .find({ students: new Types.ObjectId(studentId) })
      .select('_id name')
      .exec();

    if (!courses || courses.length === 0) {
      return [];
    }

    // Obtener IDs de cursos
    const courseIds = courses.map((c) => c._id);

    // Buscar todos los materiales de estos cursos
    const materials = await this.courseMaterialModel
      .find({ courseId: { $in: courseIds } })
      .exec();

    // Mapear a DTOs con información del curso y URL de acceso
    const result: StudentCourseMaterialDto[] = materials.map((material) => {
      const course = courses.find(
        (c) => c._id.toString() === material.courseId.toString(),
      );

      return {
        courseName: course?.name || 'Curso desconocido',
        courseId: material.courseId.toString(),
        materialId: String((material as any)._id),
        title: material.title,
        description: material.description,
        type: material.type,
        originalName: material.originalName,
        storageRef: this.storage.getAccessUrl(material.storageRef),
      };
    });

    return result;
  }
}
