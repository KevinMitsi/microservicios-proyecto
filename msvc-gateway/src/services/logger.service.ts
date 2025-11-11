import type { Request } from 'express';

export class LoggerService {
  private static instance: LoggerService;

  private constructor() {}

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  public info(message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`, meta || '');
  }

  public error(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, error || '');
  }

  public warn(message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`, meta || '');
  }

  public debug(message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${timestamp}] [DEBUG] ${message}`, meta || '');
    }
  }

  public logRequest(req: Request): void {
    this.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }
}

export const logger = LoggerService.getInstance();
