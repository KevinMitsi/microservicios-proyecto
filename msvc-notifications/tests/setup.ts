import { beforeAll, afterAll } from '@jest/globals';

// Setup global para los tests
beforeAll(async () => {
  // Configuración global antes de ejecutar todos los tests
  process.env.NODE_ENV = 'test';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.RABBITMQ_URL = 'amqp://localhost:5672';
});

afterAll(async () => {
  // Limpieza después de todos los tests
});

// Mock de console.log para tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});
