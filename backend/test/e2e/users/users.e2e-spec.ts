import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';

import { createTestApp, chainable } from '../utils/test-app';
import { User } from '../../../src/auth/schemas/user.schema';
import { Role } from '../../../src/auth/schemas/role.schema';
import { Course } from '../../../src/courses/schemas/course.schema';

describe('Users E2E', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let jwtService: JwtService;

  let adminToken: string;
  let docenteToken: string;
  let estudianteToken: string;

  let mockUserModel: any;
  let mockRoleModel: any;
  let mockCourseModel: any;

  const mockUsers = {
    admin: {
      _id: '507f1f77bcf86cd799439021',
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'hash',
      roles: ['administrador'],
    },
    docente: {
      _id: '507f1f77bcf86cd799439022',
      name: 'Docente User',
      email: 'docente@test.com',
      password: 'hash',
      roles: ['docente'],
    },
    estudiante: {
      _id: '507f1f77bcf86cd799439023',
      name: 'Estudiante User',
      email: 'estudiante@test.com',
      password: 'hash',
      roles: ['estudiante'],
    },
  };

  const mockRoleEstudiante = {
    _id: '607f1f77bcf86cd799439301',
    name: 'estudiante',
  };
  const mockRoleDocente = { _id: '607f1f77bcf86cd799439302', name: 'docente' };

  beforeAll(async () => {
    // Mock User model
    mockUserModel = jest.fn();
    mockUserModel.find = jest.fn().mockImplementation(() => chainable([]));
    mockUserModel.findOne = jest.fn().mockImplementation(() => chainable(null));
    mockUserModel.findById = jest
      .fn()
      .mockImplementation(() => chainable(null));
    mockUserModel.findByIdAndDelete = jest
      .fn()
      .mockImplementation(() => chainable(null));
    mockUserModel.mockImplementation((data: any) => ({
      ...data,
      save: jest
        .fn()
        .mockResolvedValue({ _id: '507f1f77bcf86cd799439099', ...data }),
      toObject: () => ({ _id: '507f1f77bcf86cd799439099', ...data }),
    }));

    // Mock Role model
    mockRoleModel = jest.fn();
    mockRoleModel.find = jest.fn().mockImplementation(() => chainable([]));
    mockRoleModel.findOne = jest.fn().mockImplementation(() => chainable(null));
    mockRoleModel.findById = jest
      .fn()
      .mockImplementation(() => chainable(null));

    // Mock Course model
    mockCourseModel = jest.fn();
    mockCourseModel.find = jest.fn().mockImplementation(() => chainable([]));

    ({ app, module: moduleRef } = await createTestApp({
      overrides: [
        { token: getModelToken(User.name), useValue: mockUserModel },
        { token: getModelToken(Role.name), useValue: mockRoleModel },
        { token: getModelToken(Course.name), useValue: mockCourseModel },
      ],
      globalPipes: true,
    }));

    jwtService = moduleRef.get<JwtService>(JwtService);

    adminToken = jwtService.sign({
      sub: mockUsers.admin._id,
      email: mockUsers.admin.email,
      name: mockUsers.admin.name,
      roles: ['administrador'],
      permissions: [],
    });

    docenteToken = jwtService.sign({
      sub: mockUsers.docente._id,
      email: mockUsers.docente.email,
      name: mockUsers.docente.name,
      roles: ['docente'],
      permissions: [],
    });

    estudianteToken = jwtService.sign({
      sub: mockUsers.estudiante._id,
      email: mockUsers.estudiante.email,
      name: mockUsers.estudiante.name,
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

  describe('POST /users - Crear usuario', () => {
    it('401 sin autenticación', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Nuevo', email: 'nuevo@test.com', password: '123456' })
        .expect(401);
    });

    it('403 con rol Docente', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${docenteToken}`)
        .send({ name: 'Nuevo', email: 'nuevo@test.com', password: '123456' })
        .expect(403);
    });

    it('201 con rol Admin crea usuario con rol por defecto', async () => {
      mockUserModel.findOne.mockImplementationOnce(() => chainable(null));
      mockRoleModel.findOne.mockImplementationOnce(() =>
        chainable(mockRoleEstudiante),
      );

      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nuevo', email: 'nuevo@test.com', password: '123456' })
        .expect(201);

      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('email', 'nuevo@test.com');
    });

    it('409 email duplicado', async () => {
      mockUserModel.findOne.mockImplementationOnce(() =>
        chainable(mockUsers.admin),
      );

      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Nuevo',
          email: mockUsers.admin.email,
          password: '123456',
        })
        .expect(409);

      expect(res.body).toHaveProperty('message');
    });

    it('404 rol especificado no existe', async () => {
      mockUserModel.findOne.mockImplementationOnce(() => chainable(null));
      mockRoleModel.findById.mockImplementationOnce(() => chainable(null));

      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Nuevo',
          email: 'nuevo2@test.com',
          password: '123456',
          roleId: '607f1f77bcf86cd799439399',
        })
        .expect(404);

      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /users - Listar usuarios', () => {
    it('401 sin autenticación', async () => {
      await request(app.getHttpServer()).get('/users').expect(401);
    });

    it('403 con rol Estudiante', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${estudianteToken}`)
        .expect(403);
    });

    it('200 Admin lista todos', async () => {
      mockUserModel.find.mockImplementationOnce(() =>
        chainable([mockUsers.admin, mockUsers.docente]),
      );

      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('200 filtrar por rol', async () => {
      mockRoleModel.findOne.mockImplementationOnce(() =>
        chainable(mockRoleDocente),
      );
      mockUserModel.find.mockImplementationOnce(() =>
        chainable([mockUsers.docente]),
      );

      const res = await request(app.getHttpServer())
        .get('/users?role=docente')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('404 rol de filtro no existe', async () => {
      mockRoleModel.findOne.mockImplementationOnce(() => chainable(null));

      const res = await request(app.getHttpServer())
        .get('/users?role=noexiste')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /users/:id - Obtener usuario', () => {
    it('200 Admin obtiene usuario por ID', async () => {
      mockUserModel.findById.mockImplementationOnce(() =>
        chainable(mockUsers.docente),
      );

      const res = await request(app.getHttpServer())
        .get(`/users/${mockUsers.docente._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('_id', mockUsers.docente._id);
    });

    it('404 usuario no encontrado', async () => {
      mockUserModel.findById.mockImplementationOnce(() => chainable(null));

      const res = await request(app.getHttpServer())
        .get('/users/507f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body).toHaveProperty('message');
    });
  });

  describe('PATCH /users/:id - Actualizar usuario', () => {
    it('403 si no es propio perfil ni admin', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${mockUsers.estudiante._id}`)
        .set('Authorization', `Bearer ${docenteToken}`)
        .send({ name: 'Cambio' })
        .expect(403);

      expect(res.body).toHaveProperty('message');
    });

    it('200 admin actualiza usuario', async () => {
      const current = { ...mockUsers.estudiante, email: 'old@test.com' };
      const updated = {
        ...current,
        name: 'Nuevo Nombre',
        toObject: () => ({ ...current, name: 'Nuevo Nombre' }),
      } as any;

      mockUserModel.findById.mockImplementationOnce(() => chainable(current));
      mockUserModel.findOne.mockImplementationOnce(() => chainable(null)); // email no duplicado
      (updated as any).save = jest.fn().mockResolvedValue(updated);

      const res = await request(app.getHttpServer())
        .patch(`/users/${mockUsers.estudiante._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nuevo Nombre' })
        .expect(200);

      expect(res.body).toHaveProperty('name', 'Nuevo Nombre');
    });

    it('409 email duplicado en actualización', async () => {
      const current = { ...mockUsers.estudiante, email: 'old@test.com' };
      mockUserModel.findById.mockImplementationOnce(() => chainable(current));
      mockUserModel.findOne.mockImplementationOnce(() =>
        chainable(mockUsers.admin),
      );

      const res = await request(app.getHttpServer())
        .patch(`/users/${mockUsers.estudiante._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: mockUsers.admin.email })
        .expect(409);

      expect(res.body).toHaveProperty('message');
    });

    it('404 rol especificado en update no existe', async () => {
      const current = { ...mockUsers.estudiante, email: 'old@test.com' };
      mockUserModel.findById.mockImplementationOnce(() => chainable(current));
      mockUserModel.findOne.mockImplementationOnce(() => chainable(null));
      mockRoleModel.findById.mockImplementationOnce(() => chainable(null));

      const res = await request(app.getHttpServer())
        .patch(`/users/${mockUsers.estudiante._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roleId: '607f1f77bcf86cd799439399' })
        .expect(404);

      expect(res.body).toHaveProperty('message');
    });

    it('404 usuario a actualizar no existe', async () => {
      mockUserModel.findById.mockImplementationOnce(() => chainable(null));

      const res = await request(app.getHttpServer())
        .patch('/users/507f1f77bcf86cd799439198')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'X' })
        .expect(404);

      expect(res.body).toHaveProperty('message');
    });
  });

  describe('DELETE /users/:id - Eliminar usuario', () => {
    it('200 admin elimina usuario', async () => {
      mockUserModel.findByIdAndDelete.mockImplementationOnce(() =>
        chainable(mockUsers.estudiante),
      );

      await request(app.getHttpServer())
        .delete(`/users/${mockUsers.estudiante._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('404 usuario a eliminar no existe', async () => {
      mockUserModel.findByIdAndDelete.mockImplementationOnce(() =>
        chainable(null),
      );

      const res = await request(app.getHttpServer())
        .delete('/users/507f1f77bcf86cd799439197')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /users/my-teachers - Profesores del estudiante', () => {
    it('401 sin autenticación', async () => {
      await request(app.getHttpServer()).get('/users/my-teachers').expect(401);
    });

    it('403 admin no puede acceder', async () => {
      await request(app.getHttpServer())
        .get('/users/my-teachers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('200 estudiante obtiene profesores', async () => {
      mockUserModel.findById.mockImplementationOnce(() =>
        chainable(mockUsers.estudiante),
      );
      const mockCourses = [
        {
          name: 'Curso A',
          teacher: { name: 'Prof A', email: 'profA@test.com' },
        },
        {
          name: 'Curso B',
          teacher: { name: 'Prof B', email: 'profB@test.com' },
        },
      ];
      mockCourseModel.find.mockImplementationOnce(() => chainable(mockCourses));

      const res = await request(app.getHttpServer())
        .get('/users/my-teachers')
        .set('Authorization', `Bearer ${estudianteToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('teacherEmail');
    });

    it('404 estudiante no encontrado', async () => {
      mockUserModel.findById.mockImplementationOnce(() => chainable(null));

      const res = await request(app.getHttpServer())
        .get('/users/my-teachers')
        .set('Authorization', `Bearer ${estudianteToken}`)
        .expect(404);

      expect(res.body).toHaveProperty('message');
    });
  });
});
