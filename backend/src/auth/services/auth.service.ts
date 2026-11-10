import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { User, UserDocument } from '../schemas/user.schema';
import { Role, RoleDocument } from '../schemas/role.schema';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel
      .findOne({ email })
      .populate({
        path: 'roles',
        populate: {
          path: 'permissions',
        },
      })
      .exec();

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const verifyCode = await this.generateVerifyCode(user._id.toString());

    try {
      await this.emailService.sendVerificationCode(
        user.email,
        verifyCode,
        user.name,
      );
    } catch (error) {
      console.error('Error al enviar email:', error);
    }
    return {
      message: 'Código de verificación enviado a tu correo electrónico',
      email: user.email,
      requiresVerification: true,
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userModel.findOne({
      email: registerDto.email,
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    let estudianteRole = await this.roleModel
      .findOne({ name: 'estudiante' })
      .exec();

    if (!estudianteRole) {
      estudianteRole = await this.roleModel.create({
        name: 'estudiante',
        description: 'Estudiante del sistema',
        permissions: [],
      });
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const newUser = await this.userModel.create({
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
      roles: [estudianteRole._id],
    });

    const verifyCode = await this.generateVerifyCode(
      (newUser._id as any).toString(),
    );

    try {
      await this.emailService.sendWelcomeEmail(
        newUser.email,
        verifyCode,
        newUser.name,
      );
    } catch (error) {
      console.error('Error al enviar email de bienvenida:', error);
    }

    return {
      message:
        'Usuario registrado exitosamente. Código de verificación enviado a tu correo electrónico.',
      email: newUser.email,
      name: newUser.name,
      requiresVerification: true,
    };
  }

  async getProfile(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate({
        path: 'roles',
        populate: {
          path: 'permissions',
        },
      })
      .select('-password')
      .exec();

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return user;
  }

  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findUserById(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findById(id)
      .populate({
        path: 'roles',
        populate: {
          path: 'permissions',
        },
      })
      .exec();
  }

  async generateVerifyCode(userId: string): Promise<number> {
    const verifyCode = randomInt(100000, 1000000);
    const verifyCodeExpiration = new Date(Date.now() + 15 * 60 * 1000);

    await this.userModel.findByIdAndUpdate(userId, {
      verifyCode,
      verifyCodeExpiration,
    });

    return verifyCode;
  }

  async verifyCode(email: string, code: number) {
    const user = await this.userModel
      .findOne({ email })
      .populate({
        path: 'roles',
        populate: {
          path: 'permissions',
        },
      })
      .exec();

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (user.verifyCode !== code) {
      throw new UnauthorizedException('Código de verificación inválido');
    }

    if (user.verifyCodeExpiration && user.verifyCodeExpiration < new Date()) {
      throw new UnauthorizedException('Código de verificación expirado');
    }

    await this.userModel.findByIdAndUpdate(user._id, {
      $unset: { verifyCode: '', verifyCodeExpiration: '' },
    });

    const roles = user.roles.map((role: any) => role.name);
    const permissions = user.roles.flatMap((role: any) =>
      role.permissions.map((perm: any) => ({
        name: perm.name,
        method: perm.method,
      })),
    );

    const payload = {
      sub: user._id,
      email: user.email,
      name: user.name,
      roles: roles,
      permissions: permissions,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        sub: user._id,
        email: user.email,
        name: user.name,
        roles: roles,
      },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      return {
        message: 'Si el correo existe, recibirás un enlace de recuperación',
      };
    }

    const resetToken = this.jwtService.sign(
      {
        sub: user._id,
        email: user.email,
        type: 'password-reset',
      },
      { expiresIn: '1h' },
    );

    const resetPasswordExpiration = new Date(Date.now() + 60 * 60 * 1000);
    await this.userModel.findByIdAndUpdate(user._id, {
      resetPasswordToken: resetToken,
      resetPasswordExpiration: resetPasswordExpiration,
    });

    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.name,
      );
    } catch (error) {
      console.error('Error al enviar email de recuperación:', error);
      throw new Error('Error al enviar el correo de recuperación');
    }

    return {
      message:
        'Se ha enviado un enlace de recuperación a tu correo electrónico',
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    if (newPassword !== confirmPassword) {
      throw new UnauthorizedException('Las contraseñas no coinciden');
    }

    let decoded;
    try {
      decoded = this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    if (decoded.type !== 'password-reset') {
      throw new UnauthorizedException('Token inválido');
    }

    const user = await this.userModel.findOne({
      _id: decoded.sub,
      resetPasswordToken: token,
    });

    if (!user) {
      throw new UnauthorizedException('Token inválido o ya utilizado');
    }

    if (
      user.resetPasswordExpiration &&
      user.resetPasswordExpiration < new Date()
    ) {
      throw new UnauthorizedException('Token expirado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.userModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      $unset: { resetPasswordToken: '', resetPasswordExpiration: '' },
    });

    return {
      message: 'Contraseña actualizada exitosamente',
    };
  }
}
