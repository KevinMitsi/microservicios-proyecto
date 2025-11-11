import type { Request, Response } from 'express';
import { configService } from '../services/config.service.js';

export class GatewayController {
  public getInfo(req: Request, res: Response): void {
    const config = configService.getConfig();
    
    res.json({
      name: 'API Gateway',
      version: '1.0.0',
      environment: config.nodeEnv,
      services: config.services.map(s => ({
        name: s.name,
        path: s.path,
      })),
      timestamp: new Date().toISOString(),
    });
  }

  public notFound(req: Request, res: Response): void {
    res.status(404).json({
      statusCode: 404,
      message: 'Route not found',
      path: req.path,
      timestamp: new Date().toISOString(),
    });
  }
}

export const gatewayController = new GatewayController();
