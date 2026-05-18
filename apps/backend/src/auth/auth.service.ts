import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  // ─── REGISTER ─────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('As senhas não coincidem');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Este email já está cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    // Gerar token de ativação
    const activationToken = require('crypto').randomBytes(32).toString('hex');
    
    const user = await this.prisma.user.create({
      data: { 
        name: dto.name, 
        email: dto.email, 
        passwordHash,
        active: false,
        activationToken 
      },
    });

    await this.mailService.sendActivationEmail(user.email, user.name, activationToken);

    return { message: 'Conta criada! Verifique seu email para ativar a conta.' };
  }

  // ─── ACTIVATE ACCOUNT ──────────────────────────────────────────────────────
  async activateAccount(token: string) {
    const user = await this.prisma.user.findFirst({ where: { activationToken: token } });
    if (!user) {
      throw new BadRequestException('Token de ativação inválido ou conta já ativada.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { active: true, activationToken: null },
    });

    return { message: 'Conta ativada com sucesso!' };
  }

  // ─── LOGIN ─────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    if (!user.active) {
      throw new UnauthorizedException('Conta inativa. Por favor, verifique seu email para ativar a conta.');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const token = this.generateToken(user.id, user.email);
    return { user: this.sanitizeUser(user), token };
  }

  // ─── FORGOT PASSWORD ───────────────────────────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // Sempre retorna sucesso para evitar enumeração de emails
    if (!user) {
      return { message: 'Se este email estiver cadastrado, você receberá um código em breve.' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otp, otpExpiresAt },
    });

    await this.mailService.sendOtpEmail(user.email, user.name, otp);

    return { message: 'Se este email estiver cadastrado, você receberá um código em breve.' };
  }

  // ─── VERIFY OTP ────────────────────────────────────────────────────────────
  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.otpCode || !user.otpExpiresAt) {
      throw new BadRequestException('Código inválido ou expirado');
    }

    if (user.otpCode !== dto.otp) {
      throw new BadRequestException('Código incorreto');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new BadRequestException('Código expirado. Solicite um novo.');
    }

    return { valid: true, message: 'Código verificado com sucesso' };
  }

  // ─── RESET PASSWORD ────────────────────────────────────────────────────────
  async resetPassword(dto: ResetPasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('As senhas não coincidem');
    }

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.otpCode || !user.otpExpiresAt) {
      throw new BadRequestException('Código inválido ou expirado');
    }

    if (user.otpCode !== dto.otp) {
      throw new BadRequestException('Código incorreto');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new BadRequestException('Código expirado. Solicite um novo.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, otpCode: null, otpExpiresAt: null },
    });

    return { message: 'Senha redefinida com sucesso!' };
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────
  private generateToken(userId: string, email: string) {
    return this.jwtService.sign({ sub: userId, email });
  }

  private sanitizeUser(user: { id: string; name: string; email: string; role: string; avatar: string | null; createdAt: Date }) {
    return { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, createdAt: user.createdAt };
  }
}
