import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';

import { createTestApp } from '../utils/test-app';
import { MaterialsService } from '../../../src/materials/materials.service';
import { MaterialUploadService } from '../../../src/materials/services/material-upload.service';
import { PdfExporterService } from '../../../src/materials/services/pdf-exporter.service';

describe('Materials E2E', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let jwtService: JwtService;

  let adminToken: string;
  let docenteToken: string;
  let estudianteToken: string;

  const ids = {
    admin: '507f1f77bcf86cd799439021',
    docente: '507f1f77bcf86cd799439022',
    estudiante: '507f1f77bcf86cd799439023',
    course: '607f1f77bcf86cd799439701',
    material: '607f1f77bcf86cd799439702',
  };

  // Mocks de servicios
  const materialsServiceMock: Partial<Record<keyof MaterialsService, any>> = {
    processAudioForCourse: jest.fn().mockResolvedValue({ id: ids.material }),
    generarSoloResumen: jest
      .fn()
      .mockResolvedValue({ id: ids.material, resumen: 'Texto' }),
    generarSoloQuiz: jest
      .fn()
      .mockResolvedValue({ id: ids.material, quiz: [] }),
    generarTodoSecuencial: jest
      .fn()
      .mockResolvedValue({ id: ids.material, resumen: 'R', quiz: [] }),
    findByCourse: jest
      .fn()
      .mockResolvedValue([{ _id: ids.material, title: 'Mat 1' }]),
    findAll: jest.fn().mockResolvedValue([{ _id: ids.material }]),
    findOne: jest
      .fn()
      .mockResolvedValue({ _id: ids.material, title: 'Mat', content: '...' }),
    publish: jest
      .fn()
      .mockResolvedValue({ _id: ids.material, status: 'published' }),
    update: jest.fn().mockResolvedValue({ _id: ids.material, title: 'Nuevo' }),
    remove: jest.fn().mockResolvedValue(undefined),
    getStudentCourseMaterials: jest.fn().mockResolvedValue([
      {
        courseId: ids.course,
        courseName: 'Curso X',
        materialId: ids.material,
        title: 'Mat 1',
        type: 'PDF',
        accessUrl: 'https://drive.google.com/xyz',
      },
    ]),
  } as any;

  const uploadServiceMock: Partial<Record<keyof MaterialUploadService, any>> = {
    upload: jest.fn().mockResolvedValue([
      {
        id: 'mat-1',
        courseId: ids.course,
        type: 'PDF',
        title: 'File1',
        description: 'Desc',
        mime: 'application/pdf',
        size: 123,
        status: 'stored',
        storageRef: 'https://drive/file1',
      },
    ]),
    getAccessUrlById: jest
      .fn()
      .mockResolvedValue({ accessUrl: 'https://drive/file1' }),
    getAccessUrlByTitle: jest.fn().mockResolvedValue({
      accessUrl: 'https://drive/file1',
      material: { _id: 'mat-1', title: 'File1' },
    }),
    streamById: jest.fn().mockImplementation(async (_id: string, res: any) => {
      res.set({ 'Content-Type': 'application/octet-stream' });
      res.end('file-bytes');
    }),
  } as any;

  const pdfExporterMock: Partial<Record<keyof PdfExporterService, any>> = {
    generatePdf: jest.fn().mockResolvedValue(Buffer.from('PDF')),
  } as any;

  beforeAll(async () => {
    ({ app, module: moduleRef } = await createTestApp({
      overrides: [
        { token: MaterialsService, useValue: materialsServiceMock },
        { token: MaterialUploadService, useValue: uploadServiceMock },
        { token: PdfExporterService, useValue: pdfExporterMock },
      ],
      globalPipes: true,
    }));

    jwtService = moduleRef.get<JwtService>(JwtService);
    adminToken = jwtService.sign({
      sub: ids.admin,
      email: 'admin@test.com',
      roles: ['administrador'],
      permissions: [],
    });
    docenteToken = jwtService.sign({
      sub: ids.docente,
      email: 'docente@test.com',
      roles: ['docente'],
      permissions: [],
    });
    estudianteToken = jwtService.sign({
      sub: ids.estudiante,
      email: 'estudiante@test.com',
      roles: ['estudiante'],
      permissions: [],
    });
  });

  afterAll(async () => {
    await app.close();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /materials/course/:courseId', () => {
    it('401 sin auth', async () => {
      await request(app.getHttpServer())
        .get(`/materials/course/${ids.course}`)
        .expect(401);
    });
    it('200 estudiante', async () => {
      const res = await request(app.getHttpServer())
        .get(`/materials/course/${ids.course}`)
        .set('Authorization', `Bearer ${estudianteToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /materials', () => {
    it('200 admin lista todos', async () => {
      const res = await request(app.getHttpServer())
        .get('/materials')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /materials/:id', () => {
    it('200 encontrado', async () => {
      const res = await request(app.getHttpServer())
        .get(`/materials/${ids.material}`)
        .set('Authorization', `Bearer ${docenteToken}`)
        .expect(200);
      expect(res.body).toHaveProperty('_id', ids.material);
    });
    it('404 no encontrado', async () => {
      (materialsServiceMock.findOne as any).mockResolvedValueOnce(null);
      const res = await request(app.getHttpServer())
        .get('/materials/607f1f77bcf86cd799439799')
        .set('Authorization', `Bearer ${docenteToken}`)
        .expect(404);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('PATCH /materials/:id/publish', () => {
    it('200 publica', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/materials/${ids.material}/publish`)
        .set('Authorization', `Bearer ${docenteToken}`)
        .expect(200);
      expect(res.body).toHaveProperty('status', 'published');
    });
  });

  describe('GET /materials/:id/export/pdf', () => {
    it('200 descarga PDF', async () => {
      const res = await request(app.getHttpServer())
        .get(`/materials/${ids.material}/export/pdf`)
        .set('Authorization', `Bearer ${estudianteToken}`)
        .expect(200);
      expect(res.headers['content-type']).toContain('application/pdf');
    });
  });

  describe('PATCH /materials/:id', () => {
    it('200 actualiza', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/materials/${ids.material}`)
        .set('Authorization', `Bearer ${docenteToken}`)
        .send({ title: 'Nuevo' })
        .expect(200);
      expect(res.body).toHaveProperty('title', 'Nuevo');
    });
    it('404 actualización material no existe', async () => {
      (materialsServiceMock.update as any).mockResolvedValueOnce(null);
      const res = await request(app.getHttpServer())
        .patch('/materials/607f1f77bcf86cd799439799')
        .set('Authorization', `Bearer ${docenteToken}`)
        .send({ title: 'X' })
        .expect(404);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('DELETE /materials/:id', () => {
    it('200 elimina', async () => {
      await request(app.getHttpServer())
        .delete(`/materials/${ids.material}`)
        .set('Authorization', `Bearer ${docenteToken}`)
        .expect(200);
    });
  });

  describe('POST /materials/courses/:courseId/upload', () => {
    it('201 sube materiales', async () => {
      const res = await request(app.getHttpServer())
        .post(`/materials/courses/${ids.course}/upload`)
        .set('Authorization', `Bearer ${docenteToken}`)
        .field('title', 'Tema 1')
        .field('description', 'Desc')
        .attach('files', Buffer.from('PDF'), {
          filename: 'file1.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('accessUrl');
    });
  });

  describe('Acceso/Descarga materiales de curso', () => {
    it('GET /materials/courses/materials/:id/access', async () => {
      const res = await request(app.getHttpServer())
        .get('/materials/courses/materials/mat-1/access')
        .set('Authorization', `Bearer ${estudianteToken}`)
        .expect(200);
      expect(res.body).toHaveProperty('accessUrl');
    });

    it('GET /materials/courses/materials/access?title=File1', async () => {
      const res = await request(app.getHttpServer())
        .get('/materials/courses/materials/access?title=File1')
        .set('Authorization', `Bearer ${docenteToken}`)
        .expect(200);
      expect(res.body).toHaveProperty('accessUrl');
    });

    it('GET /materials/courses/materials/:id/download', async () => {
      const res = await request(app.getHttpServer())
        .get('/materials/courses/materials/mat-1/download')
        .set('Authorization', `Bearer ${estudianteToken}`)
        .expect(200);
      expect(res.headers['content-type']).toContain('application/octet-stream');
    });
  });

  describe('GET /materials/student/:id/course-materials', () => {
    it('403 docente no autorizado', async () => {
      await request(app.getHttpServer())
        .get(`/materials/student/${ids.estudiante}/course-materials`)
        .set('Authorization', `Bearer ${docenteToken}`)
        .expect(403);
    });

    it('200 estudiante obtiene materiales', async () => {
      const res = await request(app.getHttpServer())
        .get(`/materials/student/${ids.estudiante}/course-materials`)
        .set('Authorization', `Bearer ${estudianteToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
