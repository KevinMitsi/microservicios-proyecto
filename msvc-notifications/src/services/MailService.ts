import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

class MailService {
  private transporter: Transporter<SMTPTransport.SentMessageInfo>;
  private isConfigured: boolean = false;

  constructor() {
    this.transporter = this.createTransporter();
  }

  private createTransporter(): Transporter<SMTPTransport.SentMessageInfo> {
    const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      console.warn('⚠️ Email credentials not configured. Email service will not work.');
      this.isConfigured = false;
      // Return a dummy transporter
      return nodemailer.createTransport({
        host: 'localhost',
        port: 25,
        secure: false,
      });
    }

    this.isConfigured = true;
    console.log(`✅ Email service configured with host: ${emailHost}`);

    return nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  }

  /**
   * Envía un correo electrónico
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn('⚠️ Email service is not configured. Skipping email send.');
      return false;
    }

    try {
      const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;

      const mailOptions = {
        from: emailFrom,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent successfully to ${options.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return false;
    }
  }

  /**
   * Envía correo de bienvenida a nuevo usuario
   */
  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    const subject = '¡Bienvenido a nuestra plataforma!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">¡Bienvenido, ${username}!</h2>
        <p>Tu cuenta ha sido creada exitosamente.</p>
        <p>Ahora puedes disfrutar de todas las funcionalidades de nuestra plataforma.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Este es un correo automático, por favor no responder.
        </p>
      </div>
    `;
    const text = `¡Bienvenido, ${username}! Tu cuenta ha sido creada exitosamente.`;

    return await this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Envía correo de inicio de sesión
   */
  async sendLoginEmail(email: string, username: string, loginTime: string): Promise<boolean> {
    const subject = 'Nuevo inicio de sesión detectado';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">Inicio de Sesión Detectado</h2>
        <p>Hola <strong>${username}</strong>,</p>
        <p>Se ha detectado un nuevo inicio de sesión en tu cuenta.</p>
        <p><strong>Fecha y hora:</strong> ${loginTime}</p>
        <p>Si no fuiste tú, por favor cambia tu contraseña inmediatamente.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Este es un correo automático, por favor no responder.
        </p>
      </div>
    `;
    const text = `Hola ${username}, se ha detectado un nuevo inicio de sesión en tu cuenta el ${loginTime}.`;

    return await this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Envía correo de recuperación de contraseña
   */
  async sendPasswordRecoveryEmail(
    email: string,
    username: string,
    token: string,
    expiryDate: string
  ): Promise<boolean> {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    const subject = 'Recuperación de contraseña';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF9800;">Recuperación de Contraseña</h2>
        <p>Hola <strong>${username}</strong>,</p>
        <p>Has solicitado recuperar tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">
          Restablecer Contraseña
        </a>
        <p>O copia y pega este enlace en tu navegador:</p>
        <p style="background-color: #f5f5f5; padding: 10px; word-break: break-all;">${resetLink}</p>
        <p><strong>Este enlace expira el:</strong> ${expiryDate}</p>
        <p style="color: #f44336;">Si no solicitaste este cambio, ignora este correo.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Este es un correo automático, por favor no responder.
        </p>
      </div>
    `;
    const text = `Hola ${username}, has solicitado recuperar tu contraseña. Visita este enlace: ${resetLink}. Expira el ${expiryDate}`;

    return await this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Envía correo de confirmación de cambio de contraseña
   */
  async sendPasswordUpdateEmail(email: string, username: string): Promise<boolean> {
    const subject = 'Contraseña actualizada exitosamente';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Contraseña Actualizada</h2>
        <p>Hola <strong>${username}</strong>,</p>
        <p>Tu contraseña ha sido actualizada exitosamente.</p>
        <p>Si no realizaste este cambio, por favor contacta a soporte inmediatamente.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Este es un correo automático, por favor no responder.
        </p>
      </div>
    `;
    const text = `Hola ${username}, tu contraseña ha sido actualizada exitosamente.`;

    return await this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Envía correo de actualización de perfil
   */
  async sendProfileUpdateEmail(email: string, username: string): Promise<boolean> {
    const subject = 'Perfil actualizado';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">Perfil Actualizado</h2>
        <p>Hola <strong>${username}</strong>,</p>
        <p>Tu información de perfil ha sido actualizada correctamente.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Este es un correo automático, por favor no responder.
        </p>
      </div>
    `;
    const text = `Hola ${username}, tu información de perfil ha sido actualizada correctamente.`;

    return await this.sendEmail({ to: email, subject, html, text });
  }
}

export default MailService;

