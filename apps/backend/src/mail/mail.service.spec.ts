import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';

// ─── Mock do nodemailer (deve vir antes do import que usa nodemailer) ─────────
const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockImplementation(() => ({
    sendMail: mockSendMail,
  })),
}));

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('MailService', () => {
  let service: MailService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        MAIL_HOST: 'smtp.example.com',
        MAIL_PORT: '587',
        MAIL_USER: 'test@example.com',
        MAIL_PASS: 'testpass',
        MAIL_FROM: 'noreply@copa2026.com',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    mockSendMail.mockClear();
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('sendOtpEmail()', () => {
    it('deve chamar sendMail com os parâmetros corretos', async () => {
      const to = 'usuario@example.com';
      const name = 'Maria Clara';
      const otp = '847291';

      await service.sendOtpEmail(to, name, otp);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to,
          subject: expect.stringContaining('verificação'),
          html: expect.stringContaining(otp),
        }),
      );
    });

    it('deve incluir o nome do usuário no email HTML', async () => {
      const name = 'Carlos Eduardo';
      await service.sendOtpEmail('test@test.com', name, '111111');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(name);
    });

    it('deve incluir o OTP no corpo do email', async () => {
      const otp = '999888';
      await service.sendOtpEmail('test@test.com', 'Teste', otp);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(otp);
    });

    it('deve mencionar o tempo de expiração de 15 minutos', async () => {
      await service.sendOtpEmail('test@test.com', 'Teste', '123456');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('15');
    });

    it('deve lançar erro se o transporter falhar', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

      await expect(
        service.sendOtpEmail('fail@test.com', 'Fail', '000000'),
      ).rejects.toThrow('SMTP error');
    });
  });
});
