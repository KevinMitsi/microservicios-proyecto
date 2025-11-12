import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch
from app.services.profile_service import ProfileService
from app.models.profile import ProfileCreate, ProfileUpdate


@pytest.mark.unit
class TestProfileService:
    """Tests unitarios para ProfileService"""

    @pytest.fixture
    def profile_service(self):
        return ProfileService()

    @pytest.mark.asyncio
    async def test_create_profile_success(self, profile_service, sample_profile_data):
        """Test creación exitosa de perfil"""
        with patch.object(profile_service, 'collection') as mock_collection:
            mock_collection.insert_one.return_value = AsyncMock(inserted_id="profile_id_123")
            mock_collection.find_one.return_value = {
                "_id": "profile_id_123",
                **sample_profile_data
            }

            profile_data = ProfileCreate(**sample_profile_data)
            result = await profile_service.create_profile("test-user-123", profile_data)

            assert result is not None
            assert result["user_id"] == "test-user-123"
            assert result["nickname"] == "TestUser"
            mock_collection.insert_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_profile_by_user_id(self, profile_service, sample_profile_data):
        """Test obtener perfil por user_id"""
        with patch.object(profile_service, 'collection') as mock_collection:
            mock_collection.find_one.return_value = {
                "_id": "profile_id_123",
                **sample_profile_data
            }

            result = await profile_service.get_profile_by_user_id("test-user-123")

            assert result is not None
            assert result["user_id"] == "test-user-123"
            mock_collection.find_one.assert_called_once_with({"user_id": "test-user-123"})

    @pytest.mark.asyncio
    async def test_update_profile(self, profile_service, sample_profile_data):
        """Test actualización de perfil"""
        with patch.object(profile_service, 'collection') as mock_collection:
            update_data = {"nickname": "UpdatedUser", "biography": "Updated bio"}
            mock_collection.update_one.return_value = AsyncMock(modified_count=1)
            mock_collection.find_one.return_value = {
                "_id": "profile_id_123",
                **sample_profile_data,
                **update_data
            }

            profile_update = ProfileUpdate(**update_data)
            result = await profile_service.update_profile("test-user-123", profile_update)

            assert result is not None
            assert result["nickname"] == "UpdatedUser"
            assert result["biography"] == "Updated bio"

    @pytest.mark.asyncio
    async def test_delete_profile(self, profile_service):
        """Test eliminación de perfil"""
        with patch.object(profile_service, 'collection') as mock_collection:
            mock_collection.delete_one.return_value = AsyncMock(deleted_count=1)

            result = await profile_service.delete_profile("test-user-123")

            assert result is True
            mock_collection.delete_one.assert_called_once_with({"user_id": "test-user-123"})

    @pytest.mark.asyncio
    async def test_profile_not_found(self, profile_service):
        """Test cuando no se encuentra el perfil"""
        with patch.object(profile_service, 'collection') as mock_collection:
            mock_collection.find_one.return_value = None

            result = await profile_service.get_profile_by_user_id("nonexistent-user")

            assert result is None
