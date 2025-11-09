#!/bin/bash
# Script para iniciar el sistema de monitoreo
# Linux/Mac

echo "🚀 Iniciando Sistema de Monitoreo..."
echo ""

# Verificar que Docker esté corriendo
echo "Verificando Docker..."
docker --version
if [ $? -ne 0 ]; then
    echo "❌ Docker no está instalado o no está corriendo"
    exit 1
fi

echo "✅ Docker está disponible"
echo ""

# Iniciar servicios de monitoreo
echo "Iniciando Prometheus, Grafana y Exporters..."
docker-compose up -d prometheus grafana postgres-exporter mongodb-exporter redis-exporter rabbitmq-exporter node-exporter

echo ""
echo "⏳ Esperando que los servicios estén listos..."
sleep 10

echo ""
echo "✅ Sistema de Monitoreo Iniciado!"
echo ""
echo "📊 Accede a las interfaces:"
echo "  • Grafana:    http://localhost:3000 (admin/admin)"
echo "  • Prometheus: http://localhost:9090"
echo ""
echo "🎯 Endpoints de Métricas:"
echo "  • Auth:          http://localhost:8081/actuator/prometheus"
echo "  • Profiles:      http://localhost:8082/metrics"
echo "  • Notifications: http://localhost:4000/metrics"
echo ""
echo "📈 Para ver los targets en Prometheus:"
echo "  http://localhost:9090/targets"
echo ""
echo "📚 Documentación completa: docs/MONITORING.md"
# Script para iniciar el sistema de monitoreo
# Windows PowerShell

Write-Host "🚀 Iniciando Sistema de Monitoreo..." -ForegroundColor Green
Write-Host ""

# Verificar que Docker esté corriendo
Write-Host "Verificando Docker..." -ForegroundColor Yellow
docker --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker no está instalado o no está corriendo" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker está disponible" -ForegroundColor Green
Write-Host ""

# Iniciar servicios de monitoreo
Write-Host "Iniciando Prometheus, Grafana y Exporters..." -ForegroundColor Yellow
docker-compose up -d prometheus grafana postgres-exporter mongodb-exporter redis-exporter rabbitmq-exporter node-exporter

Write-Host ""
Write-Host "⏳ Esperando que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "✅ Sistema de Monitoreo Iniciado!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Accede a las interfaces:" -ForegroundColor Cyan
Write-Host "  • Grafana:    http://localhost:3000 (admin/admin)" -ForegroundColor White
Write-Host "  • Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Endpoints de Métricas:" -ForegroundColor Cyan
Write-Host "  • Auth:          http://localhost:8081/actuator/prometheus" -ForegroundColor White
Write-Host "  • Profiles:      http://localhost:8082/metrics" -ForegroundColor White
Write-Host "  • Notifications: http://localhost:4000/metrics" -ForegroundColor White
Write-Host ""
Write-Host "📈 Para ver los targets en Prometheus:" -ForegroundColor Cyan
Write-Host "  http://localhost:9090/targets" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentación completa: docs/MONITORING.md" -ForegroundColor Cyan

