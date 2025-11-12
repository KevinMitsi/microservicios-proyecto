import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import NotificationService from '../../src/services/NotificationService';
import { NotificationType } from '../../src/interfaces/Notification';

// Mock de las dependencias
jest.mock('../../src/services/RedisService');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123')
}));

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockRedisService: any;

  beforeEach(() => {
    // ✅ Mock RedisService con los métodos REALES que usa NotificationService
    mockRedisService = {
      // Métodos reales del RedisService según la implementación
      saveNotification: jest.fn().mockImplementation(() => Promise.resolve()),
      getNotification: jest.fn().mockImplementation(() => Promise.resolve(null)),
      getUserNotifications: jest.fn().mockImplementation(() => Promise.resolve([])),
      markAsRead: jest.fn().mockImplementation(() => Promise.resolve(true)),
      deleteNotification: jest.fn().mockImplementation(() => Promise.resolve(true))
    };

    require('../../src/services/RedisService').default = jest.fn().mockImplementation(() => mockRedisService);

    notificationService = new NotificationService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    test('debería crear una notificación correctamente', async () => {
      const userId = 'user-123';
      const type = NotificationType.USER_CREATED;
      const title = 'Test Notification';
      const message = 'This is a test message';

      const notification = await notificationService.createNotification(
        userId, type, title, message
      );

      expect(notification).toEqual({
        id: 'test-uuid-123',
        userId,
        type,
        title,
        message,
        data: undefined,
        read: false,
        createdAt: expect.any(Date)
      });

      // ✅ Verificar que se llamó al método REAL saveNotification
      expect(mockRedisService.saveNotification).toHaveBeenCalledWith(notification);
    });

    test('debería crear notificación con data adicional', async () => {
      const additionalData = { actionUrl: '/profile', count: 5 };

      const notification = await notificationService.createNotification(
        'user-123',
        NotificationType.PROFILE_UPDATED,
        'Test Title',
        'Test Message',
        additionalData
      );

      expect(notification.data).toEqual(additionalData);
      expect(mockRedisService.saveNotification).toHaveBeenCalledWith(notification);
    });
  });

  describe('getUserNotifications', () => {
    test('debería obtener notificaciones del usuario', async () => {
      const userId = 'user-123';
      const mockNotifications = [
        {
          id: '1',
          userId,
          type: NotificationType.USER_CREATED,
          title: 'Test',
          message: 'Test message',
          read: false,
          createdAt: new Date()
        }
      ];

      // ✅ Configurar el mock para retornar las notificaciones
      mockRedisService.getUserNotifications.mockImplementation(() => Promise.resolve(mockNotifications));

      const notifications = await notificationService.getUserNotifications(userId);

      // ✅ Verificar que se llamó al método REAL getUserNotifications
      expect(mockRedisService.getUserNotifications).toHaveBeenCalledWith(userId, 50);
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toEqual(mockNotifications[0]);
    });

    test('debería usar el límite personalizado', async () => {
      const userId = 'user-123';
      const customLimit = 10;

      await notificationService.getUserNotifications(userId, customLimit);

      expect(mockRedisService.getUserNotifications).toHaveBeenCalledWith(userId, customLimit);
    });
  });

  describe('markAsRead', () => {
    test('debería marcar notificación como leída', async () => {
      const notificationId = 'notif-123';

      // ✅ Configurar el mock para simular éxito
      mockRedisService.markAsRead.mockImplementation(() => Promise.resolve(true));

      const result = await notificationService.markAsRead(notificationId);

      // ✅ Verificar que se llamó al método REAL markAsRead
      expect(mockRedisService.markAsRead).toHaveBeenCalledWith(notificationId);
      expect(result).toBe(true);
    });

    test('debería retornar false si la notificación no existe', async () => {
      const notificationId = 'invalid-id';

      // ✅ Configurar el mock para simular fallo
      mockRedisService.markAsRead.mockImplementation(() => Promise.resolve(false));

      const result = await notificationService.markAsRead(notificationId);

      expect(mockRedisService.markAsRead).toHaveBeenCalledWith(notificationId);
      expect(result).toBe(false);
    });
  });
});
