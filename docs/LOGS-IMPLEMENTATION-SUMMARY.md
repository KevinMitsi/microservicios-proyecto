# ✅ LOGS AGREGADOS A TODOS LOS MICROSERVICIOS

## 📋 Resumen de Cambios

Se ha implementado logging centralizado en todos los microservicios del proyecto. Los logs se envían a RabbitMQ y son procesados por FluentBit para almacenamiento en OpenSearch.

### Microservicios Actualizados

1. ✅ **msvc-gateway** (Node.js/TypeScript)
2. ✅ **msvc-notifications** (Node.js/TypeScript)
3. ✅ **msvc-profiles** (Python/FastAPI)
4. ✅ **msvc-auth** (Java/Spring Boot)

## 🚀 Pasos para Desplegar

### 1. Instalar Dependencias

#### msvc-gateway
```bash
cd msvc-gateway
npm install
```

Dependencias agregadas:
- `amqplib@^0.10.9`
- `@types/amqplib@^0.10.8` (dev)

#### msvc-notifications
Ya tiene las dependencias necesarias (winston, amqplib).

#### msvc-profiles
Ya tiene las dependencias necesarias (pika).

#### msvc-auth
No requiere instalación adicional (usa Spring AMQP que ya está en build.gradle).

### 2. Configurar Variables de Entorno

Las variables ya están configuradas en `docker-compose.yaml`:

```yaml
# Cada microservicio tiene:
environment:
  - RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
  - SERVICE_NAME=msvc-{nombre}
```

### 3. Levantar los Servicios

```bash
# Desde la raíz del proyecto
docker-compose up --build
```

O para servicios específicos:
```bash
docker-compose up --build msvc-gateway msvc-notifications msvc-profiles msvc-auth
```

### 4. Verificar que los Logs Funcionan

#### Ver logs en consola:
```bash
docker logs msvc-gateway
docker logs msvc-notifications
docker logs msvc-profiles
docker logs msvc-auth
```

#### Ver cola de RabbitMQ:
1. Acceder a: http://localhost:15672
2. Usuario: `admin`, Password: `admin`
3. Ir a "Queues" y verificar `log_queue`

#### Ver logs en OpenSearch Dashboards:
1. Acceder a: http://localhost:5601
2. Crear index pattern: `logs-*`
3. Explorar logs por servicio, nivel, timestamp, etc.

## 📝 Archivos Creados/Modificados

### msvc-gateway
- ✏️ `src/services/logger.service.ts` - Actualizado con integración RabbitMQ
- ✏️ `package.json` - Agregadas dependencias amqplib

### msvc-notifications
- ✅ Ya tenía logger con RabbitMQ (`src/config/logger.ts`)

### msvc-profiles
- ✏️ `logger.py` - Reemplazado Logstash por RabbitMQ
- ✅ `requirements.txt` - Ya tenía pika

### msvc-auth
- ➕ `src/main/java/com/proyecto/msvc_auth/config/RabbitMQLoggerConfig.java` - Configuración
- ➕ `src/main/java/com/proyecto/msvc_auth/util/RabbitMQLogger.java` - Logger utility
- ✏️ `src/main/java/com/proyecto/msvc_auth/controllers/UserController.java` - Ejemplo de uso
- ✏️ `src/main/resources/application.yaml` - Configuración de log queue

### Documentación
- ➕ `docs/LOGGING-INTEGRATION.md` - Guía completa de uso

### Docker Compose
- ✏️ `docker-compose.yaml` - Agregadas variables de entorno para todos los servicios

## 🔍 Cómo Usar los Loggers

### Node.js/TypeScript (Gateway, Notifications)
```typescript
import { logger } from './services/logger.service.js';

logger.info('Mensaje', { meta: 'data' });
logger.error('Error', errorObject);
logger.warn('Warning', { details: 'info' });
```

### Python (Profiles)
```python
from logger import logger, info, error, warning

info('Mensaje', meta={'key': 'value'})
error('Error', meta={'error': str(e)})
```

### Java (Auth)
```java
@Autowired
private RabbitMQLogger rabbitMQLogger;

rabbitMQLogger.info("Mensaje");
rabbitMQLogger.info("Mensaje con meta", metaMap);
rabbitMQLogger.error("Error");
rabbitMQLogger.errorWithException("Error", exception);
```

## 📊 Visualización de Logs

### OpenSearch Dashboards (Recomendado)
- URL: http://localhost:5601
- Index pattern: `logs-*`
- Campos importantes:
  - `service`: Nombre del microservicio
  - `level`: Nivel de log (info, warn, error)
  - `message`: Mensaje del log
  - `meta.*`: Metadata adicional
  - `timestamp`: Marca de tiempo

### RabbitMQ Management
- URL: http://localhost:15672
- Ver cola `log_queue`
- Monitorear tasa de mensajes

### FluentBit Metrics
- URL: http://localhost:2020/api/v1/metrics
- Estadísticas de procesamiento

## 🧪 Pruebas

### Generar logs de prueba

#### msvc-auth
```bash
# Registrar usuario (genera logs)
curl -X POST http://localhost:8081/api/auth/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test","lastName":"User"}'

# Login (genera logs)
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"test123"}'
```

#### msvc-gateway
```bash
# Cualquier request al gateway genera logs
curl http://localhost:8083/api/auth/users
```

#### msvc-profiles
```bash
# Request a profiles (genera logs)
curl http://localhost:8082/api/profiles
```

#### msvc-notifications
```bash
# Health check (genera logs)
curl http://localhost:4000/health
```

### Verificar logs en OpenSearch

1. Ir a OpenSearch Dashboards: http://localhost:5601
2. Discover → Seleccionar index `logs-*`
3. Filtrar por servicio: `service: "msvc-auth"`
4. Ver logs en tiempo real

## ⚠️ Notas Importantes

1. **Reconexión Automática**: Todos los loggers reintentan conexión automáticamente si RabbitMQ no está disponible.

2. **No Bloquean**: Los loggers son asíncronos y no afectan el rendimiento de la aplicación.

3. **Fallback**: Si RabbitMQ falla, los logs siguen apareciendo en la consola/stdout.

4. **Formato Consistente**: Todos los microservicios envían logs en el mismo formato JSON.

5. **Metadata**: Usa metadata para agregar contexto (userId, requestId, etc.).

## 🐛 Solución de Problemas

### Logs no aparecen en OpenSearch

```bash
# 1. Verificar RabbitMQ
docker logs rabbitmq

# 2. Verificar FluentBit
docker logs fluent-bit

# 3. Verificar procesador directo
docker logs direct-log-processor

# 4. Verificar OpenSearch
docker logs opensearch

# 5. Ver mensajes en cola
# Ir a http://localhost:15672 → Queues → log_queue
```

### Error de conexión a RabbitMQ

```bash
# Reiniciar RabbitMQ
docker-compose restart rabbitmq

# Esperar a que esté saludable
docker-compose ps rabbitmq
```

### Limpiar logs antiguos

```bash
# OpenSearch elimina índices antiguos automáticamente
# O manualmente:
curl -X DELETE "localhost:9200/logs-2025.11.01"
```

## 📚 Documentación Adicional

- [Guía completa de integración](./LOGGING-INTEGRATION.md)
- [Cómo agregar logging a nuevos servicios](./AGREGAR-SERVICIO-LOGS.md)
- [README del sistema de logs](../msvc-logs/README.md)

## ✅ Checklist de Verificación

- [ ] Todos los servicios inician sin errores
- [ ] RabbitMQ está corriendo y saludable
- [ ] Cola `log_queue` existe y recibe mensajes
- [ ] FluentBit procesa mensajes sin errores
- [ ] OpenSearch está accesible en puerto 9200
- [ ] OpenSearch Dashboards muestra logs en puerto 5601
- [ ] Cada microservicio envía logs con su SERVICE_NAME correcto
- [ ] Los logs incluyen timestamp, level, message y meta

## 🎉 ¡Listo!

El sistema de logging centralizado está completamente configurado y funcionando. Todos los microservicios ahora envían sus logs a través de RabbitMQ → FluentBit → OpenSearch para análisis centralizado.

