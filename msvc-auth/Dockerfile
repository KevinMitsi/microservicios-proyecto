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

# Copiamos el jar generado desde la etapa builder
COPY --from=builder /app/build/libs/*.jar app.jar

# Exponemos el puerto de Spring Boot
EXPOSE 8081

# Comando de ejecución
ENTRYPOINT ["java", "-jar", "app.jar"]