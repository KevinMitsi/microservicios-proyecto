from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SocialLinks(BaseModel):
    """Links de redes sociales del usuario"""
    twitter: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    website: Optional[str] = None


class UserProfile(BaseModel):
    """Modelo del perfil de usuario"""
    user_id: str = Field(..., description="ID del usuario (desde auth)")
    username: str = Field(..., description="Nombre de usuario")
    nickname: Optional[str] = Field(None, description="Apodo del usuario")
    personal_page_url: Optional[str] = Field(None, description="URL de página personal")
    is_contact_public: bool = Field(default=False, description="¿Información de contacto pública?")
    mailing_address: Optional[str] = Field(None, description="Dirección de correspondencia")
    biography: Optional[str] = Field(None, description="Biografía del usuario")
    organization: Optional[str] = Field(None, description="Organización a la que pertenece")
    country: Optional[str] = Field(None, description="País de residencia")
    social_links: Optional[SocialLinks] = Field(default_factory=SocialLinks, description="Links de redes sociales")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "123",
                "username": "johndoe",
                "nickname": "Johnny",
                "personal_page_url": "https://johndoe.com",
                "is_contact_public": True,
                "mailing_address": "123 Main St, City, Country",
                "biography": "Software developer passionate about microservices",
                "organization": "Tech Corp",
                "country": "USA",
                "social_links": {
                    "twitter": "https://twitter.com/johndoe",
                    "github": "https://github.com/johndoe"
                }
            }
        }

