import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course, CourseDocument } from '../schemas/course.schema';

/**
 * Guard que verifica que el usuario esté inscrito en el curso
 *
 * Uso:
 * @UseGuards(JwtAuthGuard, CourseEnrollmentGuard)
 * @Get('courses/:courseId/content')
 * @Get('courses/:courseId/materials')
 * async getCourseMaterials(@Param('courseId') courseId: string) { ... }
 *
 * Solo estudiantes inscritos, el instructor, y administradores pueden acceder
 */
@Injectable()
export class CourseEnrollmentGuard implements CanActivate {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Usuario del JWT
    const courseId = request.params.courseId || request.params.id;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    if (!courseId) {
      throw new ForbiddenException('ID de curso no proporcionado');
    }

    // Los administradores pueden acceder a cualquier curso
    if (user.roles?.includes('administrador')) {
      return true;
    }

    // Buscar el curso con estudiantes y docente
    const course = await this.courseModel
      .findById(courseId)
      .populate('teacher')
      .populate('students')
      .exec();

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    // Verificar si es el docente del curso
    const teacherId = (course.teacher as any)._id || course.teacher;
    if (teacherId.toString() === user.id) {
      request.course = course;
      return true;
    }

    // Verificar si el usuario está inscrito como estudiante
    const isEnrolled = course.students.some((student: any) => {
      const studentId = student._id || student;
      return studentId.toString() === user.id;
    });

    if (!isEnrolled) {
      throw new ForbiddenException(
        'No estás inscrito en este curso. Debes inscribirte primero.',
      );
    }

    // Adjuntar el curso al request
    request.course = course;

    return true;
  }
}
