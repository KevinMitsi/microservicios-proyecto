# Arquitectura del Microservicio msvc-profiles

## 📐 Diseño de la Arquitectura

### Patrón de Capas

El microservicio sigue una arquitectura de capas bien definida:

```
┌─────────────────────────────────────┐
│         API Layer (FastAPI)         │  ← Endpoints HTTP
├─────────────────────────────────────┤
│       Services Layer (Business)     │  ← Lógica de negocio
├─────────────────────────────────────┤
│      Database Layer (MongoDB)       │  ← Persistencia
├─────────────────────────────────────┤
│    Messaging Layer (RabbitMQ)       │  ← Comunicación async
└─────────────────────────────────────┘
```

## 📂 Estructura de Carpetas Explicada

### `/app/api/`
**Capa de Presentación** - Maneja las peticiones HTTP

- `health.py`: Endpoints de health checks (live, ready)
- `profiles.py`: Endpoints CRUD de perfiles de usuario

### `/app/core/`
**Configuración Central** - Configuración compartida

- `config.py`: Variables de entorno y configuración global
- `security.py`: Autenticación y validación de JWT

### `/app/database/`
**Capa de Persistencia** - Conexiones a bases de datos

- `mongodb.py`: Conexión asíncrona a MongoDB con Motor

### `/app/models/`
**Modelos de Datos** - Esquemas Pydantic

- `profile.py`: Modelo de dominio del perfil de usuario
- `schemas.py`: DTOs para requests (create, update)
- `responses.py`: DTOs para responses

### `/app/services/`
**Capa de Negocio** - Lógica de aplicación

- `profile_service.py`: Operaciones CRUD y lógica de perfiles
- `rabbitmq_service.py`: Publicación/consumo de eventos

### `/tests/`
**Pruebas** - Tests unitarios e integración

## 🔄 Flujo de Datos

### 1. Crear Perfil

```
Cliente
  │
  ├─► POST /api/profiles (con JWT)
  │
  ▼
API Layer (profiles.py)
  │
  ├─► Valida JWT (security.py)
  ├─► Valida datos (ProfileCreateRequest)
  │
  ▼
Service Layer (profile_service.py)
  │
  ├─► Crea documento en MongoDB
  ├─► Publica evento PROFILE_CREATED a RabbitMQ
  │
  ▼
Database Layer
  │
  └─► MongoDB: collection.profiles.insert_one()
```

### 2. Consumir Evento USER_REGISTERED

```
msvc-auth
  │
  ├─► Publica: USER_REGISTERED
  │
  ▼
RabbitMQ (exchange: microservices.events)
  │
  ├─► Routing key: user.registered
  │
  ▼
msvc-profiles (Consumer Thread)
  │
  ├─► Recibe evento en cola: profiles.queue
  │
  ▼
Service Layer
  │
  ├─► Crea perfil básico automáticamente
  │
  ▼
MongoDB
  │
  └─► Inserta perfil inicial
```

## 🔐 Seguridad

### Autenticación JWT

1. El cliente obtiene un token JWT de `msvc-auth`
2. Incluye el token en el header: `Authorization: Bearer <token>`
3. `security.py` valida el token usando el mismo secret que `msvc-auth`
4. Extrae `user_id` y `username` del payload
5. Los endpoints protegidos reciben los datos del usuario autenticado

### Validación de Datos

- **Pydantic Models**: Validación automática de tipos y formatos
- **Field Validators**: Restricciones en campos específicos
- **HTTP Status Codes**: Respuestas semánticas (400, 401, 404, 500)

## 📨 Comunicación Asíncrona

### RabbitMQ Topic Exchange

```
microservices.events (exchange)
    │
    ├─► profile.created ──► notifications
    ├─► profile.updated ──► notifications
    ├─► profile.deleted ──► notifications
    │
    └─► user.* ──► profiles.queue (consumed)
```

### Formato de Eventos

```json
{
  "type": "PROFILE_CREATED",
  "eventType": "PROFILE_CREATED",
  "userId": "123",
  "username": "johndoe",
  "timestamp": "2025-11-03T00:00:00Z",
  "data": {
    "nickname": "Johnny",
    "organization": "Tech Corp",
    "country": "USA"
  }
}
```

## 🗄️ Modelo de Datos MongoDB

### Collection: `profiles`

```javascript
{
  _id: ObjectId("..."),
  user_id: "123",                    // Index: unique
  username: "johndoe",
  nickname: "Johnny",
  personal_page_url: "https://...",
  is_contact_public: true,
  mailing_address: "123 Main St...",
  biography: "Software developer...",
  organization: "Tech Corp",
  country: "USA",
  social_links: {
    twitter: "https://...",
    linkedin: "https://...",
    github: "https://...",
    facebook: null,
    instagram: null,
    website: null
  },
  created_at: ISODate("2025-11-03T00:00:00Z"),
  updated_at: ISODate("2025-11-03T00:00:00Z")
}
```

### Índices

- `user_id`: UNIQUE - Un perfil por usuario
- Permite búsqueda eficiente por `user_id`

## 🚀 Ciclo de Vida de la Aplicación

### Startup (lifespan context)

1. **Conexión a MongoDB**
   - Conecta a la base de datos
   - Crea índices si no existen
   - Valida conexión con `ping`

2. **Conexión a RabbitMQ**
   - Conecta al broker
   - Declara exchange y queue
   - Hace binding de routing keys

3. **Inicia Consumer Thread**
   - Thread daemon para escuchar eventos
   - Procesa mensajes de forma asíncrona

### Shutdown

1. Cierra conexión a MongoDB
2. Cierra conexión a RabbitMQ
3. Limpia recursos

## 🎯 Principios de Diseño

### SOLID

- **Single Responsibility**: Cada módulo tiene una responsabilidad única
- **Open/Closed**: Fácil agregar nuevos endpoints sin modificar existentes
- **Dependency Inversion**: Dependencias inyectadas (FastAPI Depends)

### Clean Architecture

- **Independencia de Frameworks**: Lógica de negocio separada de FastAPI
- **Testeable**: Servicios pueden probarse sin API
- **Independencia de BD**: MongoDB puede reemplazarse fácilmente

### Microservicios

- **Autonomía**: Servicio independiente con su propia BD
- **Comunicación Asíncrona**: Eventos para bajo acoplamiento
- **Escalabilidad**: Puede escalar horizontalmente

## 🔧 Mantenibilidad

### Logging

```python
logger.info("✅ Success message")
logger.error("❌ Error message")
logger.warning("⚠️ Warning message")
```

### Health Checks

- `/health/live`: ¿Está vivo el proceso?
- `/health/ready`: ¿Están disponibles las dependencias?

### Documentación Automática

- Swagger UI: `/docs`
- ReDoc: `/redoc`
- OpenAPI Schema: `/openapi.json`

## 🧪 Testing (Futuro)

```
tests/
├── unit/
│   ├── test_profile_service.py
│   └── test_models.py
├── integration/
│   ├── test_mongodb.py
│   └── test_rabbitmq.py
└── e2e/
    └── test_api.py
```

## 📊 Métricas y Monitoreo (Futuro)

- Prometheus metrics endpoint
- Request duration
- Error rates
- Database connection pool
- RabbitMQ queue size

## 🔄 CI/CD (Futuro con Jenkins)

```
Pipeline:
1. Build Docker image
2. Run tests
3. Push to registry
4. Deploy to staging
5. Run E2E tests
6. Deploy to production
```

