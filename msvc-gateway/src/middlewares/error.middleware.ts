import type { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.service.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const statusCode = (err as any).statusCode || 500;
  
  res.status(statusCode).json({
    statusCode,
    message: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
    path: req.path,
  });
}
