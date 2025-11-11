from fastapi import APIRouter
from app.core.config import settings
from app.database import get_database
from app.services import rabbitmq_service

router = APIRouter(prefix="/api/profiles/health", tags=["Health"])


@router.get("", summary="Health Check", description="Verifica el estado general del servicio")
async def health_check():
    """Health check endpoint - verifica el estado general del servicio"""
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version
    }


@router.get("/live", summary="Liveness Probe", description="Verifica si la aplicación está corriendo")
async def liveness_check():
    """Liveness probe - verifica si la aplicación está corriendo"""
    return {
        "status": "alive",
        "service": settings.app_name
    }


@router.get("/ready", summary="Readiness Probe", description="Verifica si la aplicación está lista para recibir tráfico")
async def readiness_check():
    """Readiness probe - verifica si la aplicación está lista para recibir tráfico"""
    from fastapi import HTTPException, status

    db = get_database()

    # Check MongoDB connection
    mongo_ready = False
    try:
        await db.command('ping')
        mongo_ready = True
    except Exception:
        pass

    # Check RabbitMQ connection
    rabbitmq_ready = rabbitmq_service.is_connected

    is_ready = mongo_ready and rabbitmq_ready

    if not is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service not ready"
        )

    return {
        "status": "ready",
        "service": settings.app_name,
        "mongodb": "connected" if mongo_ready else "disconnected",
        "rabbitmq": "connected" if rabbitmq_ready else "disconnected"
    }

