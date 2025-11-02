# Guía de Configuración y Puesta en Marcha

Este documento proporciona una guía completa para configurar y ejecutar el ecosistema de microservicios de este proyecto.

## 1. Descripción General

El proyecto consiste en una arquitectura de microservicios que incluye:
- **msvc-auth**: Servicio de autenticación y gestión de usuarios (Java, Spring Boot).
- **msvc-profiles**: Servicio de perfiles de usuario (Python, FastAPI).
- **msvc-notifications**: Servicio de notificaciones (Node.js, Express).
- **msvc-logs**: Microservicio para la centralización de logs con Logstash y OpenSearch.

La comunicación entre servicios se realiza a través de **RabbitMQ**, y los logs se centralizan utilizando el stack **OpenSearch + Logstash**.

## 2. Prerrequisitos

Asegúrate de tener instalado el siguiente software en tu sistema:
- **Docker**: Para la creación y gestión de contenedores.
- **Docker Compose**: Para orquestar los servicios definidos en el archivo `docker-compose.yaml`.

## 3. Estructura del Proyecto

La estructura principal del repositorio es la siguiente:

```
.
├── docker-compose.yaml     # Orquesta todos los servicios.
├── msvc-auth/              # Microservicio de autenticación (Java)
│   ├── src/
│   ├── build.gradle
│   └── .env                # Variables de entorno (requerido)
├── msvc-notifications/     # Microservicio de notificaciones (Node.js)
│   ├── src/
│   └── package.json
├── msvc-profiles/          # Microservicio de perfiles (Python)
│   ├── main.py
│   └── requirements.txt
├── msvc-logs/              # Configuración de Logstash
│   ├── logstash.conf
│   └── Dockerfile
├── jenkins_home/           # Volumen para datos de Jenkins (ignorado por Git)
└── data/                   # Volúmenes para bases de datos (ignorado por Git)
```

## 4. Variables de Entorno

El único servicio que requiere un archivo de configuración manual es `msvc-auth`.

Crea un archivo llamado `.env` dentro del directorio `msvc-auth/` con el siguiente contenido:

```dotenv
# msvc-auth/.env

DB_HOST=db-auth
DB_PORT=5432
DB_NAME=authdb
DB_USER=authuser
DB_PASSWORD=authpass
JWT_SECRET=your-super-secret-key-for-jwt
RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
```

## 5. Instalación y Puesta en Marcha

1.  **Clona el repositorio:**
    ```bash
    git clone <URL-DEL-REPOSITORIO>
    cd <nombre-del-repositorio>
    ```

2.  **Crea el archivo de entorno:**
    Asegúrate de haber creado el archivo `msvc-auth/.env` como se describe en la sección anterior.

3.  **Levanta los servicios con Docker Compose:**
    Ejecuta el siguiente comando desde la raíz del proyecto. Este comando construirá las imágenes de los microservicios y levantará todos los contenedores en segundo plano.

    ```bash
    docker-compose up --build -d
    ```

    La primera vez que se ejecute, Docker descargará todas las imágenes base, lo que puede tardar varios minutos.

## 6. Acceso a los Servicios

Una vez que todos los contenedores estén en funcionamiento, puedes acceder a los diferentes servicios a través de las siguientes URLs:

| Servicio                  | URL                               | Credenciales (si aplica)      |
| ------------------------- | --------------------------------- | ----------------------------- |
| **RabbitMQ Management**   | `http://localhost:15672`          | `user: admin`, `pass: admin`  |
| **OpenSearch Dashboards** | `http://localhost:5601`           | N/A                           |
| **Jenkins**               | `http://localhost:8080`           | Ver logs para clave inicial   |
| **msvc-auth**             | `http://localhost:8081`           | N/A                           |
| **msvc-profiles**         | `http://localhost:8000`           | N/A                           |
| **msvc-notifications**    | `http://localhost:4000`           | N/A                           |
| **OpenSearch (API)**      | `http://localhost:9200`           | N/A                           |

---
*Guía generada automáticamente. Última actualización: 2025-11-02.*

