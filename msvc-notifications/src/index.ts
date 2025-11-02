import express from 'express';
import { json } from 'body-parser';
import { config } from './config/config';
import RedisConnection from './config/database';
import RabbitMQConnection from './config/rabbitmq';
import MessageBrokerService from './services/MessageBrokerService';
import notificationRoutes from './routes/notificationRoutes';
import healthRoutes from './routes/healthRoutes';

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
    console.log('🚀 Starting Notifications Microservice...');

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
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${config.nodeEnv}`);
      console.log(`📡 Redis URL: ${config.redisUrl}`);
      console.log(`🐰 RabbitMQ URL: ${config.rabbitmqUrl}`);
      console.log('✨ Notifications Microservice is ready!');
    });

    // Manejo de señales de terminación
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      
      try {
        await messageBrokerService.close();
        await rabbitMQConnection.disconnect();
        await redisConnection.disconnect();
        console.log('✅ All connections closed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
