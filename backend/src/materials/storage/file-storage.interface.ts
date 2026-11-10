import { Express } from 'express';

export interface StoreFileResult {
  provider: string;
  ref: string;
  mime: string;
  size: number;
  originalName: string;
  filename: string;
}

export interface FileStreamResult {
  stream: NodeJS.ReadableStream;
  filename?: string;
  mime?: string;
  size?: number;
}

export interface IFileStorage {
  store(
    file: Express.Multer.File,
    options?: Record<string, any>,
  ): Promise<StoreFileResult>;
  getAccessUrl(ref: string): string;
  getFileStream(ref: string): Promise<FileStreamResult>;
}

export const FILE_STORAGE = 'FILE_STORAGE';
