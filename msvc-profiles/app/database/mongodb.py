from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class Database:
    client: AsyncIOMotorClient = None
    db = None


db = Database()


async def connect_to_mongo():
    """Conectar a MongoDB"""
    try:
        logger.info("🔄 Connecting to MongoDB...")
        db.client = AsyncIOMotorClient(settings.mongo_url)
        db.db = db.client[settings.database_name]

        # Test the connection
        await db.client.admin.command('ping')
        logger.info("✅ MongoDB Connected Successfully")

        # Create indexes
        await db.db.profiles.create_index("user_id", unique=True)
        logger.info("✅ Database indexes created")

    except Exception as e:
        logger.error(f"❌ Error connecting to MongoDB: {e}")
        raise


def close_mongo_connection():
    """Cerrar conexión a MongoDB"""
    try:
        if db.client:
            db.client.close()
            logger.info("✅ MongoDB Connection Closed")
    except Exception as e:
        logger.error(f"❌ Error closing MongoDB connection: {e}")


def get_database():
    """Obtener instancia de la base de datos"""
    return db.db

