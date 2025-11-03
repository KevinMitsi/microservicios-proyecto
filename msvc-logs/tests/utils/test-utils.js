const fs = require('fs');
const path = require('path');

/**
 * Utilidades para las pruebas del sistema de logs
 */

class LogTestUtils {

  /**
   * Genera un log de prueba con estructura estándar
   */
  static generateTestLog(service, level = 'INFO', userId = 'test-user', action = 'test-action', customData = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      service,
      message: customData.message || `Test log from ${service}`,
      userId,
      action,
      metadata: {
        testId: `test-${Date.now()}`,
        environment: 'test',
        ...customData.metadata
      },
      ...customData
    };
  }

  /**
   * Genera una secuencia de logs para simular un flujo de trabajo
   */
  static generateLogSequence(service, userId, actions, baseTimestamp = new Date()) {
    return actions.map((action, index) => {
      const timestamp = new Date(baseTimestamp.getTime() + (index * 1000));
      return this.generateTestLog(
        service,
        action.level || 'INFO',
        userId,
        action.name,
        {
          message: action.message,
          metadata: action.metadata
        }
      );
    });
  }

  /**
   * Valida la estructura de un log
   */
  static validateLogStructure(log) {
    const requiredFields = ['timestamp', 'level', 'service', 'message', 'userId', 'action'];

    for (const field of requiredFields) {
      if (!log.hasOwnProperty(field)) {
        throw new Error(`Campo requerido '${field}' faltante en el log`);
      }
    }

    // Validar formato de timestamp
    if (isNaN(Date.parse(log.timestamp))) {
      throw new Error('Formato de timestamp inválido');
    }

    // Validar nivel de log
    const validLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
    if (!validLevels.includes(log.level)) {
      throw new Error(`Nivel de log inválido: ${log.level}`);
    }

    return true;
  }

  /**
   * Genera un índice de OpenSearch basado en la fecha
   */
  static generateIndexName(date = new Date(), prefix = 'logs') {
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '.');
    return `${prefix}-${dateStr}`;
  }

  /**
   * Espera un tiempo determinado (para tests asíncronos)
   */
  static async sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  /**
   * Valida que la configuración de FluentBit sea correcta
   */
  static validateFluentBitConfig(configPath) {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Archivo de configuración no encontrado: ${configPath}`);
    }

    const config = fs.readFileSync(configPath, 'utf8');

    // Validaciones básicas
    if (!config.includes('input {')) {
      throw new Error('Configuración de input faltante');
    }

    if (!config.includes('output {')) {
      throw new Error('Configuración de output faltante');
    }

    if (!config.includes('rabbitmq')) {
      throw new Error('Configuración de RabbitMQ faltante');
    }

    if (!config.includes('opensearch')) {
      throw new Error('Configuración de OpenSearch faltante');
    }

    return true;
  }

  /**
   * Limpia índices de prueba en OpenSearch
   */
  static async cleanupTestIndices(opensearchClient, pattern = 'test-logs-*') {
    try {
      await opensearchClient.indices.delete({
        index: pattern,
        ignore_unavailable: true
      });
      console.log(`Índices de prueba limpiados: ${pattern}`);
    } catch (error) {
      console.warn('No se pudieron limpiar los índices de prueba:', error.message);
    }
  }

  /**
   * Verifica que un log haya sido procesado en OpenSearch
   */
  static async verifyLogInOpenSearch(opensearchClient, indexName, searchCriteria, maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await opensearchClient.search({
          index: indexName,
          body: {
            query: searchCriteria
          }
        });

        if (response.body.hits.total.value > 0) {
          return response.body.hits.hits;
        }
      } catch (error) {
        if (error.meta && error.meta.statusCode === 404) {
          // Índice no existe aún, esperar y reintentar
          await this.sleep(2000);
          continue;
        }
        throw error;
      }

      await this.sleep(2000);
    }

    throw new Error(`Log no encontrado en OpenSearch después de ${maxRetries} intentos`);
  }
}

module.exports = LogTestUtils;
