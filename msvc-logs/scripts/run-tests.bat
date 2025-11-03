@echo off
REM Script para ejecutar pruebas del microservicio de logs en Windows
REM Uso: run-tests.bat [tipo_de_prueba]
REM Tipos: unit, integration, all, coverage

setlocal enabledelayedexpansion

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo [ERROR] Este script debe ejecutarse desde el directorio msvc-logs
    exit /b 1
)

REM Verificar que Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no está instalado
    exit /b 1
)

REM Verificar que Docker está ejecutándose
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker no está ejecutándose
    exit /b 1
)

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    npm install
)

REM Verificar servicios necesarios
echo [INFO] Verificando servicios necesarios...

REM Verificar RabbitMQ
curl -s -u admin:admin http://localhost:15672/api/overview >nul 2>&1
if errorlevel 1 (
    echo [WARNING] RabbitMQ no está disponible en localhost:15672
    echo [INFO] Asegúrate de que docker-compose esté ejecutándose:
    echo [INFO]   docker-compose up -d
)

REM Verificar OpenSearch
curl -s http://localhost:9200 >nul 2>&1
if errorlevel 1 (
    echo [WARNING] OpenSearch no está disponible en localhost:9200
)

REM Determinar qué pruebas ejecutar
set TEST_TYPE=%1
if "%TEST_TYPE%"=="" set TEST_TYPE=all

if "%TEST_TYPE%"=="unit" (
    echo [INFO] Ejecutando pruebas unitarias...
    npm run test:unit
) else if "%TEST_TYPE%"=="integration" (
    echo [INFO] Ejecutando pruebas de integración...
    echo [WARNING] Nota: Las pruebas de integración requieren que los servicios estén ejecutándose
    npm run test:integration
) else if "%TEST_TYPE%"=="coverage" (
    echo [INFO] Ejecutando pruebas con reporte de cobertura...
    npm run test:coverage
) else if "%TEST_TYPE%"=="all" (
    echo [INFO] Ejecutando todas las pruebas...
    npm test
) else (
    echo [ERROR] Tipo de prueba no válido: %TEST_TYPE%
    echo [INFO] Tipos válidos: unit, integration, coverage, all
    exit /b 1
)

REM Verificar resultado
if errorlevel 1 (
    echo [ERROR] ❌ Algunas pruebas fallaron
    exit /b 1
) else (
    echo [INFO] ✅ Todas las pruebas completadas exitosamente
)
