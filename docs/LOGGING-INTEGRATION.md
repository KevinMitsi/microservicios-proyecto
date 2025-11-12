# Integración de Logging Centralizado en Microservicios

Este documento describe cómo se ha integrado el sistema de logging centralizado en todos los microservicios del proyecto.

## 🎯 Arquitectura de Logging

```
Microservicio → RabbitMQ (log_queue) → Direct Log Processor → FluentBit → OpenSearch
                                                                    ↓
                                                            OpenSearch Dashboards
```

Todos los microservicios envían logs a RabbitMQ en formato JSON estructurado, que luego son procesados y enviados a OpenSearch para su análisis y visualización.

## 📊 Formato de Log Estándar

Todos los logs siguen este formato JSON:

```json
{
  "service": "nombre-del-servicio",
  "level": "info|warn|error|debug",
  "message": "Mensaje del log",
  "meta": {
    "campo1": "valor1",
    "campo2": "valor2"
  },
  "timestamp": "2025-11-11T10:30:00.000Z"
}
```

## 🔧 Configuración por Microservicio

### msvc-gateway (Node.js/TypeScript)

**Archivo:** `msvc-gateway/src/services/logger.service.ts`

**Uso:**
```typescript
import { logger } from './services/logger.service.js';

// Log básico
logger.info('Gateway iniciado');

// Log con metadata
logger.info('Usuario autenticado', {
  userId: '123',
  method: 'JWT'
});

// Log de error
logger.error('Error al procesar request', error);

// Log de warning
logger.warn('Rate limit alcanzado', { ip: '192.168.1.1' });
```

**Variables de entorno requeridas:**
- `RABBITMQ_URL`: URL de conexión a RabbitMQ (default: `amqp://admin:admin@rabbitmq:5672`)
- `SERVICE_NAME`: Nombre del servicio (default: `msvc-gateway`)
- `RABBITMQ_LOG_QUEUE`: Nombre de la cola de logs (default: `log_queue`)

### msvc-notifications (Node.js/TypeScript)

**Archivo:** `msvc-notifications/src/config/logger.ts`

**Uso:**
```typescript
import { logger } from './config/logger.js';

// Los mismos métodos que msvc-gateway
logger.info('Notificación enviada', {
  userId: '456',
  type: 'email'
});

logger.error('Error al enviar email', {
  error: err.message,
  recipient: 'user@example.com'
});
```

**Variables de entorno requeridas:**
- `RABBITMQ_URL`: URL de conexión a RabbitMQ
- `SERVICE_NAME`: Nombre del servicio (default: `msvc-notifications`)
- `RABBITMQ_LOG_QUEUE`: Nombre de la cola de logs (default: `log_queue`)

### msvc-profiles (Python/FastAPI)

**Archivo:** `msvc-profiles/logger.py`

**Uso:**
```python
from logger import logger, info, warning, error

# Usando el logger directamente
logger.info('Perfil creado')

# Usando las funciones helper con metadata
info('Usuario actualizado', meta={
    'userId': '789',
    'fields': ['name', 'email']
})

error('Error al conectar a MongoDB', meta={
    'error': str(e),
    'collection': 'profiles'
})

warning('Cache miss', meta={
    'key': 'user:123'
})
```

**Variables de entorno requeridas:**
- `RABBITMQ_URL`: URL de conexión a RabbitMQ
- `SERVICE_NAME`: Nombre del servicio (default: `msvc-profiles`)
- `RABBITMQ_LOG_QUEUE`: Nombre de la cola de logs (default: `log_queue`)

### msvc-auth (Java/Spring Boot)

**Archivo:** `msvc-auth/src/main/java/com/proyecto/msvc_auth/util/RabbitMQLogger.java`

**Uso:**
```java
import com.proyecto.msvc_auth.util.RabbitMQLogger;

@RestController
@RequiredArgsConstructor
public class MyController {
    private final RabbitMQLogger rabbitMQLogger;
    
    public void myMethod() {
        // Log básico
        rabbitMQLogger.info("Usuario registrado");
        
        // Log con metadata
        Map<String, Object> meta = new HashMap<>();
        meta.put("userId", userId);
        meta.put("email", email);
        rabbitMQLogger.info("Login exitoso", meta);
        
        // Log de error
        rabbitMQLogger.error("Error al procesar request");
        
        // Log de error con excepción
        rabbitMQLogger.errorWithException("Error crítico", exception);
        
        // Log de warning
        rabbitMQLogger.warn("Token expirado", meta);
        
        // Log de debug
        rabbitMQLogger.debug("Debug info", meta);
    }
}
```

**Configuración en `application.yaml`:**
```yaml
spring:
  application:
    name: msvc-auth
  rabbitmq:
    host: ${RABBITMQ_HOST:localhost}
    port: ${RABBITMQ_PORT:5672}
    username: ${RABBITMQ_USER:admin}
    password: ${RABBITMQ_PASS:admin}

rabbitmq:
  log:
    queue: ${RABBITMQ_LOG_QUEUE:log_queue}
```

## 🚀 Variables de Entorno en Docker Compose

Todas estas variables ya están configuradas en `docker-compose.yaml`:

```yaml
# msvc-gateway
environment:
  - RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
  - SERVICE_NAME=msvc-gateway

# msvc-notifications
environment:
  - RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
  - SERVICE_NAME=msvc-notifications

# msvc-profiles
environment:
  - RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
  - SERVICE_NAME=msvc-profiles

# msvc-auth (usa la configuración de spring.rabbitmq)
environment:
  - RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
```

## 📈 Visualización de Logs

### OpenSearch Dashboards

Accede a: `http://localhost:5601`

Los logs están indexados en: `logs-YYYY.MM.DD`

**Queries útiles:**
```
# Todos los logs de un servicio
service: "msvc-auth"

# Logs de error
level: "error"

# Logs de un usuario específico
meta.userId: "123"

# Logs en un rango de tiempo
timestamp: [now-1h TO now]
```

### Métricas de FluentBit

Accede a: `http://localhost:2020/api/v1/metrics`

Para ver estadísticas de procesamiento de logs.

## 🔍 Buenas Prácticas

### 1. Niveles de Log

- **DEBUG**: Información detallada para debugging (solo en desarrollo)
- **INFO**: Eventos normales del sistema (inicio, operaciones exitosas)
- **WARN**: Situaciones inusuales pero manejables (cache miss, rate limit)
- **ERROR**: Errores que requieren atención (fallos de BD, excepciones)

### 2. Metadata Útil

Siempre incluye contexto relevante:

```typescript
// ✅ Bueno
logger.info('Usuario autenticado', {
  userId: user.id,
  method: 'JWT',
  ip: req.ip
});

// ❌ Malo
logger.info('Login');
```

### 3. Información Sensible

**NUNCA** loguear:
- Contraseñas
- Tokens completos (solo primeros/últimos caracteres)
- Información de tarjetas de crédito
- Datos personales sensibles (sin anonimizar)

```typescript
// ✅ Bueno
logger.info('Token generado', {
  tokenPrefix: token.substring(0, 10) + '...'
});

// ❌ Malo
logger.info('Token generado', {
  token: fullToken
});
```

### 4. Performance

Los loggers son asíncronos y no bloquean la aplicación. Sin embargo:

- No loguear en loops intensivos
- Usar nivel DEBUG solo en desarrollo
- Evitar objetos muy grandes en metadata

## 🐛 Troubleshooting

### Los logs no aparecen en OpenSearch

1. Verificar que RabbitMQ está funcionando:
   ```bash
   docker logs rabbitmq
   ```

2. Verificar la cola de logs:
   - Acceder a RabbitMQ Management: `http://localhost:15672`
   - Usuario/Password: `admin/admin`
   - Ver si la cola `log_queue` tiene mensajes

3. Verificar FluentBit:
   ```bash
   docker logs fluent-bit
   ```

4. Verificar el procesador directo:
   ```bash
   docker logs direct-log-processor
   ```

### Conexión a RabbitMQ falla

Los loggers están diseñados para reintentar la conexión automáticamente cada 5 segundos. Verifica:

1. Que RabbitMQ esté corriendo
2. Que las credenciales sean correctas
3. Que la red Docker `microservices-net` esté configurada

### Logs duplicados

Si ves logs duplicados, verifica que:
- No tengas múltiples instancias del mismo servicio corriendo
- No estés enviando logs manualmente a RabbitMQ Y usando el logger

## 📚 Referencias

- [Documentación de FluentBit](https://docs.fluentbit.io/)
- [OpenSearch Dashboards](https://opensearch.org/docs/latest/dashboards/)
- [RabbitMQ Management](https://www.rabbitmq.com/management.html)
- [Guía de configuración](./AGREGAR-SERVICIO-LOGS.md)

