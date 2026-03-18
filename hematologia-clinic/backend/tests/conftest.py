"""Fixtures de pytest para tests de integración."""
import asyncio
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.base import Base
from app.db.session import get_db
from app.main import app

# Base de datos SQLite en memoria para tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Sesión de BD para cada test, con rollback al final."""
    TestSessionLocal = async_sessionmaker(
        bind=test_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Cliente HTTP para tests de endpoints."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession):
    """Usuario admin de prueba."""
    from app.core.security import hash_password
    from app.modules.users.models import Role, User, UserRole
    from app.modules.users.repository import UserRepository

    repo = UserRepository(db_session)

    # Crear rol admin si no existe
    role = await repo.get_role_by_name("admin")
    if not role:
        role = Role(name="admin", description="Admin", is_system=True)
        await repo.create_role(role)
        await db_session.flush()

    # Crear usuario
    user = User(
        email="test.admin@test.com",
        full_name="Test Admin",
        hashed_password=hash_password("Admin1234!"),
        must_change_password=False,
        is_active=True,
    )
    user = await repo.create(user)
    db_session.add(UserRole(user_id=user.id, role_id=role.id))
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def admin_token(client: AsyncClient, admin_user) -> str:
    """Token JWT de acceso para el usuario admin."""
    # Override para retornar el admin_user directamente
    from app.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: admin_user
    return "test_token"
