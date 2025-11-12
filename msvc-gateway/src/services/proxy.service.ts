import { createProxyMiddleware, type Options } from 'http-proxy-middleware';
import type { ServiceConfig } from '../models/config.model.js';
import { logger } from './logger.service.js';
import type { Request } from 'express';

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
                proxyReq: (proxyReq, req, res) => {
                    const expressReq = req as Request;
                    // Mantener headers de autorización
                    if (expressReq.headers.authorization) {
                        proxyReq.setHeader('Authorization', expressReq.headers.authorization);
                    }

                    // CRÍTICO: Re-enviar el body para peticiones POST/PUT/PATCH
                    // Express ya parseó el body, así que debemos re-escribirlo
                    if (expressReq.body && (expressReq.method === 'POST' || expressReq.method === 'PUT' || expressReq.method === 'PATCH')) {
                        const bodyData = JSON.stringify(expressReq.body);

                        // Actualizar headers
                        proxyReq.setHeader('Content-Type', 'application/json');
                        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));

                        // Escribir el body en el stream del proxy
                        proxyReq.write(bodyData);
                        proxyReq.end();
                    }

                    logger.debug(`Proxying request to ${service.name}`, {
                        path: expressReq.url,
                        method: expressReq.method,
                        target: service.target,
                        hasAuth: !!expressReq.headers.authorization,
                        hasBody: !!(expressReq.body && Object.keys(expressReq.body).length > 0),
                        bodySize: expressReq.body ? Buffer.byteLength(JSON.stringify(expressReq.body)) : 0,
                    });
                },

                proxyRes: (proxyRes, req) => {
                    logger.debug(`Response from ${service.name}`, {
                        statusCode: proxyRes.statusCode,
                        path: req.url,
                        method: req.method,
                    });
                },

                error: (err, req, res) => {
                    logger.error(`Proxy error for ${service.name}`, {
                        error: err.message,
                        path: req.url,
                        method: req.method,
                        stack: err.stack,
                    });

                    // Type guard para verificar si res es ServerResponse
                    if (res && 'writeHead' in res && !res.headersSent) {
                        res.writeHead(502, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            message: 'Bad Gateway - Service unavailable',
                            service: service.name,
                            error: err.message,
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