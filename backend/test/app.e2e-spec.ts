import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from './../src/app.module';
import { User } from '../src/auth/schemas/user.schema';
import { Role } from '../src/auth/schemas/role.schema';
import { Course } from '../src/courses/schemas/course.schema';
import { Permission } from '../src/auth/schemas/permission.schema';
import * as bcrypt from 'bcrypt';

describe('RootSearch E2E Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  // Tokens de autenticación
  let adminToken: string;
  let docenteToken: string;
  let estudianteToken: string;

  // Mocks de los modelos
  let mockUserModel: any;
  let mockRoleModel: any;
  let mockCourseModel: any;
  let mockPermissionModel: any;

  // Helper to create a chainable mock (scoped at file level so tests can use it)
  const chainable = (result: any) => {
    const chain: any = {
      exec: jest.fn().mockResolvedValue(result),
      populate: jest.fn(),
      select: jest.fn(),
    };
    chain.populate.mockImplementation(() => chain);
    chain.select.mockImplementation(() => chain);
    return chain;
  };

  // Datos de prueba
  const mockRoles = {
    admin: {
      _id: '507f1f77bcf86cd799439011',
      name: 'ADMIN',
      description: 'Administrador del sistema',
      permissions: [],
    },
    docente: {
      _id: '507f1f77bcf86cd799439012',
      name: 'DOCENTE',
      description: 'Docente',
      permissions: [{ name: 'create:course', method: 'POST' }],
    },
    estudiante: {
      _id: '507f1f77bcf86cd799439013',
      name: 'ESTUDIANTE',
      description: 'Estudiante',
      permissions: [],
    },
  };

  const mockUsers = {
    admin: {
      _id: '507f1f77bcf86cd799439021',
      name: 'Admin User',
      email: 'admin@test.com',
      password: '', // Se generará en beforeAll
      roles: [mockRoles.admin],
      toObject: function () {
        return { ...this, password: undefined };
      },
    },
    docente: {
      _id: '507f1f77bcf86cd799439022',
      name: 'Docente User',
      email: 'docente@test.com',
      password: '', // Se generará en beforeAll
      roles: [mockRoles.docente],
      toObject: function () {
        return { ...this, password: undefined };
      },
    },
    estudiante: {
      _id: '507f1f77bcf86cd799439023',
      name: 'Estudiante User',
      email: 'estudiante@test.com',
      password: '', // Se generará en beforeAll
      roles: [mockRoles.estudiante],
      toObject: function () {
        return { ...this, password: undefined };
      },
    },
  };

  const mockCourse = {
    _id: '507f1f77bcf86cd799439031',
    name: 'Curso de Prueba',
    description: 'Descripción del curso',
    teacher: '507f1f77bcf86cd799439022',
    students: [],
    active: true,
  };

  beforeAll(async () => {
    // Generar contraseñas hasheadas
    const hashedPassword = await bcrypt.hash('password123', 10);
    mockUsers.admin.password = hashedPassword;
    mockUsers.docente.password = hashedPassword;
    mockUsers.estudiante.password = hashedPassword;

    // Helper to create a chainable mock (supports .populate().populate().select().exec())
    const chainable = (result: any) => {
      const chain: any = {
        exec: jest.fn().mockResolvedValue(result),
        populate: jest.fn(),
        select: jest.fn(),
      };
      // allow multiple populate/select calls
      chain.populate.mockImplementation(() => chain);
      chain.select.mockImplementation(() => chain);
      return chain;
    };

    // Mock del UserModel - act as constructor and provide chainable query defaults
    mockUserModel = jest.fn();
    mockUserModel.findOne = jest.fn().mockImplementation(() => chainable(null));
    mockUserModel.findById = jest
      .fn()
      .mockImplementation(() => chainable(null));
    mockUserModel.create = jest.fn().mockResolvedValue(null);
    mockUserModel.findByIdAndUpdate = jest
      .fn()
      .mockImplementation(() => chainable(null));
    mockUserModel.find = jest.fn().mockImplementation(() => chainable([]));
    // when used as `new UserModel(dto)` return an object with save() and toObject()
    mockUserModel.mockImplementation((data: any) => ({
      ...data,
      save: jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439099',
        ...data,
        toObject: function () {
          const { password, ...rest } = this;
          return rest;
        },
      }),
      toObject: function () {
        const { password, ...rest } = this;
        return rest;
      },
    }));

    // Mock del RoleModel - siempre retornar chainable
    mockRoleModel = jest.fn();
    mockRoleModel.findOne = jest.fn().mockImplementation(() => chainable(null));
    mockRoleModel.findById = jest
      .fn()
      .mockImplementation(() => chainable(mockRoles.estudiante));
    mockRoleModel.findByIdAndUpdate = jest
      .fn()
      .mockImplementation(() => chainable(null));
    mockRoleModel.findByIdAndDelete = jest
      .fn()
      .mockImplementation(() => chainable(null));
    mockRoleModel.create = jest.fn();
    mockRoleModel.find = jest.fn().mockImplementation(() => chainable([]));
    // Constructor behavior
    mockRoleModel.mockImplementation((data: any) => ({
      ...data,
      save: jest
        .fn()
        .mockResolvedValue({ _id: '607f1f77bcf86cd799439099', ...data }),
    }));

    // Mock del CourseModel as a constructor function and provide chainable defaults
    mockCourseModel = jest.fn();
    mockCourseModel.findById = jest
      .fn()
      .mockImplementation(() => chainable(null));
    mockCourseModel.create = jest.fn().mockResolvedValue(null);
    mockCourseModel.findByIdAndUpdate = jest
      .fn()
      .mockImplementation(() => chainable(null));
    mockCourseModel.find = jest.fn().mockImplementation(() => chainable([]));
    // default constructor behavior
    mockCourseModel.mockImplementation((data: any) => ({
      ...data,
      save: jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439099',
        ...data,
        toObject: function () {
          return this;
        },
      }),
      toObject: function () {
        return this;
      },
    }));

    // Mock del PermissionModel
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
    mockPermissionModel.countDocuments = jest.fn().mockResolvedValue(0);
    mockPermissionModel.create = jest.fn();
    // Constructor behavior
    mockPermissionModel.mockImplementation((data: any) => ({
      ...data,
      save: jest
        .fn()
        .mockResolvedValue({ _id: '607f1f77bcf86cd799439099', ...data }),
    }));

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getModelToken(User.name))
      .useValue(mockUserModel)
      .overrideProvider(getModelToken(Role.name))
      .useValue(mockRoleModel)
      .overrideProvider(getModelToken(Course.name))
      .useValue(mockCourseModel)
      .overrideProvider(getModelToken(Permission.name))
      .useValue(mockPermissionModel)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Generar tokens de autenticación
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
      permissions: [{ name: 'create:course', method: 'POST' }],
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

  // ==========================================
  // 🔐 AUTHENTICATION TESTS
  // ==========================================

  describe('Authentication', () => {
    describe('POST /auth/login - Login exitoso', () => {
      it('debe retornar mensaje de verificación cuando las credenciales son correctas', async () => {
        // Configurar mocks
        mockUserModel.findOne.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({
              ...mockUsers.estudiante,
              toObject: () => ({
                ...mockUsers.estudiante,
                password: undefined,
              }),
            }),
          }),
        });

        mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUsers.estudiante);

        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'estudiante@test.com',
            password: 'password123',
          })
          .expect(200);

        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('email', 'estudiante@test.com');
        expect(response.body).toHaveProperty('requiresVerification', true);
        expect(mockUserModel.findOne).toHaveBeenCalledWith({
          email: 'estudiante@test.com',
        });
      });
    });

    describe('POST /auth/login - Login fallido', () => {
      it('debe retornar 401 cuando la contraseña es incorrecta', async () => {
        // Mock: usuario existe pero contraseña incorrecta
        mockUserModel.findOne.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({
              ...mockUsers.estudiante,
              password: await bcrypt.hash('otrapassword', 10),
              toObject: () => ({ ...mockUsers.estudiante }),
            }),
          }),
        });

        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'estudiante@test.com',
            password: 'password-incorrecta',
          })
          .expect(401);

        expect(response.body).toHaveProperty(
          'message',
          'Credenciales inválidas',
        );
      });

      it('debe retornar 401 cuando el usuario no existe', async () => {
        mockUserModel.findOne.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        });

        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'noexiste@test.com',
            password: 'password123',
          })
          .expect(401);

        expect(response.body).toHaveProperty(
          'message',
          'Credenciales inválidas',
        );
      });
    });
  });

  // ==========================================
  // 👥 USER MANAGEMENT TESTS
  // ==========================================

  describe('User Management', () => {
    describe('POST /users - Crear usuario', () => {
      it('debe fallar al crear usuario sin token (401)', async () => {
        // Configurar mocks para que findOne retorne null (email no existe)
        mockUserModel.findOne.mockImplementationOnce(() => chainable(null));

        const response = await request(app.getHttpServer())
          .post('/users')
          .send({
            name: 'Nuevo Usuario',
            email: 'nuevo@test.com',
            password: 'password123',
            roleId: mockRoles.estudiante._id,
          })
          .expect(401);

        expect(response.body).toHaveProperty('message', 'Unauthorized');
      });

      it('debe fallar al crear usuario con rol Docente (403)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.docente),
          }),
        });

        const response = await request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${docenteToken}`)
          .send({
            name: 'Nuevo Usuario',
            email: 'nuevo@test.com',
            password: 'password123',
            roleId: mockRoles.estudiante._id,
          })
          .expect(403);

        expect(response.body).toHaveProperty('message');
      });

      it('debe crear usuario exitosamente con rol Admin (201)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        // Mock para verificar que el email no existe
        mockUserModel.findOne.mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(null),
        });

        // Mock para verificar que el rol existe
        mockRoleModel.findById.mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockRoles.estudiante),
        });

        // Mock del usuario guardado
        const mockSavedUser = {
          _id: '507f1f77bcf86cd799439041',
          name: 'Nuevo Usuario',
          email: 'nuevo@test.com',
          roles: [mockRoles.estudiante._id],
          toObject: jest.fn().mockReturnValue({
            _id: '507f1f77bcf86cd799439041',
            name: 'Nuevo Usuario',
            email: 'nuevo@test.com',
            roles: [mockRoles.estudiante],
          }),
        };

        // Mock del constructor UserModel - retorna objeto con save()
        mockUserModel.mockImplementationOnce((data: any) => ({
          ...data,
          save: jest.fn().mockResolvedValue(mockSavedUser),
        }));

        const response = await request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Nuevo Usuario',
            email: 'nuevo@test.com',
            password: 'password123',
            roleId: mockRoles.estudiante._id,
          })
          .expect(201);

        expect(response.body).toHaveProperty('name', 'Nuevo Usuario');
        expect(response.body).toHaveProperty('email', 'nuevo@test.com');
        expect(mockUserModel).toHaveBeenCalled(); // Verificar que el constructor fue llamado
      });
    });

    describe('GET /users - Obtener usuarios', () => {
      it('debe obtener todos los usuarios exitosamente (Admin)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        mockUserModel.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              exec: jest
                .fn()
                .mockResolvedValue([
                  mockUsers.admin,
                  mockUsers.docente,
                  mockUsers.estudiante,
                ]),
            }),
          }),
        });

        const response = await request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(3);
      });
    });

    describe('GET /users/my-teachers - Obtener profesores de mis cursos (Solo Estudiante)', () => {
      it('debe obtener profesores de los cursos del estudiante (200)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.estudiante),
          }),
        });

        // Mock de cursos con profesores
        const coursesWithTeachers = [
          {
            _id: mockCourse._id,
            name: mockCourse.name,
            description: mockCourse.description,
            teacher: {
              _id: mockUsers.docente._id,
              name: mockUsers.docente.name,
              email: mockUsers.docente.email,
            },
            students: [mockUsers.estudiante._id],
          },
          {
            _id: '507f1f77bcf86cd799439032',
            name: 'Matemáticas Avanzadas',
            description: 'Curso de matemáticas',
            teacher: {
              _id: '507f1f77bcf86cd799439024',
              name: 'Prof. María García',
              email: 'maria@test.com',
            },
            students: [mockUsers.estudiante._id],
          },
        ];

        mockCourseModel.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(coursesWithTeachers),
          }),
        });

        const response = await request(app.getHttpServer())
          .get('/users/my-teachers')
          .set('Authorization', `Bearer ${estudianteToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);
        expect(response.body[0]).toHaveProperty('courseName');
        expect(response.body[0]).toHaveProperty('teacherName');
        expect(response.body[0]).toHaveProperty('teacherEmail');
      });

      it('debe retornar lista vacía si el estudiante no está inscrito en cursos (200)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.estudiante),
          }),
        });

        mockCourseModel.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        });

        const response = await request(app.getHttpServer())
          .get('/users/my-teachers')
          .set('Authorization', `Bearer ${estudianteToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
      });

      it('debe denegar acceso a Docente (403)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.docente),
          }),
        });

        const response = await request(app.getHttpServer())
          .get('/users/my-teachers')
          .set('Authorization', `Bearer ${docenteToken}`)
          .expect(403);

        expect(response.body).toHaveProperty('message');
      });

      it('debe denegar acceso a Administrador (403)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        const response = await request(app.getHttpServer())
          .get('/users/my-teachers')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(403);

        expect(response.body).toHaveProperty('message');
      });

      it('debe fallar sin token de autenticación (401)', async () => {
        const response = await request(app.getHttpServer())
          .get('/users/my-teachers')
          .expect(401);

        expect(response.body).toHaveProperty('message', 'Unauthorized');
      });
    });
  });

  // ==========================================
  // 📚 COURSE MANAGEMENT TESTS
  // ==========================================

  describe('Course Management', () => {
    describe('POST /courses - Crear curso', () => {
      it('debe fallar al crear curso con rol Estudiante (403)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.estudiante),
          }),
        });

        const response = await request(app.getHttpServer())
          .post('/courses')
          .set('Authorization', `Bearer ${estudianteToken}`)
          .send({
            name: 'Nuevo Curso',
            description: 'Descripción',
            teacherId: mockUsers.docente._id,
          })
          .expect(403);

        expect(response.body).toHaveProperty('message');
        expect(mockCourseModel.create).not.toHaveBeenCalled();
      });

      it('debe crear curso exitosamente con rol Docente (201)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({
              ...mockUsers.docente,
              roles: [mockRoles.docente],
            }),
          }),
        });

        const newCourse = {
          _id: '507f1f77bcf86cd799439051',
          name: 'Nuevo Curso',
          description: 'Descripción',
          teacher: mockUsers.docente._id,
          students: [],
          active: true,
          save: jest.fn().mockResolvedValue({
            _id: '507f1f77bcf86cd799439051',
            name: 'Nuevo Curso',
            description: 'Descripción',
            teacher: mockUsers.docente._id,
            students: [],
            active: true,
          }),
        };

        // Mock del constructor del modelo
        mockCourseModel.mockImplementation(() => newCourse);

        // Mock para el findById después del save
        mockCourseModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue({
            _id: '507f1f77bcf86cd799439051',
            name: 'Nuevo Curso',
            description: 'Descripción',
            teacher: mockUsers.docente,
            students: [],
            active: true,
          }),
        });

        const response = await request(app.getHttpServer())
          .post('/courses')
          .set('Authorization', `Bearer ${docenteToken}`)
          .send({
            name: 'Nuevo Curso',
            description: 'Descripción',
            teacherId: mockUsers.docente._id,
          })
          .expect(201);

        expect(response.body).toHaveProperty('name', 'Nuevo Curso');
        expect(response.body).toHaveProperty('teacher');
      });
    });

    describe('POST /courses/:id/enroll - Inscribir estudiantes', () => {
      it('debe inscribir estudiantes exitosamente (Docente)', async () => {
        // Mock de userModel.findById - retorna usuario según el ID
        mockUserModel.findById.mockImplementation((userId: string) => ({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(
              userId === mockUsers.docente._id
                ? mockUsers.docente
                : {
                    ...mockUsers.estudiante,
                    roles: [mockRoles.estudiante],
                  },
            ),
          }),
        }));

        // Mock del curso - findById retorna curso con save()
        const mockCourseWithSave = {
          _id: mockCourse._id,
          name: mockCourse.name,
          description: mockCourse.description,
          teacher: mockUsers.docente._id,
          students: [] as any[],
          active: true,
          save: jest.fn().mockResolvedValue({
            _id: mockCourse._id,
            name: mockCourse.name,
            students: [mockUsers.estudiante._id],
          }),
        };

        // Mock de courseModel.findById - necesita ser más inteligente
        let findByIdCallCount = 0;
        mockCourseModel.findById.mockImplementation(() => {
          findByIdCallCount++;
          if (findByIdCallCount === 1) {
            // Primera llamada - retorna curso simple con exec()
            return {
              exec: jest.fn().mockResolvedValue(mockCourseWithSave),
            };
          } else {
            // Segunda llamada después de save - retorna con populate chainable
            return {
              populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  exec: jest.fn().mockResolvedValue({
                    ...mockCourse,
                    students: [
                      {
                        _id: mockUsers.estudiante._id,
                        name: mockUsers.estudiante.name,
                        email: mockUsers.estudiante.email,
                      },
                    ],
                    teacher: {
                      _id: mockUsers.docente._id,
                      name: mockUsers.docente.name,
                      email: mockUsers.docente.email,
                    },
                  }),
                }),
              }),
            };
          }
        });

        const response = await request(app.getHttpServer())
          .post(`/courses/${mockCourse._id}/enroll`)
          .set('Authorization', `Bearer ${docenteToken}`)
          .send({
            studentIds: [mockUsers.estudiante._id],
          });

        // El endpoint POST retorna 201 Created
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('students');
        expect(mockCourseWithSave.save).toHaveBeenCalled();
      });
    });

    describe('GET /courses - Ver cursos', () => {
      it('debe ver cursos exitosamente como Estudiante (200)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.estudiante),
          }),
        });

        mockCourseModel.find.mockReturnValue(
          chainable([
            {
              ...mockCourse,
              students: [mockUsers.estudiante._id],
            },
          ]),
        );

        const response = await request(app.getHttpServer())
          .get('/courses')
          .set('Authorization', `Bearer ${estudianteToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('debe ver cursos exitosamente como Docente (200)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.docente),
          }),
        });

        mockCourseModel.find.mockReturnValue(chainable([mockCourse]));

        const response = await request(app.getHttpServer())
          .get('/courses')
          .set('Authorization', `Bearer ${docenteToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('debe ver todos los cursos exitosamente como Admin (200)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        mockCourseModel.find.mockReturnValue(
          chainable([
            mockCourse,
            { ...mockCourse, _id: '507f1f77bcf86cd799439032' },
            { ...mockCourse, _id: '507f1f77bcf86cd799439033' },
          ]),
        );

        const response = await request(app.getHttpServer())
          .get('/courses')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(1);
      });
    });

    describe('GET /courses/all - Ver todos los cursos (Solo Admin)', () => {
      it('debe retornar todos los cursos como Administrador (200)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        const allCourses = [
          mockCourse,
          { ...mockCourse, _id: '507f1f77bcf86cd799439032', name: 'Curso 2' },
          { ...mockCourse, _id: '507f1f77bcf86cd799439033', name: 'Curso 3' },
        ];

        mockCourseModel.find.mockReturnValue(chainable(allCourses));

        const response = await request(app.getHttpServer())
          .get('/courses/all')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(3);
      });

      it('debe denegar acceso a Docente (403)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.docente),
          }),
        });

        const response = await request(app.getHttpServer())
          .get('/courses/all')
          .set('Authorization', `Bearer ${docenteToken}`)
          .expect(403);

        expect(response.body).toHaveProperty('message');
      });

      it('debe denegar acceso a Estudiante (403)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.estudiante),
          }),
        });

        const response = await request(app.getHttpServer())
          .get('/courses/all')
          .set('Authorization', `Bearer ${estudianteToken}`)
          .expect(403);

        expect(response.body).toHaveProperty('message');
      });

      it('debe fallar sin token de autenticación (401)', async () => {
        const response = await request(app.getHttpServer())
          .get('/courses/all')
          .expect(401);

        expect(response.body).toHaveProperty('message', 'Unauthorized');
      });
    });
  });

  // ==========================================
  // 🔑 PERMISSIONS MANAGEMENT TESTS
  // ==========================================

  describe('Permissions Management', () => {
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
      updateUser: {
        _id: '607f1f77bcf86cd799439043',
        name: 'update:user',
        description: 'Permite actualizar usuarios',
        method: 'PATCH',
      },
    };

    describe('POST /permissions - Crear permiso', () => {
      it('debe fallar al crear permiso sin autenticación (401)', async () => {
        const response = await request(app.getHttpServer())
          .post('/permissions')
          .send({
            name: 'test:permission',
            description: 'Permiso de prueba',
            method: 'GET',
          })
          .expect(401);

        expect(response.body).toHaveProperty('message', 'Unauthorized');
      });

      it('debe fallar al crear permiso con rol Estudiante (403)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.estudiante),
          }),
        });

        const response = await request(app.getHttpServer())
          .post('/permissions')
          .set('Authorization', `Bearer ${estudianteToken}`)
          .send({
            name: 'test:permission',
            description: 'Permiso de prueba',
            method: 'GET',
          })
          .expect(403);

        expect(response.body).toHaveProperty('message');
      });

      it('debe fallar al crear permiso con rol Docente (403)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.docente),
          }),
        });

        const response = await request(app.getHttpServer())
          .post('/permissions')
          .set('Authorization', `Bearer ${docenteToken}`)
          .send({
            name: 'test:permission',
            description: 'Permiso de prueba',
            method: 'GET',
          })
          .expect(403);

        expect(response.body).toHaveProperty('message');
      });

      it('debe crear permiso exitosamente con rol Admin (201)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        // Mock: verificar que el permiso no existe
        mockPermissionModel.findOne.mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        });

        // Mock del permiso guardado
        const mockSavedPermission = {
          _id: '607f1f77bcf86cd799439044',
          name: 'delete:course',
          description: 'Permite eliminar cursos',
          method: 'DELETE',
          save: jest.fn().mockResolvedValue({
            _id: '607f1f77bcf86cd799439044',
            name: 'delete:course',
            description: 'Permite eliminar cursos',
            method: 'DELETE',
          }),
        };

        mockPermissionModel.mockImplementationOnce(() => mockSavedPermission);

        const response = await request(app.getHttpServer())
          .post('/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'delete:course',
            description: 'Permite eliminar cursos',
            method: 'DELETE',
          })
          .expect(201);

        expect(response.body).toHaveProperty('name', 'delete:course');
        expect(response.body).toHaveProperty('method', 'DELETE');
        expect(mockSavedPermission.save).toHaveBeenCalled();
      });

      it('debe fallar al crear permiso duplicado (409)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        // Mock: el permiso ya existe
        mockPermissionModel.findOne.mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPermissions.createUser),
        });

        const response = await request(app.getHttpServer())
          .post('/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'create:user',
            description: 'Permite crear usuarios',
            method: 'POST',
          })
          .expect(409);

        expect(response.body).toHaveProperty('message', 'El permiso ya existe');
      });
    });

    describe('GET /permissions - Obtener todos los permisos', () => {
      it('debe fallar sin autenticación (401)', async () => {
        const response = await request(app.getHttpServer())
          .get('/permissions')
          .expect(401);

        expect(response.body).toHaveProperty('message', 'Unauthorized');
      });

      it('debe fallar con rol Estudiante (403)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.estudiante),
          }),
        });

        const response = await request(app.getHttpServer())
          .get('/permissions')
          .set('Authorization', `Bearer ${estudianteToken}`)
          .expect(403);

        expect(response.body).toHaveProperty('message');
      });

      it('debe obtener todos los permisos exitosamente con rol Admin (200)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        mockPermissionModel.find.mockReturnValue({
          exec: jest
            .fn()
            .mockResolvedValue([
              mockPermissions.createUser,
              mockPermissions.readUser,
              mockPermissions.updateUser,
            ]),
        });

        const response = await request(app.getHttpServer())
          .get('/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(3);
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('method');
      });
    });

    describe('GET /permissions/:id - Obtener permiso por ID', () => {
      it('debe obtener un permiso específico exitosamente (200)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        mockPermissionModel.findById.mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPermissions.createUser),
        });

        const response = await request(app.getHttpServer())
          .get(`/permissions/${mockPermissions.createUser._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty(
          '_id',
          mockPermissions.createUser._id,
        );
        expect(response.body).toHaveProperty('name', 'create:user');
      });

      it('debe fallar cuando el permiso no existe (404)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        mockPermissionModel.findById.mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        });

        const response = await request(app.getHttpServer())
          .get('/permissions/507f1f77bcf86cd799439999')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body).toHaveProperty('message');
      });
    });

    describe('PATCH /permissions/:id - Actualizar permiso', () => {
      it('debe actualizar un permiso exitosamente (200)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        const updatedPermission = {
          ...mockPermissions.createUser,
          description: 'Permite crear nuevos usuarios en el sistema',
        };

        mockPermissionModel.findByIdAndUpdate.mockReturnValue({
          exec: jest.fn().mockResolvedValue(updatedPermission),
        });

        const response = await request(app.getHttpServer())
          .patch(`/permissions/${mockPermissions.createUser._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            description: 'Permite crear nuevos usuarios en el sistema',
          })
          .expect(200);

        expect(response.body).toHaveProperty(
          'description',
          'Permite crear nuevos usuarios en el sistema',
        );
      });

      it('debe fallar al actualizar permiso inexistente (404)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        mockPermissionModel.findByIdAndUpdate.mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        });

        const response = await request(app.getHttpServer())
          .patch('/permissions/507f1f77bcf86cd799439999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            description: 'Nueva descripción',
          })
          .expect(404);

        expect(response.body).toHaveProperty('message');
      });
    });

    describe('DELETE /permissions/:id - Eliminar permiso', () => {
      it('debe eliminar un permiso exitosamente (200)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        mockPermissionModel.findByIdAndDelete.mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPermissions.updateUser),
        });

        const response = await request(app.getHttpServer())
          .delete(`/permissions/${mockPermissions.updateUser._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(mockPermissionModel.findByIdAndDelete).toHaveBeenCalledWith(
          mockPermissions.updateUser._id,
        );
      });

      it('debe fallar al eliminar permiso inexistente (404)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        mockPermissionModel.findByIdAndDelete.mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        });

        const response = await request(app.getHttpServer())
          .delete('/permissions/507f1f77bcf86cd799439999')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body).toHaveProperty('message');
      });
    });
  });

  // ==========================================
  // 👔 ROLES MANAGEMENT TESTS
  // ==========================================

  describe('Roles Management', () => {
    const mockCustomRole = {
      _id: '607f1f77bcf86cd799439051',
      name: 'moderador',
      description: 'Rol de moderador',
      permissions: [
        {
          _id: '607f1f77bcf86cd799439041',
          name: 'read:user',
          method: 'GET',
        },
      ],
    };

    describe('POST /roles - Crear rol', () => {
      it('debe fallar al crear rol sin autenticación (401)', async () => {
        const response = await request(app.getHttpServer())
          .post('/roles')
          .send({
            name: 'test-role',
            description: 'Rol de prueba',
            permissions: [],
          })
          .expect(401);

        expect(response.body).toHaveProperty('message', 'Unauthorized');
      });

      it('debe fallar al crear rol con rol Estudiante (403)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.estudiante),
          }),
        });

        const response = await request(app.getHttpServer())
          .post('/roles')
          .set('Authorization', `Bearer ${estudianteToken}`)
          .send({
            name: 'test-role',
            description: 'Rol de prueba',
            permissions: [],
          })
          .expect(403);

        expect(response.body).toHaveProperty('message');
      });

      it('debe crear rol exitosamente con rol Admin (201)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        // Mock: verificar que el rol no existe
        mockRoleModel.findOne.mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        });

        // Mock: verificar que los permisos existen
        mockPermissionModel.countDocuments.mockResolvedValue(2);

        const mockSavedRole = {
          _id: '607f1f77bcf86cd799439052',
          name: 'supervisor',
          description: 'Rol de supervisor',
          permissions: ['607f1f77bcf86cd799439041', '607f1f77bcf86cd799439042'],
          save: jest.fn().mockResolvedValue({
            _id: '607f1f77bcf86cd799439052',
            name: 'supervisor',
            description: 'Rol de supervisor',
            permissions: [
              '607f1f77bcf86cd799439041',
              '607f1f77bcf86cd799439042',
            ],
          }),
        };

        mockRoleModel.mockImplementationOnce(() => mockSavedRole);

        const response = await request(app.getHttpServer())
          .post('/roles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'supervisor',
            description: 'Rol de supervisor',
            permissions: [
              '607f1f77bcf86cd799439041',
              '607f1f77bcf86cd799439042',
            ],
          })
          .expect(201);

        expect(response.body).toHaveProperty('name', 'supervisor');
        expect(mockSavedRole.save).toHaveBeenCalled();
      });

      it('debe fallar al crear rol duplicado (409)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        // Mock: el rol ya existe
        mockRoleModel.findOne.mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockRoles.admin),
        });

        const response = await request(app.getHttpServer())
          .post('/roles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'ADMIN',
            description: 'Administrador',
            permissions: [],
          })
          .expect(409);

        expect(response.body).toHaveProperty('message', 'El rol ya existe');
      });

      it('debe fallar al crear rol con permisos inexistentes (404)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        mockRoleModel.findOne.mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        });

        // Mock: algunos permisos no existen
        mockPermissionModel.countDocuments.mockResolvedValue(1); // Se esperaban 2

        const response = await request(app.getHttpServer())
          .post('/roles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'test-role',
            description: 'Rol de prueba',
            permissions: [
              '607f1f77bcf86cd799439041',
              '607f1f77bcf86cd799439999',
            ],
          })
          .expect(404);

        expect(response.body).toHaveProperty(
          'message',
          'Uno o más permisos no existen',
        );
      });
    });

    describe('GET /roles - Obtener todos los roles', () => {
      it('debe fallar sin autenticación (401)', async () => {
        const response = await request(app.getHttpServer())
          .get('/roles')
          .expect(401);

        expect(response.body).toHaveProperty('message', 'Unauthorized');
      });

      it('debe fallar con rol Docente (403)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.docente),
          }),
        });

        const response = await request(app.getHttpServer())
          .get('/roles')
          .set('Authorization', `Bearer ${docenteToken}`)
          .expect(403);

        expect(response.body).toHaveProperty('message');
      });

      it('debe obtener todos los roles exitosamente con rol Admin (200)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        mockRoleModel.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest
              .fn()
              .mockResolvedValue([
                mockRoles.admin,
                mockRoles.docente,
                mockRoles.estudiante,
                mockCustomRole,
              ]),
          }),
        });

        const response = await request(app.getHttpServer())
          .get('/roles')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(4);
        expect(response.body[0]).toHaveProperty('name');
      });
    });

    describe('GET /roles/:id - Obtener rol por ID', () => {
      it('debe obtener un rol específico exitosamente (200)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        mockRoleModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockCustomRole),
          }),
        });

        const response = await request(app.getHttpServer())
          .get(`/roles/${mockCustomRole._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('_id', mockCustomRole._id);
        expect(response.body).toHaveProperty('name', 'moderador');
        expect(response.body).toHaveProperty('permissions');
      });

      it('debe fallar cuando el rol no existe (404)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        mockRoleModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        });

        const response = await request(app.getHttpServer())
          .get('/roles/507f1f77bcf86cd799439999')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body).toHaveProperty('message');
      });
    });

    describe('PATCH /roles/:id - Actualizar rol', () => {
      it('debe actualizar un rol exitosamente (200)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        // Mock findById inicial
        mockRoleModel.findById.mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockCustomRole),
        });

        mockPermissionModel.countDocuments.mockResolvedValue(1);

        const updatedRole = {
          ...mockCustomRole,
          description: 'Rol de moderador actualizado',
        };

        mockRoleModel.findByIdAndUpdate.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(updatedRole),
          }),
        });

        const response = await request(app.getHttpServer())
          .patch(`/roles/${mockCustomRole._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            description: 'Rol de moderador actualizado',
          })
          .expect(200);

        expect(response.body).toHaveProperty(
          'description',
          'Rol de moderador actualizado',
        );
      });

      it('debe fallar al actualizar rol inexistente (404)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        // Mock para que findById retorne null (rol no existe)
        mockRoleModel.findById.mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(null),
        });

        const response = await request(app.getHttpServer())
          .patch('/roles/507f1f77bcf86cd799439999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            description: 'Nueva descripción',
          })
          .expect(404);

        expect(response.body).toHaveProperty('message');
      });

      it('debe fallar al cambiar nombre de rol protegido (400)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        // Mock para que findById retorne el rol ADMIN (protegido)
        mockRoleModel.findById.mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockRoles.admin),
        });

        const response = await request(app.getHttpServer())
          .patch(`/roles/${mockRoles.admin._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'super-admin',
          })
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('protegido');
      });
    });

    describe('DELETE /roles/:id - Eliminar rol', () => {
      it('debe eliminar un rol personalizado exitosamente (200)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        mockRoleModel.findById.mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockCustomRole),
        });

        mockRoleModel.findByIdAndDelete.mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockCustomRole),
        });

        const response = await request(app.getHttpServer())
          .delete(`/roles/${mockCustomRole._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(mockRoleModel.findByIdAndDelete).toHaveBeenCalledWith(
          mockCustomRole._id,
        );
      });

      it('debe fallar al eliminar rol protegido (400)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        // Mock para que findById retorne rol protegido
        mockRoleModel.findById.mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockRoles.admin),
        });

        const response = await request(app.getHttpServer())
          .delete(`/roles/${mockRoles.admin._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('protegido');
      });

      it('debe fallar al eliminar rol inexistente (404)', async () => {
        mockUserModel.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUsers.admin),
          }),
        });

        // Mock para que findById retorne null (rol no existe)
        mockRoleModel.findById.mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(null),
        });

        const response = await request(app.getHttpServer())
          .delete('/roles/507f1f77bcf86cd799439999')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body).toHaveProperty('message');
      });
    });
  });
});
