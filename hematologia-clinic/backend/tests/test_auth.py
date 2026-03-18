"""Tests de autenticación."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    response = await client.post(
        "/v1/auth/login",
        json={"email": "noexiste@test.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"


@pytest.mark.asyncio
async def test_login_missing_fields(client: AsyncClient):
    response = await client.post("/v1/auth/login", json={"email": "test@test.com"})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_access_protected_route_without_token(client: AsyncClient):
    response = await client.get("/v1/users/")
    assert response.status_code == 403  # HTTPBearer retorna 403 si no hay token


@pytest.mark.asyncio
async def test_access_protected_route_with_invalid_token(client: AsyncClient):
    response = await client.get(
        "/v1/users/",
        headers={"Authorization": "Bearer token_invalido"},
    )
    assert response.status_code == 401
