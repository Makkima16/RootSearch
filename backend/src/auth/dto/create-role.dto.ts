import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'profesor', description: 'Nombre único del rol' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Rol con permisos para gestionar cursos',
    description: 'Descripción del rol',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: ['60d5ecb8b487343568912345'],
    description: 'IDs de los permisos asignados',
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  permissions?: string[];
}
