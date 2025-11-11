import dotenv from 'dotenv';
import type { GatewayConfig } from '../models/config.model.js';

dotenv.config();

export class ConfigService {
  private static instance: ConfigService;
  private config: GatewayConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private loadConfig(): GatewayConfig {
    const port = parseInt(process.env.PORT || '3000', 10);
    const nodeEnv = process.env.NODE_ENV || 'development';
    const allowedOrigins = process.env.ALLOWED_ORIGINS || '*';
    const logLevel = process.env.LOG_LEVEL || 'info';

    const services = [
      {
        name: 'msvc-auth',
        target: process.env.MSVC_AUTH_URL || 'http://msvc-auth:8081',
        path: '/api/auth',
        changeOrigin: true,
        timeout: 30000,
      },
      {
        name: 'msvc-profiles',
        target: process.env.MSVC_PROFILES_URL || 'http://msvc-profiles:8082',
        path: '/api/profiles',
        changeOrigin: true,
        timeout: 30000,
      },
      {
        name: 'msvc-notifications',
        target: process.env.MSVC_NOTIFICATIONS_URL || 'http://msvc-notifications:4000',
        path: '/api/notifications',
        changeOrigin: true,
        timeout: 30000,
      },
    ];

    return {
      port,
      nodeEnv,
      allowedOrigins,
      logLevel,
      services,
    };
  }

  public getConfig(): GatewayConfig {
    return this.config;
  }

  public getPort(): number {
    return this.config.port;
  }

  public getServices() {
    return this.config.services;
  }

  public getAllowedOrigins(): string {
    return this.config.allowedOrigins;
  }

  public isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }
}

export const configService = ConfigService.getInstance();
