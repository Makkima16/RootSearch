import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: this.configService.get<string>('EMAIL_SERVICE'),
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendVerificationCode(email: string, code: number, userName: string) {
    const mailOptions = {
      from: `"RootSearch" <${this.configService.get<string>('EMAIL_USER')}>`,
      to: email,
      subject: 'Verification Code - RootSearch',
      html: `
                <!DOCTYPE html>
                <html lang="en" style="margin: 0; padding: 0;">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Verification Code - RootSearch</title>
                </head>
                <body style="font-family: Arial, sans-serif; background-color: #f8f8f8; margin: 0; padding: 0;">
                    <table align="center" cellpadding="0" cellspacing="0" width="100%" 
                        style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 10px; 
                                box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <tr>
                            <td style="text-align: center; padding: 30px 0;">
                                <img src="cid:logo" alt="RootSearch Logo" width="120" style="margin-bottom: 10px;" />
                                <h2 style="color: #6356E5; font-size: 22px; margin: 0;">RootSearch</h2>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 0 40px 30px 40px; text-align: center;">
                                <h3 style="color: #333;">Verification Code</h3>
                                <p style="color: #555; font-size: 15px; line-height: 1.5;">
                                    Hello ${userName} 👋<br />
                                    We send you the verification code to complete the 2FA process.<br />
                                    Please use the following code to continue:
                                </p>

                                <div style="background-color: #6356E5; color: #ffffff; display: inline-block;
                                            font-size: 24px; letter-spacing: 4px; margin: 20px 0; padding: 12px 24px;
                                            border-radius: 6px; font-weight: bold;">
                                    ${code}
                                </div>

                                <p style="color: #777; font-size: 14px;">This code will expire in 15 minutes for your security.</p>
                                <p style="color: #999; font-size: 13px; margin-top: 30px;">
                                    If you didn’t request this, please ignore this email or contact our support team.
                                </p>

                                <p style="margin-top: 40px; color: #444; font-size: 14px;">
                                    Sincerely,<br />
                                    <strong>The RootSearch Team</strong>
                                </p>
                            </td>
                        </tr>
                    </table>
                    <div style="text-align: center; color: #aaa; font-size: 12px; margin-top: 20px; font-family: Arial, sans-serif;">
                        © ${new Date().getFullYear()} RootSearch. All rights reserved.
                    </div>
                </body>
                </html>
            `,
      attachments: [
        {
          filename: 'logo.png',
          path: './assets/logo.png', // Asegúrate de que la ruta sea correcta
          cid: 'logo', // Identificador usado en el <img src="cid:logo">
        },
      ],
      text: `RootSearch - Verification Code

    Hello ${userName},

    Your verification code is: ${code}

    This code will expire in 15 minutes.

    If you didn’t request this, please ignore this email.

    Sincerely,
    The RootSearch Team
    © ${new Date().getFullYear()} RootSearch`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Error sending verification email');
    }
  }

  async sendWelcomeEmail(email: string, code: number, userName: string) {
    const mailOptions = {
      from: `"RootSearch" <${this.configService.get<string>('EMAIL_USER')}>`,
      to: email,
      subject: 'Welcome to RootSearch!',
      html: `
                <!DOCTYPE html>
                <html lang="en" style="margin: 0; padding: 0;">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Welcome to RootSearch</title>
                </head>
                <body style="font-family: Arial, sans-serif; background-color: #f8f8f8; margin: 0; padding: 0;">
                    <table align="center" cellpadding="0" cellspacing="0" width="100%"
                        style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 10px;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <tr>
                            <td style="text-align: center; padding: 30px 0;">
                                <img src="cid:logo" alt="RootSearch Logo" width="120" style="margin-bottom: 10px;" />
                                <h2 style="color: #6356E5; font-size: 22px; margin: 0;">RootSearch</h2>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 0 40px 30px 40px; text-align: center;">
                                <h3 style="color: #333;">Welcome, ${userName}!</h3>
                                <p style="color: #555; font-size: 15px; line-height: 1.5;">
                                    Thank you for joining <strong>RootSearch</strong> 👋<br />
                                    To activate your account, please use the following code:
                                </p>

                                <div style="background-color: #6356E5; color: #ffffff; display: inline-block;
                                            font-size: 24px; letter-spacing: 4px; margin: 20px 0; padding: 12px 24px;
                                            border-radius: 6px; font-weight: bold;">
                                    ${code}
                                </div>

                                <p style="color: #777; font-size: 14px;">
                                    This code will expire in 15 minutes for your security.
                                </p>

                                <p style="color: #999; font-size: 13px; margin-top: 30px;">
                                    If you didn’t create an account with RootSearch, please ignore this email.
                                </p>

                                <p style="margin-top: 40px; color: #444; font-size: 14px;">
                                    Sincerely,<br />
                                    <strong>The RootSearch Team</strong>
                                </p>
                            </td>
                        </tr>
                    </table>
                    <div style="text-align: center; color: #aaa; font-size: 12px; margin-top: 20px; font-family: Arial, sans-serif;">
                        © ${new Date().getFullYear()} RootSearch. All rights reserved.
                    </div>
                </body>
                </html>
            `,
      attachments: [
        {
          filename: 'logo.png',
          path: './assets/logo.png',
          cid: 'logo', // Identificador del logo inline
        },
      ],
      text: `Welcome to RootSearch!

    Hello ${userName},

    Thank you for joining RootSearch.

    To activate your account, please use the following code: ${code}

    This code will expire in 15 minutes for your security.

    If you didn’t create an account, please ignore this email.

    Sincerely,
    The RootSearch Team
    © ${new Date().getFullYear()} RootSearch`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw new Error('Error sending welcome email');
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName: string,
  ) {
    const frontend =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetLink = `${frontend}/reset-password?token=${resetToken}`;

    const logoUrl = `${frontend}/assets/logo.png`;

    const mailOptions = {
      from: `"RootSearch" <${this.configService.get<string>('EMAIL_USER')}>`,
      to: email,
      subject: 'Recuperación de contraseña - RootSearch',
      html: `
                <html>
                    <body style="font-family: Arial, sans-serif; color: #222; margin: 0; padding: 20px; background-color: #f9fafb;">
                        <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:8px; padding:20px; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                            <div style="text-align:center; margin-bottom:20px;">
                                <img src="${logoUrl}" alt="RootSearch Logo" width="120" style="margin-bottom:10px;" />
                                <h1 style="font-size:20px; color:#3b78d8; margin:0;">RootSearch</h1>
                            </div>

                            <p style="margin:16px 0;">Hola <strong>${userName}</strong>,</p>
                            <p style="margin:0 0 12px;">Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para continuar:</p>

                            <div style="text-align:center; margin:20px 0;">
                                <a href="${resetLink}" 
                                    style="background:#3b78d8; color:#fff; padding:10px 18px; text-decoration:none; border-radius:4px; font-weight:bold;">
                                    Restablecer contraseña
                                </a>
                            </div>

                            <p style="font-size:13px; color:#666; margin:10px 0;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                            <div style="word-break:break-all; font-size:12px; color:#333; background:#f7f7f7; padding:8px; border-radius:4px; margin-top:8px;">
                                ${resetLink}
                            </div>

                            <p style="font-size:12px; color:#666; margin:16px 0 0;">El enlace es válido 1 hora y se puede usar una sola vez.</p>
                            <hr style="border:none; border-top:1px solid #eee; margin:18px 0;">
                            <p style="font-size:12px; color:#888; margin:0; text-align:center;">Este es un correo automático, por favor no responda.<br>© ${new Date().getFullYear()} RootSearch</p>
                        </div>
                    </body>
                </html>
            `,
      text: `RootSearch - Recuperación de contraseña

    Hola ${userName},

    Recibimos una solicitud para restablecer tu contraseña.

    Usa este enlace para restablecerla:
    ${resetLink}

    El enlace es válido por 1 hora y solo se puede usar una vez.

    Si no solicitaste esto, ignora este correo.

    © ${new Date().getFullYear()} RootSearch`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email de recuperación enviado:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error enviando email de recuperación:', error);
      throw new Error(
        'Error al enviar el correo de recuperación de contraseña',
      );
    }
  }

  async sendNotificationEmail(to: string, subject: string, content: string) {
    const mailOptions = {
      from: `"RootSearch" <${this.configService.get<string>('EMAIL_USER')}>`,
      to: to,
      subject: subject,
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #6356E5;">Hola Docente,</h2>
                    <p style="font-size: 16px; color: #333;">${content}</p>
                    <p style="font-size: 16px; color: #333;">Ingresa a la plataforma para revisarlo.</p>
                    <br>
                    <hr style="border: none; border-top: 1px solid #eee;" />
                    <small style="color: #777;">Equipo RootSearch</small>
                </div>
            `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Notification email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending notification email:', error);
      throw error;
    }
  }
}
