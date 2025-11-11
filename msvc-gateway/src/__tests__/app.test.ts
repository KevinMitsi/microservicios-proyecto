import request from 'supertest';
import { createApp } from '../app.js';

describe('App Integration Tests', () => {
  const app = createApp();

  describe('GET /', () => {
    it('should return gateway info', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('API Gateway');
      expect(response.body.version).toBeDefined();
      expect(response.body.services).toBeDefined();
      expect(Array.isArray(response.body.services)).toBe(true);
    });

    it('should include all microservices in response', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      const serviceNames = response.body.services.map((s: any) => s.name);
      
      expect(serviceNames).toContain('msvc-auth');
      expect(serviceNames).toContain('msvc-profiles');
      expect(serviceNames).toContain('msvc-notifications');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      
      expect([200, 503]).toContain(response.status);
      expect(response.body.status).toBeDefined();
      expect(['healthy', 'unhealthy']).toContain(response.body.status);
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      expect(response.body.services).toBeDefined();
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app).get('/health/live');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('alive');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app).get('/health/ready');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ready');
      expect(response.body.uptime).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');
      
      expect(response.status).toBe(404);
      expect(response.body.statusCode).toBe(404);
      expect(response.body.message).toContain('not found');
      expect(response.body.path).toBe('/unknown-route');
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/')
        .set('Origin', 'http://example.com');
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('JSON Parsing', () => {
    it('should accept JSON requests', async () => {
      const response = await request(app)
        .post('/health')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');
      
      // Aunque no hay POST /health, debería manejar JSON
      expect(response.headers['content-type']).toMatch(/json/);
    });
  });
});
