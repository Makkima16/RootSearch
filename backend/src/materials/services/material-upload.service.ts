import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CourseMaterial } from '../schemas/course-material.schema';
import { MaterialListItemDto } from '../dto/material-list-item.dto';
import {
  IMaterialUploadStrategy,
  MATERIAL_UPLOAD_STRATEGIES,
} from '../interfaces/material-upload-strategy.interface';
import { FILE_STORAGE, IFileStorage } from '../storage/file-storage.interface';
import { Response } from 'express';
import * as path from 'path';

interface UploadResult {
  id: string;
  courseId: string;
  uploaderId: string;
  type: string;
  filename: string;
  originalName: string;
  mime: string;
  size: number;
  storageProvider: string;
  storageRef: string;
  title?: string;
  description?: string;
  status: string;
  accessUrl: string;
}

@Injectable()
export class MaterialUploadService {
  private readonly logger = new Logger(MaterialUploadService.name);

  constructor(
    @InjectModel(CourseMaterial.name)
    private materialModel: Model<CourseMaterial>,
    @Inject(MATERIAL_UPLOAD_STRATEGIES)
    private strategies: IMaterialUploadStrategy[],
    @Inject(FILE_STORAGE) private storage: IFileStorage,
  ) {}

  private resolveStrategy(file: Express.Multer.File): IMaterialUploadStrategy {
    const ext = path.extname(file.originalname).toLowerCase();
    const strategy = this.strategies.find((s) =>
      s.supports(file.mimetype, ext),
    );
    if (!strategy) {
      throw new Error(`Tipo de archivo no soportado: ${file.mimetype}`);
    }
    return strategy;
  }

  async upload(
    courseId: string,
    uploaderId: string,
    files: Express.Multer.File[],
    dto?: { title?: string; description?: string },
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    for (const file of files) {
      const strategy = this.resolveStrategy(file);
      strategy.validate(file);
      const store = await strategy.store(file, { courseId, uploaderId, dto });
      const metadata = strategy.buildMetadata(file, store, undefined, {
        courseId,
        uploaderId,
        dto,
      });
      const created = new this.materialModel(metadata);
      await created.save();
      const accessUrl = this.storage.getAccessUrl(store.storageRef);
      results.push({
        id: String(created._id),
        accessUrl,
        courseId: created.courseId,
        uploaderId: created.uploaderId,
        type: created.type,
        filename: created.filename,
        originalName: created.originalName,
        mime: created.mime,
        size: created.size,
        storageProvider: created.storageProvider,
        storageRef: created.storageRef,
        title: created.title,
        description: created.description,
        status: created.status,
      });
    }
    return results;
  }

  async getAccessUrlById(
    id: string,
  ): Promise<{ accessUrl: string; material: CourseMaterial }> {
    const material = await this.materialModel.findById(id).exec();
    if (!material) {
      throw new Error('Material no encontrado');
    }
    const accessUrl = this.storage.getAccessUrl(material.storageRef);
    return { accessUrl, material };
  }

  async getAccessUrlByTitle(
    title: string,
    courseId?: string,
  ): Promise<{ accessUrl: string; material: CourseMaterial }> {
    const filter: any = { title };
    if (courseId) filter.courseId = courseId;
    const material = await this.materialModel.findOne(filter).exec();
    if (!material) {
      throw new Error('Material no encontrado por título');
    }
    const accessUrl = this.storage.getAccessUrl(material.storageRef);
    return { accessUrl, material };
  }

  async streamById(id: string, res: Response): Promise<void> {
    const material = await this.materialModel.findById(id).exec();
    if (!material) throw new Error('Material no encontrado');
    const { stream, filename, mime, size } = await this.storage.getFileStream(
      material.storageRef,
    );
    if (mime) res.setHeader('Content-Type', mime);
    if (size) res.setHeader('Content-Length', String(size));
    const safeName =
      filename || material.originalName || material.filename || 'file';
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    stream.pipe(res);
  }

  async listByCourse(courseId: string): Promise<MaterialListItemDto[]> {
    const items = await this.materialModel
      .find({ courseId })
      .sort({ createdAt: -1 })
      .exec();

    return items.map((m: any) => ({
      _id: String(m._id),
      courseId: String(m.courseId),
      uploaderId: String(m.uploaderId),
      type: m.type,
      filename: m.filename,
      originalName: m.originalName,
      mime: m.mime,
      size: m.size,
      storageProvider: m.storageProvider,
      storageRef: this.storage.getAccessUrl(m.storageRef),
      title: m.title,
      description: m.description,
      status: m.status,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }
}
