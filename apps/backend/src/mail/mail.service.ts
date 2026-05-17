import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST'),
      port: this.config.get<number>('MAIL_PORT'),
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: this.config.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendOtpEmail(to: string, name: string, otp: string): Promise<void> {
    await this.transporter.sendMail({
      from: `"Copa do Mundo 2026 🏆" <${this.config.get('MAIL_FROM')}>`,
      to,
      subject: 'Seu código de verificação - Copa 2026',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background: #0a0f1e; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, #0a1628 0%, #1a3a2a 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,215,0,0.2); }
            .header { background: linear-gradient(135deg, #1a472a 0%, #0d5c3a 100%); padding: 40px; text-align: center; }
            .header h1 { color: #FFD700; font-size: 28px; margin: 0; }
            .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; }
            .body { padding: 40px; }
            .greeting { color: #ffffff; font-size: 18px; margin-bottom: 16px; }
            .message { color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6; margin-bottom: 32px; }
            .otp-box { background: rgba(255,215,0,0.1); border: 2px solid #FFD700; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
            .otp-code { font-size: 40px; font-weight: bold; color: #FFD700; letter-spacing: 12px; font-family: monospace; }
            .expiry { color: rgba(255,255,255,0.5); font-size: 13px; margin-top: 12px; }
            .footer { padding: 24px 40px; border-top: 1px solid rgba(255,215,0,0.1); color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; }
            .warning { background: rgba(255,0,0,0.1); border: 1px solid rgba(255,0,0,0.3); border-radius: 8px; padding: 12px 16px; color: rgba(255,200,200,0.8); font-size: 13px; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏆 Copa do Mundo 2026</h1>
              <p>Recuperação de Senha</p>
            </div>
            <div class="body">
              <div class="greeting">Olá, ${name}!</div>
              <div class="message">
                Recebemos uma solicitação para redefinir a senha da sua conta no jogo da Copa do Mundo 2026. 
                Use o código abaixo para continuar:
              </div>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <div class="expiry">⏱️ Este código expira em <strong>15 minutos</strong></div>
              </div>
              <div class="warning">
                ⚠️ Se você não solicitou a redefinição de senha, ignore este email. Sua senha permanecerá a mesma.
              </div>
            </div>
            <div class="footer">
              © 2026 Copa do Mundo 2026 Game. Este é um email automático, não responda.
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async sendActivationEmail(to: string, name: string, token: string): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const activationUrl = `${frontendUrl}/ativar?token=${token}`;
    await this.transporter.sendMail({
      from: `"Copa do Mundo 2026 🏆" <${this.config.get('MAIL_FROM')}>`,
      to,
      subject: 'Ative sua conta - Copa 2026',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background: #0a0f1e; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, #0a1628 0%, #1a3a2a 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,215,0,0.2); }
            .header { background: linear-gradient(135deg, #1a472a 0%, #0d5c3a 100%); padding: 40px; text-align: center; }
            .header h1 { color: #FFD700; font-size: 28px; margin: 0; }
            .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; }
            .body { padding: 40px; text-align: center; }
            .greeting { color: #ffffff; font-size: 18px; margin-bottom: 16px; }
            .message { color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6; margin-bottom: 32px; }
            .btn { display: inline-block; background: #FFD700; color: #0d2b1a; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 16px; }
            .footer { padding: 24px 40px; border-top: 1px solid rgba(255,215,0,0.1); color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏆 Copa do Mundo 2026</h1>
              <p>Ativação de Conta</p>
            </div>
            <div class="body">
              <div class="greeting">Olá, ${name}!</div>
              <div class="message">
                Falta pouco para você participar do jogo da Copa! Clique no botão abaixo para ativar sua conta:
              </div>
              <a href="${activationUrl}" class="btn">Ativar Minha Conta</a>
            </div>
            <div class="footer">
              © 2026 Copa do Mundo 2026 Game. Este é um email automático, não responda.
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }
}
