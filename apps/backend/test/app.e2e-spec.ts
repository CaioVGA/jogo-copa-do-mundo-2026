import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/prisma/redis.service';
import { MailService } from '../src/mail/mail.service';

// Mock do nodemailer para evitar disparos SMTP reais em testes E2E
const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockImplementation(() => ({
    sendMail: mockSendMail,
  })),
}));

describe('Auth — Testes de Integração (E2E)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const testUser = {
    name: 'Usuário Teste',
    email: `teste-${Date.now()}@example.com`,
    password: 'Teste@123',
    confirmPassword: 'Teste@123',
  };

  const mockRedisService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    delByPattern: jest.fn().mockResolvedValue(undefined),
    client: {
      lpush: jest.fn().mockResolvedValue(1),
      rpop: jest.fn().mockResolvedValue(null),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );

    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Limpa usuário de teste criado
    await prisma.user.deleteMany({ where: { email: testUser.email } }).catch(() => null);
    await app.close();
  });

  // ─── REGISTER ─────────────────────────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('201 — deve registrar um novo usuário e ativá-lo', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body).toEqual({
        message: 'Conta criada! Verifique seu email para ativar a conta.',
      });

      // Busca o token de ativação gerado no banco e ativa a conta para os próximos testes
      const dbUser = await prisma.user.findUnique({ where: { email: testUser.email } });
      expect(dbUser).toBeDefined();
      expect(dbUser.active).toBe(false);

      await request(app.getHttpServer())
        .post('/api/auth/activate')
        .send({ token: dbUser.activationToken })
        .expect(200);

      const activatedUser = await prisma.user.findUnique({ where: { email: testUser.email } });
      expect(activatedUser.active).toBe(true);
    });

    it('409 — deve rejeitar email duplicado', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);

      expect(res.body.message).toContain('já está cadastrado');
    });

    it('400 — deve rejeitar senha fraca (sem maiúscula)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...testUser, email: 'novo@example.com', password: 'fraca@123', confirmPassword: 'fraca@123' })
        .expect(400);
    });

    it('400 — deve rejeitar senhas que não coincidem', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...testUser, email: 'novo2@example.com', confirmPassword: 'Diferente@999' })
        .expect(400);
    });

    it('400 — deve rejeitar email inválido', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...testUser, email: 'email-invalido' })
        .expect(400);
    });
  });

  // ─── LOGIN ─────────────────────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('200 — deve fazer login com credenciais corretas', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body).toMatchObject({
        user: { email: testUser.email },
        token: expect.any(String),
      });
    });

    it('401 — deve rejeitar senha incorreta', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'Errada@999' })
        .expect(401);

      expect(res.body.message).toContain('inválidos');
    });

    it('401 — deve rejeitar email não cadastrado', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'naoexiste@example.com', password: testUser.password })
        .expect(401);
    });
  });

  // ─── FORGOT PASSWORD ───────────────────────────────────────────────────────
  describe('POST /api/auth/forgot-password', () => {
    it('200 — deve retornar mensagem genérica para email existente', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(res.body.message).toContain('Se este email estiver cadastrado');
    });

    it('200 — deve retornar a mesma mensagem genérica para email inexistente (anti-enumeração)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'naoexiste@example.com' })
        .expect(200);

      expect(res.body.message).toContain('Se este email estiver cadastrado');
    });

    it('400 — deve rejeitar body sem campo email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({})
        .expect(400);
    });
  });

  // ─── VERIFY OTP ────────────────────────────────────────────────────────────
  describe('POST /api/auth/verify-otp', () => {
    it('400 — deve rejeitar OTP inválido', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/verify-otp')
        .send({ email: testUser.email, otp: '000000' })
        .expect(400);

      expect(res.body.message).toBeDefined();
    });

    it('400 — deve rejeitar se o usuário não tiver OTP gerado', async () => {
      // O usuário de teste foi criado sem OTP
      await request(app.getHttpServer())
        .post('/api/auth/verify-otp')
        .send({ email: testUser.email, otp: '123456' })
        .expect(400);
    });
  });

  // ─── RESET PASSWORD ────────────────────────────────────────────────────────
  describe('POST /api/auth/reset-password', () => {
    it('400 — deve rejeitar se não houver OTP válido', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          email: testUser.email,
          otp: '000000',
          newPassword: 'NovaSenha@456',
          confirmPassword: 'NovaSenha@456',
        })
        .expect(400);
    });

    it('400 — deve rejeitar senhas que não coincidem', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          email: testUser.email,
          otp: '000000',
          newPassword: 'NovaSenha@456',
          confirmPassword: 'Diferente@789',
        })
        .expect(400);
    });
  });

  // ─── CACHE & IDEMPOTENCY ──────────────────────────────────────────────────
  describe('Caching & Idempotency', () => {
    it('deve consultar o cache do Redis ao buscar detalhes de um grupo', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      
      const token = loginRes.body.token;
      
      const spyRedisGet = jest.spyOn(mockRedisService, 'get').mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/groups/non-existent-group-id')
        .set('Authorization', `Bearer ${token}`);

      expect(spyRedisGet).toHaveBeenCalled();
    });

    it('deve bloquear envios de email duplicados dentro da janela de 15 segundos (idempotência)', async () => {
      const mailService = app.get(MailService);
      const token = 'token-idempotencia-e2e-teste';
      
      const spyRedisGet = jest.spyOn(mockRedisService, 'get').mockResolvedValueOnce(null).mockResolvedValueOnce('1');
      const spySendMail = jest.spyOn(mailService as any, 'processEmail');

      // Primeiro envio
      await mailService.sendActivationEmail('usuario@teste.com', 'Nome Teste', token);
      
      // Segundo envio (deve ser ignorado devido à idempotência)
      await mailService.sendActivationEmail('usuario@teste.com', 'Nome Teste', token);

      expect(spySendMail).toHaveBeenCalledTimes(1);
    });
  });
});
