import express from 'express';
import { json } from 'body-parser';
import { config } from './config/config';
import RedisConnection from './config/database';
import RabbitMQConnection from './config/rabbitmq';
import MessageBrokerService from './services/MessageBrokerService';
import notificationRoutes from './routes/notificationRoutes';
import healthRoutes from './routes/healthRoutes';
import logger from './config/logger';

const app = express();

// Middlewares
app.use(json());

// Routes
app.use('/api/notifications', notificationRoutes);
app.use('/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'msvc-notifications',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      notifications: '/api/notifications',
    },
  });
});

// Inicialización del servidor
async function startServer() {
  try {
    logger.info('🚀 Starting Notifications Microservice...');

    // Conectar a Redis
    const redisConnection = RedisConnection.getInstance();
    await redisConnection.connect();

    // Conectar a RabbitMQ
    const rabbitMQConnection = RabbitMQConnection.getInstance();
    await rabbitMQConnection.connect();

    // Inicializar el servicio de mensajería
    const messageBrokerService = new MessageBrokerService();
    await messageBrokerService.initialize();
    await messageBrokerService.startConsuming();

    // Iniciar servidor Express
    const PORT = config.port;
    app.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
      logger.info(`🌐 Environment: ${config.nodeEnv}`);
      logger.info(`📡 Redis URL: ${config.redisUrl}`);
      logger.info(`🐰 RabbitMQ URL: ${config.rabbitmqUrl}`);
      logger.info('✨ Notifications Microservice is ready!');
    });

    // Manejo de señales de terminación
    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Shutting down gracefully...`);

      try {
        await messageBrokerService.close();
        await rabbitMQConnection.disconnect();
        await redisConnection.disconnect();
        logger.info('✅ All connections closed');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
