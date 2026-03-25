"""Schemas de autenticación."""
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None  # Código TOTP si 2FA está habilitado


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # Segundos hasta que expira el access token
    user: "UserTokenInfo"


class UserTokenInfo(BaseModel):
    id: str
    email: str
    full_name: str
    roles: List[str]
    must_change_password: bool
    totp_enabled: bool


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


TokenResponse.model_rebuild()


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, description="Mínimo 8 caracteres")
