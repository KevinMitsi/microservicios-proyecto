import pytest
import asyncio
from httpx import AsyncClient
from asgi_lifespan import LifespanManager
from app.main import app
from app.database.connection import get_database
from unittest.mock import AsyncMock, patch


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def test_client():
    """Create a test client for the FastAPI app."""
    async with LifespanManager(app):
        async with AsyncClient(app=app, base_url="http://testserver") as client:
            yield client


@pytest.fixture
def mock_database():
    """Mock database connection."""
    with patch('app.database.connection.get_database') as mock_db:
        mock_collection = AsyncMock()
        mock_db.return_value = {
            'profiles': mock_collection,
            'user_events': mock_collection
        }
        yield mock_db


@pytest.fixture
def sample_profile_data():
    """Sample profile data for testing."""
    return {
        "user_id": "test-user-123",
        "nickname": "TestUser",
        "personal_page_url": "https://example.com",
        "is_contact_public": True,
        "mailing_address": "123 Test St",
        "biography": "Test biography",
        "organization": "Test Org",
        "country": "Test Country"
    }


@pytest.fixture
def mock_auth_token():
    """Mock authentication token."""
    return "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token"
