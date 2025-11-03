from pydantic import BaseModel
from typing import Optional
from app.models.profile import SocialLinks


class ProfileCreateRequest(BaseModel):
    """Request para crear un perfil"""
    nickname: Optional[str] = None
    personal_page_url: Optional[str] = None
    is_contact_public: bool = False
    mailing_address: Optional[str] = None
    biography: Optional[str] = None
    organization: Optional[str] = None
    country: Optional[str] = None
    social_links: Optional[SocialLinks] = None


class ProfileUpdateRequest(BaseModel):
    """Request para actualizar un perfil"""
    nickname: Optional[str] = None
    personal_page_url: Optional[str] = None
    is_contact_public: Optional[bool] = None
    mailing_address: Optional[str] = None
    biography: Optional[str] = None
    organization: Optional[str] = None
    country: Optional[str] = None
    social_links: Optional[SocialLinks] = None

