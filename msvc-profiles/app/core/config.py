from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # MongoDB
    mongo_url: str
    database_name: str
    # RabbitMQ
    rabbitmq_url: str
    rabbitmq_exchange: str
    rabbitmq_queue: str
    # JWT
    jwt_secret: str
    jwt_algorithm: str
    jwt_issuer: str
    # Opcionales
    app_name: str = "msvc-profiles"
    app_version: str = "1.0.0"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
