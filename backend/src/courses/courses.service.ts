import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from './schemas/course.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Role, RoleDocument } from '../auth/schemas/role.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { EnrollStudentsDto } from './dto/enroll-students.dto';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdf = require('pdf-parse/lib/pdf-parse.js');

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
  ) {}

  async create(
    createCourseDto: CreateCourseDto,
    user?: UserDocument,
    file?: any,
  ): Promise<Course> {
    let piaaText = createCourseDto.piaa_syllabus || '';
    let piaBase64 = createCourseDto.pia || '';

    // Si el docente subió un PDF, lo guardamos como Base64 en el campo 'pia'
    if (file) {
      try {
        // Convertir buffer a Base64
        piaBase64 = file.buffer.toString('base64');

        // Opcional: Si aún queremos extraer texto para búsquedas, podemos dejarlo,
        // pero la prioridad ahora es guardar el archivo.
        // Por ahora, mantenemos la extracción de texto como secundario si se desea.
        const data = await pdf(file.buffer);
        piaaText = data.text.replace(/\n+/g, '\n');
      } catch (error) {
        console.error('Error al procesar el PDF del PIAA', error);
      }
    }

    // Verificar que el profesor existe y tiene el rol DOCENTE
    const teacher = await this.userModel
      .findById(createCourseDto.teacherId)
      .populate('roles')
      .exec();

    if (!teacher) {
      throw new NotFoundException('El profesor especificado no existe');
    }

    const hasTeacherRole = await this.hasRole(teacher, 'docente');
    if (!hasTeacherRole) {
      throw new BadRequestException(
        'El usuario especificado no tiene el rol de docente',
      );
    }

    // Verificar estudiantes si se proporcionan
    if (createCourseDto.studentIds && createCourseDto.studentIds.length > 0) {
      await this.validateStudents(createCourseDto.studentIds);
    }

    // Crear el curso
    const newCourse = new this.courseModel({
      name: createCourseDto.name,
      description: createCourseDto.description,
      photo: createCourseDto.photo,
      piaa_syllabus: piaaText,
      pia: piaBase64,
      teacher: new Types.ObjectId(createCourseDto.teacherId),
      students: createCourseDto.studentIds
        ? createCourseDto.studentIds.map((id) => new Types.ObjectId(id))
        : [],
    });

    const savedCourse = await newCourse.save();

    const course = await this.courseModel
      .findById(savedCourse._id)
      .populate('teacher', 'name email')
      .populate('students', 'name email')
      .exec();

    return course as Course;
  }

  async findAll(): Promise<Course[]> {
    return this.courseModel
      .find()
      .populate('teacher', 'name email')
      .populate('students', 'name email')
      .exec();
  }

  async findAllCourses(): Promise<Course[]> {
    return this.courseModel
      .find()
      .populate('teacher', 'name email')
      .populate('students', 'name email')
      .exec();
  }

  async findOne(id: string): Promise<Course> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de curso inválido');
    }

    const course = await this.courseModel
      .findById(id)
      .populate('teacher', 'name email')
      .populate('students', 'name email')
      .exec();

    if (!course) {
      throw new NotFoundException(`Curso con ID ${id} no encontrado`);
    }

    return course;
  }

  async findByTeacher(teacherId: string): Promise<Course[]> {
    if (!Types.ObjectId.isValid(teacherId)) {
      throw new BadRequestException('ID de profesor inválido');
    }

    const courses = await this.courseModel
      .find({ teacher: new Types.ObjectId(teacherId) })
      .populate('teacher', 'name email')
      .populate('students', 'name email')
      .exec();

    return courses || [];
  }

  async findByStudent(studentId: string): Promise<Course[]> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('ID de estudiante inválido');
    }

    return this.courseModel
      .find({ students: studentId })
      .populate('teacher', 'name email')
      .populate('students', 'name email')
      .exec();
  }

  async update(
    id: string,
    updateCourseDto: UpdateCourseDto,
    file?: any,
  ): Promise<Course> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de curso inválido');
    }

    const course = await this.courseModel.findById(id).exec();

    if (!course) {
      throw new NotFoundException(`Curso con ID ${id} no encontrado`);
    }

    // Lógica de actualización de PIAA Syllabus y PIA Base64
    if (file) {
      try {
        // Guardar PDF como Base64
        course.pia = file.buffer.toString('base64');

        // Extraer texto para piaa_syllabus
        const data = await pdf(file.buffer);
        course.piaa_syllabus = data.text.replace(/\n+/g, '\n');
      } catch (error) {
        console.error('Error al procesar el PDF del PIAA en update', error);
      }
    } else {
      if (updateCourseDto.piaa_syllabus !== undefined) {
        course.piaa_syllabus = updateCourseDto.piaa_syllabus;
      }
      if (updateCourseDto.pia !== undefined) {
        course.pia = updateCourseDto.pia;
      }
    }

    // Si se actualiza el profesor, verificar que existe y tiene rol DOCENTE
    if (updateCourseDto.teacherId) {
      const teacher = await this.userModel
        .findById(updateCourseDto.teacherId)
        .populate('roles')
        .exec();

      if (!teacher) {
        throw new NotFoundException('El profesor especificado no existe');
      }

      const hasTeacherRole = await this.hasRole(teacher, 'docente');
      if (!hasTeacherRole) {
        throw new BadRequestException(
          'El usuario especificado no tiene el rol de DOCENTE',
        );
      }

      course.teacher = new Types.ObjectId(updateCourseDto.teacherId);
    }

    // Si se actualizan los estudiantes, validarlos
    if (updateCourseDto.studentIds) {
      await this.validateStudents(updateCourseDto.studentIds);
      course.students = updateCourseDto.studentIds.map(
        (id) => new Types.ObjectId(id),
      );
    }

    // Actualizar otros campos
    if (updateCourseDto.name) course.name = updateCourseDto.name;
    if (updateCourseDto.description)
      course.description = updateCourseDto.description;
    if (updateCourseDto.photo) course.photo = updateCourseDto.photo;
    if (updateCourseDto.active !== undefined)
      course.active = updateCourseDto.active;

    const updatedCourse = await course.save();

    const result = await this.courseModel
      .findById(updatedCourse._id)
      .populate('teacher', 'name email')
      .populate('students', 'name email')
      .exec();

    return result as Course;
  }

  async enrollStudents(
    id: string,
    enrollStudentsDto: EnrollStudentsDto,
  ): Promise<Course> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de curso inválido');
    }

    const course = await this.courseModel.findById(id).exec();

    if (!course) {
      throw new NotFoundException(`Curso con ID ${id} no encontrado`);
    }

    // Validar estudiantes
    await this.validateStudents(enrollStudentsDto.studentIds);

    // Agregar estudiantes sin duplicados
    const currentStudentIds = (course.students as Types.ObjectId[]).map((s) =>
      s.toString(),
    );
    const newStudentIds = enrollStudentsDto.studentIds.filter(
      (id) => !currentStudentIds.includes(id),
    );

    const newStudentObjectIds = newStudentIds.map(
      (id) => new Types.ObjectId(id),
    );
    course.students = [
      ...(course.students as Types.ObjectId[]),
      ...newStudentObjectIds,
    ];

    await course.save();

    const result = await this.courseModel
      .findById(course._id)
      .populate('teacher', 'name email')
      .populate('students', 'name email')
      .exec();

    return result as Course;
  }

  async unenrollStudents(
    id: string,
    enrollStudentsDto: EnrollStudentsDto,
  ): Promise<Course> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de curso inválido');
    }

    const course = await this.courseModel.findById(id).exec();

    if (!course) {
      throw new NotFoundException(`Curso con ID ${id} no encontrado`);
    }

    // Remover estudiantes
    const studentIds = course.students as Types.ObjectId[];
    course.students = studentIds.filter(
      (studentId) =>
        !enrollStudentsDto.studentIds.includes(studentId.toString()),
    );

    await course.save();

    const result = await this.courseModel
      .findById(course._id)
      .populate('teacher', 'name email')
      .populate('students', 'name email')
      .exec();

    return result as Course;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de curso inválido');
    }

    const result = await this.courseModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Curso con ID ${id} no encontrado`);
    }
  }

  // Métodos auxiliares privados
  private async validateStudents(studentIds: string[]): Promise<void> {
    for (const studentId of studentIds) {
      if (!Types.ObjectId.isValid(studentId)) {
        throw new BadRequestException(
          `ID de estudiante inválido: ${studentId}`,
        );
      }

      const student = await this.userModel
        .findById(studentId)
        .populate('roles')
        .exec();

      if (!student) {
        throw new NotFoundException(
          `Estudiante con ID ${studentId} no encontrado`,
        );
      }

      const hasStudentRole = await this.hasRole(student, 'estudiante');
      if (!hasStudentRole) {
        throw new BadRequestException(
          `El usuario ${student.name} no tiene el rol de ESTUDIANTE`,
        );
      }
    }
  }

  private async hasRole(
    user: UserDocument,
    roleName: string,
  ): Promise<boolean> {
    const roles = user.roles as any[];

    for (const role of roles) {
      if (
        typeof role === 'object' &&
        role.name.toUpperCase() === roleName.toUpperCase()
      ) {
        return true;
      } else if (typeof role === 'string' || role instanceof Types.ObjectId) {
        const roleDoc = await this.roleModel.findById(role).exec();
        if (roleDoc && roleDoc.name.toUpperCase() === roleName.toUpperCase()) {
          return true;
        }
      }
    }

    return false; // Retornar false si no se encuentra el rol
  }
}
