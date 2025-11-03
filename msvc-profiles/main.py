from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

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

        # Start consumer thread
        db = get_database()
        profile_service = ProfileService(db)
        start_consumer_thread(profile_service)

    except Exception as e:
        logger.error(f"⚠️ Failed to connect to RabbitMQ: {e}")

    logger.info("✅ Application started successfully")

    yield

    # Shutdown
    logger.info("🛑 Shutting down msvc-profiles application...")
    await close_mongo_connection()
    rabbitmq_service.close()
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
            "health": "/health",
            "live": "/health/live",
            "ready": "/health/ready",
            "docs": "/docs",
            "profiles": "/api/profiles"
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

