import { createProxyMiddleware, type Options } from 'http-proxy-middleware';
import type { ServiceConfig } from '../models/config.model.js';
import { logger } from './logger.service.js';

export class ProxyService {
  private static instance: ProxyService;

  private constructor() {}

  public static getInstance(): ProxyService {
    if (!ProxyService.instance) {
      ProxyService.instance = new ProxyService();
    }
    return ProxyService.instance;
  }

  public createProxy(service: ServiceConfig) {
    const options: Options = {
      target: service.target,
      changeOrigin: service.changeOrigin || true,
      pathRewrite: {
        [`^${service.path}`]: '',
      },
      timeout: service.timeout || 30000,
      on: {
        proxyReq: (proxyReq, req) => {
          logger.debug(`Proxying request to ${service.name}`, {
            path: req.url,
            method: req.method,
            target: service.target,
          });
        },
        proxyRes: (proxyRes, req) => {
          logger.debug(`Response from ${service.name}`, {
            statusCode: proxyRes.statusCode,
            path: req.url,
          });
        },
        error: (err, req, res) => {
          logger.error(`Proxy error for ${service.name}`, {
            error: err.message,
            path: req.url,
          });

          // Type guard to check if res is a ServerResponse
          if (res && 'writeHead' in res && !res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              message: 'Bad Gateway - Service unavailable',
              service: service.name,
              timestamp: new Date().toISOString(),
            }));
          }
        },
      },
    };

    return createProxyMiddleware(options);
  }
}

export const proxyService = ProxyService.getInstance();
