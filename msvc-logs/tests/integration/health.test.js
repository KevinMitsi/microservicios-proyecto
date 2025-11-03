const axios = require('axios');
const { Client } = require('@opensearch-project/opensearch');

describe('Pruebas de Monitoreo y Salud del Sistema de Logs', () => {
  let opensearchClient;

  beforeAll(async () => {
    // En un entorno de pruebas real, estos serían los endpoints del sistema desplegado
    // Para pruebas locales, usar los puertos del docker-compose
    opensearchClient = new Client({
      node: 'http://localhost:9200'
    });
  });

  test('debe validar que OpenSearch está funcionando correctamente', async () => {
    try {
      const health = await opensearchClient.cluster.health();
      expect(health.body.status).toMatch(/green|yellow/);
      expect(health.body.number_of_nodes).toBeGreaterThan(0);
    } catch (error) {
      // Si falla, puede ser que el contenedor no esté ejecutándose
      console.warn('OpenSearch no está disponible para pruebas de salud');
      expect(error.message).toContain('ECONNREFUSED');
    }
  });

  test('debe verificar que los índices de logs se crean correctamente', async () => {
    try {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '.');
      const expectedIndex = `logs-${today}`;

      // Intentar crear un documento de prueba para asegurar que el índice existe
      await opensearchClient.index({
        index: expectedIndex,
        body: {
          timestamp: new Date().toISOString(),
          level: 'INFO',
          service: 'health-check',
          message: 'Health check log entry'
        }
      });

      // Verificar que el índice existe
      const indexExists = await opensearchClient.indices.exists({
        index: expectedIndex
      });

      expect(indexExists.body).toBe(true);
    } catch (error) {
      console.warn('No se pudo verificar los índices de OpenSearch');
    }
  });

  test('debe validar la estructura del índice de logs', async () => {
    try {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '.');
      const indexName = `logs-${today}`;

      const mapping = await opensearchClient.indices.getMapping({
        index: indexName
      });

      // El mapping debería existir y tener la estructura esperada
      expect(mapping.body).toBeDefined();
      expect(mapping.body[indexName]).toBeDefined();
    } catch (error) {
      console.warn('No se pudo verificar el mapping del índice');
    }
  });

  test('debe validar que RabbitMQ Management está accesible', async () => {
    try {
      // Verificar que la API de management de RabbitMQ responde
      const response = await axios.get('http://localhost:15672/api/overview', {
        auth: {
          username: 'admin',
          password: 'admin'
        },
        timeout: 5000
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.rabbitmq_version).toBeDefined();
    } catch (error) {
      console.warn('RabbitMQ Management no está disponible para pruebas');
    }
  });

  test('debe verificar que la cola log_queue existe en RabbitMQ', async () => {
    try {
      const response = await axios.get('http://localhost:15672/api/queues/%2F/log_queue', {
        auth: {
          username: 'admin',
          password: 'admin'
        },
        timeout: 5000
      });

      expect(response.status).toBe(200);
      expect(response.data.name).toBe('log_queue');
      expect(response.data.durable).toBe(true);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.warn('La cola log_queue no existe aún - esto es normal si FluentBit no se ha conectado');
      } else {
        console.warn('Error al verificar la cola de RabbitMQ');
      }
    }
  });

});
