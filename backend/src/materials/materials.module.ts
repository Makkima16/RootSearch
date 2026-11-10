import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import {
  GeneratedMaterial,
  GeneratedMaterialSchema,
} from './schemas/material.schema';
import {
  Transcription,
  TranscriptionSchema,
} from '../transcription/schemas/transcription.schema';
import { Course, CourseSchema } from '../courses/schemas/course.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { TranscriptionModule } from '../transcription/transcription.module';
import { ContentGenerationModule } from '../content-generation/content-generation.module';
import { PdfExporterService } from './services/pdf-exporter.service';
import {
  CourseMaterial,
  CourseMaterialSchema,
} from './schemas/course-material.schema';
import { MaterialUploadService } from './services/material-upload.service';
import { PdfUploadStrategy } from './strategies/pdf-upload.strategy';
import { PptxUploadStrategy } from './strategies/pptx-upload.strategy';
import { VideoUploadStrategy } from './strategies/video-upload.strategy';
import { GoogleDriveStorageProvider } from './storage/google-drive-storage.provider';
import { MATERIAL_UPLOAD_STRATEGIES } from './interfaces/material-upload-strategy.interface';
import { FILE_STORAGE } from './storage/file-storage.interface';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GeneratedMaterial.name, schema: GeneratedMaterialSchema },
      { name: Transcription.name, schema: TranscriptionSchema },
      { name: CourseMaterial.name, schema: CourseMaterialSchema },
      { name: Course.name, schema: CourseSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ContentGenerationModule,
    TranscriptionModule,
    AuthModule,
  ],
  controllers: [MaterialsController],
  providers: [
    MaterialsService,
    PdfExporterService,
    MaterialUploadService,
    // Storage provider: Google Drive
    GoogleDriveStorageProvider,
    {
      provide: FILE_STORAGE,
      useExisting: GoogleDriveStorageProvider,
    },
    // Estrategias
    PdfUploadStrategy,
    PptxUploadStrategy,
    VideoUploadStrategy,
    {
      provide: MATERIAL_UPLOAD_STRATEGIES,
      useFactory: (
        pdf: PdfUploadStrategy,
        pptx: PptxUploadStrategy,
        video: VideoUploadStrategy,
      ) => [pdf, pptx, video],
      inject: [PdfUploadStrategy, PptxUploadStrategy, VideoUploadStrategy],
    },
  ],
  exports: [MaterialsService, MaterialUploadService],
})
export class MaterialsModule {}
