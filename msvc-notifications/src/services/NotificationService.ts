// Dynamic import for uuid to support ESM-only package in CommonJS
import { v4 as uuidv4 } from 'uuid';
import RedisService from './RedisService';
import MailService from './MailService';
import { Notification, NotificationType, NotificationEvent } from '../interfaces/Notification';

class NotificationService {
  private redisService: RedisService;
  private mailService: MailService;

  constructor() {
    this.redisService = new RedisService();
    this.mailService = new MailService();
  }

  /**
   * Crea una nueva notificación
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any
  ): Promise<Notification> {
    const notification: Notification = {
      id: uuidv4(),
      userId,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: new Date(),
    };

    await this.redisService.saveNotification(notification);
    console.log(`📬 Notification created for user ${userId}: ${title}`);

    return notification;
  }

  /**
   * Procesa eventos de RabbitMQ y crea notificaciones correspondientes
   */
  async processEvent(event: NotificationEvent): Promise<void> {
    let title = '';
    let message = '';
    const email = event.data?.email || '';
    const username = event.data?.username || event.userId;

    switch (event.type) {
      case NotificationType.USER_CREATED:
        title = '¡Bienvenido!';
        message = 'Tu cuenta ha sido creada exitosamente.';
        // Enviar correo de bienvenida
        if (email) {
          await this.mailService.sendWelcomeEmail(email, username);
        }
        break;

      case NotificationType.USER_UPDATED:
        title = 'Perfil Actualizado';
        message = 'Tu información de usuario ha sido actualizada.';
        // Enviar correo de actualización
        if (email) {
          await this.mailService.sendProfileUpdateEmail(email, username);
        }
        break;

      case NotificationType.USER_DELETED:
        title = 'Cuenta Eliminada';
        message = 'Tu cuenta ha sido eliminada del sistema.';
        break;

      case NotificationType.PROFILE_CREATED:
        title = 'Perfil Creado';
        message = 'Tu perfil ha sido creado exitosamente.';
        break;

      case NotificationType.PROFILE_UPDATED:
        title = 'Perfil Actualizado';
        message = 'Tu perfil ha sido actualizado correctamente.';
        break;

      case NotificationType.PROFILE_DELETED:
        title = 'Perfil Eliminado';
        message = 'Tu perfil ha sido eliminado.';
        break;

      case NotificationType.AUTH_LOGIN:
        title = 'Inicio de Sesión';
        message = 'Has iniciado sesión en tu cuenta.';
        // Enviar correo de login
        if (email) {
          const loginTime = event.data?.loginTime || new Date().toISOString();
          await this.mailService.sendLoginEmail(email, username, loginTime);
        }
        break;

      case NotificationType.AUTH_LOGOUT:
        title = 'Cierre de Sesión';
        message = 'Has cerrado sesión exitosamente.';
        break;

      case NotificationType.SYSTEM_ALERT:
        title = 'Alerta del Sistema';
        message = event.data?.message || 'Notificación del sistema';
        break;

      case NotificationType.CUSTOM:
        title = event.data?.title || 'Notificación';
        message = event.data?.message || 'Tienes una nueva notificación';

        // Manejar eventos especiales de password
        const eventTypeRaw = event.data?.eventType || '';

        if (eventTypeRaw.includes('password-recovery')) {
          title = 'Recuperación de Contraseña';
          message = 'Se ha solicitado la recuperación de tu contraseña.';

          if (email && event.data?.token && event.data?.expiry) {
            await this.mailService.sendPasswordRecoveryEmail(
              email,
              username,
              event.data.token,
              event.data.expiry
            );
          }
        } else if (eventTypeRaw.includes('password-update')) {
          title = 'Contraseña Actualizada';
          message = 'Tu contraseña ha sido actualizada exitosamente.';

          if (email) {
            await this.mailService.sendPasswordUpdateEmail(email, username);
          }
        }
        break;

      default:
        title = 'Notificación';
        message = 'Tienes una nueva notificación';
    }

    await this.createNotification(event.userId, event.type, title, message, event.data);
  }

  /**
   * Obtiene notificaciones de un usuario
   */
  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    return await this.redisService.getUserNotifications(userId, limit);
  }

  /**
   * Obtiene notificaciones no leídas
   */
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return await this.redisService.getUnreadNotifications(userId);
  }

  /**
   * Marca una notificación como leída
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    return await this.redisService.markAsRead(notificationId);
  }

  /**
   * Marca todas las notificaciones como leídas
   */
  async markAllAsRead(userId: string): Promise<number> {
    return await this.redisService.markAllAsRead(userId);
  }

  /**
   * Elimina una notificación
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    return await this.redisService.deleteNotification(notificationId, userId);
  }

  /**
   * Cuenta notificaciones no leídas
   */
  async countUnread(userId: string): Promise<number> {
    return await this.redisService.countUnread(userId);
  }
}

export default NotificationService;
