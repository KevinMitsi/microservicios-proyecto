# Sistema de Monitoreo con Prometheus y Grafana

Este documento describe la implementación del sistema de monitoreo para la arquitectura de microservicios usando **Prometheus** y **Grafana**.

## 📊 Arquitectura de Monitoreo

```
Microservicios (métricas) → Prometheus (recolección) → Grafana (visualización)
       ↓
Exporters (bases de datos, RabbitMQ, sistema)
```

## 🚀 Componentes

### 1. Prometheus
- **Puerto**: 9090
- **Función**: Recolección y almacenamiento de métricas
- **Configuración**: `monitoring/prometheus/prometheus.yml`
- **Interfaz**: http://localhost:9090

### 2. Grafana
- **Puerto**: 3000
- **Función**: Visualización de métricas
- **Usuario**: admin
- **Contraseña**: admin
- **Interfaz**: http://localhost:3000

### 3. Exporters

| Exporter | Puerto | Servicio | Descripción |
|----------|--------|----------|-------------|
| postgres-exporter | 9187 | PostgreSQL | Métricas de base de datos de Auth |
| mongodb-exporter | 9216 | MongoDB | Métricas de base de datos de Profiles |
| redis-exporter | 9121 | Redis | Métricas de cache de Notifications |
| rabbitmq-exporter | 9419 | RabbitMQ | Métricas del message broker |
| node-exporter | 9100 | Sistema | Métricas del sistema operativo |

## 📈 Métricas por Microservicio

### msvc-auth (Spring Boot)
- **Endpoint**: http://localhost:8081/actuator/prometheus
- **Métricas incluidas**:
  - `http_server_requests_seconds` - Latencia de requests
  - `jvm_memory_used_bytes` - Uso de memoria JVM
  - `jvm_threads_live` - Hilos activos
  - `jdbc_connections_active` - Conexiones a PostgreSQL
  - Métricas personalizadas de autenticación

### msvc-profiles (FastAPI)
- **Endpoint**: http://localhost:8082/metrics
- **Métricas incluidas**:
  - `http_requests_total` - Total de requests
  - `http_request_duration_seconds` - Duración de requests
  - `process_cpu_seconds_total` - Uso de CPU
  - `mongodb_connections` - Conexiones a MongoDB
  - Métricas personalizadas de perfiles

### msvc-notifications (Node.js)
- **Endpoint**: http://localhost:4000/metrics
- **Métricas incluidas**:
  - `http_requests_total` - Total de requests
  - `nodejs_heap_size_total_bytes` - Memoria heap
  - `process_cpu_user_seconds_total` - Uso de CPU
  - `redis_connected_clients` - Clientes Redis
  - Métricas personalizadas de notificaciones

## 🎯 Dashboards de Grafana

### Dashboard Principal: "Microservicios - Vista General"
Ubicación: `monitoring/grafana/provisioning/dashboards/json/microservices-overview.json`

**Paneles incluidos**:
1. **Tasa de Requests por Servicio** - Requests/segundo de cada microservicio
2. **Latencia P95 - Auth Service** - Percentil 95 de latencia
3. **Uso de Memoria JVM** - Memoria heap y non-heap
4. **Mensajes en RabbitMQ** - Mensajes pendientes por cola
5. **Conexiones PostgreSQL** - Conexiones activas a la BD
6. **Conexiones MongoDB** - Estado de conexiones
7. **Conexiones Redis** - Clientes conectados

## 🛠️ Configuración

### Iniciar el Sistema de Monitoreo

```bash
# Iniciar todos los servicios incluyendo monitoreo
docker-compose up -d

# Solo servicios de monitoreo
docker-compose up -d prometheus grafana postgres-exporter mongodb-exporter redis-exporter rabbitmq-exporter node-exporter
```

### Verificar Estado de Prometheus

```bash
# Acceder a Prometheus
http://localhost:9090

# Verificar targets
http://localhost:9090/targets

# Todos los targets deben estar en estado "UP"
```

### Acceder a Grafana

```bash
# URL
http://localhost:3000

# Credenciales por defecto
Usuario: admin
Contraseña: admin

# El datasource de Prometheus y los dashboards se configuran automáticamente
```

## 📊 Queries Útiles de Prometheus

### Tasa de Requests HTTP
```promql
# Auth Service
rate(http_server_requests_seconds_count{job="msvc-auth"}[5m])

# Profiles Service
rate(http_requests_total{job="msvc-profiles"}[5m])

# Notifications Service
rate(http_requests_total{job="msvc-notifications"}[5m])
```

### Latencia (P95 y P99)
```promql
# P95 de Auth
histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket{job="msvc-auth"}[5m])) by (le))

# P99 de Auth
histogram_quantile(0.99, sum(rate(http_server_requests_seconds_bucket{job="msvc-auth"}[5m])) by (le))
```

### Uso de Memoria
```promql
# JVM (Auth)
jvm_memory_used_bytes{job="msvc-auth",area="heap"}

# Node.js (Notifications)
nodejs_heap_size_used_bytes{job="msvc-notifications"}

# Python (Profiles)
process_resident_memory_bytes{job="msvc-profiles"}
```

### Mensajes en RabbitMQ
```promql
# Mensajes totales por cola
rabbitmq_queue_messages{job="rabbitmq"}

# Tasa de mensajes publicados
rate(rabbitmq_queue_messages_published_total[5m])

# Tasa de mensajes consumidos
rate(rabbitmq_queue_messages_delivered_total[5m])
```

### Conexiones a Bases de Datos
```promql
# PostgreSQL
pg_stat_database_numbackends{job="postgresql"}

# MongoDB
mongodb_connections{job="mongodb",state="current"}

# Redis
redis_connected_clients{job="redis"}
```

## 🔧 Personalización

### Agregar Nuevas Métricas

#### Spring Boot (msvc-auth)
```java
@Component
public class CustomMetrics {
    private final Counter loginAttempts;
    
    public CustomMetrics(MeterRegistry registry) {
        this.loginAttempts = Counter.builder("auth.login.attempts")
            .description("Total login attempts")
            .tag("service", "auth")
            .register(registry);
    }
    
    public void recordLoginAttempt() {
        loginAttempts.increment();
    }
}
```

#### FastAPI (msvc-profiles)
```python
from prometheus_client import Counter, Histogram

profile_updates = Counter(
    'profile_updates_total',
    'Total profile updates',
    ['status']
)

profile_updates.labels(status='success').inc()
```

#### Node.js (msvc-notifications)
```typescript
import { Counter, Histogram } from 'prom-client';

const notificationsSent = new Counter({
  name: 'notifications_sent_total',
  help: 'Total notifications sent',
  labelNames: ['type', 'status']
});

notificationsSent.labels('email', 'success').inc();
```

### Agregar Nuevos Dashboards

1. Crear archivo JSON en `monitoring/grafana/provisioning/dashboards/json/`
2. Reiniciar Grafana o esperar auto-reload (10 segundos)

```bash
docker-compose restart grafana
```

### Modificar Configuración de Prometheus

1. Editar `monitoring/prometheus/prometheus.yml`
2. Recargar configuración sin reiniciar:

```bash
curl -X POST http://localhost:9090/-/reload
```

O reiniciar el contenedor:

```bash
docker-compose restart prometheus
```

## 🚨 Alertas (Configuración Futura)

Para implementar alertas, agregar en `prometheus.yml`:

```yaml
rule_files:
  - "alerts.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
```

Ejemplo de regla de alerta (`alerts.yml`):

```yaml
groups:
  - name: microservices
    interval: 30s
    rules:
      - alert: HighRequestLatency
        expr: histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Alta latencia detectada"
          description: "P95 latency is above 1 second"
      
      - alert: ServiceDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Servicio caído"
          description: "{{ $labels.job }} is down"
```

## 📝 Troubleshooting

### Los targets aparecen como "DOWN" en Prometheus

1. Verificar que los servicios estén corriendo:
```bash
docker-compose ps
```

2. Verificar logs del servicio:
```bash
docker-compose logs <servicio>
```

3. Verificar endpoint de métricas manualmente:
```bash
curl http://localhost:8081/actuator/prometheus  # Auth
curl http://localhost:8082/metrics              # Profiles
curl http://localhost:4000/metrics              # Notifications
```

### Grafana no muestra datos

1. Verificar conexión a Prometheus en Grafana UI
2. Verificar que Prometheus esté recolectando métricas:
```bash
# Acceder a Prometheus UI
http://localhost:9090/graph

# Ejecutar query de prueba
up{job="msvc-auth"}
```

### Métricas no aparecen después de actualización

1. Reconstruir imagen del microservicio:
```bash
docker-compose build msvc-auth
docker-compose up -d msvc-auth
```

2. Verificar logs para errores:
```bash
docker-compose logs -f msvc-auth
```

## 🔗 Referencias

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Micrometer (Spring Boot)](https://micrometer.io/)
- [Prometheus FastAPI Instrumentator](https://github.com/trallnag/prometheus-fastapi-instrumentator)
- [prom-client (Node.js)](https://github.com/siimon/prom-client)

## 📊 Métricas de Negocio Sugeridas

### Autenticación
- Total de logins exitosos/fallidos
- Tiempo promedio de autenticación
- Usuarios activos por periodo
- Tokens JWT emitidos

### Perfiles
- Perfiles creados/actualizados
- Tiempo de respuesta de búsqueda
- Validaciones fallidas
- Operaciones de MongoDB por tipo

### Notificaciones
- Notificaciones enviadas por tipo
- Tasa de éxito/fallo de envío
- Tiempo en cola de notificaciones
- Cache hits/misses en Redis

