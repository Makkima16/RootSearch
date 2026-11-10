import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';

import { createTestApp, chainable } from '../utils/test-app';
import { Course } from '../../../src/courses/schemas/course.schema';
import { User } from '../../../src/auth/schemas/user.schema';
import { Role } from '../../../src/auth/schemas/role.schema';

describe('Courses E2E', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let jwtService: JwtService;

  let adminToken: string;
  let docenteToken: string;
  let estudianteToken: string;

  let mockCourseModel: any;
  let mockUserModel: any;
  let mockRoleModel: any;

  const ids = {
    admin: '507f1f77bcf86cd799439021',
    docente: '507f1f77bcf86cd799439022',
    estudiante: '507f1f77bcf86cd799439023',
    course: '607f1f77bcf86cd799439501',
    studentA: '507f1f77bcf86cd799439024',
    studentB: '507f1f77bcf86cd799439025',
  };

  beforeAll(async () => {
    // Mock Course model
    mockCourseModel = jest.fn();
    mockCourseModel.find = jest.fn().mockImplementation(() => chainable([]));
    mockCourseModel.findById = jest
      .fn()
      .mockImplementation(() => chainable(null));
    mockCourseModel.findByIdAndDelete = jest
      .fn()
      .mockImplementation(() => chainable(null));
    mockCourseModel.mockImplementation((data: any) => ({
      ...data,
      _id: ids.course,
      save: jest.fn().mockResolvedValue({ _id: ids.course, ...data }),
    }));

    // Mock User model
    mockUserModel = jest.fn();
    mockUserModel.findById = jest
      .fn()
      .mockImplementation(() => chainable(null));

    // Mock Role model (no-op by defecto)
    mockRoleModel = jest.fn();
    mockRoleModel.findById = jest
      .fn()
      .mockImplementation(() => chainable(null));

    ({ app, module: moduleRef } = await createTestApp({
      overrides: [
        { token: getModelToken(Course.name), useValue: mockCourseModel },
        { token: getModelToken(User.name), useValue: mockUserModel },
        { token: getModelToken(Role.name), useValue: mockRoleModel },
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

  describe('POST /courses - Crear curso', () => {
    it('401 sin autenticación', async () => {
      await request(app.getHttpServer())
        .post('/courses')
        .field('name', 'Curso X')
        .field('description', 'Desc')
        .field('teacherId', ids.docente)
        .expect(401);
    });

    it('403 rol Estudiante', async () => {
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${estudianteToken}`)
        .field('name', 'Curso X')
        .field('description', 'Desc')
        .field('teacherId', ids.docente)
        .expect(403);
    });

    it('201 Admin crea curso con docente válido y estudiantes', async () => {
      // Docente válido (rol docente)
      mockUserModel.findById.mockImplementationOnce(() =>
        chainable({
          _id: ids.docente,
          roles: [{ name: 'docente' }],
          name: 'Prof',
          email: 'prof@test.com',
        }),
      );
      // Validación de estudiantes: estudiante A
      mockUserModel.findById.mockImplementationOnce(() =>
        chainable({
          _id: ids.studentA,
          roles: [{ name: 'estudiante' }],
          name: 'Est A',
        }),
      );
      // estudiante B
      mockUserModel.findById.mockImplementationOnce(() =>
        chainable({
          _id: ids.studentB,
          roles: [{ name: 'estudiante' }],
          name: 'Est B',
        }),
      );
      // findById tras guardar curso
      mockCourseModel.findById.mockImplementationOnce(() =>
        chainable({
          _id: ids.course,
          name: 'Curso X',
          description: 'Desc',
          teacher: { name: 'Prof', email: 'prof@test.com' },
          students: [
            { name: 'Est A', email: 'a@test.com' },
            { name: 'Est B', email: 'b@test.com' },
          ],
        }),
      );

      const res = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Curso X')
        .field('description', 'Desc')
        .field('teacherId', ids.docente)
        .field('studentIds', `${ids.studentA},${ids.studentB}`)
        .expect(201);

      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('teacher');
    });

    it('404 docente no existe', async () => {
      mockUserModel.findById.mockImplementationOnce(() => chainable(null));

      const res = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Curso X')
        .field('description', 'Desc')
        .field('teacherId', ids.docente)
        .expect(404);

      expect(res.body).toHaveProperty('message');
    });

    it('400 docente sin rol DOCENTE', async () => {
      mockUserModel.findById.mockImplementationOnce(() =>
        chainable({ _id: ids.docente, roles: [{ name: 'administrador' }] }),
      );

      const res = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Curso X')
        .field('description', 'Desc')
        .field('teacherId', ids.docente)
        .expect(400);

      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /courses - Listar cursos', () => {
    it('401 sin autenticación', async () => {
      await request(app.getHttpServer()).get('/courses').expect(401);
    });

    it('200 con rol Docente', async () => {
      mockCourseModel.find.mockImplementationOnce(() =>
        chainable([{ _id: ids.course, name: 'Curso X' }]),
      );

      const res = await request(app.getHttpServer())
        .get('/courses')
        .set('Authorization', `Bearer ${docenteToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('200 por teacher query', async () => {
      mockCourseModel.find.mockImplementationOnce(() =>
        chainable([{ _id: ids.course, name: 'Curso X' }]),
      );

      const res = await request(app.getHttpServer())
        .get(`/courses?teacher=${ids.docente}`)
        .set('Authorization', `Bearer ${docenteToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('200 por student query', async () => {
      mockCourseModel.find.mockImplementationOnce(() =>
        chainable([{ _id: ids.course, name: 'Curso X' }]),
      );

      const res = await request(app.getHttpServer())
        .get(`/courses?student=${ids.estudiante}`)
        .set('Authorization', `Bearer ${docenteToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /courses/all - Admin listar todos', () => {
    it('403 estudiante', async () => {
      await request(app.getHttpServer())
        .get('/courses/all')
        .set('Authorization', `Bearer ${estudianteToken}`)
        .expect(403);
    });

    it('200 admin', async () => {
      mockCourseModel.find.mockImplementationOnce(() =>
        chainable([{ _id: ids.course, name: 'Curso X' }]),
      );

      const res = await request(app.getHttpServer())
        .get('/courses/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /courses/:id - Detalle curso', () => {
    it('200 curso encontrado', async () => {
      mockCourseModel.findById.mockImplementationOnce(() =>
        chainable({ _id: ids.course, name: 'Curso X' }),
      );

      const res = await request(app.getHttpServer())
        .get(`/courses/${ids.course}`)
        .set('Authorization', `Bearer ${docenteToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('_id', ids.course);
    });

    it('404 curso no encontrado', async () => {
      mockCourseModel.findById.mockImplementationOnce(() => chainable(null));

      const res = await request(app.getHttpServer())
        .get('/courses/607f1f77bcf86cd799439599')
        .set('Authorization', `Bearer ${docenteToken}`)
        .expect(404);

      expect(res.body).toHaveProperty('message');
    });
  });

  describe('PATCH /courses/:id - Actualizar curso', () => {
    it('403 estudiante', async () => {
      await request(app.getHttpServer())
        .patch(`/courses/${ids.course}`)
        .set('Authorization', `Bearer ${estudianteToken}`)
        .field('name', 'Nuevo')
        .expect(403);
    });

    it('200 admin actualiza nombre', async () => {
      const current = {
        _id: ids.course,
        name: 'Curso X',
        save: jest.fn().mockResolvedValue({ _id: ids.course }),
      } as any;
      mockCourseModel.findById.mockImplementationOnce(() => chainable(current));
      mockCourseModel.findById.mockImplementationOnce(() =>
        chainable({ _id: ids.course, name: 'Nuevo' }),
      );

      const res = await request(app.getHttpServer())
        .patch(`/courses/${ids.course}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Nuevo')
        .expect(200);

      expect(res.body).toHaveProperty('name', 'Nuevo');
    });

    it('404 curso no existe', async () => {
      mockCourseModel.findById.mockImplementationOnce(() => chainable(null));

      const res = await request(app.getHttpServer())
        .patch(`/courses/${ids.course}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Nuevo')
        .expect(404);

      expect(res.body).toHaveProperty('message');
    });

    it('404 profesor nuevo no existe', async () => {
      const current = {
        _id: ids.course,
        name: 'Curso X',
        save: jest.fn().mockResolvedValue({ _id: ids.course }),
      } as any;
      mockCourseModel.findById.mockImplementationOnce(() => chainable(current));
      mockUserModel.findById.mockImplementationOnce(() => chainable(null));

      const res = await request(app.getHttpServer())
        .patch(`/courses/${ids.course}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('teacherId', ids.docente)
        .expect(404);

      expect(res.body).toHaveProperty('message');
    });

    it('400 profesor nuevo sin rol DOCENTE', async () => {
      const current = {
        _id: ids.course,
        name: 'Curso X',
        save: jest.fn().mockResolvedValue({ _id: ids.course }),
      } as any;
      mockCourseModel.findById.mockImplementationOnce(() => chainable(current));
      mockUserModel.findById.mockImplementationOnce(() =>
        chainable({ _id: ids.docente, roles: [{ name: 'administrador' }] }),
      );

      const res = await request(app.getHttpServer())
        .patch(`/courses/${ids.course}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('teacherId', ids.docente)
        .expect(400);

      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /courses/:id/enroll - Inscribir estudiantes', () => {
    it('200 inscribe nuevos estudiantes', async () => {
      const current = {
        _id: ids.course,
        students: [],
        save: jest.fn().mockResolvedValue({ _id: ids.course }),
      } as any;
      mockCourseModel.findById.mockImplementationOnce(() => chainable(current));
      mockUserModel.findById.mockImplementationOnce(() =>
        chainable({
          _id: ids.studentA,
          roles: [{ name: 'estudiante' }],
          name: 'Est A',
        }),
      );
      mockUserModel.findById.mockImplementationOnce(() =>
        chainable({
          _id: ids.studentB,
          roles: [{ name: 'estudiante' }],
          name: 'Est B',
        }),
      );
      mockCourseModel.findById.mockImplementationOnce(() =>
        chainable({
          _id: ids.course,
          students: [{ name: 'Est A' }, { name: 'Est B' }],
        }),
      );

      const res = await request(app.getHttpServer())
        .post(`/courses/${ids.course}/enroll`)
        .set('Authorization', `Bearer ${docenteToken}`)
        .send({ studentIds: [ids.studentA, ids.studentB] })
        .expect(200);

      expect(Array.isArray(res.body.students)).toBe(true);
    });

    it('400 usuario no es estudiante', async () => {
      const current = {
        _id: ids.course,
        students: [],
        save: jest.fn().mockResolvedValue({ _id: ids.course }),
      } as any;
      mockCourseModel.findById.mockImplementationOnce(() => chainable(current));
      mockUserModel.findById.mockImplementationOnce(() =>
        chainable({
          _id: ids.studentA,
          roles: [{ name: 'docente' }],
          name: 'No Est',
        }),
      );

      const res = await request(app.getHttpServer())
        .post(`/courses/${ids.course}/enroll`)
        .set('Authorization', `Bearer ${docenteToken}`)
        .send({ studentIds: [ids.studentA] })
        .expect(400);

      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /courses/:id/unenroll - Desinscribir estudiantes', () => {
    it('200 remueve estudiantes', async () => {
      const current = {
        _id: ids.course,
        students: [
          { toString: () => ids.studentA },
          { toString: () => ids.studentB },
        ],
        save: jest.fn().mockResolvedValue({ _id: ids.course }),
      } as any;
      mockCourseModel.findById.mockImplementationOnce(() => chainable(current));
      mockCourseModel.findById.mockImplementationOnce(() =>
        chainable({ _id: ids.course, students: [] }),
      );

      const res = await request(app.getHttpServer())
        .post(`/courses/${ids.course}/unenroll`)
        .set('Authorization', `Bearer ${docenteToken}`)
        .send({ studentIds: [ids.studentA, ids.studentB] })
        .expect(200);

      expect(Array.isArray(res.body.students)).toBe(true);
    });
  });

  describe('DELETE /courses/:id - Eliminar curso', () => {
    it('403 docente no autorizado', async () => {
      await request(app.getHttpServer())
        .delete(`/courses/${ids.course}`)
        .set('Authorization', `Bearer ${docenteToken}`)
        .expect(403);
    });

    it('200 admin elimina curso', async () => {
      mockCourseModel.findByIdAndDelete.mockImplementationOnce(() =>
        chainable({ _id: ids.course }),
      );

      await request(app.getHttpServer())
        .delete(`/courses/${ids.course}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('404 curso no existe', async () => {
      mockCourseModel.findByIdAndDelete.mockImplementationOnce(() =>
        chainable(null),
      );

      const res = await request(app.getHttpServer())
        .delete('/courses/607f1f77bcf86cd799439588')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /courses/by-teacher/:teacherId', () => {
    it('200 lista por profesor', async () => {
      mockCourseModel.find.mockImplementationOnce(() =>
        chainable([{ _id: ids.course, name: 'Curso X' }]),
      );

      const res = await request(app.getHttpServer())
        .get(`/courses/by-teacher/${ids.docente}`)
        .set('Authorization', `Bearer ${docenteToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
