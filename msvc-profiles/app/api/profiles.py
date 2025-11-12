from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models import ProfileCreateRequest, ProfileUpdateRequest, ProfileResponse
from app.services import ProfileService
from app.database import get_database
from app.core.security import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/profiles", tags=["Profiles"])


def get_profile_service() -> ProfileService:
    """Dependency to get profile service"""
    db = get_database()
    return ProfileService(db)


@router.post(
    "/profile",
    response_model=ProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear perfil",
    description="Crear un nuevo perfil para el usuario autenticado"
)
async def create_profile(
    profile_data: ProfileCreateRequest,
    current_user: dict = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service)
):
    """
    Crear un nuevo perfil para el usuario autenticado.

    El perfil incluye:
    - Nickname (apodo)
    - URL de página personal
    - Configuración de privacidad de contacto
    - Dirección de correspondencia
    - Biografía
    - Organización
    - País
    - Links de redes sociales
    """
    try:
        user_id = str(current_user["user_id"])  # Convert user_id to string
        username = current_user["username"]

        profile = await profile_service.create_profile(user_id, username, profile_data)
        return ProfileResponse(**profile.model_dump())

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create profile"
        )


@router.get(
    "/me",
    response_model=ProfileResponse,
    summary="Obtener mi perfil",
    description="Obtener el perfil del usuario autenticado"
)
async def get_my_profile(
    current_user: dict = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service)
):
    """Obtener el perfil del usuario autenticado."""
    try:
        user_id = str(current_user["user_id"])  # Convertir a string para asegurar coincidencia
        logger.info(f"Fetching profile for user_id: {user_id}")
        profile = await profile_service.get_profile(user_id)

        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        return ProfileResponse(**profile.model_dump())

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get profile"
        )


@router.get(
    "/all",
    response_model=List[ProfileResponse],
    summary="Listar perfiles",
    description="Obtener todos los perfiles (paginado)"
)
async def get_all_profiles(
    skip: int = 0,
    limit: int = 100,
    profile_service: ProfileService = Depends(get_profile_service)
):
    """
    Obtener todos los perfiles (paginado).

    Parámetros:
    - skip: Número de perfiles a omitir (default: 0)
    - limit: Número máximo de perfiles a retornar (default: 100, max: 100)
    """
    try:
        if limit > 100:
            limit = 100

        profiles = await profile_service.get_all_profiles(skip, limit)
        return [ProfileResponse(**profile.model_dump()) for profile in profiles]

    except Exception as e:
        logger.error(f"Error getting all profiles: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get profiles"
        )


@router.get(
    "/{user_id}",
    response_model=ProfileResponse,
    summary="Obtener perfil por ID",
    description="Obtener el perfil de un usuario por su ID (público)"
)
async def get_profile_by_id(
    user_id: str,
    profile_service: ProfileService = Depends(get_profile_service)
):
    """Obtener el perfil de un usuario por su ID (público)."""
    try:
        profile = await profile_service.get_profile(user_id)

        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        return ProfileResponse(**profile.model_dump())

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get profile"
        )


@router.put(
    "/me",
    response_model=ProfileResponse,
    summary="Actualizar mi perfil",
    description="Actualizar el perfil del usuario autenticado"
)
async def update_my_profile(
    profile_data: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service)
):
    """
    Actualizar el perfil del usuario autenticado.

    Permite actualizar:
    - Nickname (apodo)
    - URL de página personal
    - Configuración de privacidad de contacto
    - Dirección de correspondencia
    - Biografía
    - Organización
    - País
    - Links de redes sociales
    """
    try:
        user_id = str(current_user["user_id"])
        profile = await profile_service.update_profile(user_id, profile_data)

        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        return ProfileResponse(**profile.model_dump())

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar mi perfil",
    description="Eliminar el perfil del usuario autenticado"
)
async def delete_my_profile(
    current_user: dict = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service)
):
    """Eliminar el perfil del usuario autenticado."""
    try:
        user_id = str(current_user["user_id"])
        deleted = await profile_service.delete_profile(user_id)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete profile"
        )
