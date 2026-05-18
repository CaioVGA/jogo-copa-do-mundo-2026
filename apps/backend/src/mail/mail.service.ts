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
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Seu código de verificação</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #040814; margin: 0; padding: 40px 20px;">
          <div style="max-width: 560px; margin: 0 auto; background-color: #0b1220; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255, 215, 0, 0.12); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);">
            
            <!-- Header Brand -->
            <div style="background-color: #000000; padding: 36px 20px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 300; font-size: 16px; letter-spacing: 5px; color: #ffffff; text-transform: uppercase; padding-right: 6px;">COPA DO</td>
                  <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 900; font-size: 18px; letter-spacing: -0.5px; color: #ffd700; text-transform: uppercase; padding-right: 8px;">MUNDO</td>
                  <td>
                    <span style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.45); padding: 2px 6px; border-radius: 6px; font-size: 9px; font-weight: 900; font-family: sans-serif; vertical-align: middle;">2026</span>
                  </td>
                </tr>
              </table>
              <div style="color: rgba(255,255,255,0.4); font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-top: 10px; font-family: sans-serif;">Recuperação de Senha</div>
            </div>

            <!-- Body Content -->
            <div style="padding: 40px 30px;">
              <div style="color: #ffffff; font-size: 18px; font-weight: 700; margin-bottom: 16px;">Olá, ${name}!</div>
              <div style="color: rgba(255, 255, 255, 0.65); font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
                Recebemos uma solicitação para redefinir a senha da sua conta no jogo da Copa do Mundo 2026. Use o código de verificação exclusivo abaixo para prosseguir:
              </div>
              
              <!-- OTP Box -->
              <div style="background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 16px; padding: 28px; text-align: center; margin: 30px 0;">
                <div style="font-size: 38px; font-weight: 900; color: #ffd700; letter-spacing: 14px; font-family: Courier, monospace; margin-left: 14px; line-height: 1;">${otp}</div>
                <div style="color: rgba(255, 255, 255, 0.4); font-size: 11px; margin-top: 16px;">⏱️ Este código expira em <strong style="color: #ffffff;">15 minutos</strong></div>
              </div>

              <!-- Warning Alert -->
              <div style="background-color: rgba(239, 68, 68, 0.04); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 12px; padding: 14px 18px; color: rgba(239, 68, 68, 0.8); font-size: 12px; line-height: 1.5; margin-top: 24px;">
                ⚠️ Se você não solicitou a redefinição de senha, ignore este e-mail por segurança. Sua senha atual permanecerá inalterada.
              </div>
            </div>

            <!-- Footer Area -->
            <div style="padding: 24px 30px; border-top: 1px solid rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.3); font-size: 11px; text-align: center; line-height: 1.5;">
              Este é um e-mail automático enviado pelo sistema de bolão oficial.<br/>
              © 2026 Copa do Mundo 2026 Game. Todos os direitos reservados.
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
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ative sua conta</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #040814; margin: 0; padding: 40px 20px;">
          <div style="max-width: 560px; margin: 0 auto; background-color: #0b1220; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255, 215, 0, 0.12); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);">
            
            <!-- Header Brand -->
            <div style="background-color: #000000; padding: 36px 20px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 300; font-size: 16px; letter-spacing: 5px; color: #ffffff; text-transform: uppercase; padding-right: 6px;">COPA DO</td>
                  <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 900; font-size: 18px; letter-spacing: -0.5px; color: #ffd700; text-transform: uppercase; padding-right: 8px;">MUNDO</td>
                  <td>
                    <span style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.45); padding: 2px 6px; border-radius: 6px; font-size: 9px; font-weight: 900; font-family: sans-serif; vertical-align: middle;">2026</span>
                  </td>
                </tr>
              </table>
              <div style="color: rgba(255,255,255,0.4); font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-top: 10px; font-family: sans-serif;">Ativação de Conta</div>
            </div>

            <!-- Body Content -->
            <div style="padding: 40px 30px; text-align: center;">
              <div style="color: #ffffff; font-size: 18px; font-weight: 700; margin-bottom: 16px; text-align: left;">Olá, ${name}!</div>
              <div style="color: rgba(255, 255, 255, 0.65); font-size: 14px; line-height: 1.6; margin-bottom: 32px; text-align: left;">
                Seja muito bem-vindo ao bolão oficial da Copa do Mundo 2026! Falta apenas um passo para você liberar sua conta e começar a fazer seus palpites nos grupos e mata-mata.
              </div>
              
              <!-- CTA Button -->
              <div style="margin: 36px 0;">
                <a href="${activationUrl}" style="display: inline-block; background-color: #ffd700; background: linear-gradient(135deg, #ffd700 0%, #f5c800 100%); color: #05110a; padding: 16px 36px; text-decoration: none; font-weight: 900; border-radius: 12px; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; box-shadow: 0 4px 16px rgba(255, 215, 0, 0.2);">Ativar Minha Conta</a>
              </div>
            </div>

            <!-- Footer Area -->
            <div style="padding: 24px 30px; border-top: 1px solid rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.3); font-size: 11px; text-align: center; line-height: 1.5;">
              Este é um e-mail automático enviado pelo sistema de bolão oficial.<br/>
              © 2026 Copa do Mundo 2026 Game. Todos os direitos reservados.
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }
}
