import type { Router } from 'express';
import healthRoutes from './health.routes.js';
import gatewayRoutes from './gateway.routes.js';

export function setupRoutes(app: Router): void {
  // Gateway info routes
  app.use('/', gatewayRoutes);
  
  // Health check routes
  app.use('/', healthRoutes);
}
