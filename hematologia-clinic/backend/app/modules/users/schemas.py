"""Schemas Pydantic para el módulo de usuarios."""
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class RoleRead(BaseModel):
    id: str
    name: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    password: str = Field(min_length=8, max_length=128)
    role_names: List[str] = Field(default=["medico"])

    # Campos requeridos solo cuando role_names incluye "paciente"
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    dni: Optional[str] = Field(None, max_length=20)
    birth_date: Optional[date] = None
    sex: Optional[str] = Field(None, pattern="^(M|F|Otro)$")

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("La contraseña debe tener al menos una mayúscula")
        if not any(c.isdigit() for c in v):
            raise ValueError("La contraseña debe tener al menos un número")
        return v

    @model_validator(mode="after")
    def validate_patient_fields(self) -> "UserCreate":
        if "paciente" in (self.role_names or []):
            missing = []
            if not self.first_name:
                missing.append("first_name")
            if not self.last_name:
                missing.append("last_name")
            if not self.dni:
                missing.append("dni")
            if not self.birth_date:
                missing.append("birth_date")
            if not self.sex:
                missing.append("sex")
            if missing:
                raise ValueError(
                    f"Los siguientes campos son requeridos para el rol 'paciente': {', '.join(missing)}"
                )
        return self


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    is_active: Optional[bool] = None
    role_names: Optional[List[str]] = None


class UserRead(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    is_active: bool
    is_email_verified: bool
    must_change_password: bool
    totp_enabled: bool
    failed_login_attempts: int
    last_login_at: Optional[datetime] = None
    last_login_ip: Optional[str] = None
    avatar_url: Optional[str] = None
    roles: List[RoleRead] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("roles", mode="before")
    @classmethod
    def extract_roles(cls, v):
        """Extrae el Role de cada UserRole (tabla de unión)."""
        result = []
        for item in v:
            if hasattr(item, "role"):  # Es un UserRole
                result.append(item.role)
            else:
                result.append(item)
        return result

    @property
    def role_names(self) -> List[str]:
        return [r.name for r in self.roles]


class UserList(BaseModel):
    items: List[UserRead]
    total: int
    page: int
    size: int
    pages: int


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("La contraseña debe tener al menos una mayúscula")
        if not any(c.isdigit() for c in v):
            raise ValueError("La contraseña debe tener al menos un número")
        return v
