# msvc-profiles

Microservicio de gestión de perfiles de usuario construido con FastAPI, MongoDB y RabbitMQ.

## 📁 Estructura del Proyecto

```
msvc-profiles/
├── app/
│   ├── api/                    # Endpoints y routers
│   │   ├── __init__.py
│   │   ├── health.py          # Health checks
│   │   └── profiles.py        # CRUD de perfiles
│   ├── core/                   # Configuración central
│   │   ├── __init__.py
│   │   ├── config.py          # Variables de entorno
│   │   └── security.py        # Autenticación JWT
│   ├── database/               # Conexiones a BD
│   │   ├── __init__.py
│   │   └── mongodb.py         # Conexión MongoDB
│   ├── models/                 # Modelos de datos
│   │   ├── __init__.py
│   │   ├── profile.py         # Modelo de perfil
│   │   ├── schemas.py         # Esquemas de request
│   │   └── responses.py       # Esquemas de response
│   ├── services/               # Lógica de negocio
│   │   ├── __init__.py
│   │   ├── profile_service.py # Servicio de perfiles
│   │   └── rabbitmq_service.py # Mensajería
│   └── __init__.py
├── tests/                      # Tests unitarios
├── main.py                     # Aplicación principal
├── config.py                   # Wrapper de compatibilidad
├── requirements.txt            # Dependencias
├── Dockerfile                  # Imagen Docker
├── .env.example               # Ejemplo de configuración
└── README.md                   # Documentación

```

## ✨ Características

- **Gestión de Perfiles**: CRUD completo para perfiles de usuario
- **Autenticación JWT**: Integración con msvc-auth
- **MongoDB**: Base de datos NoSQL para perfiles
- **RabbitMQ**: Mensajería asíncrona entre microservicios
- **Health Checks**: Endpoints para liveness y readiness probes
- **Arquitectura Modular**: Código organizado en capas

## 🎯 Funcionalidades del Perfil

Cada usuario autenticado puede gestionar:

- ✅ **Nickname** (apodo personalizado)
- ✅ **URL de página personal**
- ✅ **Privacidad de contacto** (público/privado)
- ✅ **Dirección de correspondencia**
- ✅ **Biografía**
- ✅ **Organización**
- ✅ **País de residencia**
- ✅ **Links de redes sociales** (Twitter, LinkedIn, GitHub, Facebook, Instagram, Website)

## 📡 Endpoints API

### Health Checks
- `GET /health` - Estado general del servicio
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe (verifica MongoDB y RabbitMQ)

### Profiles
- `POST /api/profiles` - Crear perfil (requiere autenticación)
- `GET /api/profiles/me` - Obtener mi perfil (requiere autenticación)
- `PUT /api/profiles/me` - Actualizar mi perfil (requiere autenticación)
- `DELETE /api/profiles/me` - Eliminar mi perfil (requiere autenticación)
- `GET /api/profiles/{user_id}` - Obtener perfil por ID (público)
- `GET /api/profiles` - Listar todos los perfiles (paginado)

## 🔄 Eventos RabbitMQ

### Exchange
- **Nombre**: `microservices.events`
- **Tipo**: `topic`

### Queue
- **Nombre**: `profiles.queue`
- **Routing Keys**: `profile.*`, `user.*`

### Eventos Consumidos
- `USER_REGISTERED` - Crea un perfil básico cuando se registra un usuario

### Eventos Publicados
- `PROFILE_CREATED` (routing key: `profile.created`)
- `PROFILE_UPDATED` (routing key: `profile.updated`)
- `PROFILE_DELETED` (routing key: `profile.deleted`)

## 🚀 Instalación y Ejecución

### Con Docker Compose

```bash
# Desde la raíz del proyecto
docker-compose up msvc-profiles
```

### Local (Desarrollo)

1. Instalar dependencias:
```bash
pip install -r requirements.txt
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus valores
```

3. Ejecutar la aplicación:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## ⚙️ Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `MONGO_URL` | URL de conexión a MongoDB | `mongodb://profilesuser:profilespass@localhost:27018/profilesdb?authSource=admin` |
| `DATABASE_NAME` | Nombre de la base de datos | `profilesdb` |
| `RABBITMQ_URL` | URL de conexión a RabbitMQ | `amqp://admin:admin@localhost:5672` |
| `RABBITMQ_EXCHANGE` | Nombre del exchange | `microservices.events` |
| `RABBITMQ_QUEUE` | Nombre de la cola | `profiles.queue` |
| `JWT_SECRET` | Secret para validar JWT | (debe coincidir con msvc-auth) |
| `JWT_ALGORITHM` | Algoritmo JWT | `HS256` |
| `JWT_ISSUER` | Emisor del JWT | `msvc-auth` |

## 📚 Documentación API

Una vez ejecutado el servicio, accede a:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🧪 Ejemplo de Uso

### 1. Autenticarse en msvc-auth

```bash
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"usuario","password":"contraseña"}'
```

### 2. Crear/Actualizar Perfil

```bash
curl -X POST http://localhost:8000/api/profiles \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "Johnny",
    "personal_page_url": "https://johndoe.com",
    "is_contact_public": true,
    "biography": "Software developer passionate about microservices",
    "organization": "Tech Corp",
    "country": "USA",
    "social_links": {
      "github": "https://github.com/johndoe",
      "linkedin": "https://linkedin.com/in/johndoe"
    }
  }'
```

### 3. Obtener Mi Perfil

```bash
curl -X GET http://localhost:8000/api/profiles/me \
  -H "Authorization: Bearer {token}"
```

## 📦 Dependencias Principales

- **FastAPI**: Framework web moderno y rápido
- **Uvicorn**: Servidor ASGI
- **Motor**: Driver async de MongoDB
- **Pika**: Cliente de RabbitMQ
- **python-jose**: Manejo de JWT
- **Pydantic**: Validación de datos

## 🏗️ Arquitectura

```
┌─────────────────┐
│   msvc-auth     │ ──► Publica: USER_REGISTERED
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   RabbitMQ      │
│   Exchange      │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ msvc-profiles   │ ──► Consume: USER_REGISTERED
│                 │ ──► Publica: PROFILE_CREATED/UPDATED/DELETED
└─────────────────┘
         │
         ▼
┌─────────────────┐
│    MongoDB      │
└─────────────────┘
```

## 📝 Licencia

MIT

