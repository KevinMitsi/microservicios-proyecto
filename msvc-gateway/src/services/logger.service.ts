import type { Request } from 'express';
import * as amqplib from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672';
const RABBITMQ_QUEUE = process.env.RABBITMQ_LOG_QUEUE || 'log_queue';

export class LoggerService {
  private static instance: LoggerService;
  private rabbitConn: any = null;
  private rabbitChannel: any = null;
  private rabbitConnecting = false;

  private constructor() {
    this.ensureRabbitConnection().catch(() => {});
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  private async ensureRabbitConnection(): Promise<void> {
    if (this.rabbitChannel) return;
    if (this.rabbitConnecting) return;
    this.rabbitConnecting = true;

    try {
      const conn = await amqplib.connect(RABBITMQ_URL);
      if (conn && typeof conn.createChannel === 'function') {
        this.rabbitConn = conn;
        this.rabbitChannel = await this.rabbitConn.createChannel();
        if (this.rabbitChannel && typeof this.rabbitChannel.assertQueue === 'function') {
          await this.rabbitChannel.assertQueue(RABBITMQ_QUEUE, { durable: true });
        }
      } else {
        throw new Error('Invalid RabbitMQ connection object');
      }

      if (this.rabbitConn) {
        this.rabbitConn.on('error', (err: unknown) => {
          console.error('RabbitMQ connection error:', err);
          this.rabbitChannel = null;
          this.rabbitConn = null;
          this.rabbitConnecting = false;
          setTimeout(() => this.ensureRabbitConnection().catch(() => {}), 5000);
        });

        this.rabbitConn.on('close', () => {
          console.warn('RabbitMQ connection closed');
          this.rabbitChannel = null;
          this.rabbitConn = null;
          this.rabbitConnecting = false;
          setTimeout(() => this.ensureRabbitConnection().catch(() => {}), 5000);
        });
      }
    } catch (err) {
      console.error('Failed to connect to RabbitMQ for logging:', err);
      this.rabbitChannel = null;
      this.rabbitConn = null;
      this.rabbitConnecting = false;
      setTimeout(() => this.ensureRabbitConnection().catch(() => {}), 5000);
    }
  }

  private publishToRabbit(level: string, message: string, meta?: any): void {
    if (!this.rabbitChannel) return;

    const payload = {
      service: process.env.SERVICE_NAME || 'msvc-gateway',
      level,
      message,
      meta: meta || null,
      timestamp: new Date().toISOString(),
    };

    try {
      if (this.rabbitChannel && typeof this.rabbitChannel.sendToQueue === 'function') {
        this.rabbitChannel.sendToQueue(RABBITMQ_QUEUE, Buffer.from(JSON.stringify(payload)), { persistent: true });
      }
    } catch (err) {
      console.error('Failed to publish log to RabbitMQ:', err);
    }
  }

  public info(message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`, meta || '');
    this.publishToRabbit('info', message, meta);
  }

  public error(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, error || '');
    this.publishToRabbit('error', message, error);
  }

  public warn(message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`, meta || '');
    this.publishToRabbit('warn', message, meta);
  }

  public debug(message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${timestamp}] [DEBUG] ${message}`, meta || '');
      this.publishToRabbit('debug', message, meta);
    }
  }

  public logRequest(req: Request): void {
    this.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }
}

export const logger = LoggerService.getInstance();
