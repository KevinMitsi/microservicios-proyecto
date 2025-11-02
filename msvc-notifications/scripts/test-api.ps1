# PowerShell Script para probar el API
# Uso: .\scripts\test-api.ps1

$BASE_URL = "http://localhost:3002"
$USER_ID = "test-user-001"

Write-Host "🧪 Testing msvc-notifications API" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 1. Health Check
Write-Host "1️⃣ Health Check" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$BASE_URL/health" -Method Get
$response | ConvertTo-Json
Write-Host ""

# 2. Crear notificación de prueba
Write-Host "2️⃣ Creating test notification..." -ForegroundColor Yellow
$body = @{
    userId = $USER_ID
    type = "user.created"
    title = "Test Notification"
    message = "This is a test notification"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$BASE_URL/api/notifications/test" -Method Post -Body $body -ContentType "application/json"
$response | ConvertTo-Json
Write-Host ""

# 3. Obtener todas las notificaciones
Write-Host "3️⃣ Getting all notifications for user $USER_ID" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$BASE_URL/api/notifications/$USER_ID" -Method Get
$response | ConvertTo-Json -Depth 5
Write-Host ""

# 4. Contar no leídas
Write-Host "4️⃣ Counting unread notifications" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$BASE_URL/api/notifications/$USER_ID/count" -Method Get
$response | ConvertTo-Json
Write-Host ""

# 5. Obtener no leídas
Write-Host "5️⃣ Getting unread notifications" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$BASE_URL/api/notifications/$USER_ID/unread" -Method Get
$response | ConvertTo-Json -Depth 5
Write-Host ""

# 6. Marcar todas como leídas
Write-Host "6️⃣ Marking all as read" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$BASE_URL/api/notifications/$USER_ID/read-all" -Method Put
$response | ConvertTo-Json
Write-Host ""

# 7. Verificar contador después de marcar como leídas
Write-Host "7️⃣ Counting unread after marking all as read" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$BASE_URL/api/notifications/$USER_ID/count" -Method Get
$response | ConvertTo-Json
Write-Host ""

Write-Host "✅ Tests completed!" -ForegroundColor Green
