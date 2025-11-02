# 🚀 Quick Start - msvc-notifications

## ⚡ Inicio Rápido (5 minutos)

### Opción 1: Docker Compose (Recomendado)

```powershell
# Navegar al directorio raíz del proyecto (donde está docker-compose.yml)
cd c:\Users\Kevin\Desktop\Universidad\2025-2\Microservicios\proyecto-msvcs

# Iniciar servicios necesarios
docker-compose up -d rabbitmq db-notifications

# Esperar a que RabbitMQ y Redis estén listos (30 segundos)
Start-Sleep -Seconds 30

# Iniciar el microservicio
docker-compose up msvc-notifications
```

### Opción 2: Desarrollo Local

```powershell
# Terminal 1: Redis
docker run -d --name redis-local -p 6379:6379 redis:7

# Terminal 2: RabbitMQ
docker run -d --name rabbitmq-local -p 5672:5672 -p 15672:15672 `
  -e RABBITMQ_DEFAULT_USER=admin `
  -e RABBITMQ_DEFAULT_PASS=admin `
  rabbitmq:3-management

# Terminal 3: Microservicio
cd c:\Users\Kevin\Desktop\Universidad\2025-2\Microservicios\proyecto-msvcs\msvc-notifications
npm install
npm run dev
```

## ✅ Verificar que Funciona

```powershell
# 1. Health check
Invoke-RestMethod http://localhost:3002/health

# 2. Crear notificación de prueba
$body = @{
    userId = "test-user"
    type = "user.created"
    title = "Test"
    message = "Funciona!"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3002/api/notifications/test `
  -Method Post -Body $body -ContentType "application/json"

# 3. Ver notificaciones
Invoke-RestMethod http://localhost:3002/api/notifications/test-user
```

## 🎯 URLs Importantes

- **API**: http://localhost:3002
- **Health**: http://localhost:3002/health
- **RabbitMQ UI**: http://localhost:15672 (admin/admin)
- **Notificaciones**: http://localhost:3002/api/notifications/{userId}

## 📚 Siguiente Paso

Lee el archivo **README.md** para documentación completa.

## 🐛 Problemas Comunes

### El servicio no inicia
```powershell
# Verificar que los puertos no estén en uso
netstat -ano | findstr :3002
netstat -ano | findstr :6379
netstat -ano | findstr :5672
```

### Redis no se conecta
```powershell
# Probar conexión manual
docker exec -it db-notifications redis-cli ping
# Debe responder: PONG
```

### RabbitMQ no se conecta
```powershell
# Verificar estado
docker ps | findstr rabbitmq

# Ver logs
docker logs rabbitmq
```

## 🎉 ¡Listo!

Tu microservicio de notificaciones está funcionando. 🎊
