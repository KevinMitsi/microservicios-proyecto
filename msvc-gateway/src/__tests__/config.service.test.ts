import { ConfigService } from '../services/config.service.js';

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = ConfigService.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ConfigService.getInstance();
      const instance2 = ConfigService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getConfig', () => {
    it('should return valid configuration', () => {
      const config = configService.getConfig();
      
      expect(config).toBeDefined();
      expect(config.port).toBeDefined();
      expect(config.nodeEnv).toBeDefined();
      expect(config.services).toBeDefined();
      expect(Array.isArray(config.services)).toBe(true);
    });
  });

  describe('getPort', () => {
    it('should return port number', () => {
      const port = configService.getPort();
      expect(typeof port).toBe('number');
      expect(port).toBeGreaterThan(0);
    });
  });

  describe('getServices', () => {
    it('should return array of services', () => {
      const services = configService.getServices();
      
      expect(Array.isArray(services)).toBe(true);
      expect(services.length).toBeGreaterThan(0);
    });

    it('should return services with required properties', () => {
      const services = configService.getServices();
      
      services.forEach((service: any) => {
        expect(service.name).toBeDefined();
        expect(service.target).toBeDefined();
        expect(service.path).toBeDefined();
      });
    });

    it('should include msvc-auth service', () => {
      const services = configService.getServices();
      const authService = services.find((s: any) => s.name === 'msvc-auth');
      
      expect(authService).toBeDefined();
      expect(authService?.path).toBe('/api/auth');
    });

    it('should include msvc-profiles service', () => {
      const services = configService.getServices();
      const profilesService = services.find((s: any) => s.name === 'msvc-profiles');
      
      expect(profilesService).toBeDefined();
      expect(profilesService?.path).toBe('/api/profiles');
    });

    it('should include msvc-notifications service', () => {
      const services = configService.getServices();
      const notificationsService = services.find((s: any) => s.name === 'msvc-notifications');
      
      expect(notificationsService).toBeDefined();
      expect(notificationsService?.path).toBe('/api/notifications');
    });
  });

  describe('isProduction', () => {
    it('should return boolean', () => {
      const isProduction = configService.isProduction();
      expect(typeof isProduction).toBe('boolean');
    });
  });
});
