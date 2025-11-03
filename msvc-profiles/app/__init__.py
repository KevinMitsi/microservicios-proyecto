"""
App package - Aplicación FastAPI
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # MongoDB Configuration
    mongo_url: str = "mongodb://profilesuser:profilespass@localhost:27018/profilesdb?authSource=admin"
    database_name: str = "profilesdb"

    # RabbitMQ Configuration
    rabbitmq_url: str = "amqp://admin:admin@localhost:5672"
    rabbitmq_exchange: str = "microservices.events"
    rabbitmq_queue: str = "profiles.queue"

    # JWT Configuration
    jwt_secret: str = "VGhpcy1pcy1qd3Qtc2VjcmV0LXNob3VsZC1iZS1iYXNlNjQtMzJieXRlcy0xMjM0NTY3ODkwMTIzNDU2"
    jwt_algorithm: str = "HS256"
    jwt_issuer: str = "msvc-auth"

    # Application Configuration
    app_name: str = "msvc-profiles"
    app_version: str = "1.0.0"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

