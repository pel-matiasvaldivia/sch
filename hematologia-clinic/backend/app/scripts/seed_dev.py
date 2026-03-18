"""
Script de seed para entorno de desarrollo.
Crea usuarios de prueba y datos de ejemplo.

Uso: python -m app.scripts.seed_dev
"""
import asyncio
import sys

from app.config import get_settings
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.modules.users.models import User, UserRole
from app.modules.users.repository import UserRepository
from app.modules.users.service import UserService

settings = get_settings()

SEED_USERS = [
    {
        "email": "admin@clinica.com",
        "full_name": "Administrador Sistema",
        "password": "Admin1234!",
        "roles": ["admin"],
    },
    {
        "email": "medico@clinica.com",
        "full_name": "Dra. María García",
        "password": "Medico1234!",
        "roles": ["medico"],
    },
    {
        "email": "admin2@clinica.com",
        "full_name": "Juan Pérez",
        "password": "Admin1234!",
        "roles": ["administrativo"],
    },
    {
        "email": "tecnico@clinica.com",
        "full_name": "Carlos Rodríguez",
        "password": "Tecnico1234!",
        "roles": ["tecnico"],
    },
]


async def seed():
    async with AsyncSessionLocal() as db:
        service = UserService(db)

        # Inicializar roles del sistema
        await service.initialize_system_roles()
        await db.commit()

        # Crear usuarios de prueba
        repo = UserRepository(db)
        created = 0

        for user_data in SEED_USERS:
            existing = await repo.get_by_email(user_data["email"])
            if existing:
                print(f"  ↷ Ya existe: {user_data['email']}")
                continue

            user = User(
                email=user_data["email"],
                full_name=user_data["full_name"],
                hashed_password=hash_password(user_data["password"]),
                must_change_password=False,  # Para facilitar el testing
                is_active=True,
            )
            user = await repo.create(user)

            roles = await repo.get_roles_by_names(user_data["roles"])
            for role in roles:
                db.add(UserRole(user_id=user.id, role_id=role.id))

            await db.flush()
            print(f"  ✓ Creado: {user_data['email']} ({', '.join(user_data['roles'])})")
            created += 1

        await db.commit()
        print(f"\n✓ Seed completado: {created} usuarios creados")
        print("\nCredenciales de acceso:")
        for u in SEED_USERS:
            print(f"  {u['email']} / {u['password']} — {', '.join(u['roles'])}")


if __name__ == "__main__":
    if settings.is_production:
        print("⛔ No ejecutar seed en producción")
        sys.exit(1)

    print("Ejecutando seed de desarrollo...")
    asyncio.run(seed())
