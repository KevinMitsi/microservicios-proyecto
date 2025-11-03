# Cómo agregar un nuevo microservicio y conectarlo al flujo de logs

Esta guía cubre:
- Alta de un nuevo microservicio en docker-compose
- Conexión a RabbitMQ para publicar logs
- Envío de logs al pipeline (RabbitMQ -> Procesador Directo -> FluentBit -> OpenSearch)
- Ajustes mínimos de CI/CD

## 1) Requisitos mínimos del microservicio

- Variable de entorno `RABBITMQ_URL` (ej.: `amqp://admin:admin@rabbitmq:5672`).
- Logger de aplicación que publique eventos relevantes en una cola de RabbitMQ (`log_queue` por defecto) o exponga logs por stdout con un formato JSON que incluya:
  - `service`: nombre del servicio
  - `level`: info|warn|error
  - `message`: string
  - `timestamp`: ISO8601 (opcional; FluentBit normaliza)
  - `meta`: objeto adicional (opcional)

Ejemplo de payload en RabbitMQ:
```json
{
  "service": "msvc-new",
  "level": "info",
  "message": "usuario creado",
  "meta": {"userId": "123"},
  "timestamp": "2025-11-02T18:23:54Z"
}
```

## 2) Publicación de logs en RabbitMQ

- Cola por defecto: `log_queue`.
- Exchange directo opcional: `logs.exchange` con routing key `logs`.

Ejemplo Node.js:
```js
const amqp = require('amqplib');
const url = process.env.RABBITMQ_URL;
const QUEUE = process.env.LOG_QUEUE_NAME || 'log_queue';

async function publishLog(msg) {
  const conn = await amqp.connect(url);
  const ch = await conn.createChannel();
  await ch.assertQueue(QUEUE, { durable: true });
  ch.sendToQueue(QUEUE, Buffer.from(JSON.stringify(msg)), { persistent: true });
  await ch.close();
  await conn.close();
}
```

Ejemplo Python:
```py
import json, os
import pika

url = os.getenv('RABBITMQ_URL', 'amqp://admin:admin@rabbitmq:5672')
params = pika.URLParameters(url)

QUEUE = os.getenv('LOG_QUEUE_NAME', 'log_queue')

connection = pika.BlockingConnection(params)
channel = connection.channel()
channel.queue_declare(queue=QUEUE, durable=True)

log = {"service":"msvc-new","level":"info","message":"hello"}
channel.basic_publish(exchange='', routing_key=QUEUE, body=json.dumps(log).encode('utf-8'), properties=pika.BasicProperties(delivery_mode=2))
connection.close()
```

## 3) Recepción y envío a FluentBit

El contenedor `direct-log-processor` ya está desplegado. Toma mensajes de RabbitMQ (`log_queue`) y los envía por HTTP a FluentBit (`http://fluent-bit:9880`). No hay que cambiar nada si reutilizas la misma cola y formato JSON arriba.

Si necesitas otra cola, configura la variable `LOG_QUEUE_NAME` del servicio `direct-log-processor` o añade otra instancia del procesador directo.

## 4) Configuración de FluentBit

`msvc-logs/fluent-bit.conf` ya enruta todo lo que llega por HTTP/forward hacia OpenSearch con índice `logs-%Y.%m.%d`. Puedes añadir filtros por servicio o nivel usando bloques `[FILTER]` con `Match`.

Ejemplo para añadir el nombre del entorno:
```
[FILTER]
    Name    modify
    Match   logs.*
    Add     env production
```

## 5) Alta en docker-compose

- Añade el nuevo servicio en `docker-compose.yaml` bajo la misma red `microservices-net`.
- Expón variables necesarias (`RABBITMQ_URL`, DB, etc.).
- Usa `depends_on: [rabbitmq]` si publicará logs al arrancar.

## 6) Ajustes de CI/CD

- Si es Node.js, añade etapa de `npm ci && npm test` al Jenkinsfile.
- Si es Python, instala requirements y ejecuta tests (`pytest`).
- Si es Java, ejecuta `./gradlew test`.
- Para Docker, asegúrate de tener `Dockerfile` y, si quieres incluirlo en el despliegue, añádelo a `docker-compose.yaml`.

Puedes usar como plantilla los bloques existentes del `Jenkinsfile` (stages paralelos de pruebas) y copiar un servicio similar en `docker-compose.yaml`.

## 7) Convenciones de logs

- Estructura JSON plana cuando sea posible.
- Incluye `service`, `level`, `message` y metadatos en `meta`.
- No incluyas datos sensibles (tokens, contraseñas).
- Preferir niveles: trace, debug, info, warn, error, fatal (mapear a `level`).

## 8) Validación rápida

1. Arranca la plataforma:
```bash
docker compose up -d rabbitmq fluent-bit direct-log-processor opensearch opensearch-dashboards
```
2. Publica un mensaje de prueba a RabbitMQ.
3. Verifica en OpenSearch:
```bash
curl http://localhost:9200/logs-*/_search?pretty
```
4. Revisa métricas de FluentBit: http://localhost:2020

---

## Apéndice: usar Logstash en lugar de FluentBit (opcional)

Este proyecto usa FluentBit por rendimiento y simplicidad. Si prefieres Logstash, el esquema sería:
```
Microservicios -> RabbitMQ -> Logstash -> OpenSearch
```
Configuración mínima de Logstash (`pipeline.conf`):
```
input {
  rabbitmq {
    host => "rabbitmq"
    port => 5672
    user => "admin"
    password => "admin"
    queue => "log_queue"
    durable => true
    codec => json
  }
}
filter {
  mutate { add_field => { "processed_by" => "logstash" } }
  date { match => ["timestamp", "ISO8601"] target => "@timestamp" }
}
output {
  opensearch {
    hosts => ["http://opensearch:9200"]
    index => "logs-%{+YYYY.MM.dd}"
    ssl => false
  }
  stdout { codec => rubydebug }
}
```
Incluye el servicio de Logstash en `docker-compose.yaml` y apúntalo a `rabbitmq` y `opensearch` en la misma red.
