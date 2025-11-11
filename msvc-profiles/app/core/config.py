from pydantic_settings import BaseSettings
from functools import lru_cache
import base64

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
    s = Settings()
    # Decodifica la clave JWT en base64 y la usa completa para HS384
    try:
        s.jwt_secret = base64.b64decode(s.jwt_secret)
    except Exception:
        pass  # Si falla, deja la clave como está
    return s

settings = get_settings()
