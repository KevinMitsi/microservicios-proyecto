import express, { type Application } from 'express';
import { configService } from './services/config.service.js';
import { proxyService } from './services/proxy.service.js';
import { logger } from './services/logger.service.js';
import { corsMiddleware } from './middlewares/cors.middleware.js';
import { requestLogger } from './middlewares/logger.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { setupRoutes } from './routes/index.js';
import { gatewayController } from './controllers/gateway.controller.js';

export function createApp(): Application {
  const app = express();

  // Middlewares
  app.use(corsMiddleware());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Setup gateway routes
  setupRoutes(app);

  // Setup proxy routes for microservices
  const services = configService.getServices();
  services.forEach(service => {
    logger.info(`Setting up proxy for ${service.name}`, {
      path: service.path,
      target: service.target,
    });
    
    app.use(service.path, proxyService.createProxy(service));
  });

  // 404 handler - must be after all routes
  app.use((req, res) => gatewayController.notFound(req, res));

  // Error handler - must be last
  app.use(errorHandler);

  return app;
}
