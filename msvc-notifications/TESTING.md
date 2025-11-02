# Guía de Pruebas - msvc-notifications

Este documento contiene ejemplos de cómo probar el microservicio de notificaciones.

## 🚀 Iniciar Servicios

### Opción 1: Con Docker Compose (Recomendado)
```bash
docker-compose up rabbitmq db-notifications msvc-notifications
```

### Opción 2: Localmente
```bash
# Terminal 1: Iniciar Redis
docker run -d -p 6379:6379 redis:7

# Terminal 2: Iniciar RabbitMQ
docker run -d -p 5672:5672 -p 15672:15672 -e RABBITMQ_DEFAULT_USER=admin -e RABBITMQ_DEFAULT_PASS=admin rabbitmq:3-management

# Terminal 3: Iniciar el microservicio
npm run dev
```

## 📊 Verificar Estado del Servicio

### Health Check
```bash
curl http://localhost:3002/health
```

Respuesta esperada:
```json
{
  "service": "msvc-notifications",
  "status": "ok",
  "timestamp": "2025-11-02T...",
  "uptime": 123.456,
  "connections": {
    "redis": "connected",
    "rabbitmq": "connected"
  }
}
```

## 📬 API REST - Ejemplos

### 1. Crear una notificación de prueba
```bash
curl -X POST http://localhost:3002/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "type": "user.created",
    "title": "¡Bienvenido!",
    "message": "Tu cuenta ha sido creada exitosamente"
  }'
```

### 2. Obtener todas las notificaciones de un usuario
```bash
curl http://localhost:3002/api/notifications/user-123
```

### 3. Obtener notificaciones no leídas
```bash
curl http://localhost:3002/api/notifications/user-123/unread
```

### 4. Contar notificaciones no leídas
```bash
curl http://localhost:3002/api/notifications/user-123/count
```

### 5. Marcar una notificación como leída
```bash
# Primero obtén el ID de una notificación
NOTIFICATION_ID="<id-de-notificacion>"

curl -X PUT http://localhost:3002/api/notifications/$NOTIFICATION_ID/read
```

### 6. Marcar todas como leídas
```bash
curl -X PUT http://localhost:3002/api/notifications/user-123/read-all
```

### 7. Eliminar una notificación
```bash
NOTIFICATION_ID="<id-de-notificacion>"

curl -X DELETE http://localhost:3002/api/notifications/$NOTIFICATION_ID \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123"}'
```

## 🐰 Pruebas con RabbitMQ

### Opción 1: Usar RabbitMQ Management UI

1. Acceder a: http://localhost:15672
2. Login: `admin` / `admin`
3. Ir a "Exchanges" → `microservices.events`
4. Expandir "Publish message"
5. Configurar:
   - **Routing key**: `user.created` (o cualquier patrón: `user.*`, `profile.*`, `auth.*`)
   - **Payload**:
   ```json
   {
     "type": "user.created",
     "userId": "user-456",
     "data": {
       "username": "johndoe",
       "email": "john@example.com"
     },
     "timestamp": "2025-11-02T10:00:00.000Z"
   }
   ```
6. Click "Publish message"

### Opción 2: Usar Node.js Script

Crear archivo `test-publisher.js`:

```javascript
const amqp = require('amqplib');

async function publishTestEvent() {
  try {
    const connection = await amqp.connect('amqp://admin:admin@localhost:5672');
    const channel = await connection.createChannel();

    const exchange = 'microservices.events';
    await channel.assertExchange(exchange, 'topic', { durable: true });

    const event = {
      type: 'user.created',
      userId: 'user-789',
      data: {
        username: 'testuser',
        email: 'test@example.com'
      },
      timestamp: new Date().toISOString()
    };

    channel.publish(
      exchange,
      'user.created',
      Buffer.from(JSON.stringify(event)),
      { persistent: true }
    );

    console.log('✅ Event published:', event);

    setTimeout(() => {
      channel.close();
      connection.close();
    }, 500);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

publishTestEvent();
```

Ejecutar:
```bash
node test-publisher.js
```

### Opción 3: Usar curl con RabbitMQ HTTP API

```bash
curl -X POST http://localhost:15672/api/exchanges/%2F/microservices.events/publish \
  -u admin:admin \
  -H "Content-Type: application/json" \
  -d '{
    "properties": {
      "content_type": "application/json",
      "delivery_mode": 2
    },
    "routing_key": "user.created",
    "payload": "{\"type\":\"user.created\",\"userId\":\"user-999\",\"data\":{},\"timestamp\":\"2025-11-02T10:00:00.000Z\"}",
    "payload_encoding": "string"
  }'
```

## 🧪 Escenarios de Prueba Completos

### Escenario 1: Registro de Usuario
```bash
# 1. Publicar evento de usuario creado
curl -X POST http://localhost:15672/api/exchanges/%2F/microservices.events/publish \
  -u admin:admin \
  -H "Content-Type: application/json" \
  -d '{
    "routing_key": "user.created",
    "payload": "{\"type\":\"user.created\",\"userId\":\"user-001\",\"data\":{\"username\":\"johndoe\"},\"timestamp\":\"2025-11-02T10:00:00.000Z\"}",
    "properties": {"delivery_mode": 2}
  }'

# 2. Verificar que se creó la notificación
curl http://localhost:3002/api/notifications/user-001

# 3. Verificar contador de no leídas
curl http://localhost:3002/api/notifications/user-001/count
```

### Escenario 2: Actualización de Perfil
```bash
# 1. Publicar evento de perfil actualizado
curl -X POST http://localhost:3002/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-001",
    "type": "profile.updated",
    "title": "Perfil Actualizado",
    "message": "Tu perfil ha sido actualizado correctamente"
  }'

# 2. Verificar notificaciones no leídas
curl http://localhost:3002/api/notifications/user-001/unread

# 3. Marcar todas como leídas
curl -X PUT http://localhost:3002/api/notifications/user-001/read-all
```

### Escenario 3: Login del Usuario
```bash
# Publicar evento de login
curl -X POST http://localhost:3002/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-001",
    "type": "auth.login",
    "title": "Inicio de Sesión",
    "message": "Has iniciado sesión desde un nuevo dispositivo"
  }'
```

## 🔍 Verificar Logs

### Ver logs del microservicio
```bash
# Con Docker Compose
docker-compose logs -f msvc-notifications

# Localmente
# Los logs aparecerán en la terminal donde ejecutaste npm run dev
```

Buscar mensajes como:
- `✅ Redis Client Connected`
- `✅ RabbitMQ Connected`
- `🎧 Listening for messages on queue: notifications.queue`
- `📨 Received event: user.created for user: user-123`
- `📬 Notification created for user user-123: ¡Bienvenido!`

## 🗄️ Verificar Redis

### Conectarse a Redis
```bash
# Con Docker
docker exec -it db-notifications redis-cli

# Localmente
redis-cli
```

### Comandos útiles
```redis
# Ver todas las claves
KEYS *

# Ver notificaciones de un usuario
LRANGE user:notifications:user-123 0 -1

# Ver una notificación específica
GET notification:<notification-id>

# Ver TTL de una clave
TTL notification:<notification-id>
```

## 📈 Pruebas de Carga

### Crear múltiples notificaciones
```bash
# Bash script
for i in {1..10}; do
  curl -X POST http://localhost:3002/api/notifications/test \
    -H "Content-Type: application/json" \
    -d "{
      \"userId\": \"user-load-test\",
      \"type\": \"custom\",
      \"title\": \"Notificación #$i\",
      \"message\": \"Mensaje de prueba número $i\"
    }"
  echo ""
  sleep 0.5
done

# Verificar
curl http://localhost:3002/api/notifications/user-load-test
```

## 🐛 Troubleshooting

### El servicio no se conecta a Redis
```bash
# Verificar que Redis está corriendo
docker ps | grep redis

# Verificar logs de Redis
docker logs db-notifications

# Probar conexión
redis-cli ping
```

### El servicio no se conecta a RabbitMQ
```bash
# Verificar que RabbitMQ está corriendo
docker ps | grep rabbitmq

# Verificar logs
docker logs rabbitmq

# Acceder a Management UI
open http://localhost:15672
```

### Los eventos no se procesan
```bash
# Verificar que la cola existe
# En RabbitMQ Management UI → Queues
# Debe aparecer: notifications.queue

# Verificar bindings
# La cola debe estar bindeada a microservices.events con routing keys:
# - user.*
# - profile.*
# - auth.*
# - system.*

# Verificar logs del microservicio
docker-compose logs -f msvc-notifications
```

## 📊 Tipos de Eventos Soportados

| Routing Key | Tipo de Evento | Descripción |
|-------------|----------------|-------------|
| `user.created` | `user.created` | Usuario registrado |
| `user.updated` | `user.updated` | Usuario actualizado |
| `user.deleted` | `user.deleted` | Usuario eliminado |
| `profile.created` | `profile.created` | Perfil creado |
| `profile.updated` | `profile.updated` | Perfil actualizado |
| `profile.deleted` | `profile.deleted` | Perfil eliminado |
| `auth.login` | `auth.login` | Inicio de sesión |
| `auth.logout` | `auth.logout` | Cierre de sesión |
| `system.alert` | `system.alert` | Alerta del sistema |
| `custom.*` | `custom` | Notificación personalizada |

## 🎯 Casos de Uso de Integración

### Desde msvc-auth (Spring Boot)
Cuando un usuario se registra o inicia sesión, publicar:
```java
rabbitTemplate.convertAndSend("microservices.events", "user.created", event);
```

### Desde msvc-profiles (FastAPI)
Cuando se actualiza un perfil:
```python
channel.basic_publish(
    exchange='microservices.events',
    routing_key='profile.updated',
    body=json.dumps(event)
)
```

### Desde api-gateway (NestJS)
Consultar notificaciones:
```typescript
const response = await axios.get(`http://msvc-notifications:3002/api/notifications/${userId}`);
```
