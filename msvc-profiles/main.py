from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.database import connect_to_mongo, close_mongo_connection, get_database
from app.services import rabbitmq_service, start_consumer_thread, ProfileService
from app.api import health, profiles

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Lifespan context manager for startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Starting msvc-profiles application...")

    # Connect to MongoDB
    await connect_to_mongo()

    # Connect to RabbitMQ
    try:
        rabbitmq_service.connect()

        # Start consumer thread - pasar el loop principal
        db = get_database()
        profile_service = ProfileService(db)

        # Obtener el loop principal actual
        import asyncio
        main_loop = asyncio.get_running_loop()

        start_consumer_thread(profile_service, main_loop)

    except Exception as e:
        logger.error(f"⚠️ Failed to connect to RabbitMQ: {e}")

    logger.info("✅ Application started successfully")

    yield

    # Shutdown
    logger.info("🛑 Shutting down msvc-profiles application...")

    # Close RabbitMQ first
    try:
        rabbitmq_service.close()
    except Exception as e:
        logger.error(f"⚠️ Error closing RabbitMQ: {e}")

    # Close MongoDB connection
    try:
        result = close_mongo_connection()
        # Si close_mongo_connection es async, usar await
        if result is not None and hasattr(result, '__await__'):
            await result
    except Exception as e:
        logger.error(f"⚠️ Error closing MongoDB: {e}")

    logger.info("✅ Application shutdown complete")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Microservicio de gestión de perfiles de usuario",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurar Prometheus metrics
Instrumentator().instrument(app).expose(app)

# Include routers
app.include_router(health.router)
app.include_router(profiles.router)


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint - información del servicio"""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "description": "Microservicio de gestión de perfiles de usuario",
        "endpoints": {
            "health": "/api/profiles/health",
            "live": "/api/profiles/health/live",
            "ready": "/api/profiles/health/ready",
            "docs": "/api/profiles/docs",
            "profiles": "/api/profiles/profiles",
            "metrics": "/api/profiles/metrics"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )