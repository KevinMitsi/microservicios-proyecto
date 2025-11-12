import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import MessageBrokerService from '../../src/services/MessageBrokerService';
import { NotificationType } from '../../src/interfaces/Notification';

// Mock de las dependencias
jest.mock('../../src/config/rabbitmq');
jest.mock('../../src/services/NotificationService');

describe('MessageBrokerService', () => {
  let messageBrokerService: MessageBrokerService;
  let mockChannel: any;

  beforeEach(() => {
    // Setup mock channel con TODOS los métodos que usa la implementación real
    mockChannel = {
      assertExchange: jest.fn().mockImplementation(() => Promise.resolve({})),
      assertQueue: jest.fn().mockImplementation(() => Promise.resolve({ queue: 'notifications.queue' })),
      bindQueue: jest.fn().mockImplementation(() => Promise.resolve({})),
      consume: jest.fn().mockImplementation(() => Promise.resolve({})),
      publish: jest.fn().mockReturnValue(true),
      ack: jest.fn(),
      // ✅ AGREGANDO prefetch que faltaba y causaba el error
      prefetch: jest.fn().mockImplementation(() => Promise.resolve())
    };

    // Mock RabbitMQConnection
    const mockRabbitMQ = {
      getChannel: jest.fn().mockReturnValue(mockChannel)
    };

    require('../../src/config/rabbitmq').default = {
      getInstance: jest.fn().mockReturnValue(mockRabbitMQ)
    };

    messageBrokerService = new MessageBrokerService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    test('debería inicializar correctamente el exchange y queue', async () => {
      await messageBrokerService.initialize();

      // Verificar que se configuró el exchange
      expect(mockChannel.assertExchange).toHaveBeenCalledWith(
        'microservices.events',
        'topic',
        { durable: true }
      );

      // Verificar que se configuró la queue
      expect(mockChannel.assertQueue).toHaveBeenCalledWith(
        'notifications.queue',
        { durable: true }
      );

      // ✅ Verificar que se configuró prefetch
      expect(mockChannel.prefetch).toHaveBeenCalledWith(1);
    });

    test('debería manejar errores durante la inicialización', async () => {
      mockChannel.assertExchange.mockImplementation(() => Promise.reject(new Error('Connection failed')));

      await expect(messageBrokerService.initialize()).rejects.toThrow('Connection failed');
    });
  });

  describe('publishEvent', () => {
    beforeEach(async () => {
      await messageBrokerService.initialize();
    });

    test('debería publicar evento correctamente', async () => {
      const eventType = NotificationType.USER_CREATED;
      // ✅ Crear payload que coincida exactamente con la interfaz NotificationEvent
      const notificationEvent = {
        type: eventType,
        userId: '123',
        data: { username: 'testuser', action: 'created' },
        timestamp: new Date()
      };

      const result = await messageBrokerService.publishEvent(eventType, notificationEvent);

      // ✅ Corregir la verificación para incluir el cuarto parámetro con opciones
      expect(mockChannel.publish).toHaveBeenCalledWith(
        'microservices.events',
        eventType,
        Buffer.from(JSON.stringify(notificationEvent)),
        {
          persistent: true,
          contentType: 'application/json'
        }
      );
      expect(result).toBeUndefined(); // publishEvent no retorna valor según la implementación real
    });
  });
});
