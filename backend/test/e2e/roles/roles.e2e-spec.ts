import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';

import { createTestApp, chainable } from '../utils/test-app';
import { Role } from '../../../src/auth/schemas/role.schema';
import { Permission } from '../../../src/auth/schemas/permission.schema';

describe('Roles E2E', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let jwtService: JwtService;

  let adminToken: string;
  let docenteToken: string;
  let estudianteToken: string;

  let mockRoleModel: any;
  let mockPermissionModel: any;

  const mockRoles = {
    admin: {
      _id: '607f1f77bcf86cd799439101',
      name: 'administrador',
      permissions: [],
    },
    docente: {
      _id: '607f1f77bcf86cd799439102',
      name: 'docente',
      permissions: [],
    },
    estudiante: {
      _id: '607f1f77bcf86cd799439103',
      name: 'estudiante',
      permissions: [],
    },
    custom: {
      _id: '607f1f77bcf86cd799439104',
      name: 'gestor',
      permissions: [],
    },
  };

  beforeAll(async () => {
    // Mock Role model con métodos chainables
    mockRoleModel = jest.fn();
    mockRoleModel.find = jest.fn().mockImplementation(() => chainable([]));
    mockRoleModel.findOne = jest.fn().mockImplementation(() => chainable(null));
    mockRoleModel.findById = jest
      .fn()
      .mockImplementation(() => chainable(null));
    mockRoleModel.findByIdAndUpdate = jest
      .fn()
      .mockImplementation(() => chainable(null));
    mockRoleModel.findByIdAndDelete = jest
      .fn()
      .mockImplementation(() => chainable(null));
    mockRoleModel.mockImplementation((data: any) => ({
      ...data,
      save: jest
        .fn()
        .mockResolvedValue({ _id: '607f1f77bcf86cd799439199', ...data }),
    }));

    // Mock Permission model: solo countDocuments requerido
    mockPermissionModel = jest.fn();
    mockPermissionModel.countDocuments = jest.fn().mockResolvedValue(0);

    ({ app, module: moduleRef } = await createTestApp({
      overrides: [
        { token: getModelToken(Role.name), useValue: mockRoleModel },
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

  describe('POST /roles - Crear rol', () => {
    it('debe fallar sin autenticación (401)', async () => {
      await request(app.getHttpServer())
        .post('/roles')
        .send({ name: 'gestor', permissions: [] })
        .expect(401);
    });

    it('debe fallar con rol Estudiante (403)', async () => {
      await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${estudianteToken}`)
        .send({ name: 'gestor', permissions: [] })
        .expect(403);
    });

    it('debe fallar con rol Docente (403)', async () => {
      await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${docenteToken}`)
        .send({ name: 'gestor', permissions: [] })
        .expect(403);
    });

    it('debe crear rol exitosamente con rol Admin (201)', async () => {
      mockRoleModel.findOne.mockImplementationOnce(() => chainable(null));
      mockPermissionModel.countDocuments.mockResolvedValueOnce(0);

      const response = await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'gestor', permissions: [] })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('name', 'gestor');
    });

    it('debe fallar al crear rol duplicado (409)', async () => {
      mockRoleModel.findOne.mockImplementationOnce(() =>
        chainable(mockRoles.custom),
      );

      const res = await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: mockRoles.custom.name, permissions: [] })
        .expect(409);

      expect(res.body).toHaveProperty('message');
    });

    it('debe fallar si incluye permisos inexistentes (404)', async () => {
      mockRoleModel.findOne.mockImplementationOnce(() => chainable(null));
      mockPermissionModel.countDocuments.mockResolvedValueOnce(1); // pero enviamos 2

      const res = await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'gestor',
          permissions: ['607f1f77bcf86cd799439041', '607f1f77bcf86cd799439042'],
        })
        .expect(404);

      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /roles - Listar roles', () => {
    it('debe fallar sin autenticación (401)', async () => {
      await request(app.getHttpServer()).get('/roles').expect(401);
    });

    it('debe fallar con rol Estudiante (403)', async () => {
      await request(app.getHttpServer())
        .get('/roles')
        .set('Authorization', `Bearer ${estudianteToken}`)
        .expect(403);
    });

    it('debe listar roles exitosamente con Admin (200)', async () => {
      mockRoleModel.find.mockImplementationOnce(() =>
        chainable(Object.values(mockRoles)),
      );

      const res = await request(app.getHttpServer())
        .get('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /roles/:id - Obtener rol', () => {
    it('debe obtener un rol específico (200)', async () => {
      mockRoleModel.findById.mockImplementationOnce(() =>
        chainable(mockRoles.docente),
      );

      const res = await request(app.getHttpServer())
        .get(`/roles/${mockRoles.docente._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('_id', mockRoles.docente._id);
      expect(res.body).toHaveProperty('name', mockRoles.docente.name);
    });

    it('debe fallar cuando el rol no existe (404)', async () => {
      mockRoleModel.findById.mockImplementationOnce(() => chainable(null));

      const res = await request(app.getHttpServer())
        .get('/roles/607f1f77bcf86cd799439199')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body).toHaveProperty('message');
    });
  });

  describe('PATCH /roles/:id - Actualizar rol', () => {
    it('debe actualizar role exitosamente (200)', async () => {
      const current = { ...mockRoles.custom };
      const updated = {
        ...mockRoles.custom,
        permissions: ['607f1f77bcf86cd799439041'],
      };

      mockRoleModel.findById.mockImplementationOnce(() => chainable(current));
      mockPermissionModel.countDocuments.mockResolvedValueOnce(1);
      mockRoleModel.findByIdAndUpdate.mockImplementationOnce(() =>
        chainable(updated),
      );

      const res = await request(app.getHttpServer())
        .patch(`/roles/${mockRoles.custom._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['607f1f77bcf86cd799439041'] })
        .expect(200);

      expect(res.body).toHaveProperty('permissions');
    });

    it('debe impedir renombrar un rol protegido (400)', async () => {
      const current = { ...mockRoles.estudiante };
      mockRoleModel.findById.mockImplementationOnce(() => chainable(current));

      const res = await request(app.getHttpServer())
        .patch(`/roles/${mockRoles.estudiante._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'alumno' })
        .expect(400);

      expect(res.body).toHaveProperty('message');
    });

    it('debe fallar si el rol no existe (404)', async () => {
      mockRoleModel.findById.mockImplementationOnce(() => chainable(null));

      const res = await request(app.getHttpServer())
        .patch('/roles/607f1f77bcf86cd799439198')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: [] })
        .expect(404);

      expect(res.body).toHaveProperty('message');
    });

    it('debe fallar si se envían permisos inexistentes (404)', async () => {
      const current = { ...mockRoles.custom };
      mockRoleModel.findById.mockImplementationOnce(() => chainable(current));
      mockPermissionModel.countDocuments.mockResolvedValueOnce(0); // pero enviamos 1

      const res = await request(app.getHttpServer())
        .patch(`/roles/${mockRoles.custom._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['607f1f77bcf86cd799439041'] })
        .expect(404);

      expect(res.body).toHaveProperty('message');
    });
  });

  describe('DELETE /roles/:id - Eliminar rol', () => {
    it('debe eliminar un rol no protegido (200)', async () => {
      mockRoleModel.findById.mockImplementationOnce(() =>
        chainable(mockRoles.custom),
      );
      mockRoleModel.findByIdAndDelete.mockImplementationOnce(() =>
        chainable(mockRoles.custom),
      );

      await request(app.getHttpServer())
        .delete(`/roles/${mockRoles.custom._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('debe impedir eliminar rol protegido (400)', async () => {
      mockRoleModel.findById.mockImplementationOnce(() =>
        chainable(mockRoles.estudiante),
      );

      const res = await request(app.getHttpServer())
        .delete(`/roles/${mockRoles.estudiante._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(res.body).toHaveProperty('message');
    });

    it('debe fallar si el rol no existe (404)', async () => {
      mockRoleModel.findById.mockImplementationOnce(() => chainable(null));

      const res = await request(app.getHttpServer())
        .delete('/roles/607f1f77bcf86cd799439197')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body).toHaveProperty('message');
    });
  });
});
