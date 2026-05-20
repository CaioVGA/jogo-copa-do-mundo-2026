import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async updateProfile(
    userId: string,
    data: { name?: string; password?: string; avatar?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const updateData: any = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.avatar !== undefined) {
      updateData.avatar = data.avatar;
    }
    if (data.password !== undefined && data.password.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const { passwordHash, ...safeUser } = updatedUser;
    return safeUser;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return users.map(({ passwordHash, ...user }) => user);
  }

  async updateUserRole(id: string, role: string) {
    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
    });
    const { passwordHash, ...user } = updated;
    return user;
  }

  async updateUserActiveStatus(id: string, active: boolean) {
    const updated = await this.prisma.user.update({
      where: { id },
      data: { active },
    });
    const { passwordHash, ...user } = updated;
    return user;
  }
}
