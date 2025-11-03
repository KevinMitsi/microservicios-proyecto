# CI/CD con Jenkins

Este documento describe el pipeline de Jenkins para ejecutar pruebas, construir imágenes Docker y desplegar el sistema automáticamente con Docker Compose.

## Resumen del Pipeline

Etapas principales:
- Checkout del código
- Prechequeos de herramientas (Docker, Compose, Java, Node, Python)
- Pruebas en paralelo:
  - msvc-logs: Jest
  - msvc-auth: Gradle (JUnit)
  - msvc-notifications: build TypeScript
  - msvc-profiles: instalación de dependencias de Python y verificación simple
- Construcción de imágenes Docker (docker compose build)
- Despliegue (docker compose up -d)

Los artefactos de cobertura de `msvc-logs` y los reportes JUnit de `msvc-auth` se archivan en Jenkins.

## Requisitos del Agente Jenkins

Se provee una imagen de Jenkins personalizada (`ci/jenkins.Dockerfile`) que incluye:
- Docker CLI y Docker Compose v2
- Node.js LTS + npm
- Python 3 + pip
- OpenJDK 21 (para Gradle/Spring Boot)

El servicio `jenkins` en `docker-compose.yaml` monta el socket de Docker (`/var/run/docker.sock`) para que el pipeline pueda construir y levantar contenedores.

## Configuración local

1. Construir e iniciar Jenkins y la plataforma:

```bash
# Construir imagen Jenkins e iniciar solo Jenkins
docker compose build jenkins
docker compose up -d jenkins

# Obtener la contraseña inicial
docker exec -it jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

2. Crear un Pipeline Multibranch o Pipeline simple apuntando a este repositorio. Jenkins detectará el `Jenkinsfile` en la raíz.

3. Variables opcionales
- COMPOSE_FILE: docker-compose.yaml
- COMPOSE_PROJECT_NAME: microservicios

## Despliegue

El stage de despliegue hace:
- `docker compose down --remove-orphans` (tolerante a errores)
- `docker compose up -d` para todos los servicios definidos.

Esto asegura que los cambios de imágenes se apliquen (compose reconstruye/rehace si cambió la build).

## Troubleshooting

- En Windows, use Docker Desktop con contenedores Linux. El socket `/var/run/docker.sock` es expuesto por Docker Desktop al WSL backend.
- Si su entorno no soporta `docker compose`, se hace fallback a `docker-compose` (v1).
- Si los tests de `msvc-auth` requieren DB, considere usar perfiles de test con H2 o mocks.

