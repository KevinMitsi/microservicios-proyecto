import { RedisClientType } from 'redis';
import RedisConnection from '../config/database';
import { Notification } from '../interfaces/Notification';

class RedisService {
  private client: RedisClientType;
  private readonly NOTIFICATION_PREFIX = 'notification:';
  private readonly USER_NOTIFICATIONS_PREFIX = 'user:notifications:';
  private readonly NOTIFICATION_EXPIRY = 60 * 60 * 24 * 30; // 30 días

  constructor() {
    this.client = RedisConnection.getInstance().getClient();
  }

  /**
   * Guarda una notificación en Redis
   */
  async saveNotification(notification: Notification): Promise<void> {
    const key = `${this.NOTIFICATION_PREFIX}${notification.id}`;
    await this.client.setEx(
      key,
      this.NOTIFICATION_EXPIRY,
      JSON.stringify(notification)
    );

    // Agregar a la lista de notificaciones del usuario
    const userKey = `${this.USER_NOTIFICATIONS_PREFIX}${notification.userId}`;
    await this.client.lPush(userKey, notification.id);
    await this.client.expire(userKey, this.NOTIFICATION_EXPIRY);
  }

  /**
   * Obtiene una notificación por ID
   */
  async getNotification(notificationId: string): Promise<Notification | null> {
    const key = `${this.NOTIFICATION_PREFIX}${notificationId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Obtiene todas las notificaciones de un usuario
   */
  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    const userKey = `${this.USER_NOTIFICATIONS_PREFIX}${userId}`;
    const notificationIds = await this.client.lRange(userKey, 0, limit - 1);

    const notifications: Notification[] = [];
    for (const id of notificationIds) {
      const notification = await this.getNotification(id);
      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  }

  /**
   * Obtiene notificaciones no leídas de un usuario
   */
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    const allNotifications = await this.getUserNotifications(userId);
    return allNotifications.filter((n) => !n.read);
  }

  /**
   * Marca una notificación como leída
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    const notification = await this.getNotification(notificationId);
    if (!notification) {
      return false;
    }

    notification.read = true;
    const key = `${this.NOTIFICATION_PREFIX}${notificationId}`;
    await this.client.setEx(
      key,
      this.NOTIFICATION_EXPIRY,
      JSON.stringify(notification)
    );

    return true;
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  async markAllAsRead(userId: string): Promise<number> {
    const notifications = await this.getUnreadNotifications(userId);
    let count = 0;

    for (const notification of notifications) {
      const success = await this.markAsRead(notification.id);
      if (success) count++;
    }

    return count;
  }

  /**
   * Elimina una notificación
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const notificationKey = `${this.NOTIFICATION_PREFIX}${notificationId}`;
    const userKey = `${this.USER_NOTIFICATIONS_PREFIX}${userId}`;

    await this.client.del(notificationKey);
    await this.client.lRem(userKey, 1, notificationId);

    return true;
  }

  /**
   * Elimina todas las notificaciones de un usuario
   */
  async deleteAllUserNotifications(userId: string): Promise<void> {
    const userKey = `${this.USER_NOTIFICATIONS_PREFIX}${userId}`;
    const notificationIds = await this.client.lRange(userKey, 0, -1);

    for (const id of notificationIds) {
      const notificationKey = `${this.NOTIFICATION_PREFIX}${id}`;
      await this.client.del(notificationKey);
    }

    await this.client.del(userKey);
  }

  /**
   * Cuenta las notificaciones no leídas de un usuario
   */
  async countUnread(userId: string): Promise<number> {
    const unread = await this.getUnreadNotifications(userId);
    return unread.length;
  }
}

export default RedisService;
