import { HealthService } from '../services/health.service.js';

describe('HealthService', () => {
  let healthService: HealthService;

  beforeEach(() => {
    healthService = HealthService.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = HealthService.getInstance();
      const instance2 = HealthService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('checkHealth', () => {
    it('should return health check result', async () => {
      const result = await healthService.checkHealth();
      
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      expect(['healthy', 'unhealthy']).toContain(result.status);
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeDefined();
      expect(result.services).toBeDefined();
    });

    it('should return array of service statuses', async () => {
      const result = await healthService.checkHealth();
      
      expect(Array.isArray(result.services)).toBe(true);
      expect(result.services.length).toBeGreaterThan(0);
    });

    it('should include service status details', async () => {
      const result = await healthService.checkHealth();
      
      result.services.forEach((service: any) => {
        expect(service.name).toBeDefined();
        expect(service.url).toBeDefined();
        expect(service.status).toBeDefined();
        expect(['up', 'down', 'unknown']).toContain(service.status);
      });
    });
  });

  describe('getUptime', () => {
    it('should return uptime in seconds', () => {
      const uptime = healthService.getUptime();
      
      expect(typeof uptime).toBe('number');
      expect(uptime).toBeGreaterThanOrEqual(0);
    });

    it('should increase over time', async () => {
      const uptime1 = healthService.getUptime();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const uptime2 = healthService.getUptime();
      expect(uptime2).toBeGreaterThanOrEqual(uptime1);
    });
  });
});
