import type { Request, Response } from 'express';
import { healthService } from '../services/health.service.js';
import { logger } from '../services/logger.service.js';

export class HealthController {
  public async checkHealth(req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = await healthService.checkHealth();
      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
      
      res.status(statusCode).json(healthStatus);
    } catch (error) {
      logger.error('Error checking health', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to check health',
        timestamp: new Date().toISOString(),
      });
    }
  }

  public liveness(req: Request, res: Response): void {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  }

  public readiness(req: Request, res: Response): void {
    res.status(200).json({
      status: 'ready',
      uptime: healthService.getUptime(),
      timestamp: new Date().toISOString(),
    });
  }
}

export const healthController = new HealthController();
