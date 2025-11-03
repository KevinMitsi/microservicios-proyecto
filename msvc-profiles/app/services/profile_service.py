from datetime import datetime
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models import UserProfile, ProfileUpdateRequest, ProfileCreateRequest
from app.services.rabbitmq_service import rabbitmq_service
import logging

logger = logging.getLogger(__name__)


class ProfileService:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.collection = self.db.profiles

    async def create_profile(
        self,
        user_id: str,
        username: str,
        profile_data: ProfileCreateRequest
    ) -> UserProfile:
        """Crear un nuevo perfil de usuario"""
        try:
            # Check if profile already exists
            existing = await self.collection.find_one({"user_id": user_id})
            if existing:
                raise ValueError(f"Profile already exists for user_id: {user_id}")

            # Create profile document
            profile = UserProfile(
                user_id=user_id,
                username=username,
                **profile_data.model_dump(exclude_unset=True)
            )

            # Insert into database
            result = await self.collection.insert_one(profile.model_dump())

            if result.inserted_id:
                logger.info(f"✅ Profile created for user: {username}")

                # Publish event to RabbitMQ
                event = {
                    "type": "PROFILE_CREATED",
                    "eventType": "PROFILE_CREATED",
                    "userId": user_id,
                    "username": username,
                    "timestamp": datetime.utcnow().isoformat(),
                    "data": {
                        "nickname": profile.nickname,
                        "organization": profile.organization,
                        "country": profile.country
                    }
                }

                try:
                    rabbitmq_service.publish_event("profile.created", event)
                except Exception as e:
                    logger.error(f"⚠️ Failed to publish event: {e}")

                return profile

            raise Exception("Failed to create profile")

        except Exception as e:
            logger.error(f"❌ Error creating profile: {e}")
            raise

    async def create_profile_from_event(self, user_id: str, username: str):
        """Crear perfil básico desde evento de registro"""
        try:
            existing = await self.collection.find_one({"user_id": user_id})
            if existing:
                logger.info(f"Profile already exists for user_id: {user_id}")
                return

            profile = UserProfile(
                user_id=user_id,
                username=username,
                is_contact_public=False
            )

            await self.collection.insert_one(profile.model_dump())
            logger.info(f"✅ Profile auto-created for user: {username}")

        except Exception as e:
            logger.error(f"❌ Error creating profile from event: {e}")

    async def get_profile(self, user_id: str) -> Optional[UserProfile]:
        """Obtener perfil de usuario"""
        try:
            profile_doc = await self.collection.find_one({"user_id": user_id})
            if profile_doc:
                profile_doc.pop('_id', None)  # Remove MongoDB _id
                return UserProfile(**profile_doc)
            return None
        except Exception as e:
            logger.error(f"❌ Error getting profile: {e}")
            raise

    async def update_profile(
        self,
        user_id: str,
        update_data: ProfileUpdateRequest
    ) -> Optional[UserProfile]:
        """Actualizar perfil de usuario"""
        try:
            # Get current profile
            current_profile = await self.get_profile(user_id)
            if not current_profile:
                raise ValueError(f"Profile not found for user_id: {user_id}")

            # Prepare update data
            update_dict = update_data.model_dump(exclude_unset=True)
            update_dict["updated_at"] = datetime.utcnow()

            # Update in database
            result = await self.collection.update_one(
                {"user_id": user_id},
                {"$set": update_dict}
            )

            if result.modified_count > 0:
                logger.info(f"✅ Profile updated for user_id: {user_id}")

                # Publish event to RabbitMQ
                event = {
                    "type": "PROFILE_UPDATED",
                    "eventType": "PROFILE_UPDATED",
                    "userId": user_id,
                    "username": current_profile.username,
                    "timestamp": datetime.utcnow().isoformat(),
                    "data": update_dict
                }

                try:
                    rabbitmq_service.publish_event("profile.updated", event)
                except Exception as e:
                    logger.error(f"⚠️ Failed to publish event: {e}")

                # Return updated profile
                return await self.get_profile(user_id)

            return current_profile

        except Exception as e:
            logger.error(f"❌ Error updating profile: {e}")
            raise

    async def delete_profile(self, user_id: str) -> bool:
        """Eliminar perfil de usuario"""
        try:
            result = await self.collection.delete_one({"user_id": user_id})

            if result.deleted_count > 0:
                logger.info(f"✅ Profile deleted for user_id: {user_id}")

                # Publish event to RabbitMQ
                event = {
                    "type": "PROFILE_DELETED",
                    "eventType": "PROFILE_DELETED",
                    "userId": user_id,
                    "timestamp": datetime.utcnow().isoformat()
                }

                try:
                    rabbitmq_service.publish_event("profile.deleted", event)
                except Exception as e:
                    logger.error(f"⚠️ Failed to publish event: {e}")

                return True

            return False

        except Exception as e:
            logger.error(f"❌ Error deleting profile: {e}")
            raise

    async def get_all_profiles(self, skip: int = 0, limit: int = 100) -> List[UserProfile]:
        """Obtener todos los perfiles (paginado)"""
        try:
            cursor = self.collection.find().skip(skip).limit(limit)
            profiles = []

            async for profile_doc in cursor:
                profile_doc.pop('_id', None)
                profiles.append(UserProfile(**profile_doc))

            return profiles

        except Exception as e:
            logger.error(f"❌ Error getting all profiles: {e}")
            raise

