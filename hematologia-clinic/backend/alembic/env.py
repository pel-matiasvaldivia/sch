"""Configuración de Alembic para migraciones async con SQLAlchemy."""
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

# Importar settings para obtener DATABASE_URL
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import get_settings
from app.db.base import Base
import app.db.all_models  # noqa: F401 — registra todos los modelos para autogenerate

# Interpretar el archivo ini de Alembic para logging
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata de todos los modelos para autogenerate
target_metadata = Base.metadata

# Sobreescribir sqlalchemy.url con el valor de settings
settings = get_settings()
config.set_main_option(
    "sqlalchemy.url",
    # Alembic necesita la URL sync para algunas operaciones
    settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
    if "asyncpg" in settings.DATABASE_URL
    else settings.DATABASE_URL,
)


def run_migrations_offline() -> None:
    """Ejecuta migraciones en modo 'offline' (sin conexión real)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Ejecuta migraciones en modo async."""
    # Para async usamos asyncpg, pero Alembic necesita psycopg2 para offline
    # En runtime usamos el engine async
    async_url = settings.DATABASE_URL
    if "psycopg2" in async_url:
        async_url = async_url.replace("postgresql+psycopg2://", "postgresql+asyncpg://")

    connectable = async_engine_from_config(
        {"sqlalchemy.url": async_url},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    """Ejecuta migraciones en modo 'online' (con conexión real)."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
