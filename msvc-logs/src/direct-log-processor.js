const amqp = require('amqplib');
const axios = require('axios');

/**
 * Consumidor directo de logs que procesa mensajes de RabbitMQ
 * y los envía a FluentBit, que luego los procesa y envía a OpenSearch
 */
class DirectLogProcessor {
  constructor(config = {}) {
    this.rabbitmqUrl = config.rabbitmqUrl || 'amqp://admin:admin@localhost:5672';
    this.fluentbitUrl = config.fluentbitUrl || 'http://localhost:9880';
    this.queueName = config.queueName || 'log_queue';

    this.connection = null;
    this.channel = null;
    this.isProcessing = false;
  }

  async connect() {
    try {
      console.log('🔌 Conectando a RabbitMQ...');
      this.connection = await amqp.connect(this.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Configurar la cola
      await this.channel.assertQueue(this.queueName, { durable: true });

      console.log('🔌 Verificando conectividad con FluentBit...');
      try {
        await axios.get(this.fluentbitUrl.replace('9880', '2020')); // Health check en puerto 2020
        console.log('✅ FluentBit está disponible');
      } catch (error) {
        console.warn('⚠️  FluentBit puede no estar disponible, pero continuando...');
      }

      console.log('✅ Conexiones establecidas exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error conectando:', error.message);
      return false;
    }
  }

  async startProcessing() {
    if (!this.channel) {
      throw new Error('Debe conectar primero usando connect()');
    }

    this.isProcessing = true;
    console.log('🚀 Iniciando procesamiento de logs...');

    // Configurar QoS para procesar un mensaje a la vez
    await this.channel.prefetch(1);

    // Configurar el consumidor
    await this.channel.consume(this.queueName, async (msg) => {
      if (msg) {
        try {
          await this.processLogMessage(msg);
          this.channel.ack(msg);
        } catch (error) {
          console.error('❌ Error procesando mensaje:', error.message);
          // Rechazar el mensaje y enviarlo de vuelta a la cola
          this.channel.nack(msg, false, true);
        }
      }
    });

    console.log(`📥 Escuchando mensajes en la cola: ${this.queueName}`);
  }

  async processLogMessage(msg) {
    const logData = JSON.parse(msg.content.toString());

    // Agregar metadatos de procesamiento
    const processedLog = {
      ...logData,
      '@timestamp': logData.timestamp || new Date().toISOString(),
      processed_at: new Date().toISOString(),
      processor: 'direct-log-processor-to-fluentbit'
    };

    try {
      // Enviar a FluentBit via HTTP
      await axios.post(this.fluentbitUrl, processedLog, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      console.log(`📝 Log enviado a FluentBit: ${logData.service} - ${logData.message?.substring(0, 50)}...`);
    } catch (error) {
      console.error('❌ Error enviando log a FluentBit:', error.message);
      throw error; // Re-lanzar para que el mensaje vuelva a la cola
    }
  }

  async stopProcessing() {
    this.isProcessing = false;
    console.log('⏹️  Deteniendo procesamiento...');

    if (this.channel) {
      await this.channel.close();
    }

    if (this.connection) {
      await this.connection.close();
    }

    console.log('✅ Procesamiento detenido');
  }

  async getStats() {
    if (!this.channel) return null;

    const queueInfo = await this.channel.checkQueue(this.queueName);

    // Intentar obtener estadísticas de FluentBit
    let fluentbitStats = null;
    try {
      const response = await axios.get(this.fluentbitUrl.replace('9880', '2020'), {
        timeout: 3000
      });
      fluentbitStats = { available: true, status: response.status };
    } catch (error) {
      fluentbitStats = { available: false, error: error.message };
    }

    return {
      queueName: this.queueName,
      messageCount: queueInfo.messageCount,
      consumerCount: queueInfo.consumerCount,
      isProcessing: this.isProcessing,
      fluentbit: fluentbitStats
    };
  }
}

module.exports = DirectLogProcessor;
