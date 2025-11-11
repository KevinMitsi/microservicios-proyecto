import type { Request, Response } from 'express';
import { HealthController } from '../controllers/health.controller.js';
import { HealthService } from '../services/health.service.js';

jest.mock('../services/health.service.js');

describe('HealthController', () => {
  let healthController: HealthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockHealthService: jest.Mocked<HealthService>;

  beforeEach(() => {
    healthController = new HealthController();
    
    mockRequest = {};
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockHealthService = HealthService.getInstance() as jest.Mocked<HealthService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkHealth', () => {
    it('should return 200 when service is healthy', async () => {
      const healthyResult = {
        status: 'healthy' as const,
        timestamp: new Date().toISOString(),
        uptime: 100,
        services: [],
      };

      mockHealthService.checkHealth = jest.fn().mockResolvedValue(healthyResult);

      await healthController.checkHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(healthyResult);
    });

    it('should return 503 when service is unhealthy', async () => {
      const unhealthyResult = {
        status: 'unhealthy' as const,
        timestamp: new Date().toISOString(),
        uptime: 100,
        services: [],
      };

      mockHealthService.checkHealth = jest.fn().mockResolvedValue(unhealthyResult);

      await healthController.checkHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith(unhealthyResult);
    });

    it('should handle errors gracefully', async () => {
      mockHealthService.checkHealth = jest.fn().mockRejectedValue(new Error('Test error'));

      await healthController.checkHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: expect.any(String),
        })
      );
    });
  });

  describe('liveness', () => {
    it('should return 200 with alive status', () => {
      healthController.liveness(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'alive',
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('readiness', () => {
    it('should return 200 with ready status', () => {
      mockHealthService.getUptime = jest.fn().mockReturnValue(123);

      healthController.readiness(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ready',
          uptime: 123,
          timestamp: expect.any(String),
        })
      );
    });
  });
});
