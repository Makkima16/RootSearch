import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Method } from '../enums/method.enum';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'create_course',
    description: 'Nombre único del permiso',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Permite crear un nuevo curso',
    description: 'Descripción del permiso',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    enum: Method,
    example: Method.Post,
    description: 'Método HTTP asociado',
  })
  @IsEnum(Method)
  @IsNotEmpty()
  method: Method;
}
