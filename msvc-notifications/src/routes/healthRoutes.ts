import { Router, Request, Response } from 'express';
import RedisConnection from '../config/database';
import RabbitMQConnection from '../config/rabbitmq';

const router = Router();

/**
 * GET /health
 * Verifica el estado de salud del servicio
 */
router.get('/', (req: Request, res: Response) => {
  const redisConnection = RedisConnection.getInstance();
  const rabbitMQConnection = RabbitMQConnection.getInstance();

  const health = {
    service: 'msvc-notifications',
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    connections: {
      redis: redisConnection.isReady() ? 'connected' : 'disconnected',
      rabbitmq: rabbitMQConnection.isReady() ? 'connected' : 'disconnected',
    },
  };

  const statusCode = 
    redisConnection.isReady() && rabbitMQConnection.isReady() ? 200 : 503;

  res.status(statusCode).json(health);
});

/**
 * GET /health/ready
 * Verifica si el servicio está listo para recibir tráfico
 */
router.get('/ready', (req: Request, res: Response) => {
  const redisConnection = RedisConnection.getInstance();
  const rabbitMQConnection = RabbitMQConnection.getInstance();

  const isReady = redisConnection.isReady() && rabbitMQConnection.isReady();

  if (isReady) {
    res.status(200).json({
      status: 'ready',
      message: 'Service is ready to accept traffic',
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      message: 'Service is not ready yet',
      connections: {
        redis: redisConnection.isReady(),
        rabbitmq: rabbitMQConnection.isReady(),
      },
    });
  }
});

/**
 * GET /health/live
 * Verifica si el servicio está vivo
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    message: 'Service is alive',
  });
});

export default router;
