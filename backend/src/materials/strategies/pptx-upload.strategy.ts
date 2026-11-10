import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import {
  IMaterialUploadStrategy,
  StoreContext,
  StoreResult,
} from '../interfaces/material-upload-strategy.interface';
import { CourseMaterialType } from '../schemas/course-material.schema';
import { Express } from 'express';
import { IFileStorage, FILE_STORAGE } from '../storage/file-storage.interface';

@Injectable()
export class PptxUploadStrategy implements IMaterialUploadStrategy {
  constructor(@Inject(FILE_STORAGE) private readonly storage: IFileStorage) {}

  supports(mime: string, ext: string): boolean {
    return (
      mime ===
        'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      ext === '.pptx'
    );
  }

  getType(): CourseMaterialType {
    return CourseMaterialType.PPTX;
  }

  validate(file: Express.Multer.File): void {
    if (file.size > 30 * 1024 * 1024) {
      throw new BadRequestException('PPTX excede el límite de 30MB');
    }
  }

  async store(
    file: Express.Multer.File,
    ctx: StoreContext,
  ): Promise<StoreResult> {
    const result = await this.storage.store(file);
    return { storageRef: result.ref, provider: result.provider };
  }

  buildMetadata(
    file: Express.Multer.File,
    store: StoreResult,
    _pre?: any,
    ctx?: StoreContext,
  ) {
    if (!ctx) {
      throw new Error('Context is required for building metadata');
    }
    return {
      courseId: ctx.courseId,
      uploaderId: ctx.uploaderId,
      type: CourseMaterialType.PPTX,
      filename: file.originalname,
      originalName: file.originalname,
      mime: file.mimetype,
      size: file.size,
      storageProvider: store.provider,
      storageRef: store.storageRef,
      title: ctx?.dto?.title,
      description: ctx?.dto?.description,
      status: 'READY',
    };
  }
}
