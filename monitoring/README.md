# Sistema de Monitoreo - Inicio Rápido

Este directorio contiene la configuración completa del sistema de monitoreo con Prometheus y Grafana.

## 🚀 Inicio Rápido

### Opción 1: Usando Scripts

**Windows (PowerShell):**
```powershell
.\start-monitoring.ps1
```

**Linux/Mac:**
```bash
chmod +x start-monitoring.sh
./start-monitoring.sh
```

### Opción 2: Usando Docker Compose

```bash
# Desde la raíz del proyecto
docker-compose up -d prometheus grafana postgres-exporter mongodb-exporter redis-exporter rabbitmq-exporter node-exporter
```

## 📊 Acceder a las Interfaces

Una vez iniciados los servicios:

- **Grafana**: http://localhost:3000
  - Usuario: `admin`
  - Contraseña: `admin`
  - Dashboard pre-configurado: "Microservicios - Vista General"

- **Prometheus**: http://localhost:9090
  - Targets: http://localhost:9090/targets
  - Graph: http://localhost:9090/graph

## 🔍 Verificar que Todo Funciona

1. **Verificar Prometheus Targets**
   - Ir a http://localhost:9090/targets
   - Todos los targets deben estar en estado "UP"

2. **Verificar Grafana**
   - Ir a http://localhost:3000
   - Login con admin/admin
   - Ir a Dashboards → Buscar "Microservicios - Vista General"

3. **Verificar Métricas de Microservicios**
   ```bash
   # Auth Service
   curl http://localhost:8081/actuator/prometheus
   
   # Profiles Service
   curl http://localhost:8082/metrics
   
   # Notifications Service
   curl http://localhost:4000/metrics
   ```

## 📁 Estructura de Archivos

```
monitoring/
├── prometheus/
│   └── prometheus.yml          # Configuración de Prometheus
├── grafana/
│   └── provisioning/
│       ├── datasources/
│       │   └── prometheus.yml  # Auto-configuración de datasource
│       └── dashboards/
│           ├── dashboard.yml   # Configuración de dashboards
│           └── json/
│               └── microservices-overview.json  # Dashboard principal
├── start-monitoring.ps1        # Script de inicio (Windows)
├── start-monitoring.sh         # Script de inicio (Linux/Mac)
└── README.md                   # Este archivo
```

## 🔧 Personalización

### Agregar Nuevos Dashboards

1. Crear archivo JSON en `grafana/provisioning/dashboards/json/`
2. Reiniciar Grafana: `docker-compose restart grafana`

### Modificar Configuración de Prometheus

1. Editar `prometheus/prometheus.yml`
2. Recargar configuración:
   ```bash
   curl -X POST http://localhost:9090/-/reload
   ```

## 📚 Documentación Completa

Para información detallada sobre:
- Configuración de métricas
- Queries de Prometheus
- Creación de dashboards
- Alertas
- Troubleshooting

Ver: [docs/MONITORING.md](../docs/MONITORING.md)

## 🛑 Detener Servicios

```bash
docker-compose stop prometheus grafana postgres-exporter mongodb-exporter redis-exporter rabbitmq-exporter node-exporter
```

## ⚠️ Troubleshooting

### Los targets aparecen como "DOWN"

1. Verificar que los microservicios estén corriendo:
   ```bash
   docker-compose ps
   ```

2. Verificar logs:
   ```bash
   docker-compose logs prometheus
   docker-compose logs <servicio>
   ```

### Grafana no muestra datos

1. Verificar que Prometheus esté recolectando datos
2. Ir a http://localhost:9090/graph y ejecutar: `up{job="msvc-auth"}`
3. Verificar datasource en Grafana: Configuration → Data Sources

## 📊 Puertos Utilizados

| Servicio | Puerto |
|----------|--------|
| Prometheus | 9090 |
| Grafana | 3000 |
| PostgreSQL Exporter | 9187 |
| MongoDB Exporter | 9216 |
| Redis Exporter | 9121 |
| RabbitMQ Exporter | 9419 |
| Node Exporter | 9100 |

