# Guía de configuración del sistema de logs (msvc-logs)

Esta guía explica cómo poner en marcha y configurar el pipeline de logs basado en Fluent Bit, OpenSearch y RabbitMQ, incluyendo el procesador directo que conecta RabbitMQ con Fluent Bit.

Objetivo
- Recepción de logs vía HTTP (Fluent Bit) o vía cola (RabbitMQ)
- Procesamiento y normalización de eventos
- Indexación en OpenSearch para consulta y visualización

Servicios implicados
- RabbitMQ: broker de mensajería (cola de logs)
- Fluent Bit: ingesta, filtrado y envío a OpenSearch
- OpenSearch: almacenamiento y consulta de logs
- OpenSearch Dashboards: visualización (Kibana compatible)
- direct-log-processor: consumidor de RabbitMQ que reenvía a Fluent Bit por HTTP

Requisitos previos
- Docker Desktop con contenedores Linux
- Docker Compose habilitado
- Puertos libres en tu host: 15672, 5672, 2020, 9880, 24224, 9200, 5601
- Windows: shell por defecto cmd.exe (usa los comandos tal cual aparecen)

Puertos y endpoints
- RabbitMQ UI: http://localhost:15672 (admin/admin)
- Fluent Bit métricas: http://localhost:2020
- Fluent Bit HTTP input: http://localhost:9880
- OpenSearch: http://localhost:9200
- OpenSearch Dashboards: http://localhost:5601

Variables de entorno relevantes
- RABBITMQ_URL: amqp://admin:admin@rabbitmq:5672
- FLUENTBIT_URL: http://fluent-bit:9880
- LOG_QUEUE_NAME: log_queue
- LOG_LEVEL (Fluent Bit): info (configurable en el archivo)

Archivos clave
- msvc-logs/fluent-bit.conf: configuración de Fluent Bit
- msvc-logs/Dockerfile: imagen de Fluent Bit con la config incluida
- msvc-logs/Dockerfile.direct: imagen del procesador directo
- msvc-logs/src/index.js y direct-log-processor.js: lógica del procesador
- docker-compose.yaml: orquestación de los servicios

1) Puesta en marcha rápida
1. Levanta la plataforma base (mensajería, almacenamiento e ingesta):
```bat
docker-compose up -d rabbitmq opensearch opensearch-dashboards fluent-bit
```
2. Levanta el procesador directo (RabbitMQ -> Fluent Bit):
```bat
docker-compose up -d direct-log-processor
```
3. Verifica estado de los contenedores:
```bat
docker-compose ps
```

2) Verificaciones básicas
- RabbitMQ UI accesible en http://localhost:15672 (usuario: admin, pass: admin)
- Métricas de Fluent Bit:
```bat
curl http://localhost:2020
```
- Estado de OpenSearch:
```bat
curl http://localhost:9200
```
- Dashboards: abre http://localhost:5601 en el navegador (primera carga puede tardar unos segundos)

3) Enviar un log de prueba
A) HTTP directo a Fluent Bit (sin pasar por RabbitMQ):
```bat
curl -X POST http://localhost:9880 -H "Content-Type: application/json" -d "{\"level\":\"INFO\",\"service\":\"msvc-test\",\"message\":\"Hola logs\",\"timestamp\":\"2025-01-01T00:00:00Z\"}"
```
B) A través de RabbitMQ con API HTTP (sin instalar librerías):
```bat
curl -u admin:admin -H "content-type: application/json" -X POST ^
  -d "{\"properties\":{},\"routing_key\":\"log_queue\",\"payload\":\"{\\\"service\\\":\\\"msvc-test\\\",\\\"level\\\":\\\"info\\\",\\\"message\\\":\\\"hola via rabbit http\\\"}\",\"payload_encoding\":\"string\"}" ^
  http://localhost:15672/api/exchanges/%2F/amq.default/publish
```
C) A través de RabbitMQ usando Node.js (requiere Node y amqplib instalables):
```bat
node -e "(async()=>{const amqp=require('amqplib');const url='amqp://admin:admin@localhost:5672';const q='log_queue';const c=await amqp.connect(url);const ch=await c.createChannel();await ch.assertQueue(q,{durable:true});const msg={service:'msvc-test',level:'info',message:'hola via rabbit'};ch.sendToQueue(q,Buffer.from(JSON.stringify(msg)),{persistent:true});await ch.close();await c.close();console.log('enviado');})().catch(e=>{console.error(e);process.exit(1);});"
```

4) Consultar logs en OpenSearch
- Buscar índices creados y consultar:
```bat
curl http://localhost:9200/_cat/indices
curl http://localhost:9200/logs-*/_search?pretty
```
Nota: por defecto el índice es logs-%Y.%m.%d definido en fluent-bit.conf.

5) Personalización de configuración
A) Cambiar la cola de logs
- Ajusta LOG_QUEUE_NAME en el servicio direct-log-processor de docker-compose.yaml o al arrancar el contenedor:
```bat
docker-compose run --rm -e LOG_QUEUE_NAME=otra_cola direct-log-processor
```

B) Cambiar el nivel de logs y filtros de Fluent Bit
- Edita msvc-logs/fluent-bit.conf. Ejemplo para añadir un campo env:
```
[FILTER]
    Name    modify
    Match   logs.*
    Add     env dev
```
- Reconstruye y reinicia Fluent Bit:
```bat
docker-compose build fluent-bit
docker-compose up -d fluent-bit
```

C) Apuntar a otro OpenSearch
- Cambia Host y Port del bloque [OUTPUT] opensearch en fluent-bit.conf y reconstruye la imagen de Fluent Bit como arriba.

D) Escalado del procesador directo
- Puedes lanzar más de una instancia del direct-log-processor para mayor throughput:
```bat
docker-compose up -d --scale direct-log-processor=2 direct-log-processor
```
RabbitMQ balancea mensajes entre consumidores de la misma cola.

6) Integración desde tus microservicios
- Publica eventos JSON en RabbitMQ usando la URL del broker de docker-compose (amqp://admin:admin@rabbitmq:5672) y la cola LOG_QUEUE_NAME (por defecto log_queue).
- Alternativamente, emite logs por HTTP al puerto 9880 de Fluent Bit.
- Recomendada la estructura del mensaje:
```
{
  "service": "msvc-NOMBRE",
  "level": "info|warn|error",
  "message": "...",
  "timestamp": "ISO8601 opcional",
  "meta": { "...": "..." }
}
```

7) Troubleshooting rápido
- Fluent Bit no arranca:
  - Revisa logs: 
    ```bat
    docker logs fluent-bit --tail=200
    ```
  - Valida fluent-bit.conf (bloques SERVICE/INPUT/FILTER/OUTPUT)
- No llegan logs a OpenSearch:
  - Verifica salud: 
    ```bat
    curl http://localhost:9200/_cluster/health
    curl http://localhost:9200/_cat/indices
    ```
  - Activa salida stdout en fluent-bit.conf para depurar (ya incluida por defecto)
- RabbitMQ sin consumidores:
  - Comprueba que direct-log-processor esté up: 
    ```bat
    docker-compose ps direct-log-processor
    docker logs direct-log-processor --tail=200
    ```
- Conflicto de puertos:
  - Asegúrate de que 9200/5601/15672/5672/2020/9880/24224 estén libres o ajusta mapeos en docker-compose.yaml
- Windows: errores con el socket de Docker en Jenkins
  - Jenkins del compose ya viene con privilegios root y montaje del socket para simplificar. Si no usas Jenkins, puedes ignorarlo.

8) Producción y seguridad (resumen)
- En docker-compose.yaml se desactiva la seguridad de OpenSearch para facilitar el desarrollo (DISABLE_SECURITY_PLUGIN=true). En producción habilítala.
- Usa secretos/variables seguras para credenciales de RabbitMQ y OpenSearch.
- Define límites de recursos y réplicas (deploy.resources y deploy.replicas) en entornos Swarm/Kubernetes.

9) Comandos útiles
- Ver métricas de Fluent Bit en vivo (cada 2s) desde PowerShell (opcional):
```powershell
while ($true) { curl http://localhost:2020 ; Start-Sleep -Seconds 2 }
```
- Reiniciar solo el procesador directo:
```bat
docker-compose restart direct-log-processor
```
- Reconstruir imágenes de logs:
```bat
docker-compose build fluent-bit direct-log-processor
```
- Detener y limpiar (datos volátiles):
```bat
docker-compose down
```

Referencias
- msvc-logs/README.md (visión general y pruebas)
- msvc-logs/fluent-bit.conf (config de ingesta)
- docs/AGREGAR-SERVICIO-LOGS.md (cómo integrar nuevos servicios)
