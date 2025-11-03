#!/usr/bin/env node

const DirectLogProcessor = require('./direct-log-processor');

/**
 * Script principal para ejecutar el procesador directo de logs
 * Proporciona una solución eficiente y directa para el procesamiento de logs
 */

async function main() {
  console.log('🚀 Iniciando Procesador Directo de Logs');
  console.log('====================================');

  // Configuración desde variables de entorno o valores por defecto
  const config = {
    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
    fluentbitUrl: process.env.FLUENTBIT_URL || 'http://fluent-bit:9880',
    queueName: process.env.LOG_QUEUE_NAME || 'log_queue'
  };

  console.log('📋 Configuración:');
  console.log(`   RabbitMQ: ${config.rabbitmqUrl}`);
  console.log(`   FluentBit: ${config.fluentbitUrl}`);
  console.log(`   Cola: ${config.queueName}`);
  console.log('');

  const processor = new DirectLogProcessor(config);

  // Manejar señales de terminación
  process.on('SIGINT', async () => {
    console.log('\n🛑 Recibida señal de terminación (SIGINT)');
    await processor.stopProcessing();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Recibida señal de terminación (SIGTERM)');
    await processor.stopProcessing();
    process.exit(0);
  });

  try {
    // Conectar a los servicios
    const connected = await processor.connect();

    if (!connected) {
      console.error('❌ No se pudo conectar a los servicios');
      process.exit(1);
    }

    // Mostrar estadísticas iniciales
    const stats = await processor.getStats();
    console.log('📊 Estado inicial:');
    console.log(`   Mensajes en cola: ${stats.messageCount}`);
    console.log(`   Consumidores: ${stats.consumerCount}`);
    console.log('');

    // Iniciar el procesamiento
    await processor.startProcessing();

    // Mostrar estadísticas cada 30 segundos
    setInterval(async () => {
      try {
        const currentStats = await processor.getStats();
        console.log(`📊 [${new Date().toISOString()}] Mensajes en cola: ${currentStats.messageCount}`);
      } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error.message);
      }
    }, 30000);

    console.log('✅ Procesador ejecutándose - Presiona Ctrl+C para detener');

  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
}

// Ejecutar solo si es el script principal
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error no manejado:', error);
    process.exit(1);
  });
}

module.exports = { DirectLogProcessor };
