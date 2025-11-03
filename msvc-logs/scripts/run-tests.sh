#!/bin/bash

# Script para ejecutar pruebas del microservicio de logs
# Uso: ./run-tests.sh [tipo_de_prueba]
# Tipos: unit, integration, all, coverage

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes coloreados
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "Este script debe ejecutarse desde el directorio msvc-logs"
    exit 1
fi

# Verificar que Node.js está instalado
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    exit 1
fi

# Verificar que Docker está ejecutándose
if ! docker info &> /dev/null; then
    print_error "Docker no está ejecutándose"
    exit 1
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    print_info "Instalando dependencias..."
    npm install
fi

# Verificar que los servicios necesarios están ejecutándose
print_info "Verificando servicios necesarios..."

# Verificar RabbitMQ
if ! curl -s -u admin:admin http://localhost:15672/api/overview > /dev/null; then
    print_warning "RabbitMQ no está disponible en localhost:15672"
    print_info "Asegúrate de que docker-compose esté ejecutándose:"
    print_info "  docker-compose up -d"
fi

# Verificar OpenSearch
if ! curl -s http://localhost:9200 > /dev/null; then
    print_warning "OpenSearch no está disponible en localhost:9200"
fi

# Determinar qué pruebas ejecutar
TEST_TYPE=${1:-all}

case $TEST_TYPE in
    unit)
        print_info "Ejecutando pruebas unitarias..."
        npm run test:unit
        ;;
    integration)
        print_info "Ejecutando pruebas de integración..."
        print_warning "Nota: Las pruebas de integración requieren que los servicios estén ejecutándose"
        npm run test:integration
        ;;
    coverage)
        print_info "Ejecutando pruebas con reporte de cobertura..."
        npm run test:coverage
        ;;
    all)
        print_info "Ejecutando todas las pruebas..."
        npm test
        ;;
    *)
        print_error "Tipo de prueba no válido: $TEST_TYPE"
        print_info "Tipos válidos: unit, integration, coverage, all"
        exit 1
        ;;
esac

# Verificar resultado
if [ $? -eq 0 ]; then
    print_info "✅ Todas las pruebas completadas exitosamente"
else
    print_error "❌ Algunas pruebas fallaron"
    exit 1
fi
