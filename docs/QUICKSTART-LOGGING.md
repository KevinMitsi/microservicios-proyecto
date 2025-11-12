# 🚀 Inicio Rápido - Sistema de Logging

## Instalación de Dependencias

### 1. msvc-gateway (Node.js)

```bash
cd msvc-gateway
npm install
```

**Dependencias agregadas:**
- `amqplib` - Cliente de RabbitMQ
- `@types/amqplib` - Tipos TypeScript

### 2. msvc-notifications (Node.js)

Ya tiene todas las dependencias necesarias (`winston`, `amqplib`).

```bash
cd msvc-notifications
npm install
```

### 3. msvc-profiles (Python)

Ya tiene todas las dependencias necesarias (`pika`).

```bash
cd msvc-profiles
pip install -r requirements.txt
```

### 4. msvc-auth (Java)

No requiere instalación adicional. Spring AMQP ya está en `build.gradle`.

```bash
cd msvc-auth
./gradlew build
```

## Despliegue con Docker

### Opción 1: Desplegar Todo

```bash
# Desde la raíz del proyecto
docker-compose up --build
```

### Opción 2: Desplegar Solo Logging

```bash
# Infraestructura necesaria
docker-compose up -d rabbitmq opensearch opensearch-dashboards fluent-bit direct-log-processor

# Luego los microservicios
docker-compose up -d msvc-auth msvc-gateway msvc-profiles msvc-notifications
```

### Opción 3: Reconstruir un Servicio Específico

```bash
# Reconstruir solo msvc-gateway
docker-compose up --build -d msvc-gateway

# Ver logs en tiempo real
docker logs -f msvc-gateway
```

## Verificación Rápida

### 1. Verificar que todos los servicios estén corriendo

```bash
docker-compose ps
```

Deberías ver todos los servicios con estado "Up":
- rabbitmq
- opensearch
- opensearch-dashboards
- fluent-bit
- direct-log-processor
- msvc-auth
- msvc-gateway
- msvc-profiles
- msvc-notifications

### 2. Verificar RabbitMQ

```bash
# Acceder a RabbitMQ Management
# http://localhost:15672
# Usuario: admin
# Password: admin
```

Verificar que la cola `log_queue` exista.

### 3. Verificar OpenSearch

```bash
# Verificar que OpenSearch esté corriendo
curl http://localhost:9200

# Ver índices de logs
curl http://localhost:9200/_cat/indices?v
```

### 4. Generar Logs de Prueba

**Windows:**
```powershell
.\scripts\test-logging.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/test-logging.sh
./scripts/test-logging.sh
```

### 5. Ver Logs en OpenSearch Dashboards

1. Acceder a: http://localhost:5601
2. Ir a "Management" → "Index Patterns"
3. Crear index pattern: `logs-*`
4. Seleccionar campo de tiempo: `@timestamp`
5. Ir a "Discover" para ver los logs

## Solución de Problemas Comunes

### Problema: Servicios no se conectan a RabbitMQ

**Solución:**
```bash
# Verificar que RabbitMQ esté saludable
docker logs rabbitmq

# Reiniciar RabbitMQ
docker-compose restart rabbitmq

# Esperar unos segundos y reiniciar los servicios
docker-compose restart msvc-auth msvc-gateway msvc-profiles msvc-notifications
```

### Problema: Logs no aparecen en OpenSearch

**Solución:**
```bash
# 1. Verificar que los logs lleguen a RabbitMQ
# Acceder a http://localhost:15672 y ver la cola log_queue

# 2. Verificar FluentBit
docker logs fluent-bit

# 3. Verificar el procesador directo
docker logs direct-log-processor

# 4. Verificar OpenSearch
docker logs opensearch

# 5. Reiniciar el pipeline de logs
docker-compose restart fluent-bit direct-log-processor
```

### Problema: Puerto ya en uso

**Solución:**
```bash
# Ver qué está usando el puerto (ejemplo: 8081)
# Windows:
netstat -ano | findstr :8081

# Linux/Mac:
lsof -i :8081

# Cambiar el puerto en docker-compose.yaml o detener el proceso conflictivo
```

### Problema: Dependencias de Node.js desactualizadas

**Solución:**
```bash
cd msvc-gateway
rm -rf node_modules package-lock.json
npm install

cd ../msvc-notifications
rm -rf node_modules package-lock.json
npm install
```

## Comandos Útiles

### Ver logs de un servicio específico

```bash
# Ver logs en tiempo real
docker logs -f msvc-auth

# Ver últimas 100 líneas
docker logs --tail 100 msvc-gateway

# Ver logs con timestamp
docker logs -t msvc-profiles
```

### Reiniciar servicios

```bash
# Reiniciar un servicio
docker-compose restart msvc-auth

# Reiniciar todos los microservicios
docker-compose restart msvc-auth msvc-gateway msvc-profiles msvc-notifications

# Reiniciar solo infraestructura de logs
docker-compose restart rabbitmq fluent-bit direct-log-processor opensearch
```

### Limpiar y reconstruir

```bash
# Detener todo
docker-compose down

# Limpiar volúmenes (¡CUIDADO! Borra datos)
docker-compose down -v

# Reconstruir todo
docker-compose up --build
```

### Acceder a un contenedor

```bash
# Acceder a shell de un contenedor
docker exec -it msvc-auth bash

# Ejecutar comando en un contenedor
docker exec msvc-gateway npm --version
```

## Monitoreo

### URLs de Acceso

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| RabbitMQ Management | http://localhost:15672 | admin/admin |
| OpenSearch | http://localhost:9200 | - |
| OpenSearch Dashboards | http://localhost:5601 | - |
| FluentBit Metrics | http://localhost:2020 | - |
| msvc-auth | http://localhost:8081 | - |
| msvc-gateway | http://localhost:8083 | - |
| msvc-profiles | http://localhost:8082 | - |
| msvc-notifications | http://localhost:4000 | - |

### Health Checks

```bash
# msvc-auth
curl http://localhost:8081/actuator/health

# msvc-profiles
curl http://localhost:8082/health

# msvc-notifications
curl http://localhost:4000/health

# FluentBit
curl http://localhost:2020/api/v1/metrics
```

## Siguiente Paso

Una vez que todo esté funcionando:

1. ✅ Genera logs de prueba: `.\scripts\test-logging.ps1`
2. ✅ Verifica en OpenSearch Dashboards: http://localhost:5601
3. ✅ Lee la documentación completa: [docs/LOGGING-INTEGRATION.md](../docs/LOGGING-INTEGRATION.md)
4. ✅ Aprende a agregar logging a nuevos servicios: [docs/AGREGAR-SERVICIO-LOGS.md](../docs/AGREGAR-SERVICIO-LOGS.md)

## Ayuda

Si encuentras problemas:

1. Revisa los logs: `docker-compose logs`
2. Consulta la documentación: `docs/LOGS-IMPLEMENTATION-SUMMARY.md`
3. Verifica los servicios: `docker-compose ps`
4. Reinicia servicios: `docker-compose restart <servicio>`

