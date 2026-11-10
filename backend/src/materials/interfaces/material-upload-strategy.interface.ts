import { Express } from 'express';
import { CourseMaterialType } from '../schemas/course-material.schema';

export interface StoreContext {
  courseId: string;
  uploaderId: string;
  dto?: { title?: string; description?: string };
}

export interface StoreResult {
  storageRef: string;
  provider: string;
  extra?: Record<string, any>;
}

export interface IMaterialUploadStrategy {
  supports(mime: string, ext: string): boolean;
  getType(): CourseMaterialType;
  validate(file: Express.Multer.File): void;
  preprocess?(file: Express.Multer.File): Promise<Record<string, any>>;
  store(file: Express.Multer.File, ctx: StoreContext): Promise<StoreResult>;
  buildMetadata(
    file: Express.Multer.File,
    store: StoreResult,
    preprocessData?: Record<string, any>,
    ctx?: StoreContext,
  ): Partial<any>; // Partial<CourseMaterial>
}

export const MATERIAL_UPLOAD_STRATEGIES = 'MATERIAL_UPLOAD_STRATEGIES';
