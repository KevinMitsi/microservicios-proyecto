# Script de PowerShell para ejecutar pruebas del microservicio de logs
# Uso: .\run-tests.ps1 [tipo_de_prueba]
# Tipos: unit, integration, all, coverage

param(
    [string]$TestType = "all"
)

# Función para escribir mensajes coloreados
function Write-ColorMessage {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor $Color
}

function Write-Info { param([string]$Message) Write-ColorMessage $Message "Green" }
function Write-Warning { param([string]$Message) Write-ColorMessage $Message "Yellow" }
function Write-Error { param([string]$Message) Write-ColorMessage $Message "Red" }

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Error "Este script debe ejecutarse desde el directorio msvc-logs"
    exit 1
}

# Verificar que Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Info "Node.js detectado: $nodeVersion"
} catch {
    Write-Error "Node.js no está instalado"
    exit 1
}

# Verificar que Docker está ejecutándose
try {
    docker info | Out-Null
    Write-Info "Docker está ejecutándose"
} catch {
    Write-Error "Docker no está ejecutándose"
    exit 1
}

# Instalar dependencias si no existen
if (-not (Test-Path "node_modules")) {
    Write-Info "Instalando dependencias..."
    npm install
}

# Verificar servicios necesarios
Write-Info "Verificando servicios necesarios..."

# Verificar RabbitMQ
try {
    $response = Invoke-WebRequest -Uri "http://localhost:15672/api/overview" -UseBasicParsing -Headers @{Authorization=("Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:admin")))} -TimeoutSec 5 -ErrorAction Stop
    Write-Info "RabbitMQ está disponible"
} catch {
    Write-Warning "RabbitMQ no está disponible en localhost:15672"
    Write-Info "Asegúrate de que docker-compose esté ejecutándose:"
    Write-Info "  docker-compose up -d"
}

# Verificar OpenSearch
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9200" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Info "OpenSearch está disponible"
} catch {
    Write-Warning "OpenSearch no está disponible en localhost:9200"
}

# Ejecutar pruebas según el tipo especificado
Write-Info "Ejecutando pruebas tipo: $TestType"

switch ($TestType.ToLower()) {
    "unit" {
        Write-Info "Ejecutando pruebas unitarias..."
        npm run test:unit
    }
    "integration" {
        Write-Info "Ejecutando pruebas de integración..."
        Write-Warning "Nota: Las pruebas de integración requieren que los servicios estén ejecutándose"
        npm run test:integration
    }
    "coverage" {
        Write-Info "Ejecutando pruebas con reporte de cobertura..."
        npm run test:coverage -- --testPathIgnorePatterns="pipeline.test.js"
    }
    "all" {
        Write-Info "Ejecutando todas las pruebas..."
        npm test -- --testPathIgnorePatterns="pipeline.test.js"
    }
    default {
        Write-Error "Tipo de prueba no válido: $TestType"
        Write-Info "Tipos válidos: unit, integration, coverage, all"
        exit 1
    }
}

# Verificar resultado
if ($LASTEXITCODE -eq 0) {
    Write-Info "✅ Todas las pruebas completadas exitosamente"
} else {
    Write-Error "❌ Algunas pruebas fallaron"
    exit 1
}
