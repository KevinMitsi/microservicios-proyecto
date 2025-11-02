#!/bin/bash

# Script para probar el microservicio de notificaciones
# Uso: ./scripts/test-api.sh

BASE_URL="http://localhost:3002"
USER_ID="test-user-001"

echo "🧪 Testing msvc-notifications API"
echo "=================================="
echo ""

# 1. Health Check
echo "1️⃣ Health Check"
curl -s "$BASE_URL/health" | json_pp
echo -e "\n"

# 2. Crear notificación de prueba
echo "2️⃣ Creating test notification..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/notifications/test" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'"$USER_ID"'",
    "type": "user.created",
    "title": "Test Notification",
    "message": "This is a test notification"
  }')
echo "$RESPONSE" | json_pp
echo -e "\n"

# 3. Obtener todas las notificaciones
echo "3️⃣ Getting all notifications for user $USER_ID"
curl -s "$BASE_URL/api/notifications/$USER_ID" | json_pp
echo -e "\n"

# 4. Contar no leídas
echo "4️⃣ Counting unread notifications"
curl -s "$BASE_URL/api/notifications/$USER_ID/count" | json_pp
echo -e "\n"

# 5. Obtener no leídas
echo "5️⃣ Getting unread notifications"
curl -s "$BASE_URL/api/notifications/$USER_ID/unread" | json_pp
echo -e "\n"

# 6. Marcar todas como leídas
echo "6️⃣ Marking all as read"
curl -s -X PUT "$BASE_URL/api/notifications/$USER_ID/read-all" | json_pp
echo -e "\n"

# 7. Verificar contador después de marcar como leídas
echo "7️⃣ Counting unread after marking all as read"
curl -s "$BASE_URL/api/notifications/$USER_ID/count" | json_pp
echo -e "\n"

echo "✅ Tests completed!"
