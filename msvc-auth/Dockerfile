# =======================
# Etapa 1: Construcción (Builder)
# =======================
FROM gradle:8.5.0-jdk21 AS builder

WORKDIR /app

# Copiamos los archivos de configuración de dependencias primero
COPY build.gradle .
COPY settings.gradle .
COPY gradle ./gradle
COPY gradlew .
COPY gradlew.bat .

# Descargamos las dependencias (esto se cachea si no cambia build.gradle)
RUN ./gradlew dependencies --no-daemon

# Ahora copiamos el código fuente
COPY src ./src

# Compilamos y empaquetamos la aplicación (jar)
RUN ./gradlew clean build -x test --no-daemon

# =======================
# Etapa 2: Imagen final (Runtime)
# =======================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Instalar el cliente de PostgreSQL para el script de espera
RUN apk add --no-cache postgresql-client

# Copiamos el script de espera
COPY wait-for-db.sh /usr/local/bin/wait-for-db.sh
RUN chmod +x /usr/local/bin/wait-for-db.sh

# Copiamos el jar generado desde la etapa builder
COPY --from=builder /app/build/libs/*.jar app.jar

# Exponemos el puerto de Spring Boot
EXPOSE 8081

# Comando de ejecución con espera
ENTRYPOINT ["wait-for-db.sh", "db-auth", "java", "-jar", "app.jar"]
