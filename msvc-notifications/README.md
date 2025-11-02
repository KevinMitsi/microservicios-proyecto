# Microservicio de Notificaciones

Microservicio de notificaciones desarrollado con Node.js, Express, TypeScript, Redis y RabbitMQ. Este servicio es el centro de comunicación entre microservicios, procesando eventos de RabbitMQ y gestionando notificaciones para usuarios.

## 🏗️ Arquitectura

```
msvc-notifications/
├── src/
│   ├── config/           # Configuración y conexiones
│   │   ├── config.ts     # Variables de entorno
│   │   ├── database.ts   # Conexión a Redis
│   │   └── rabbitmq.ts   # Conexión a RabbitMQ
│   ├── controllers/      # Controladores de rutas
│   │   └── NotificationController.ts
│   ├── interfaces/       # Tipos e interfaces TypeScript
│   │   ├── Notification.ts
│   │   └── UserProfile.ts
│   ├── routes/          # Definición de rutas
│   │   ├── notificationRoutes.ts
│   │   └── healthRoutes.ts
│   ├── services/        # Lógica de negocio
│   │   ├── NotificationService.ts
│   │   ├── RedisService.ts
│   │   └── MessageBrokerService.ts
│   └── index.ts         # Punto de entrada
├── .env                 # Variables de entorno
├── .env.example         # Ejemplo de variables
├── package.json
└── tsconfig.json
```

## 🚀 Características

- **Gestión de Notificaciones**: Crear, leer, actualizar y eliminar notificaciones
- **Redis**: Almacenamiento temporal de notificaciones con TTL de 30 días
- **RabbitMQ**: Consumo de eventos de otros microservicios
- **Exchange Topic**: Escucha eventos con patrones: `user.*`, `profile.*`, `auth.*`, `system.*`
- **Health Checks**: Endpoints de salud para monitoreo
- **Reconexión Automática**: Manejo de desconexiones de Redis y RabbitMQ
- **TypeScript**: Código tipado y seguro
- **Graceful Shutdown**: Cierre ordenado de conexiones

## 📋 Requisitos

- Node.js 18+
- Redis 7+
- RabbitMQ 3+

## 🔧 Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
PORT=3002
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://admin:admin@localhost:5672
NODE_ENV=development
```

3. Compilar TypeScript:
```bash
npm run build
```

## 🏃 Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm run build
npm start
```

### Con Docker Compose
```bash
docker-compose up msvc-notifications
```

## 📡 API Endpoints

### Notificaciones

#### Obtener todas las notificaciones de un usuario
```http
GET /api/notifications/:userId?limit=50
```

#### Obtener notificaciones no leídas
```http
GET /api/notifications/:userId/unread
```

#### Contar notificaciones no leídas
```http
GET /api/notifications/:userId/count
```

#### Marcar notificación como leída
```http
PUT /api/notifications/:notificationId/read
```

#### Marcar todas como leídas
```http
PUT /api/notifications/:userId/read-all
```

#### Eliminar notificación
```http
DELETE /api/notifications/:notificationId
Body: { "userId": "user-id" }
```

#### Crear notificación de prueba
```http
POST /api/notifications/test
Body: {
  "userId": "user-id",
  "type": "user.created",
  "title": "Test",
  "message": "Test message",
  "data": {}
}
```

### Health Checks

```http
GET /health          # Estado general
GET /health/ready    # Listo para tráfico
GET /health/live     # Servicio vivo
```

## 🐰 Eventos de RabbitMQ

El servicio consume eventos del exchange `microservices.events` con los siguientes tipos:

### Tipos de Eventos
- `user.created` - Usuario creado
- `user.updated` - Usuario actualizado
- `user.deleted` - Usuario eliminado
- `profile.created` - Perfil creado
- `profile.updated` - Perfil actualizado
- `profile.deleted` - Perfil eliminado
- `auth.login` - Inicio de sesión
- `auth.logout` - Cierre de sesión
- `system.alert` - Alerta del sistema
- `custom` - Notificación personalizada

### Formato de Evento
```json
{
  "type": "user.created",
  "userId": "user-id",
  "data": {},
  "timestamp": "2025-11-02T00:00:00.000Z"
}
```

## 💾 Almacenamiento en Redis

### Estructura de Claves
- `notification:{id}` - Notificación individual
- `user:notifications:{userId}` - Lista de IDs de notificaciones del usuario

### TTL
- Notificaciones: 30 días
- Listas de usuarios: 30 días

## 🔄 Flujo de Datos

1. **Eventos entrantes**: Otros microservicios publican eventos a RabbitMQ
2. **Consumo**: MessageBrokerService consume eventos de la cola
3. **Procesamiento**: NotificationService procesa eventos y crea notificaciones
4. **Almacenamiento**: RedisService guarda notificaciones en Redis
5. **Consulta**: API REST permite consultar notificaciones

## 🧪 Testing

### Publicar evento de prueba a RabbitMQ

Puedes usar la API REST para crear notificaciones de prueba:

```bash
curl -X POST http://localhost:3002/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "type": "user.created",
    "title": "¡Bienvenido!",
    "message": "Tu cuenta ha sido creada"
  }'
```

## 📊 Monitoreo

El servicio incluye logs detallados con emojis para facilitar el seguimiento:

- ✅ Operaciones exitosas
- ❌ Errores
- 🔄 Conexiones en progreso
- 📬 Notificaciones creadas
- 📨 Eventos recibidos
- 🎧 Escuchando mensajes

## 🐳 Docker

### Variables de entorno en Docker Compose
```yaml
environment:
  - REDIS_URL=redis://db-notifications:6379
  - RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
```

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3002

CMD ["npm", "start"]
```

## 🛠️ Tecnologías

- **Node.js** - Runtime
- **Express** - Framework web
- **TypeScript** - Lenguaje tipado
- **Redis** - Base de datos en memoria
- **RabbitMQ (amqplib)** - Message broker
- **dotenv** - Variables de entorno

## 📝 Notas de Desarrollo

- El servicio implementa reconexión automática para Redis y RabbitMQ
- Los mensajes de RabbitMQ usan confirmación manual (no auto-ack)
- El prefetch está configurado en 1 para procesar mensajes de uno en uno
- El exchange es de tipo "topic" para routing flexible
- Las notificaciones expiran automáticamente después de 30 días

## 🤝 Integración con otros microservicios

### msvc-auth (Spring Boot)
Publica eventos: `auth.login`, `auth.logout`, `user.created`, `user.updated`, `user.deleted`

### msvc-profiles (FastAPI)
Publica eventos: `profile.created`, `profile.updated`, `profile.deleted`

### api-gateway (NestJS)
Consume la API REST de notificaciones

## 📄 Licencia

ISC
