import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { Permissions } from './decorators/permissions.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión - Envía código de verificación por email',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Código de verificación enviado al correo electrónico.',
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar código y obtener token JWT' })
  @ApiBody({ type: VerifyCodeDto })
  @ApiResponse({
    status: 200,
    description: 'Código verificado. Retorna token JWT y datos del usuario.',
  })
  @ApiResponse({ status: 401, description: 'Código inválido o expirado' })
  async verifyCode(@Body() verifyCodeDto: VerifyCodeDto) {
    return this.authService.verifyCode(verifyCodeDto.email, verifyCodeDto.code);
  }

  @Post('register')
  @ApiOperation({
    summary: 'Registrar nuevo usuario - Envía código de verificación por email',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description:
      'Usuario registrado exitosamente. Código de verificación enviado al correo electrónico.',
  })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario con roles y permisos.',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Email de recuperación enviado si el correo existe.',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña con token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada exitosamente.',
  })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
      resetPasswordDto.confirmPassword,
    );
  }

  // Ejemplo: Solo administradores
  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrador')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Endpoint solo para administradores' })
  @ApiResponse({
    status: 200,
    description: 'Acceso permitido para administradores.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Rol insuficiente',
  })
  adminOnly() {
    return { message: 'Solo administradores pueden ver esto' };
  }

  // Ejemplo: Docentes y Administradores
  @Get('docentes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('docente', 'administrador')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Área de docentes - Gestión de cursos' })
  @ApiResponse({
    status: 200,
    description: 'Acceso para docentes y administradores.',
  })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  docenteArea() {
    return { message: 'Área de docentes - gestión de cursos' };
  }

  // Ejemplo: Endpoint con permiso específico
  @Get('create-course')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('create:course')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear curso - Requiere permiso específico' })
  @ApiResponse({
    status: 200,
    description: 'Usuario tiene permiso para crear cursos.',
  })
  @ApiResponse({ status: 403, description: 'Permiso insuficiente' })
  createCourse() {
    return { message: 'Tienes permiso para crear cursos' };
  }

  // Ejemplo: Todos los roles autenticados
  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Dashboard - Para todos los usuarios autenticados' })
  @ApiResponse({ status: 200, description: 'Dashboard del usuario.' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  dashboard(@CurrentUser() user: any) {
    return {
      message: `Bienvenido ${user.name}`,
      role: user.roles[0],
    };
  }
}
