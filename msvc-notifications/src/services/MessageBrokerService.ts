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
            const event: NotificationEvent = JSON.parse(content);

            console.log(`📨 Received event: ${event.type} for user: ${event.userId}`);

            // Procesar el evento
            await this.notificationService.processEvent(event);

            // Confirmar el mensaje
            this.channel!.ack(msg);
            console.log(`✅ Event processed successfully: ${event.type}`);
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
