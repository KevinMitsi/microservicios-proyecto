import cors from 'cors';
import { configService } from '../services/config.service.js';

export function corsMiddleware() {
  const allowedOrigins = configService.getAllowedOrigins();
  
  const corsOptions = {
    origin: allowedOrigins === '*' ? '*' : allowedOrigins.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // 24 hours
  };

  return cors(corsOptions);
}
