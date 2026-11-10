import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Role, RoleDocument } from '../auth/schemas/role.schema';
import { Course, CourseDocument } from '../courses/schemas/course.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TeacherCourseInfoDto } from './dto/teacher-course-info.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verificar si el email ya existe
    const existingUser = await this.userModel
      .findOne({ email: createUserDto.email })
      .exec();

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Verificar que el rol existe o asignar por defecto 'estudiante'
    let roleId = createUserDto.roleId;

    if (!roleId) {
      const defaultRole = await this.roleModel
        .findOne({ name: 'estudiante' })
        .exec();
      if (!defaultRole) {
        throw new NotFoundException(
          'El rol por defecto (estudiante) no existe en el sistema',
        );
      }
      roleId = (defaultRole as any)._id.toString();
    } else {
      const role = await this.roleModel.findById(roleId).exec();
      if (!role) {
        throw new NotFoundException('El rol especificado no existe');
      }
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Crear el usuario
    const newUser = new this.userModel({
      name: createUserDto.name,
      email: createUserDto.email,
      password: hashedPassword,
      photo: createUserDto.photo,
      phone: createUserDto.phone,
      address: createUserDto.address,
      birthDate: createUserDto.birthDate,
      roles: [new Types.ObjectId(roleId)],
    });

    const savedUser = await newUser.save();

    return savedUser;
  }

  async findAll(): Promise<User[]> {
    const users = await this.userModel
      .find()
      .populate('roles', 'name description')
      .select('-password')
      .exec();

    return users;
  }

  async findOne(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const user = await this.userModel
      .findById(id)
      .populate('roles', 'name description')
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async findByRole(roleName: string): Promise<User[]> {
    const role = await this.roleModel.findOne({ name: roleName }).exec();

    if (!role) {
      throw new NotFoundException(`Rol ${roleName} no encontrado`);
    }

    const users = await this.userModel
      .find({ roles: role._id })
      .populate('roles', 'name description')
      .select('-password')
      .exec();

    return users;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Si se actualiza el email, verificar que no exista
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userModel
        .findOne({ email: updateUserDto.email })
        .exec();

      if (existingUser) {
        throw new ConflictException('El email ya está en uso');
      }
    }

    // Si se actualiza el rol, verificar que existe
    if (updateUserDto.roleId) {
      const role = await this.roleModel.findById(updateUserDto.roleId).exec();
      if (!role) {
        throw new NotFoundException('El rol especificado no existe');
      }
      user.roles = [new Types.ObjectId(updateUserDto.roleId)];
    }

    // Actualizar campos
    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.photo) user.photo = updateUserDto.photo;
    if (updateUserDto.phone) user.phone = updateUserDto.phone;
    if (updateUserDto.address) user.address = updateUserDto.address;
    if (updateUserDto.birthDate) user.birthDate = updateUserDto.birthDate;

    // Si se actualiza la contraseña, hacer hash
    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await user.save();

    return this.sanitizeUser(updatedUser);
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const result = await this.userModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
  }

  async getMyTeachers(studentId: string): Promise<TeacherCourseInfoDto[]> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('ID de estudiante inválido');
    }

    // Verificar que el usuario existe
    const student = await this.userModel.findById(studentId).exec();
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    // Buscar todos los cursos en los que está inscrito el estudiante
    const courses = await this.courseModel
      .find({ students: new Types.ObjectId(studentId) })
      .populate('teacher', 'name email')
      .exec();

    // Mapear a DTOs con información del profesor
    const teacherCourseInfo: TeacherCourseInfoDto[] = courses.map((course) => {
      const teacher = course.teacher as any;

      const result: TeacherCourseInfoDto = {
        courseName: course.name,
        teacherName: teacher.name,
        teacherEmail: teacher.email,
      };

      return result;
    });

    return teacherCourseInfo;
  }

  private sanitizeUser(user: UserDocument): User {
    const userObject = user.toObject();
    delete userObject.password;
    return userObject;
  }
}
