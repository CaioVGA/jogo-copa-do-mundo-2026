import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
};

const mockMail = {
  sendOtpEmail: jest.fn().mockResolvedValue(undefined),
  sendActivationEmail: jest.fn().mockResolvedValue(undefined),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_PASSWORD = 'Senha@123';
const mockUser = {
  id: 'user-id-1',
  name: 'João Silva',
  email: 'joao@example.com',
  passwordHash: '',
  active: true,
  otpCode: null,
  otpExpiresAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: MailService, useValue: mockMail },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ─── REGISTER ────────────────────────────────────────────────────────────
  describe('register()', () => {
    const dto = {
      name: 'João Silva',
      email: 'joao@example.com',
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    };

    it('deve registrar um novo usuário com sucesso', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await service.register(dto);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: dto.name, email: dto.email }),
        }),
      );
      expect(result).toEqual({
        message: 'Conta criada! Verifique seu email para ativar a conta.',
      });
    });

    it('deve lançar BadRequestException se as senhas não coincidem', async () => {
      await expect(
        service.register({ ...dto, confirmPassword: 'Diferente@999' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar ConflictException se o email já está cadastrado e ativo', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('deve reenviar e-mail de ativação e retornar mensagem de conta inativa se o email estiver cadastrado mas não ativo', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, active: false });
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await service.register(dto);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({ name: dto.name }),
        }),
      );
      expect(mockMail.sendActivationEmail).toHaveBeenCalled();
      expect(result.message).toContain('Conta existente mas inativa');
    });
  });

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  describe('login()', () => {
    it('deve retornar token ao fazer login com credenciais corretas', async () => {
      const hash = await bcrypt.hash(VALID_PASSWORD, 12);
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: hash });

      const result = await service.login({ email: mockUser.email, password: VALID_PASSWORD });

      expect(result).toEqual({
        user: expect.objectContaining({ email: mockUser.email }),
        token: 'mock-jwt-token',
      });
    });

    it('deve lançar UnauthorizedException se o email não existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'naoexiste@example.com', password: VALID_PASSWORD }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se a senha está errada', async () => {
      const hash = await bcrypt.hash(VALID_PASSWORD, 12);
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: hash });

      await expect(
        service.login({ email: mockUser.email, password: 'SenhaErrada@1' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── FORGOT PASSWORD ──────────────────────────────────────────────────────
  describe('forgotPassword()', () => {
    it('deve enviar OTP por email se o usuário existir', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await service.forgotPassword({ email: mockUser.email });

      expect(mockMail.sendOtpEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.name,
        expect.any(String),
      );
      expect(result.message).toContain('Se este email estiver cadastrado');
    });

    it('deve retornar mensagem genérica mesmo se o email não existir (proteção contra enumeração)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'naoexiste@example.com' });

      expect(mockMail.sendOtpEmail).not.toHaveBeenCalled();
      expect(result.message).toContain('Se este email estiver cadastrado');
    });
  });

  // ─── VERIFY OTP ───────────────────────────────────────────────────────────
  describe('verifyOtp()', () => {
    const validOtp = '123456';
    const futureDate = new Date(Date.now() + 10 * 60 * 1000); // 10 min no futuro
    const pastDate = new Date(Date.now() - 10 * 60 * 1000); // 10 min no passado

    it('deve verificar OTP correto com sucesso', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        otpCode: validOtp,
        otpExpiresAt: futureDate,
      });

      const result = await service.verifyOtp({ email: mockUser.email, otp: validOtp });

      expect(result.valid).toBe(true);
    });

    it('deve lançar BadRequestException se o usuário não tiver OTP gerado', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, otpCode: null });

      await expect(
        service.verifyOtp({ email: mockUser.email, otp: validOtp }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se o OTP estiver incorreto', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        otpCode: validOtp,
        otpExpiresAt: futureDate,
      });

      await expect(
        service.verifyOtp({ email: mockUser.email, otp: '000000' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se o OTP estiver expirado', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        otpCode: validOtp,
        otpExpiresAt: pastDate,
      });

      await expect(
        service.verifyOtp({ email: mockUser.email, otp: validOtp }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── RESET PASSWORD ───────────────────────────────────────────────────────
  describe('resetPassword()', () => {
    const validOtp = '654321';
    const futureDate = new Date(Date.now() + 10 * 60 * 1000);
    const pastDate = new Date(Date.now() - 10 * 60 * 1000);

    const baseDto = {
      email: mockUser.email,
      otp: validOtp,
      newPassword: 'NovaSenha@456',
      confirmPassword: 'NovaSenha@456',
    };

    it('deve redefinir a senha com sucesso', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        otpCode: validOtp,
        otpExpiresAt: futureDate,
      });
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await service.resetPassword(baseDto);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ otpCode: null, otpExpiresAt: null }),
        }),
      );
      expect(result.message).toContain('sucesso');
    });

    it('deve lançar BadRequestException se as senhas não coincidem', async () => {
      await expect(
        service.resetPassword({ ...baseDto, confirmPassword: 'Diferente@789' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se o OTP estiver incorreto', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        otpCode: validOtp,
        otpExpiresAt: futureDate,
      });

      await expect(
        service.resetPassword({ ...baseDto, otp: '000000' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se o OTP estiver expirado', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        otpCode: validOtp,
        otpExpiresAt: pastDate,
      });

      await expect(service.resetPassword(baseDto)).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se não houver OTP gerado', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, otpCode: null });

      await expect(service.resetPassword(baseDto)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── RESEND ACTIVATION ────────────────────────────────────────────────────
  describe('resendActivation()', () => {
    it('deve reenviar o e-mail de ativação para uma conta inativa', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, active: false });
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await service.resendActivation({ email: mockUser.email });

      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockMail.sendActivationEmail).toHaveBeenCalled();
      expect(result.message).toContain('Um novo link de ativação foi enviado');
    });

    it('deve lançar BadRequestException se a conta já estiver ativa', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, active: true });

      await expect(
        service.resendActivation({ email: mockUser.email }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve retornar mensagem de sucesso genérica mesmo se o email não existir (proteção contra enumeração)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.resendActivation({ email: 'naoexiste@example.com' });

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockMail.sendActivationEmail).not.toHaveBeenCalled();
      expect(result.message).toContain('Se a conta correspondente não estiver ativa');
    });
  });

  // ─── CONFIRM EMAIL CHANGE ────────────────────────────────────────────────
  describe('confirmEmailChange()', () => {
    const mockToken = 'change-email-token-123';
    const pendingEmail = 'novoemail@example.com';

    it('deve confirmar a alteração de e-mail com sucesso', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        newEmail: pendingEmail,
        emailChangeToken: mockToken,
      });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, email: pendingEmail });

      const result = await service.confirmEmailChange(mockToken);

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { emailChangeToken: mockToken },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            email: pendingEmail,
            newEmail: null,
            emailChangeToken: null,
          }),
        }),
      );
      expect(result.message).toContain('E-mail alterado com sucesso');
    });

    it('deve lançar BadRequestException se o token for inválido/inexistente', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.confirmEmailChange('token-invalido')).rejects.toThrow(BadRequestException);
    });

    it('deve lançar ConflictException se o novo email já estiver em uso por outra conta', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        newEmail: pendingEmail,
        emailChangeToken: mockToken,
      });
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, email: pendingEmail });

      await expect(service.confirmEmailChange(mockToken)).rejects.toThrow(ConflictException);
    });
  });
});
