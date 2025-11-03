import { Router } from 'express';
import NotificationController from '../controllers/NotificationController';

const router = Router();
const notificationController = new NotificationController();

// Obtener notificaciones de un usuario
router.get('/:userId', notificationController.getUserNotifications);

// Obtener notificaciones no leídas
router.get('/:userId/unread', notificationController.getUnreadNotifications);

// Contar notificaciones no leídas
router.get('/:userId/count', notificationController.countUnread);

// Marcar notificación como leída
router.patch('/:notificationId/read', notificationController.markAsRead);

// Marcar todas las notificaciones como leídas
router.patch('/:userId/read-all', notificationController.markAllAsRead);

// Eliminar notificación
router.delete('/:notificationId', notificationController.deleteNotification);

// Crear notificación de prueba
router.post('/test', notificationController.createTestNotification);

export default router;
