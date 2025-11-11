import RabbitMQConnection from '../config/rabbitmq';
import NotificationService from './NotificationService';
import { NotificationEvent } from '../interfaces/Notification';

class MessageBrokerService {
  private channel: any = null;
  private notificationService: NotificationService;
  private readonly EXCHANGE_NAME = 'microservices.events';
  private readonly QUEUE_NAME = 'notifications.queue';
  private readonly ROUTING_KEYS = [
    'user.*',
    'profile.*',
    'auth.*',
    'system.*',
  ];

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Mapea eventos de msvc-auth al formato de NotificationEvent
   */
  private mapEventToNotificationEvent(rawEvent: any): NotificationEvent {
    // Determinar el tipo de evento
    let eventType = rawEvent.eventType || rawEvent.type || 'custom';

    // Mapear eventType a NotificationType
    const typeMap: { [key: string]: string } = {
      'register': 'user.created',
      'user.register': 'user.created',
      'login': 'auth.login',
      'user.login': 'auth.login',
      'auth.login': 'auth.login',
      'password-recovery': 'custom',
      'user.password-recovery': 'custom',
      'password-update': 'custom',
      'user.password-update': 'custom',
      'user-update': 'user.updated',
      'user.user-update': 'user.updated',
      'user-delete': 'user.deleted',
      'user.user-delete': 'user.deleted',
      'profile.created': 'profile.created',
      'profile.updated': 'profile.updated',
      'profile.deleted': 'profile.deleted',
    };

    const mappedType = typeMap[eventType] || eventType;

    // Construir el evento mapeado
    const mappedEvent: NotificationEvent = {
      type: mappedType as any,
      userId: String(rawEvent.userId),
      data: {
        username: rawEvent.username,
        email: rawEvent.email,
        mobileNumber: rawEvent.mobileNumber,
        timestamp: rawEvent.timestamp,
        eventType: eventType, // Preservar el eventType original
        ...rawEvent.additionalData,
      },
      timestamp: rawEvent.timestamp ? new Date(rawEvent.timestamp) : new Date(),
    };

    return mappedEvent;
  }

  /**
   * Inicializa el servicio de mensajería
   */
  async initialize(): Promise<void> {
    try {
      const rabbitMQ = RabbitMQConnection.getInstance();
      this.channel = rabbitMQ.getChannel();

      // Declarar exchange tipo topic
      await this.channel.assertExchange(this.EXCHANGE_NAME, 'topic', {
        durable: true,
      });

      // Declarar cola
      await this.channel.assertQueue(this.QUEUE_NAME, {
        durable: true,
      });

      // Vincular la cola al exchange con diferentes routing keys
      for (const routingKey of this.ROUTING_KEYS) {
        await this.channel.bindQueue(
          this.QUEUE_NAME,
          this.EXCHANGE_NAME,
          routingKey
        );
        console.log(`🔗 Queue bound to exchange with routing key: ${routingKey}`);
      }

      // Configurar prefetch para procesar un mensaje a la vez
      await this.channel.prefetch(1);

      console.log('✅ Message Broker Service Initialized');
    } catch (error) {
      console.error('❌ Error initializing Message Broker Service:', error);
      throw error;
    }
  }

  /**
   * Comienza a consumir mensajes de la cola
   */
  async startConsuming(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel is not initialized');
    }

    console.log(`🎧 Listening for messages on queue: ${this.QUEUE_NAME}`);

    await this.channel.consume(
      this.QUEUE_NAME,
      async (msg: any) => {
        if (msg) {
          try {
            const content = msg.content.toString();
            let event: any = JSON.parse(content);
            // Log para depuración: imprime el evento completo recibido
            console.log('🔍 Evento recibido (raw):', content);
            console.log('🔍 Evento recibido (objeto):', event);

            // Mapear el evento de msvc-auth al formato esperado
            const mappedEvent = this.mapEventToNotificationEvent(event);

            console.log(`📨 Received event: ${mappedEvent.type} for user: ${mappedEvent.userId}`);
            // Procesar el evento
            await this.notificationService.processEvent(mappedEvent);
            // Confirmar el mensaje
            this.channel!.ack(msg);
            console.log(`✅ Event processed successfully: ${mappedEvent.type}`);
          } catch (error) {
            console.error('❌ Error processing message:', error);
            // Rechazar el mensaje y no re-encolar
            this.channel!.nack(msg, false, false);
          }
        }
      },
      {
        noAck: false, // Confirmación manual de mensajes
      }
    );
  }

  /**
   * Publica un evento en el exchange (para testing o comunicación interna)
   */
  async publishEvent(routingKey: string, event: NotificationEvent): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel is not initialized');
    }

    try {
      this.channel.publish(
        this.EXCHANGE_NAME,
        routingKey,
        Buffer.from(JSON.stringify(event)),
        {
          persistent: true,
          contentType: 'application/json',
        }
      );
      console.log(`📤 Event published with routing key: ${routingKey}`);
    } catch (error) {
      console.error('❌ Error publishing event:', error);
      throw error;
    }
  }

  /**
   * Cierra la conexión del servicio
   */
  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      console.log('✅ Message Broker Service Closed');
    }
  }
}

export default MessageBrokerService;
