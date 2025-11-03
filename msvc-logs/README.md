# Sistema de Logging con FluentBit

## 🚀 Descripción

Sistema de logging centralizado de alta performance usando **FluentBit** como procesador principal, diseñado para microservicios con arquitectura moderna.

> Guía rápida de configuración: consulta "docs/GUIA-CONFIGURACION.md" para pasos detallados de puesta en marcha en Windows y Docker.

## 🏗️ Arquitectura

```
Microservicios → RabbitMQ → Procesador Directo → FluentBit → OpenSearch
                                    ↓
                            HTTP Input (9880)
                                    ↓  
                            Métricas (2020)
```


### Simplicidad Operacional
- **Configuración clara**: Sintaxis INI simple
- **Deployment ligero**: Binario único, sin JVM
- **Debugging fácil**: Logs claros y métricas nativas
- **Mantenimiento mínimo**: Menor superficie de ataque

## 📁 Estructura del Proyecto

```
msvc-logs/
├── fluent-bit.conf                # Configuración FluentBit
├── Dockerfile                     # Contenedor FluentBit  
├── Dockerfile.direct             # Procesador directo
├── package.json                  # Dependencias y scripts
├── src/
│   ├── index.js                  # Script principal
│   └── direct-log-processor.js   # Procesador RabbitMQ → FluentBit
├── tests/                        # Suite completa de pruebas
├── scripts/                      # Scripts multiplataforma
└── docs/                        # Documentación
```

## 🔧 Configuración de FluentBit

### Service
```ini
[SERVICE]
    Flush        1
    Log_Level    info
    HTTP_Server  On
    HTTP_Port    2020
```

### Input HTTP
```ini
[INPUT]
    Name              http
    Listen            0.0.0.0
    Port              9880
    Tag               logs.http
```

### Filtros
```ini
[FILTER]
    Name    modify
    Match   logs.*
    Add     processed_by fluent-bit

[FILTER]
    Name    modify  
    Match   logs.*
    Rename  timestamp @timestamp
```

### Output OpenSearch
```ini
[OUTPUT]
    Name            opensearch
    Match           logs.*
    Host            opensearch
    Port            9200
    Index           logs-%Y.%m.%d
```

## 🚀 Quick Start

### 1. Iniciar Servicios
```bash
# Servicios base
docker-compose up -d rabbitmq opensearch

# FluentBit y procesador
docker-compose up -d fluent-bit direct-log-processor
```

### 2. Verificar Estado
```bash
# Estado de servicios
docker-compose ps

# Métricas de FluentBit  
curl http://localhost:2020

# Estado de OpenSearch
curl http://localhost:9200
```

### 3. Ejecutar Pruebas
```bash
cd msvc-logs
npm install
npm test
```

## 🧪 Pruebas Automatizadas

### Ejecutar Pruebas
```bash
# Todas las pruebas
npm test

# Solo unitarias (rápidas)
npm run test:unit

# Solo integración  
npm run test:integration

# Con coverage
npm run test:coverage
```

### Scripts Multiplataforma
```bash
# Windows
.\scripts\run-tests.ps1 all
.\scripts\run-tests.bat all

# Linux/Mac
./scripts/run-tests.sh all
```

## 📈 Monitoreo

### Endpoints Disponibles
| Servicio | URL | Propósito |
|----------|-----|-----------|
| FluentBit Métricas | http://localhost:2020 | Monitoreo y salud |
| FluentBit Input | http://localhost:9880 | Recepción de logs |
| OpenSearch | http://localhost:9200 | Almacén de logs |
| OpenSearch Dashboards | http://localhost:5601 | Visualización |
| RabbitMQ Management | http://localhost:15672 | Gestión de colas |

### Métricas Clave
- **Input metrics**: Mensajes recibidos
- **Filter metrics**: Mensajes procesados  
- **Output metrics**: Mensajes enviados
- **Error rates**: Errores por componente

## 🔄 Escalabilidad

### Horizontal
- Múltiples instancias del procesador directo
- FluentBit maneja múltiples inputs
- Load balancing automático en RabbitMQ

### Vertical
- FluentBit usa recursos mínimos
- Procesador directo liviano
- Mejor aprovechamiento de hardware

## 🛡️ Producción

### Configuración Recomendada
```yaml
# docker-compose.prod.yml
services:
  fluent-bit:
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 256M
          cpus: '0.5'
        reservations:
          memory: 128M
          cpus: '0.25'
```

### Variables de Entorno
```bash
# Procesador directo
RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
FLUENTBIT_URL=http://fluent-bit:9880
LOG_QUEUE_NAME=log_queue

# FluentBit
LOG_LEVEL=info
HTTP_SERVER=on
```

### Monitoreo de Salud
```bash
# Health checks
curl -f http://fluent-bit:2020 || exit 1
curl -f http://opensearch:9200/_cluster/health || exit 1
```

## 🔧 Desarrollo

### Configurar Entorno Local
```bash
# Clonar y setup
git clone <repo>
cd msvc-logs
npm install

# Iniciar servicios
docker-compose up -d

# Modo desarrollo
npm run start:dev
```

### Debugging
```bash
# Logs de FluentBit
docker logs fluent-bit -f

# Logs del procesador
docker logs direct-log-processor -f

# Métricas en vivo
watch -n 1 'curl -s http://localhost:2020 | jq .'
```

## 📝 Ejemplos de Uso

### Enviar Log Manual
```bash
# Vía HTTP directo a FluentBit
curl -X POST http://localhost:9880 \
  -H "Content-Type: application/json" \
  -d '{
    "level": "INFO",
    "service": "test-service", 
    "message": "Test log message",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
  }'
```

### Desde Aplicación Node.js
```javascript
const axios = require('axios');

async function sendLog(level, service, message) {
  await axios.post('http://localhost:9880', {
    level,
    service,
    message,
    timestamp: new Date().toISOString(),
    userId: 'user-123'
  });
}

await sendLog('INFO', 'my-service', 'User logged in');
```

### Desde Aplicación Python
```python
import requests
from datetime import datetime

def send_log(level, service, message):
    payload = {
        'level': level,
        'service': service, 
        'message': message,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }
    requests.post('http://localhost:9880', json=payload)

send_log('INFO', 'my-service', 'User logged in')
```

## 🆘 Troubleshooting

### Problemas Comunes

**FluentBit no inicia**
```bash
# Verificar configuración
docker logs fluent-bit
# Revisar fluent-bit.conf
```

**Logs no aparecen en OpenSearch**
```bash
# Verificar conectividad
curl http://localhost:9200/_cluster/health
# Verificar índices
curl http://localhost:9200/_cat/indices
```

**RabbitMQ desconectado**
```bash
# Verificar cola
curl -u admin:admin http://localhost:15672/api/queues
# Reiniciar servicio
docker-compose restart rabbitmq
```

## 📚 Documentación Adicional

- [Documentación de Pruebas](README-TESTS.md)
- [Configuración de FluentBit](fluent-bit.conf)
- [Guía de configuración detallada](docs/GUIA-CONFIGURACION.md)
- [Scripts de Automatización](scripts/)

## 🤝 Contribución

1. Fork del repositorio
2. Crear branch de feature
3. Ejecutar pruebas: `npm test`
4. Commit con mensaje descriptivo
5. Push y crear Pull Request

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

**Desarrollado con FluentBit para máxima performance y simplicidad** 🚀
