import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

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

  async requestEmailChange(userId: string, newEmail: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const emailFormatted = newEmail.toLowerCase().trim();

    if (user.email.toLowerCase().trim() === emailFormatted) {
      throw new BadRequestException('O novo e-mail deve ser diferente do e-mail atual');
    }

    // Verificar se o e-mail já está em uso por outro usuário
    const existingUser = await this.prisma.user.findUnique({
      where: { email: emailFormatted },
    });

    if (existingUser) {
      throw new ConflictException('Este e-mail já está sendo utilizado por outra conta');
    }

    // Gerar token de confirmação
    const token = crypto.randomBytes(32).toString('hex');

    // Salvar no banco
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        newEmail: emailFormatted,
        emailChangeToken: token,
      },
    });

    // Enviar email de confirmação
    await this.mailService.sendEmailChangeConfirmation(emailFormatted, user.name, token);

    return { message: 'E-mail de confirmação enviado! Por favor, verifique a caixa de entrada do seu novo e-mail.' };
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
