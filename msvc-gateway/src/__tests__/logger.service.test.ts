import { LoggerService } from '../services/logger.service.js';

describe('LoggerService', () => {
  let loggerService: LoggerService;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    loggerService = LoggerService.getInstance();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = LoggerService.getInstance();
      const instance2 = LoggerService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('info', () => {
    it('should log info message', () => {
      loggerService.info('Test info message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should include message in log', () => {
      loggerService.info('Test info');
      const logCall = consoleLogSpy.mock.calls[0];
      expect(logCall[0]).toContain('INFO');
      expect(logCall[0]).toContain('Test info');
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      loggerService.error('Test error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should include message in error log', () => {
      loggerService.error('Test error');
      const errorCall = consoleErrorSpy.mock.calls[0];
      expect(errorCall[0]).toContain('ERROR');
      expect(errorCall[0]).toContain('Test error');
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      loggerService.warn('Test warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should include message in warning log', () => {
      loggerService.warn('Test warning');
      const warnCall = consoleWarnSpy.mock.calls[0];
      expect(warnCall[0]).toContain('WARN');
      expect(warnCall[0]).toContain('Test warning');
    });
  });

  describe('logRequest', () => {
    it('should log request details', () => {
      const mockRequest = {
        method: 'GET',
        path: '/test',
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('test-agent'),
      } as any;

      loggerService.logRequest(mockRequest);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
});
