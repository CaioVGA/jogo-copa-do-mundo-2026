import {
  Body,
  Controller,
  Get,
  Put,
  Request,
  UseGuards,
  ForbiddenException,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  password?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Put('profile')
  updateProfile(@Body() dto: UpdateProfileDto, @Request() req: any) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Get()
  async getAllUsers(@Request() req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Apenas administradores podem gerenciar usuários');
    }
    return this.usersService.findAll();
  }

  @Put(':id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') role: string,
    @Request() req: any,
  ) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Apenas administradores podem gerenciar usuários');
    }
    if (role !== 'USER' && role !== 'ADMIN') {
      throw new BadRequestException('Role inválida');
    }
    return this.usersService.updateUserRole(id, role);
  }

  @Put(':id/active')
  async updateUserActiveStatus(
    @Param('id') id: string,
    @Body('active') active: boolean,
    @Request() req: any,
  ) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Apenas administradores podem gerenciar usuários');
    }
    if (typeof active !== 'boolean') {
      throw new BadRequestException('Status active inválido');
    }
    return this.usersService.updateUserActiveStatus(id, active);
  }
}
