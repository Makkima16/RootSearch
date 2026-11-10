import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Habilitar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS restringido al frontend (lista separada por comas en CORS_ORIGIN)
  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins, credentials: true });

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('RootSearch API')
    .setDescription(
      'API para el sistema educativo RootSearch - Gestión de usuarios, cursos y documentos',
    )
    .setVersion('1.0')
    .addTag('auth', 'Endpoints de autenticación y autorización')
    .addTag('users', 'Gestión de usuarios (Docentes y Estudiantes)')
    .addTag('courses', 'Gestión de cursos y matrícula de estudiantes')
    .addTag('materials', 'Generación de material de estudio con IA')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);

  logger.log(`Aplicación corriendo en: http://localhost:${port}`);
  logger.log(`Documentación Swagger: http://localhost:${port}/api`);
}
bootstrap();
