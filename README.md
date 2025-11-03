# Proyecto de Microservicios

Este proyecto implementa una arquitectura de microservicios con logging centralizado usando **FluentBit** como procesador de logs, incluyendo pruebas automatizadas completas para validar el funcionamiento del sistema.

## Arquitectura

- **msvc-auth**: Servicio de autenticación (Spring Boot + PostgreSQL)
- **msvc-profiles**: Servicio de perfiles (FastAPI + MongoDB)  
- **msvc-notifications**: Servicio de notificaciones (Node.js + Redis)
- **msvc-logs**: Sistema de logging centralizado (**FluentBit** + OpenSearch + RabbitMQ)

## 🚀 Pipeline de Logs Mejorado

### Arquitectura del Sistema de Logs:
```
Microservicios -> RabbitMQ -> Procesador Directo -> FluentBit -> OpenSearch
```

## Pruebas Automatizadas - Sistema de Logs

Se han implementado pruebas automatizadas completas para el microservicio de logs que validan:

### ✅ Camino Feliz Validado

1. **Flujo de Autenticación**
   - Solicitud de autenticación recibida
   - Validación de credenciales
   - Generación de JWT token
   - Autenticación exitosa

2. **Flujo de Gestión de Perfiles**
   - Solicitud de actualización de perfil
   - Validación de datos
   - Actualización en MongoDB
   - Notificación enviada

3. **Flujo de Notificaciones**
   - Notificación programada
   - Procesamiento de notificación
   - Envío exitoso
   - Estado almacenado en cache

4. **Flujo de Error y Recuperación**
   - Error de conexión detectado
   - Reintentos automáticos
   - Conexión restablecida
   - Procesamiento de solicitudes pendientes

### 🧪 Tipos de Pruebas

- **Pruebas Unitarias**: Validación de configuraciones y archivos
- **Pruebas de Integración**: Verificación del pipeline completo de logs
- **Pruebas de Salud**: Monitoreo del estado de los servicios
- **Pruebas de Escenarios**: Simulación de flujos reales

### 📊 Transmisión de Logs Validada

Las pruebas verifican que:
- Los logs llegan correctamente desde RabbitMQ
- Logstash no está más en uso - ahora se usa FluentBit que es más eficiente
- OpenSearch almacena los logs con la estructura correcta
- Los índices se crean automáticamente con formato `logs-YYYY.MM.dd`
- Los metadatos complejos se preservan íntegramente

## Inicio Rápido

### Prerrequisitos
- Docker y Docker Compose
- Node.js (para ejecutar pruebas)

### 1. Iniciar Servicios
```bash
docker-compose up -d
```

### 2. Ejecutar Pruebas del Sistema de Logs
```bash
cd msvc-logs

# Instalar dependencias de prueba
npm install

# Ejecutar todas las pruebas
npm test

# Solo pruebas unitarias
npm run test:unit

# Solo pruebas de integración
npm run test:integration

# Con reporte de cobertura
npm run test:coverage
```

### 3. Scripts de Prueba

Para Windows:
```powershell
# PowerShell
.\scripts\run-tests.ps1 all

# Command Prompt
.\scripts\run-tests.bat all
```

Para Linux/Mac:
```bash
./scripts/run-tests.sh all
```

## Monitoreo

- **RabbitMQ Management**: http://localhost:15672 (admin/admin)
- **OpenSearch**: http://localhost:9200
- **OpenSearch Dashboards**: http://localhost:5601
- **FluentBit Métricas**: http://localhost:2020
- **Jenkins**: http://localhost:8080

## Servicios

| Servicio | Puerto | Base de Datos | Puerto BD |
|----------|--------|---------------|-----------|
| msvc-auth | 8081 | PostgreSQL | 5433 |
| msvc-profiles | 8000 | MongoDB | 27018 |
| msvc-notifications | 4000 | Redis | 6379 |
| RabbitMQ | 5672/15672 | - | - |
| OpenSearch | 9200 | - | - |
| FluentBit | 2020/9880 | - | - |

## Documentación Adicional

- [Sistema de Logging](msvc-logs/README.md): Documentación completa del sistema FluentBit
- [Pruebas Automatizadas](msvc-logs/README-TESTS.md): Guía detallada de pruebas  
- [Configuración FluentBit](msvc-logs/fluent-bit.conf): Pipeline de procesamiento de logs
- [CI/CD con Jenkins](docs/CI-CD.md): Pipeline y requisitos del agente
- [Agregar nuevos servicios al flujo de logs](docs/AGREGAR-SERVICIO-LOGS.md): Guía paso a paso
- [Docker Compose](docker-compose.yaml): Configuración completa de servicios

## CI/CD con Jenkins (local)

Para levantar Jenkins como parte de esta plataforma:

```bash
# Construir la imagen personalizada de Jenkins
docker compose build jenkins

# Iniciar Jenkins
docker compose up -d jenkins

# Leer la contraseña inicial
docker exec -it jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Luego vaya a `http://localhost:8080`, complete el onboarding y cree un Pipeline apuntando a este repo (detectar el `Jenkinsfile`). Más detalles en [docs/CI-CD.md](docs/CI-CD.md).
