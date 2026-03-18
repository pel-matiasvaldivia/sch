"""Tests del módulo de pacientes."""
import pytest
from httpx import AsyncClient

from tests.conftest import admin_user


PATIENT_DATA = {
    "first_name": "Juan",
    "last_name": "Pérez",
    "dni": "30123456",
    "birth_date": "1985-03-15",
    "sex": "M",
    "phone": "1122334455",
    "email": "juan.perez@test.com",
}


@pytest.mark.asyncio
async def test_create_patient(client: AsyncClient, admin_user):
    from app.dependencies import get_current_user
    from app.main import app
    app.dependency_overrides[get_current_user] = lambda: admin_user

    response = await client.post("/v1/patients/", json=PATIENT_DATA)
    assert response.status_code == 201
    data = response.json()
    assert data["dni"] == "30123456"
    assert data["full_name"] == "Pérez, Juan"
    assert data["medical_record_number"].startswith("HC-")


@pytest.mark.asyncio
async def test_create_patient_duplicate_dni(client: AsyncClient, admin_user):
    from app.dependencies import get_current_user
    from app.main import app
    app.dependency_overrides[get_current_user] = lambda: admin_user

    await client.post("/v1/patients/", json=PATIENT_DATA)
    response = await client.post("/v1/patients/", json=PATIENT_DATA)
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "CONFLICT"


@pytest.mark.asyncio
async def test_get_patient(client: AsyncClient, admin_user):
    from app.dependencies import get_current_user
    from app.main import app
    app.dependency_overrides[get_current_user] = lambda: admin_user

    create_resp = await client.post("/v1/patients/", json=PATIENT_DATA)
    patient_id = create_resp.json()["id"]

    get_resp = await client.get(f"/v1/patients/{patient_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == patient_id


@pytest.mark.asyncio
async def test_update_patient(client: AsyncClient, admin_user):
    from app.dependencies import get_current_user
    from app.main import app
    app.dependency_overrides[get_current_user] = lambda: admin_user

    create_resp = await client.post("/v1/patients/", json=PATIENT_DATA)
    patient_id = create_resp.json()["id"]

    patch_resp = await client.patch(
        f"/v1/patients/{patient_id}",
        json={"phone": "9988776655", "city": "Buenos Aires"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["phone"] == "9988776655"
    assert patch_resp.json()["city"] == "Buenos Aires"


@pytest.mark.asyncio
async def test_search_patients(client: AsyncClient, admin_user):
    from app.dependencies import get_current_user
    from app.main import app
    app.dependency_overrides[get_current_user] = lambda: admin_user

    await client.post("/v1/patients/", json=PATIENT_DATA)

    search_resp = await client.get("/v1/patients/search?q=Pérez")
    assert search_resp.status_code == 200
    assert search_resp.json()["total"] >= 1


@pytest.mark.asyncio
async def test_delete_patient(client: AsyncClient, admin_user):
    from app.dependencies import get_current_user
    from app.main import app
    app.dependency_overrides[get_current_user] = lambda: admin_user

    create_resp = await client.post("/v1/patients/", json=PATIENT_DATA)
    patient_id = create_resp.json()["id"]

    delete_resp = await client.delete(f"/v1/patients/{patient_id}")
    assert delete_resp.status_code == 204

    # Verificar que ya no aparece
    get_resp = await client.get(f"/v1/patients/{patient_id}")
    assert get_resp.status_code == 404
