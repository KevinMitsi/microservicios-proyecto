#!/usr/bin/env python3
"""
Script de prueba para msvc-profiles
Requiere: pip install httpx
"""

import asyncio
import httpx
import json

# Configuración
BASE_URL = "http://localhost:8000"
AUTH_URL = "http://localhost:8081"

# Token de autenticación (obtenerlo de msvc-auth)
TOKEN = None


async def test_health_checks():
    """Probar los endpoints de health"""
    print("\n=== PROBANDO HEALTH CHECKS ===\n")

    async with httpx.AsyncClient() as client:
        # Health
        response = await client.get(f"{BASE_URL}/health")
        print(f"✅ GET /health: {response.status_code}")
        print(json.dumps(response.json(), indent=2))

        # Live
        response = await client.get(f"{BASE_URL}/health/live")
        print(f"\n✅ GET /health/live: {response.status_code}")
        print(json.dumps(response.json(), indent=2))

        # Ready
        response = await client.get(f"{BASE_URL}/health/ready")
        print(f"\n✅ GET /health/ready: {response.status_code}")
        print(json.dumps(response.json(), indent=2))


async def test_create_profile(token: str):
    """Crear un perfil"""
    print("\n=== CREAR PERFIL ===\n")

    profile_data = {
        "nickname": "Johnny",
        "personal_page_url": "https://johndoe.com",
        "is_contact_public": True,
        "mailing_address": "123 Main St, Tech City, USA",
        "biography": "Software developer passionate about microservices and cloud computing",
        "organization": "Tech Corp",
        "country": "USA",
        "social_links": {
            "github": "https://github.com/johndoe",
            "linkedin": "https://linkedin.com/in/johndoe",
            "twitter": "https://twitter.com/johndoe"
        }
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/api/profiles",
            json=profile_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"Status: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return response.json()


async def test_get_my_profile(token: str):
    """Obtener mi perfil"""
    print("\n=== OBTENER MI PERFIL ===\n")

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/api/profiles/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"Status: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return response.json()


async def test_update_profile(token: str):
    """Actualizar perfil"""
    print("\n=== ACTUALIZAR PERFIL ===\n")

    update_data = {
        "biography": "Updated biography: Senior Software Engineer specializing in microservices",
        "country": "Canada",
        "social_links": {
            "github": "https://github.com/johndoe-updated",
            "linkedin": "https://linkedin.com/in/johndoe",
            "twitter": "https://twitter.com/johndoe",
            "website": "https://johndoe.dev"
        }
    }

    async with httpx.AsyncClient() as client:
        response = await client.put(
            f"{BASE_URL}/api/profiles/me",
            json=update_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"Status: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return response.json()


async def test_get_all_profiles():
    """Obtener todos los perfiles"""
    print("\n=== OBTENER TODOS LOS PERFILES ===\n")

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/profiles?skip=0&limit=10")
        print(f"Status: {response.status_code}")
        profiles = response.json()
        print(f"Total perfiles encontrados: {len(profiles)}")
        print(json.dumps(profiles, indent=2))
        return profiles


async def main():
    """Ejecutar todas las pruebas"""
    print("🚀 Iniciando pruebas de msvc-profiles")

    # 1. Health checks (no requieren autenticación)
    await test_health_checks()

    # 2. Obtener token (debes tenerlo de msvc-auth)
    token = input("\n📝 Ingresa el token JWT de msvc-auth (o presiona Enter para omitir pruebas autenticadas): ").strip()

    if not token:
        print("\n⚠️ Sin token, solo se probaron los health checks")
        return

    try:
        # 3. Crear perfil
        await test_create_profile(token)

        # 4. Obtener mi perfil
        await test_get_my_profile(token)

        # 5. Actualizar perfil
        await test_update_profile(token)

        # 6. Obtener mi perfil actualizado
        await test_get_my_profile(token)

        # 7. Obtener todos los perfiles
        await test_get_all_profiles()

        print("\n✅ Todas las pruebas completadas exitosamente!")

    except Exception as e:
        print(f"\n❌ Error durante las pruebas: {e}")


if __name__ == "__main__":
    asyncio.run(main())

