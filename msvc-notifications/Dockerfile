
# Dockerfile para msvc-notifications con patrón builder
FROM node:18-alpine AS builder

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (todas, para compilar TypeScript)
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# --- Imagen final ---
FROM node:18-alpine AS production
WORKDIR /app

# Copiar solo los archivos necesarios desde el builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Exponer puerto
EXPOSE 4000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=4000

# Comando de inicio
CMD ["node", "dist/index.js"]
