import winston from 'winston';
import * as amqplib from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672';
const RABBITMQ_QUEUE = process.env.RABBITMQ_LOG_QUEUE || 'log_queue';
// use 'any' to avoid mismatches with amqplib's complex types in this environment
let rabbitConn: any = null;
let rabbitChannel: any = null;
let rabbitConnecting = false;

async function ensureRabbitConnection() {
  if (rabbitChannel) return;
  if (rabbitConnecting) return;
  rabbitConnecting = true;
  try {
    const conn = await amqplib.connect(RABBITMQ_URL);
    // make minimal runtime checks because types in this environment can be inconsistent
    if (conn && typeof conn.createChannel === 'function') {
      rabbitConn = conn;
      rabbitChannel = await rabbitConn.createChannel();
      if (rabbitChannel && typeof rabbitChannel.assertQueue === 'function') {
        await rabbitChannel.assertQueue(RABBITMQ_QUEUE, { durable: true });
      }
    } else {
      throw new Error('Invalid RabbitMQ connection object');
    }

    // Attach handlers safely (check rabbitConn exists)
    if (rabbitConn) {
      rabbitConn.on('error', (err: unknown) => {
        console.error('RabbitMQ connection error:', err);
        rabbitChannel = null;
        rabbitConn = null;
        rabbitConnecting = false;
        setTimeout(() => ensureRabbitConnection().catch(() => {}), 5000);
      });

      rabbitConn.on('close', () => {
        console.warn('RabbitMQ connection closed');
        rabbitChannel = null;
        rabbitConn = null;
        rabbitConnecting = false;
        setTimeout(() => ensureRabbitConnection().catch(() => {}), 5000);
      });
    }
  } catch (err) {
    console.error('Failed to connect to RabbitMQ for logging:', err);
    rabbitChannel = null;
    rabbitConn = null;
    rabbitConnecting = false;
    setTimeout(() => ensureRabbitConnection().catch(() => {}), 5000);
  }
}

// Start connection in background
ensureRabbitConnection().catch(() => {});

function publishToRabbit(level: string, message: string, meta?: any) {
  if (!rabbitChannel) return;
  const payload = {
    service: process.env.SERVICE_NAME || 'msvc-notifications',
    level,
    message,
    meta: meta || null,
    timestamp: new Date().toISOString(),
  };
  try {
    if (rabbitChannel && typeof rabbitChannel.sendToQueue === 'function') {
      rabbitChannel.sendToQueue(RABBITMQ_QUEUE, Buffer.from(JSON.stringify(payload)), { persistent: true });
    }
  } catch (err) {
    // non-fatal
    // eslint-disable-next-line no-console
    console.error('Failed to publish log to RabbitMQ:', err);
  }
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.timestamp(), winston.format.simple()),
    }),
  ],
});

// Helper wrappers so existing code can call logger.info/error/etc.
const wrappedLogger = {
  info: (msg: string, meta?: any) => {
    logger.info(msg, meta);
    publishToRabbit('info', msg, meta);
  },
  warn: (msg: string, meta?: any) => {
    logger.warn(msg, meta);
    publishToRabbit('warn', msg, meta);
  },
  error: (msg: string | Error, meta?: any) => {
    const message = typeof msg === 'string' ? msg : (msg.stack || msg.message || String(msg));
    logger.error(message, meta);
    publishToRabbit('error', message, meta);
  },
  debug: (msg: string, meta?: any) => {
    logger.debug(msg, meta);
    publishToRabbit('debug', msg, meta);
  },
  // expose underlying winston if needed
  raw: logger,
};

export default wrappedLogger;
