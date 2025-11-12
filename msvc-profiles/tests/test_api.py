import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock


@pytest.mark.integration
class TestProfileAPI:
    """Tests de integración para la API de perfiles"""

    @pytest.mark.asyncio
    async def test_health_endpoint(self, test_client):
        """Test endpoint de health"""
        response = await test_client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data

    @pytest.mark.asyncio
    async def test_health_live_endpoint(self, test_client):
        """Test endpoint de liveness"""
        response = await test_client.get("/health/live")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"

    @pytest.mark.asyncio
    async def test_create_profile_success(self, test_client, sample_profile_data, mock_database, mock_auth_token):
        """Test creación exitosa de perfil"""
        with patch('app.api.routes.profile.get_current_user') as mock_auth:
            mock_auth.return_value = {"user_id": "test-user-123"}

            response = await test_client.post(
                "/api/v1/profiles",
                json=sample_profile_data,
                headers={"Authorization": mock_auth_token}
            )

            assert response.status_code == 201
            data = response.json()
            assert data["user_id"] == sample_profile_data["user_id"]
            assert data["nickname"] == sample_profile_data["nickname"]

    @pytest.mark.asyncio
    async def test_get_profile_success(self, test_client, sample_profile_data, mock_database, mock_auth_token):
        """Test obtener perfil exitosamente"""
        with patch('app.api.routes.profile.get_current_user') as mock_auth:
            mock_auth.return_value = {"user_id": "test-user-123"}

            # Mock de la base de datos para devolver el perfil
            mock_database.return_value['profiles'].find_one.return_value = {
                "_id": "profile_id_123",
                **sample_profile_data
            }

            response = await test_client.get(
                "/api/v1/profiles/test-user-123",
                headers={"Authorization": mock_auth_token}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["user_id"] == "test-user-123"

    @pytest.mark.asyncio
    async def test_update_profile_success(self, test_client, mock_database, mock_auth_token):
        """Test actualización exitosa de perfil"""
        update_data = {"nickname": "UpdatedUser", "biography": "Updated biography"}

        with patch('app.api.routes.profile.get_current_user') as mock_auth:
            mock_auth.return_value = {"user_id": "test-user-123"}

            response = await test_client.put(
                "/api/v1/profiles/test-user-123",
                json=update_data,
                headers={"Authorization": mock_auth_token}
            )

            assert response.status_code == 200
            data = response.json()
            assert "updated successfully" in data["message"].lower()

    @pytest.mark.asyncio
    async def test_delete_profile_success(self, test_client, mock_database, mock_auth_token):
        """Test eliminación exitosa de perfil"""
        with patch('app.api.routes.profile.get_current_user') as mock_auth:
            mock_auth.return_value = {"user_id": "test-user-123"}

            response = await test_client.delete(
                "/api/v1/profiles/test-user-123",
                headers={"Authorization": mock_auth_token}
            )

            assert response.status_code == 200
            data = response.json()
            assert "deleted successfully" in data["message"].lower()

    @pytest.mark.asyncio
    async def test_unauthorized_access(self, test_client, sample_profile_data):
        """Test acceso sin autorización"""
        response = await test_client.post(
            "/api/v1/profiles",
            json=sample_profile_data
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_profile_not_found(self, test_client, mock_database, mock_auth_token):
        """Test cuando el perfil no existe"""
        with patch('app.api.routes.profile.get_current_user') as mock_auth:
            mock_auth.return_value = {"user_id": "test-user-123"}

            # Mock de la base de datos para devolver None
            mock_database.return_value['profiles'].find_one.return_value = None

            response = await test_client.get(
                "/api/v1/profiles/nonexistent-user",
                headers={"Authorization": mock_auth_token}
            )

            assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_metrics_endpoint(self, test_client):
        """Test endpoint de métricas de Prometheus"""
        response = await test_client.get("/metrics")
        assert response.status_code == 200
        # Verificar que contiene métricas de Prometheus
        assert "python_info" in response.text
