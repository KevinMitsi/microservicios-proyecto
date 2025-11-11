import type { HealthCheckResult, ServiceStatus } from '../models/health.model.js';
import { configService } from './config.service.js';

export class HealthService {
  private static instance: HealthService;
  private startTime: number;

  private constructor() {
    this.startTime = Date.now();
  }

  public static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    const services = configService.getServices();
    const serviceStatuses = await this.checkServices(services);
    
    const allHealthy = serviceStatuses.every(s => s.status === 'up');
    
    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      services: serviceStatuses,
    };
  }

  private async checkServices(services: any[]): Promise<ServiceStatus[]> {
    const statusPromises = services.map(service => this.checkService(service));
    return Promise.all(statusPromises);
  }

  private async checkService(service: any): Promise<ServiceStatus> {
    try {
      // En un escenario real, aquí harías un ping al servicio
      // Por ahora, asumimos que están disponibles si están configurados
      return {
        name: service.name,
        url: service.target,
        status: 'unknown', // Cambiaría a 'up' con un health check real
      };
    } catch (error) {
      return {
        name: service.name,
        url: service.target,
        status: 'down',
      };
    }
  }

  public getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}

export const healthService = HealthService.getInstance();
