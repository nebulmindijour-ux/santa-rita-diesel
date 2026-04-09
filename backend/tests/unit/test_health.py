import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_healthcheck_returns_healthy(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "environment" in data


@pytest.mark.asyncio
async def test_healthcheck_contains_version(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    data = response.json()
    assert data["version"] == "0.1.0"
