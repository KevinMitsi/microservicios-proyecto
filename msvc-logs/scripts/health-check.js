#!/usr/bin/env node

const axios = require('axios');

async function check(url, opts = {}) {
  const name = opts.name || url;
  const timeout = opts.timeout || 3000;
  try {
    const res = await axios.get(url, { timeout, validateStatus: () => true, auth: opts.auth });
    const ok = res.status >= 200 && res.status < 300;
    console.log(`${ok ? 'OK ' : 'ERR'} ${name} -> status ${res.status}`);
    return ok;
  } catch (e) {
    console.log(`ERR ${name} -> ${e.message}`);
    return false;
  }
}

async function main() {
  const checks = [];

  // Fluent Bit metrics
  checks.push(await check(process.env.FLUENTBIT_METRICS_URL || 'http://localhost:2020', { name: 'fluent-bit metrics' }));

  // OpenSearch health
  checks.push(await check((process.env.OPENSEARCH_HEALTH_URL || 'http://localhost:9200/_cluster/health'), { name: 'opensearch cluster health' }));

  // RabbitMQ (opcional, no falla el health global si no responde)
  const rabbitOk = await check(process.env.RABBITMQ_HEALTH_URL || 'http://localhost:15672/api/overview', {
    name: 'rabbitmq overview (optional)',
    auth: { username: process.env.RABBIT_USER || 'admin', password: process.env.RABBIT_PASS || 'admin' }
  });

  const mandatoryOk = checks.every(Boolean);

  if (!mandatoryOk) {
    console.error('Health check FAILED');
    process.exit(1);
  }

  if (!rabbitOk) {
    console.warn('Health check PASSED with warnings (RabbitMQ optional endpoint not reachable)');
  } else {
    console.log('RabbitMQ optional check OK');
  }

  console.log('Health check PASSED');
}

main().catch(err => {
  console.error('Unhandled error in health-check:', err);
  process.exit(1);
});

