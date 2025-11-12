# API Gateway - Microservices

API Gateway para el ecosistema de microservicios. Proporciona un punto de entrada unificado para todos los servicios backend.

## 🚀 Características

- **Proxy Inteligente**: Enruta peticiones a los microservicios correspondientes
- **JWT Pass-through**: Reenvía automáticamente tokens de autenticación a servicios protegidos
- **Health Checks**: Monitoreo de salud del gateway y servicios
- **CORS**: Configuración flexible de CORS
- **Logging**: Sistema de logging estructurado
- **TypeScript**: Completamente tipado
- **Docker**: Imagen optimizada con patrón builder
- **Testing**: Suite completa de pruebas con Jest

## 📋 Servicios Disponibles

| Servicio | Path | Puerto | Tecnología |
|----------|------|--------|------------|
| Auth | `/api/auth/**` | 8081 | Spring Boot |
| Profiles | `/api/profiles/**` | 8082 | Python |
| Notifications | `/api/notifications/**` | 4000 | Express |

## 🛠️ Instalación

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Modo desarrollo
npm run dev

# Build
npm run build

# Producción
npm start
```

### Docker

```bash
# Construir imagen
docker build -t msvc-gateway .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env msvc-gateway
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Cobertura de código
npm test -- --coverage
```

## 📝 Variables de Entorno

```env
PORT=3000
NODE_ENV=development

MSVC_AUTH_URL=http://msvc-auth:8081
MSVC_PROFILES_URL=http://msvc-profiles:8082
MSVC_NOTIFICATIONS_URL=http://msvc-notifications:4000

ALLOWED_ORIGINS=*
LOG_LEVEL=info
```

## 🔍 Endpoints del Gateway

### Información
- `GET /` - Información del gateway y servicios

### Health Checks
- `GET /health` - Estado completo del gateway
- `GET /health/live` - Liveness probe (Kubernetes)
- `GET /health/ready` - Readiness probe (Kubernetes)

### Proxy
- `/**/api/auth/**` - Proxy a msvc-auth
- `/**/api/profiles/**` - Proxy a msvc-profiles
- `/**/api/notifications/**` - Proxy a msvc-notifications

## 🔐 Autenticación

El gateway soporta rutas protegidas con JWT (Bearer tokens). Los tokens se pasan automáticamente a los microservicios.

### Flujo de autenticación:

1. **Obtener token**:
```bash
curl -X POST http://localhost:8083/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user123","password":"password"}'
```

2. **Usar token en peticiones protegidas**:
```bash
curl -X GET http://localhost:8083/api/auth/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

El gateway automáticamente:
- Detecta el header `Authorization`
- Lo reenvía al microservicio correspondiente
- El microservicio valida el token con Spring Security

### Rutas protegidas en msvc-auth:
- `GET /api/auth/users` - Obtener todos los usuarios (requiere autenticación)
- `GET /api/auth/users/{id}` - Obtener usuario por ID (requiere autenticación)
- `PUT /api/auth/users/{id}` - Actualizar usuario (requiere autenticación)
- `DELETE /api/auth/users/{id}` - Eliminar usuario (requiere autenticación)

### Rutas públicas:
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/password/recover` - Recuperación de contraseña

## 🏗️ Arquitectura

```
src/
├── controllers/       # Controladores de rutas
├── models/           # Interfaces y tipos
├── routes/           # Definición de rutas
├── services/         # Lógica de negocio
├── middlewares/      # Middlewares de Express
├── __tests__/        # Tests unitarios e integración
├── app.ts            # Configuración de Express
└── index.ts          # Punto de entrada
```

## 🐳 Docker Multi-Stage Build

El Dockerfile utiliza el patrón builder para optimizar la imagen:

1. **Stage 1 (Builder)**: Instala dependencias y compila TypeScript
2. **Stage 2 (Production)**: Copia solo los archivos necesarios para producción

Ventajas:
- Imagen final más pequeña
- Aprovecha el caché de Docker
- No incluye dependencias de desarrollo
- Usuario no-root para seguridad

## 📊 Cobertura de Tests

Los tests cubren:
- ✅ Servicios (Config, Health, Logger, Proxy)
- ✅ Controladores (Health, Gateway)
- ✅ Integración de la aplicación
- ✅ Rutas y middlewares
- ✅ Manejo de errores

## 🔒 Seguridad

- Usuario no-root en Docker
- CORS configurable
- Timeouts en proxies
- Validación de headers
- Logging de todas las peticiones

## 📄 Licencia

ISC

## 👨‍💻 Autor

Proyecto de microservicios - Universidad 2025-2
