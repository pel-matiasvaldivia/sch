"""Lógica de negocio para gestión de usuarios."""
from typing import Optional
import math

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.exceptions import ConflictError, NotFoundError, ValidationError
from app.modules.users.models import User, UserRole
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, UserList, UserRead, UserUpdate


SYSTEM_ROLES = ["admin", "medico", "administrativo", "tecnico", "paciente"]


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = UserRepository(db)

    async def create_user(self, data: UserCreate, created_by_id: str) -> User:
        # Verificar email único
        existing = await self.repo.get_by_email(data.email)
        if existing:
            raise ConflictError(f"Ya existe un usuario con el email {data.email}")

        # Validar roles
        roles = await self.repo.get_roles_by_names(data.role_names)
        if len(roles) != len(data.role_names):
            found = {r.name for r in roles}
            missing = set(data.role_names) - found
            raise ValidationError(f"Roles no encontrados: {', '.join(missing)}")

        # Crear usuario
        user = User(
            email=data.email.lower(),
            full_name=data.full_name,
            phone=data.phone,
            hashed_password=hash_password(data.password),
            must_change_password=True,  # Forzar cambio en primer login
        )
        user = await self.repo.create(user)

        # Asignar roles
        for role in roles:
            user_role = UserRole(user_id=user.id, role_id=role.id)
            self.db.add(user_role)

        await self.db.flush()

        # Si el usuario es paciente, crear el registro de paciente vinculado
        if "paciente" in data.role_names:
            await self._create_linked_patient(user, data, created_by_id)

        return user

    async def _create_linked_patient(
        self, user: User, data: UserCreate, created_by_id: str
    ) -> None:
        """Crea un Patient vinculado al usuario recién creado."""
        from app.modules.patients.models import Patient
        from app.modules.patients.repository import PatientRepository

        patient_repo = PatientRepository(self.db)

        # Verificar que no exista ya un paciente con ese DNI
        existing = await patient_repo.get_by_dni(data.dni)  # type: ignore[arg-type]
        if existing:
            # Vincular usuario existente al paciente
            existing.user_id = user.id
            await self.db.flush()
            return

        # Limpiar DNI
        dni_clean = data.dni.replace(".", "").replace(" ", "").strip()  # type: ignore[union-attr]

        patient = Patient(
            first_name=data.first_name.strip(),  # type: ignore[union-attr]
            last_name=data.last_name.strip(),  # type: ignore[union-attr]
            dni=dni_clean,
            birth_date=data.birth_date,
            sex=data.sex,
            email=data.email,
            phone=data.phone,
            clinical_notes={},
            user_id=user.id,
            created_by_id=created_by_id,
        )
        patient_repo.db.add(patient)
        await self.db.flush()

    async def update_user(
        self, user_id: str, data: UserUpdate, current_user_id: str
    ) -> User:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("Usuario", user_id)

        if data.full_name is not None:
            user.full_name = data.full_name
        if data.phone is not None:
            user.phone = data.phone
        if data.is_active is not None:
            user.is_active = data.is_active

        if data.role_names is not None:
            roles = await self.repo.get_roles_by_names(data.role_names)
            # Eliminar roles actuales
            for ur in user.roles:
                await self.db.delete(ur)
            await self.db.flush()
            # Asignar nuevos roles
            for role in roles:
                self.db.add(UserRole(user_id=user.id, role_id=role.id))

        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def change_password(
        self, user_id: str, current_password: str, new_password: str
    ) -> None:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("Usuario", user_id)

        if not verify_password(current_password, user.hashed_password):
            raise ValidationError("La contraseña actual es incorrecta")

        user.hashed_password = hash_password(new_password)
        user.must_change_password = False
        await self.db.flush()

    async def get_user(self, user_id: str) -> User:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("Usuario", user_id)
        return user

    async def list_users(
        self,
        page: int = 1,
        size: int = 20,
        search: Optional[str] = None,
        role_name: Optional[str] = None,
    ) -> UserList:
        users, total = await self.repo.list_paginated(page, size, search, role_name)
        pages = math.ceil(total / size) if size > 0 else 0
        return UserList(
            items=[UserRead.model_validate(u) for u in users],
            total=total,
            page=page,
            size=size,
            pages=pages,
        )

    async def soft_delete_user(self, user_id: str) -> None:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("Usuario", user_id)
        user.soft_delete()
        user.is_active = False
        await self.db.flush()

    async def initialize_system_roles(self) -> None:
        """Crea los roles del sistema si no existen. Se llama en el startup."""
        from app.modules.users.models import Role

        role_descriptions = {
            "admin": "Administrador con acceso total al sistema",
            "medico": "Médico con acceso a sus pacientes, informes y turnos",
            "administrativo": "Personal administrativo: turnos, facturación, obras sociales",
            "tecnico": "Técnico hematólogo: carga de resultados e informes técnicos",
            "paciente": "Paciente con acceso solo a sus propios datos",
        }

        for name, description in role_descriptions.items():
            existing = await self.repo.get_role_by_name(name)
            if not existing:
                role = Role(name=name, description=description, is_system=True)
                await self.repo.create_role(role)
