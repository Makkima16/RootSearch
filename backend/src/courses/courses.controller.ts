import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  FileTypeValidator,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { EnrollStudentsDto } from './dto/enroll-students.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('courses')
@ApiBearerAuth('JWT-auth')
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles('administrador', 'docente') // Admin o Docente pueden crear cursos
  @ApiOperation({
    summary: 'Crear un nuevo curso',
    description:
      'Crea un nuevo curso en el sistema. Accesible por ADMIN y DOCENTE. El profesor debe tener rol DOCENTE. Permite subir un PDF de syllabus opcional.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Datos del curso y archivo PDF opcional',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        teacherId: { type: 'string' },
        studentIds: {
          type: 'string',
          description: 'IDs de estudiantes separados por comas',
          example: '507f1f77bcf86cd799439012,507f1f77bcf86cd799439013',
        },
        piaa_syllabus: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Curso creado exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o el profesor no tiene rol DOCENTE.',
  })
  @ApiResponse({
    status: 404,
    description: 'Profesor o estudiantes no encontrados.',
  })
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'pdf' })],
        fileIsRequired: false,
      }),
    )
    file?: any,
  ) {
    return this.coursesService.create(
      createCourseDto,
      user as UserDocument,
      file,
    );
  }

  @Get('all')
  @Roles('administrador') // Solo administradores pueden ver todos los cursos
  @ApiOperation({
    summary: 'Obtener todos los cursos disponibles (Solo Admin)',
    description:
      'Obtiene la lista completa de todos los cursos en el sistema sin filtros. Este endpoint es exclusivo para administradores.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista completa de cursos obtenida exitosamente.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado. Solo administradores.',
  })
  findAllCourses() {
    return this.coursesService.findAllCourses();
  }

  @Get()
  @Roles('administrador', 'docente', 'estudiante') // Todos los roles autenticados pueden ver cursos
  @ApiOperation({
    summary: 'Obtener todos los cursos',
    description:
      'Obtiene la lista de todos los cursos. Se puede filtrar por profesor o estudiante usando parámetros query.',
  })
  @ApiQuery({
    name: 'teacher',
    required: false,
    description: 'Filtrar cursos por ID del profesor',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({
    name: 'student',
    required: false,
    description: 'Filtrar cursos por ID del estudiante',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cursos obtenida exitosamente.',
  })
  findAll(
    @Query('teacher') teacherId?: string,
    @Query('student') studentId?: string,
  ) {
    if (teacherId) {
      return this.coursesService.findByTeacher(teacherId);
    }
    if (studentId) {
      return this.coursesService.findByStudent(studentId);
    }
    return this.coursesService.findAll();
  }

  @Get(':id')
  @Roles('administrador', 'docente', 'estudiante')
  @ApiOperation({
    summary: 'Obtener un curso por ID',
    description:
      'Obtiene la información detallada de un curso específico, incluyendo profesor y estudiantes.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del curso',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Curso encontrado.',
  })
  @ApiResponse({
    status: 404,
    description: 'Curso no encontrado.',
  })
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  @Roles('administrador', 'docente') // Admin o Docente pueden actualizar cursos
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Actualizar un curso',
    description:
      'Actualiza la información de un curso existente. Todos los campos son opcionales. Se puede subir un nuevo PDF de syllabus.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Datos del curso a actualizar y archivo PDF opcional',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        teacherId: { type: 'string' },
        studentIds: { type: 'array', items: { type: 'string' } },
        active: { type: 'boolean' },
        piaa_syllabus: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiParam({
    name: 'id',
    description: 'ID del curso a actualizar',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Curso actualizado exitosamente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Curso no encontrado.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'pdf' })],
        fileIsRequired: false,
      }),
    )
    file?: any,
  ) {
    return this.coursesService.update(id, updateCourseDto, file);
  }

  @Post(':id/enroll')
  @Roles('administrador', 'docente') // Admin o Docente pueden inscribir estudiantes
  @ApiOperation({
    summary: 'Inscribir estudiantes en un curso',
    description:
      'Inscribe uno o más estudiantes en el curso. Los estudiantes deben tener rol ESTUDIANTE. Evita duplicados automáticamente.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del curso',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Estudiantes inscritos exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o estudiantes no tienen rol ESTUDIANTE.',
  })
  @ApiResponse({
    status: 404,
    description: 'Curso o estudiantes no encontrados.',
  })
  enrollStudents(
    @Param('id') id: string,
    @Body() enrollStudentsDto: EnrollStudentsDto,
  ) {
    return this.coursesService.enrollStudents(id, enrollStudentsDto);
  }

  @Post(':id/unenroll')
  @Roles('administrador', 'docente') // Admin o Docente pueden desinscribir estudiantes
  @ApiOperation({
    summary: 'Desinscribir estudiantes de un curso',
    description: 'Remueve uno o más estudiantes del curso.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del curso',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Estudiantes desinscritos exitosamente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Curso no encontrado.',
  })
  unenrollStudents(
    @Param('id') id: string,
    @Body() enrollStudentsDto: EnrollStudentsDto,
  ) {
    return this.coursesService.unenrollStudents(id, enrollStudentsDto);
  }

  @Delete(':id')
  @Roles('administrador') // Solo Admin puede eliminar cursos
  @ApiOperation({
    summary: 'Eliminar un curso',
    description:
      'Elimina un curso del sistema de forma permanente. Solo accesible por ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del curso a eliminar',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Curso eliminado exitosamente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Curso no encontrado.',
  })
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  @Post(':id/syllabus')
  @Roles('administrador', 'docente')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Subir o actualizar el Syllabus (PDF) del curso',
    description:
      'Sube un archivo PDF, extrae el texto y lo guarda como metadatos PIAA del curso.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo PDF del Syllabus',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiParam({
    name: 'id',
    description: 'ID del curso',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Syllabus actualizado exitosamente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Curso no encontrado.',
  })
  async uploadSyllabus(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'pdf' })],
      }),
    )
    file: any,
  ) {
    return this.coursesService.update(id, {}, file);
  }

  @Get(':id/pia')
  @Roles('administrador', 'docente', 'estudiante')
  @ApiOperation({ summary: 'Descargar el PIA del curso en PDF' })
  @ApiParam({ name: 'id', description: 'ID del curso' })
  @ApiResponse({ status: 200, description: 'Archivo PDF descargado.' })
  @ApiResponse({ status: 404, description: 'Curso o PIA no encontrado.' })
  async exportPia(@Param('id') id: string, @Res() res: Response) {
    const course = await this.coursesService.findOne(id);

    if (!course || !course.pia) {
      throw new NotFoundException('PIA no encontrado para este curso');
    }

    // Decodificar Base64 a Buffer
    const pdfBuffer = Buffer.from(course.pia, 'base64');

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=PIA_${course.name.replace(/\s+/g, '_')}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get('by-teacher/:teacherId')
  @Roles('administrador', 'docente')
  @ApiOperation({
    summary: 'Obtener cursos por ID del profesor',
    description: 'Devuelve los cursos asociados a un profesor específico.',
  })
  @ApiParam({
    name: 'teacherId',
    required: true,
    description: 'ID del profesor para filtrar los cursos',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cursos obtenida exitosamente.',
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron cursos para el profesor dado.',
  })
  getCoursesByTeacher(@Param('teacherId') teacherId: string) {
    return this.coursesService.findByTeacher(teacherId);
  }
}
