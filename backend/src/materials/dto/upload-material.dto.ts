import { IsOptional, IsString, Length } from 'class-validator';

export class UploadMaterialDto {
  @IsOptional()
  @IsString()
  @Length(0, 120)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}
