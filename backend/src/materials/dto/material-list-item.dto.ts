import { ApiProperty } from '@nestjs/swagger';
import { CourseMaterialType } from '../schemas/course-material.schema';

export class MaterialListItemDto {
  @ApiProperty({
    description: 'ID del curso al que pertenece el material',
    example: '69169f8f89f550d1c96c635d',
  })
  courseId: string;

  @ApiProperty({
    description: 'ID del usuario que subió el material',
    example: '692b9b65cb7fb175d95382b2',
  })
  uploaderId: string;

  @ApiProperty({
    description: 'Tipo de material',
    enum: CourseMaterialType,
    example: CourseMaterialType.PDF,
  })
  type: CourseMaterialType;

  @ApiProperty({
    description: 'Nombre de archivo almacenado',
    example: 'Segundo parcial.pdf',
  })
  filename: string;

  @ApiProperty({
    description: 'Nombre de archivo original',
    example: 'Segundo parcial.pdf',
  })
  originalName: string;

  @ApiProperty({
    description: 'Referencia o URL de acceso en el proveedor de almacenamiento',
    example:
      'https://drive.google.com/file/d/1PahYtniPC_kAwRxaOSYWBoz3HwCTcQkA/view',
  })
  storageRef: string;

  @ApiProperty({
    description: 'Título del material (opcional)',
    required: false,
    example: 'Prueba',
  })
  title?: string;

  @ApiProperty({
    description: 'Descripción del material (opcional)',
    required: false,
    example: 'Descripción breve del material',
  })
  description?: string;
}
