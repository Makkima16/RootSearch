import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

/**
 * Guard que verifica que el usuario solo pueda acceder a sus propios datos
 *
 * Uso:
 * @UseGuards(JwtAuthGuard, UserOwnershipGuard)
 * @Get('users/:userId')
 * async getUser(@Param('userId') userId: string) { ... }
 *
 * El usuario en el JWT debe coincidir con el userId del parámetro
 */
@Injectable()
export class UserOwnershipGuard implements CanActivate {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Usuario del JWT (del JwtAuthGuard)
    const targetUserId = request.params.userId || request.params.id;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    if (!targetUserId) {
      throw new ForbiddenException('ID de usuario no proporcionado');
    }

    // Los administradores pueden acceder a cualquier usuario
    if (user.roles?.includes('administrador')) {
      return true;
    }

    // Verificar que el usuario del JWT sea el mismo que el userId solicitado
    if (user.id !== targetUserId) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a este usuario',
      );
    }

    // Verificar que el usuario existe
    const targetUser = await this.userModel.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return true;
  }
}
