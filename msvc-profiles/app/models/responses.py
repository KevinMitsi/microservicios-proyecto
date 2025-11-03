from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.profile import SocialLinks


class ProfileResponse(BaseModel):
    """Response del perfil"""
    user_id: str
    username: str
    nickname: Optional[str]
    personal_page_url: Optional[str]
    is_contact_public: bool
    mailing_address: Optional[str]
    biography: Optional[str]
    organization: Optional[str]
    country: Optional[str]
    social_links: Optional[SocialLinks]
    created_at: datetime
    updated_at: datetime

