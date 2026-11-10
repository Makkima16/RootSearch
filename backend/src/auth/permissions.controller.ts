import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { PermissionsService } from './services/permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@ApiTags('permissions')
@ApiBearerAuth('JWT-auth')
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('administrador')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo permiso',
    description: 'Crea un nuevo permiso en el sistema.',
  })
  @ApiResponse({ status: 201, description: 'Permiso creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 409, description: 'El permiso ya existe.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido. Requiere rol de ADMIN.',
  })
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos los permisos',
    description: 'Devuelve una lista de todos los permisos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de permisos recuperada exitosamente.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido. Requiere rol de ADMIN.',
  })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un permiso por ID',
    description: 'Busca y devuelve un permiso específico por su ID.',
  })
  @ApiParam({ name: 'id', description: 'ID del permiso a buscar' })
  @ApiResponse({ status: 200, description: 'Permiso encontrado.' })
  @ApiResponse({ status: 404, description: 'Permiso no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido. Requiere rol de ADMIN.',
  })
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un permiso',
    description: 'Actualiza los datos de un permiso existente.',
  })
  @ApiParam({ name: 'id', description: 'ID del permiso a actualizar' })
  @ApiResponse({
    status: 200,
    description: 'Permiso actualizado exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Permiso no encontrado.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido. Requiere rol de ADMIN.',
  })
  update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un permiso',
    description: 'Elimina permanentemente un permiso del sistema.',
  })
  @ApiParam({ name: 'id', description: 'ID del permiso a eliminar' })
  @ApiResponse({ status: 200, description: 'Permiso eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Permiso no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido. Requiere rol de ADMIN.',
  })
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}
