import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from '../schemas/role.schema';
import { Permission, PermissionDocument } from '../schemas/permission.schema';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';

@Injectable()
export class RolesService {
  private readonly PROTECTED_ROLES = [
    'admin',
    'administrador',
    'docente',
    'estudiante',
  ];

  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const existing = await this.roleModel
      .findOne({ name: createRoleDto.name })
      .exec();
    if (existing) {
      throw new ConflictException('El rol ya existe');
    }

    if (createRoleDto.permissions && createRoleDto.permissions.length > 0) {
      const count = await this.permissionModel.countDocuments({
        _id: { $in: createRoleDto.permissions },
      });
      if (count !== createRoleDto.permissions.length) {
        throw new NotFoundException('Uno o más permisos no existen');
      }
    }

    const createdRole = new this.roleModel(createRoleDto);
    return createdRole.save();
  }

  async findAll(): Promise<Role[]> {
    return this.roleModel.find().populate('permissions').exec();
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleModel
      .findById(id)
      .populate('permissions')
      .exec();
    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    // Pre-fetch para validar existencia y reglas de negocio
    const roleToUpdate = await this.roleModel.findById(id).exec();
    if (!roleToUpdate) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    // Lógica de rol protegido: no permitir renombrar
    if (
      updateRoleDto.name &&
      roleToUpdate.name &&
      this.PROTECTED_ROLES.includes(roleToUpdate.name.toLowerCase()) &&
      updateRoleDto.name !== roleToUpdate.name
    ) {
      throw new BadRequestException('No se puede renombrar un rol protegido');
    }

    // Validar existencia de permisos si se envían
    if (updateRoleDto.permissions && updateRoleDto.permissions.length > 0) {
      const count = await this.permissionModel.countDocuments({
        _id: { $in: updateRoleDto.permissions },
      });
      if (count !== updateRoleDto.permissions.length) {
        throw new NotFoundException('Uno o más permisos no existen');
      }
    }

    const updatedRole = await this.roleModel
      .findByIdAndUpdate(id, updateRoleDto, { new: true })
      .populate('permissions')
      .exec();

    if (!updatedRole) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }
    return updatedRole;
  }

  async remove(id: string): Promise<void> {
    // Pre-fetch para validar existencia y reglas de negocio
    const role = await this.roleModel.findById(id).exec();
    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }
    if (role.name && this.PROTECTED_ROLES.includes(role.name.toLowerCase())) {
      throw new BadRequestException('No se puede eliminar un rol protegido');
    }
    await this.roleModel.findByIdAndDelete(id).exec();
  }
}
