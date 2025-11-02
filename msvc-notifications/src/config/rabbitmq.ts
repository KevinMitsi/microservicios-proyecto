import amqp, { Connection, Channel } from 'amqplib/callback_api';
import { connect } from 'amqplib';
import { config } from './config';

class RabbitMQConnection {
  private static instance: RabbitMQConnection;
  private connection: any = null;
  private channel: any = null;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): RabbitMQConnection {
    if (!RabbitMQConnection.instance) {
      RabbitMQConnection.instance = new RabbitMQConnection();
    }
    return RabbitMQConnection.instance;
  }

  public async connect(): Promise<void> {
    try {
      console.log('🔄 Connecting to RabbitMQ...');
      this.connection = await connect(config.rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      this.isConnected = true;
      console.log('✅ RabbitMQ Connected');

      this.connection.on('error', (err: Error) => {
        console.error('❌ RabbitMQ Connection Error:', err);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        console.log('🔌 RabbitMQ Connection Closed');
        this.isConnected = false;
        // Reconexión automática después de 5 segundos
        setTimeout(() => this.connect(), 5000);
      });
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error);
      this.isConnected = false;
      // Reintentar conexión después de 5 segundos
      setTimeout(() => this.connect(), 5000);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      console.log('✅ RabbitMQ Disconnected Successfully');
    } catch (error) {
      console.error('❌ Error disconnecting from RabbitMQ:', error);
    }
  }

  public getChannel(): any {
    if (!this.channel || !this.isConnected) {
      throw new Error('RabbitMQ channel is not available');
    }
    return this.channel;
  }

  public isReady(): boolean {
    return this.isConnected && this.channel !== null;
  }
}

export default RabbitMQConnection;
