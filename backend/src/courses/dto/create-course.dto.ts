import {
  IsNotEmpty,
  IsString,
  IsMongoId,
  IsArray,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({
    description: 'Nombre del curso',
    example: 'Ingeniería de Software III',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Descripción detallada del curso',
    example:
      'Curso avanzado de ingeniería de software con enfoque en arquitecturas modernas',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'URL de la imagen del curso',
    example: 'https://example.com/course-image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiProperty({
    description: 'Texto extraído del PDF del plan de estudios (opcional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  piaa_syllabus?: string;

  @ApiProperty({
    description: 'Archivo PIA en formato Base64',
    required: false,
  })
  @IsOptional()
  @IsString()
  pia?: string;

  @ApiProperty({
    description:
      'ID del usuario que será el profesor del curso (debe tener rol DOCENTE)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty()
  @IsMongoId()
  teacherId: string;

  @ApiProperty({
    description:
      'Array de IDs de estudiantes a inscribir en el curso. Puede ser un array o un string separado por comas (opcional)',
    example: '507f1f77bcf86cd799439012,507f1f77bcf86cd799439013',
    required: false,
    type: String,
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id);
    }
    if (Array.isArray(value)) {
      return value;
    }
    return [];
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  studentIds?: string[];
}
