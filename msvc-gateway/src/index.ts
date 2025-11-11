import { createApp } from './app.js';
import { configService } from './services/config.service.js';
import { logger } from './services/logger.service.js';

const app = createApp();
const port = configService.getPort();

const server = app.listen(port, () => {
  logger.info(`🚀 API Gateway running on port ${port}`);
  logger.info(`Environment: ${configService.getConfig().nodeEnv}`);
  logger.info('Available services:');
  
  configService.getServices().forEach(service => {
    logger.info(`  - ${service.name}: ${service.path} -> ${service.target}`);
  });
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
