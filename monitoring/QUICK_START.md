# 🚀 Guía de Inicio Rápido - Sistema de Monitoreo

## ⚠️ Prerrequisitos

Antes de iniciar, asegúrate de que:

1. **Docker Desktop esté corriendo**
   - Abre Docker Desktop
   - Espera a que el ícono en la bandeja del sistema muestre "Docker Desktop is running"
   - Verifica con: `docker ps`

## 📋 Pasos para Iniciar el Sistema de Monitoreo

### Paso 1: Verificar Docker

```powershell
# Verificar que Docker está corriendo
docker ps

# Si ves un error, inicia Docker Desktop y espera unos segundos
```

### Paso 2: Iniciar Servicios Base (si no están corriendo)

```powershell
cd "G:\IntelliJ IDEA - workspace\microservicios-proyecto"

# Iniciar bases de datos y servicios base
docker-compose up -d rabbitmq db-auth db-profiles db-notifications
```

**Espera 30 segundos** para que las bases de datos estén listas.

### Paso 3: Iniciar Microservicios

```powershell
# Iniciar los 3 microservicios
docker-compose up -d msvc-auth msvc-profiles msvc-notifications
```

**Espera 1-2 minutos** para que los microservicios se inicien completamente.

### Paso 4: Iniciar Sistema de Monitoreo

```powershell
# Opción A: Usar el script
cd monitoring
.\start-monitoring.ps1

# Opción B: Comando directo
docker-compose up -d prometheus grafana postgres-exporter mongodb-exporter redis-exporter rabbitmq-exporter node-exporter
```

### Paso 5: Verificar que Todo Esté Corriendo

```powershell
# Ver todos los contenedores
docker-compose ps

# Deberías ver estos servicios como "running":
# - prometheus
# - grafana
# - postgres-exporter
# - mongodb-exporter
# - redis-exporter
# - rabbitmq-exporter
# - node-exporter
# - msvc-auth
# - msvc-profiles
# - msvc-notifications
# - rabbitmq
# - db-auth
# - db-profiles
# - db-notifications
```

## 🎯 Acceder a las Interfaces

Después de que todos los servicios estén corriendo:

### Grafana (Dashboard de Métricas)
```
URL: http://localhost:3000
Usuario: admin
Contraseña: admin

1. Haz login
2. Ve a: Dashboards → Browse
3. Selecciona: "Microservicios - Vista General"
```

### Prometheus (Motor de Métricas)
```
URL: http://localhost:9090

Para ver los targets:
http://localhost:9090/targets
(Todos deben estar en estado "UP")
```

### RabbitMQ Management
```
URL: http://localhost:15672
Usuario: admin
Contraseña: admin
```

## ✅ Verificación de Endpoints de Métricas

Una vez que todo esté corriendo, verifica que los endpoints de métricas respondan:

```powershell
# Auth Service (Spring Boot)
curl http://localhost:8081/actuator/prometheus

# Profiles Service (FastAPI)
curl http://localhost:8082/metrics

# Notifications Service (Node.js)
curl http://localhost:4000/metrics
```

Si recibes métricas en formato texto, ¡todo está funcionando! 🎉

## 🔧 Solución de Problemas

### Docker Desktop no está corriendo
```
Error: "The system cannot find the file specified"
Solución: Inicia Docker Desktop y espera a que esté completamente cargado
```

### Servicios no inician
```powershell
# Ver logs de un servicio específico
docker-compose logs prometheus
docker-compose logs grafana
docker-compose logs msvc-auth

# Reiniciar un servicio
docker-compose restart prometheus
```

### Prometheus Targets en estado "DOWN"
```
Causa común: Los microservicios aún no terminaron de iniciar
Solución: Espera 1-2 minutos y recarga la página de targets
```

### Grafana no muestra datos
```
1. Verifica que Prometheus esté recolectando datos:
   http://localhost:9090/graph
   
2. Ejecuta esta query: up{job="msvc-auth"}
   
3. Si ves resultados, los datos están llegando
   
4. En Grafana, ve a: Configuration → Data Sources → Prometheus
   Haz click en "Test" para verificar la conexión
```

## 🎓 Orden Recomendado de Inicio

Para una experiencia óptima, inicia en este orden:

```powershell
# 1. Bases de datos y RabbitMQ (30 segundos de espera)
docker-compose up -d rabbitmq db-auth db-profiles db-notifications
Start-Sleep -Seconds 30

# 2. Microservicios (1-2 minutos de espera)
docker-compose up -d msvc-auth msvc-profiles msvc-notifications
Start-Sleep -Seconds 60

# 3. Sistema de monitoreo (30 segundos de espera)
docker-compose up -d prometheus grafana postgres-exporter mongodb-exporter redis-exporter rabbitmq-exporter node-exporter
Start-Sleep -Seconds 30

# 4. Verificar
docker-compose ps
```

## 🚀 Inicio Rápido Todo-en-Uno

Si prefieres iniciar todo de una vez (tardará 2-3 minutos):

```powershell
docker-compose up -d

# Espera 2 minutos y luego verifica
Start-Sleep -Seconds 120
docker-compose ps
```

## 📊 Tu Primer Dashboard

1. Abre Grafana: http://localhost:3000
2. Login: admin/admin
3. Ve a: Dashboards → Browse → "Microservicios - Vista General"
4. ¡Deberías ver métricas en tiempo real!

## 📚 Más Información

- **Documentación completa**: `docs/MONITORING.md`
- **Configuración de Prometheus**: `monitoring/prometheus/prometheus.yml`
- **Queries útiles**: Ver `docs/MONITORING.md` sección "Queries Útiles"

---

**¿Necesitas ayuda?** Consulta `docs/MONITORING.md` para troubleshooting detallado.

