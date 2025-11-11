import type { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.service.js';

/**
 * Middleware que extrae el token JWT del header Authorization
 * y lo pasa al microservicio downstream
 */
export function jwtMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      // Si existe el header Authorization, registrarlo para debugging
      logger.debug('JWT token detected', {
        path: req.path,
        method: req.method,
      });
    }

    // El token se pasa automáticamente en el header Authorization
    // http-proxy-middleware lo reenviará al microservicio
    next();
  } catch (error) {
    logger.error('Error in JWT middleware', { error });
    next();
  }
}

