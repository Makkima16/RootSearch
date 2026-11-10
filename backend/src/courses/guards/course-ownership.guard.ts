import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course, CourseDocument } from '../../courses/schemas/course.schema';

/**
 * Guard que verifica que solo el docente creador del curso pueda modificarlo
 *
 * Uso:
 * @UseGuards(JwtAuthGuard, CourseOwnershipGuard)
 * @Put('courses/:courseId')
 * @Patch('courses/:courseId')
 * @Delete('courses/:courseId')
 * async updateCourse(@Param('courseId') courseId: string) { ... }
 *
 * Solo el docente que creó el curso (instructor) puede modificarlo
 * Los administradores también pueden modificar cualquier curso
 */
@Injectable()
export class CourseOwnershipGuard implements CanActivate {
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

    // Los administradores pueden modificar cualquier curso
    if (user.roles?.includes('administrador')) {
      return true;
    }

    // Buscar el curso
    const course = await this.courseModel
      .findById(courseId)
      .populate('teacher')
      .exec();

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    // Verificar que el usuario sea el docente del curso
    const teacherId = (course.teacher as any)._id || course.teacher;

    if (teacherId.toString() !== user.id) {
      throw new ForbiddenException(
        'Solo el docente del curso puede realizar esta acción',
      );
    }

    // Adjuntar el curso al request para usarlo en el controlador si es necesario
    request.course = course;

    return true;
  }
}
