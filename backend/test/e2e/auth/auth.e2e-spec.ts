import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';

import { createTestApp } from '../utils/test-app';
import { AuthService } from '../../../src/auth/services/auth.service';

describe('Auth E2E', () => {
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
  };

  const authServiceMock: Partial<Record<keyof AuthService, any>> = {
    login: jest.fn().mockResolvedValue({ message: 'Code sent' }),
    verifyCode: jest.fn().mockResolvedValue({
      token: 'jwt.token',
      user: {
        id: ids.estudiante,
        email: 'user@test.com',
        roles: ['estudiante'],
      },
    }),
    register: jest
      .fn()
      .mockResolvedValue({ id: 'new-user-id', email: 'new@test.com' }),
    getProfile: jest.fn().mockResolvedValue({
      id: ids.admin,
      email: 'admin@test.com',
      roles: ['administrador'],
      permissions: ['create:course'],
    }),
    forgotPassword: jest.fn().mockResolvedValue({ message: 'Email sent' }),
    resetPassword: jest.fn().mockResolvedValue({ message: 'Password updated' }),
  } as any;

  beforeAll(async () => {
    ({ app, module: moduleRef } = await createTestApp({
      overrides: [{ token: AuthService, useValue: authServiceMock }],
      globalPipes: true,
    }));

    jwtService = moduleRef.get<JwtService>(JwtService);
    adminToken = jwtService.sign({
      sub: ids.admin,
      email: 'admin@test.com',
      name: 'Admin',
      roles: ['administrador'],
      permissions: ['create:course'],
    });
    docenteToken = jwtService.sign({
      sub: ids.docente,
      email: 'docente@test.com',
      name: 'Docente',
      roles: ['docente'],
      permissions: [],
    });
    estudianteToken = jwtService.sign({
      sub: ids.estudiante,
      email: 'estu@test.com',
      name: 'Estudiante',
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

  describe('POST /auth/login', () => {
    it('200 envía código', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@test.com', password: '123456' })
        .expect(200);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/verify-code', () => {
    it('200 devuelve token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/verify-code')
        .send({ email: 'user@test.com', code: '123456' })
        .expect(200);
      expect(res.body).toHaveProperty('token');
    });
  });

  describe('POST /auth/register', () => {
    it('201 registra usuario', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Nuevo', email: 'new@test.com', password: '123456' })
        .expect(201);
      expect(res.body).toHaveProperty('id');
    });
  });

  describe('GET /auth/profile', () => {
    it('401 sin auth', async () => {
      await request(app.getHttpServer()).get('/auth/profile').expect(401);
    });
    it('200 con token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body).toHaveProperty('roles');
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('200 envía email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'user@test.com' })
        .expect(200);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/reset-password', () => {
    it('200 actualiza contraseña', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: 'reset-token',
          newPassword: '123456',
          confirmPassword: '123456',
        })
        .expect(200);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /auth/admin-only', () => {
    it('403 docente', async () => {
      await request(app.getHttpServer())
        .get('/auth/admin-only')
        .set('Authorization', `Bearer ${docenteToken}`)
        .expect(403);
    });
    it('200 admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/admin-only')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /auth/docentes', () => {
    it('403 estudiante', async () => {
      await request(app.getHttpServer())
        .get('/auth/docentes')
        .set('Authorization', `Bearer ${estudianteToken}`)
        .expect(403);
    });
    it('200 docente', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/docentes')
        .set('Authorization', `Bearer ${docenteToken}`)
        .expect(200);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /auth/create-course (permiso)', () => {
    it('403 sin permiso', async () => {
      await request(app.getHttpServer())
        .get('/auth/create-course')
        .set('Authorization', `Bearer ${docenteToken}`)
        .expect(403);
    });
    it('200 con permiso', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/create-course')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /auth/dashboard', () => {
    it('401 sin auth', async () => {
      await request(app.getHttpServer()).get('/auth/dashboard').expect(401);
    });
    it('200 con token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/dashboard')
        .set('Authorization', `Bearer ${estudianteToken}`)
        .expect(200);
      expect(res.body).toHaveProperty('message');
    });
  });
});
