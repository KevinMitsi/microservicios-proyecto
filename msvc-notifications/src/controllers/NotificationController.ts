import { Request, Response } from 'express';
import NotificationService from '../services/NotificationService';

class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * GET /notifications/:userId
   * Obtiene todas las notificaciones de un usuario
   */
  getUserNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const notifications = await this.notificationService.getUserNotifications(userId, limit);

      res.status(200).json({
        success: true,
        count: notifications.length,
        data: notifications,
      });
    } catch (error) {
      console.error('Error getting user notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener notificaciones',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * GET /notifications/:userId/unread
   * Obtiene notificaciones no leídas de un usuario
   */
  getUnreadNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      const notifications = await this.notificationService.getUnreadNotifications(userId);

      res.status(200).json({
        success: true,
        count: notifications.length,
        data: notifications,
      });
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener notificaciones no leídas',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * GET /notifications/:userId/count
   * Cuenta notificaciones no leídas
   */
  countUnread = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      const count = await this.notificationService.countUnread(userId);

      res.status(200).json({
        success: true,
        count,
      });
    } catch (error) {
      console.error('Error counting unread notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Error al contar notificaciones',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * PUT /notifications/:notificationId/read
   * Marca una notificación como leída
   */
  markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const { notificationId } = req.params;

      const success = await this.notificationService.markAsRead(notificationId);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Notificación marcada como leída',
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Notificación no encontrada',
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Error al marcar notificación como leída',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * PUT /notifications/:userId/read-all
   * Marca todas las notificaciones como leídas
   */
  markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      const count = await this.notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: `${count} notificaciones marcadas como leídas`,
        count,
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Error al marcar todas las notificaciones como leídas',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * DELETE /notifications/:notificationId
   * Elimina una notificación
   */
  deleteNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { notificationId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'userId es requerido',
        });
        return;
      }

      const success = await this.notificationService.deleteNotification(notificationId, userId);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Notificación eliminada',
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Notificación no encontrada',
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar notificación',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * POST /notifications/test
   * Crea una notificación de prueba
   */
  createTestNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, type, title, message, data } = req.body;

      if (!userId || !type || !title || !message) {
        res.status(400).json({
          success: false,
          message: 'userId, type, title y message son requeridos',
        });
        return;
      }

      const notification = await this.notificationService.createNotification(
        userId,
        type,
        title,
        message,
        data
      );

      res.status(201).json({
        success: true,
        message: 'Notificación de prueba creada',
        data: notification,
      });
    } catch (error) {
      console.error('Error creating test notification:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear notificación de prueba',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}

export default NotificationController;
