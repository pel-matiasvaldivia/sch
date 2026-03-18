"""
Configuración central de la aplicación.
Lee todas las variables de entorno y las valida con Pydantic.
"""
from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ─── Aplicación ───
    APP_ENV: str = "development"
    APP_NAME: str = "Sistema Hematología"
    APP_VERSION: str = "1.0.0"
    APP_SECRET_KEY: str
    ALLOWED_ORIGINS: str = "http://localhost,http://localhost:3000"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    # ─── Base de datos ───
    DATABASE_URL: str
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # ─── Redis ───
    REDIS_URL: str
    REDIS_SESSION_TTL: int = 86400 * 7  # 7 días en segundos

    # ─── JWT ───
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ─── Elasticsearch ───
    ELASTICSEARCH_URL: str = "http://elasticsearch:9200"

    # ─── MinIO ───
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ROOT_USER: str
    MINIO_ROOT_PASSWORD: str
    MINIO_BUCKET_REPORTS: str = "hema-reports"
    MINIO_BUCKET_DOCUMENTS: str = "hema-documents"
    MINIO_BUCKET_AVATARS: str = "hema-avatars"
    MINIO_USE_SSL: bool = False

    # ─── Email ───
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "Clínica Hematología"
    SMTP_FROM_EMAIL: str = "no-reply@clinica.com"

    # ─── WhatsApp ───
    WHATSAPP_API_URL: str = "https://graph.facebook.com/v18.0"
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_ACCESS_TOKEN: str = ""
    WHATSAPP_VERIFY_TOKEN: str = ""

    # ─── Seguridad ───
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15
    RATE_LIMIT_PER_MINUTE: int = 60

    # ─── Feature flags ───
    FEATURE_WHATSAPP: bool = False
    FEATURE_2FA: bool = True
    FEATURE_ELASTICSEARCH: bool = True
    FEATURE_EMAIL_NOTIFICATIONS: bool = True

    # ─── Clínica ───
    CLINIC_NAME: str = "Clínica Hematológica"
    CLINIC_ADDRESS: str = ""
    CLINIC_PHONE: str = ""
    CLINIC_LOGO_URL: str = ""
    CLINIC_CURRENCY: str = "ARS"
    CLINIC_TIMEZONE: str = "America/Argentina/Buenos_Aires"

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"


@lru_cache
def get_settings() -> Settings:
    """Singleton de settings — se cachea en el primer acceso."""
    return Settings()
