import type { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.service.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Log request
  logger.info(`Incoming ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`Completed ${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}
