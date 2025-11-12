#!/bin/sh
# Script para esperar a que PostgreSQL esté completamente listo

set -e

host="$1"
shift
cmd="$@"

echo "⏳ Esperando a que PostgreSQL esté listo en $host..."

# Intentar conectarse a PostgreSQL hasta 60 veces (5 minutos)
max_attempts=60
attempt=1

until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$host" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q' 2>/dev/null; do
  if [ $attempt -eq $max_attempts ]; then
    >&2 echo "❌ PostgreSQL no está disponible después de $max_attempts intentos - abandonando"
    exit 1
  fi

  >&2 echo "⏳ PostgreSQL no está listo aún (intento $attempt/$max_attempts) - esperando 5s..."
  attempt=$((attempt + 1))
  sleep 5
done

>&2 echo "✅ PostgreSQL está listo - ejecutando comando"
exec $cmd

