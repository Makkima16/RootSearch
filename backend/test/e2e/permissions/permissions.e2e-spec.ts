import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';

import { createTestApp, chainable } from '../utils/test-app';
import { Permission } from '../../../src/auth/schemas/permission.schema';

describe('Permissions E2E', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let jwtService: JwtService;

  let adminToken: string;
  let docenteToken: string;
  let estudianteToken: string;

  // Mock del PermissionModel
  let mockPermissionModel: any;

  const mockPermissions = {
    createUser: {
      _id: '607f1f77bcf86cd799439041',
      name: 'create:user',
      description: 'Permite crear usuarios',
      method: 'POST',
    },
    readUser: {
      _id: '607f1f77bcf86cd799439042',
      name: 'read:user',
      description: 'Permite leer usuarios',
      method: 'GET',
    },
  };

  beforeAll(async () => {
    // Constructor y métodos chainables por defecto
    mockPermissionModel = jest.fn();
    mockPermissionModel.find = jest
      .fn()
      .mockImplementation(() => chainable([]));
    mockPermissionModel.findOne = jest
      .fn()
      .mockImplementation(() => chainable(null));
    mockPermissionModel.findById = jest
      .fn()
      .mockImplementation(() => chainable(null));
    mockPermissionModel.findByIdAndUpdate = jest
      .fn()
      .mockImplementation(() => chainable(null));
    mockPermissionModel.findByIdAndDelete = jest
      .fn()
      .mockImplementation(() => chainable(null));
    mockPermissionModel.create = jest.fn();
    mockPermissionModel.mockImplementation((data: any) => ({
      ...data,
      save: jest
        .fn()
        .mockResolvedValue({ _id: '607f1f77bcf86cd799439099', ...data }),
    }));

    ({ app, module: moduleRef } = await createTestApp({
      overrides: [
        {
          token: getModelToken(Permission.name),
          useValue: mockPermissionModel,
        },
      ],
      globalPipes: true,
    }));

    jwtService = moduleRef.get<JwtService>(JwtService);

    adminToken = jwtService.sign({
      sub: '507f1f77bcf86cd799439021',
      email: 'admin@test.com',
      name: 'Admin User',
      roles: ['administrador'],
      permissions: [],
    });

    docenteToken = jwtService.sign({
      sub: '507f1f77bcf86cd799439022',
      email: 'docente@test.com',
      name: 'Docente User',
      roles: ['docente'],
      permissions: [],
    });

    estudianteToken = jwtService.sign({
      sub: '507f1f77bcf86cd799439023',
      email: 'estudiante@test.com',
      name: 'Estudiante User',
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

  describe('POST /permissions - Crear permiso', () => {
    it('debe fallar sin autenticación (401)', async () => {
      await request(app.getHttpServer())
        .post('/permissions')
        .send({ name: 'create:user', description: '...', method: 'POST' })
        .expect(401);
    });

    it('debe fallar con rol Estudiante (403)', async () => {
      await request(app.getHttpServer())
        .post('/permissions')
        .set('Authorization', `Bearer ${estudianteToken}`)
        .send({ name: 'create:user', description: '...', method: 'POST' })
        .expect(403);
    });

    it('debe fallar con rol Docente (403)', async () => {
      await request(app.getHttpServer())
        .post('/permissions')
        .set('Authorization', `Bearer ${docenteToken}`)
        .send({ name: 'create:user', description: '...', method: 'POST' })
        .expect(403);
    });

    it('debe crear permiso exitosamente con rol Admin (201)', async () => {
      mockPermissionModel.findOne.mockImplementationOnce(() => chainable(null));

      const response = await request(app.getHttpServer())
        .post('/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: mockPermissions.createUser.name,
          description: mockPermissions.createUser.description,
          method: mockPermissions.createUser.method,
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty(
        'name',
        mockPermissions.createUser.name,
      );
      expect(mockPermissionModel).toHaveBeenCalled();
    });

    it('debe fallar al crear permiso duplicado (409)', async () => {
      mockPermissionModel.findOne.mockImplementationOnce(() =>
        chainable(mockPermissions.createUser),
      );

      const response = await request(app.getHttpServer())
        .post('/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: mockPermissions.createUser.name,
          description: '...',
          method: 'POST',
        })
        .expect(409);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /permissions - Obtener todos los permisos', () => {
    it('debe fallar sin autenticación (401)', async () => {
      await request(app.getHttpServer()).get('/permissions').expect(401);
    });

    it('debe fallar con rol Estudiante (403)', async () => {
      await request(app.getHttpServer())
        .get('/permissions')
        .set('Authorization', `Bearer ${estudianteToken}`)
        .expect(403);
    });

    it('debe obtener permisos exitosamente con rol Admin (200)', async () => {
      mockPermissionModel.find.mockImplementationOnce(() =>
        chainable(Object.values(mockPermissions)),
      );

      const response = await request(app.getHttpServer())
        .get('/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /permissions/:id - Obtener permiso por ID', () => {
    it('debe obtener un permiso específico exitosamente (200)', async () => {
      mockPermissionModel.findById.mockImplementationOnce(() =>
        chainable(mockPermissions.readUser),
      );

      const response = await request(app.getHttpServer())
        .get(`/permissions/${mockPermissions.readUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id', mockPermissions.readUser._id);
      expect(response.body).toHaveProperty(
        'name',
        mockPermissions.readUser.name,
      );
    });

    it('debe fallar cuando el permiso no existe (404)', async () => {
      mockPermissionModel.findById.mockImplementationOnce(() =>
        chainable(null),
      );

      const response = await request(app.getHttpServer())
        .get('/permissions/607f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PATCH /permissions/:id - Actualizar permiso', () => {
    it('debe actualizar un permiso exitosamente (200)', async () => {
      const updated = {
        ...mockPermissions.readUser,
        description: 'Nueva desc',
      };
      mockPermissionModel.findByIdAndUpdate.mockImplementationOnce(() =>
        chainable(updated),
      );

      const response = await request(app.getHttpServer())
        .patch(`/permissions/${mockPermissions.readUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Nueva desc' })
        .expect(200);

      expect(response.body).toHaveProperty('description', 'Nueva desc');
    });

    it('debe fallar al actualizar permiso inexistente (404)', async () => {
      mockPermissionModel.findByIdAndUpdate.mockImplementationOnce(() =>
        chainable(null),
      );

      const response = await request(app.getHttpServer())
        .patch('/permissions/607f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'X' })
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /permissions/:id - Eliminar permiso', () => {
    it('debe eliminar un permiso exitosamente (200)', async () => {
      mockPermissionModel.findByIdAndDelete.mockImplementationOnce(() =>
        chainable(mockPermissions.createUser),
      );

      await request(app.getHttpServer())
        .delete(`/permissions/${mockPermissions.createUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('debe fallar al eliminar permiso inexistente (404)', async () => {
      mockPermissionModel.findByIdAndDelete.mockImplementationOnce(() =>
        chainable(null),
      );

      const response = await request(app.getHttpServer())
        .delete('/permissions/607f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });
});
