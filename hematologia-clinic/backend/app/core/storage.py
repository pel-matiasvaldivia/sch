"""
Cliente MinIO para almacenamiento de archivos (PDFs, imágenes, documentos).
Compatible con la API de Amazon S3.
"""
import io
from datetime import timedelta
from pathlib import Path

from minio import Minio
from minio.error import S3Error

from app.config import get_settings

settings = get_settings()

_minio_client: Minio | None = None


def get_minio_client() -> Minio:
    """Retorna el cliente MinIO (singleton)."""
    global _minio_client
    if _minio_client is None:
        _minio_client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ROOT_USER,
            secret_key=settings.MINIO_ROOT_PASSWORD,
            secure=settings.MINIO_USE_SSL,
        )
    return _minio_client


async def ensure_buckets_exist() -> None:
    """Crea los buckets necesarios si no existen. Se llama en el lifespan."""
    client = get_minio_client()
    buckets = [
        settings.MINIO_BUCKET_REPORTS,
        settings.MINIO_BUCKET_DOCUMENTS,
        settings.MINIO_BUCKET_AVATARS,
    ]
    for bucket in buckets:
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)


def upload_file(
    bucket: str,
    object_name: str,
    data: bytes,
    content_type: str = "application/octet-stream",
) -> str:
    """
    Sube un archivo a MinIO.
    Retorna el object_name para referencia futura.
    """
    client = get_minio_client()
    client.put_object(
        bucket_name=bucket,
        object_name=object_name,
        data=io.BytesIO(data),
        length=len(data),
        content_type=content_type,
    )
    return object_name


def get_presigned_url(
    bucket: str,
    object_name: str,
    expires_in: int = 900,  # 15 minutos por defecto
) -> str:
    """
    Genera una URL pre-firmada para acceso directo al archivo.
    expires_in: segundos hasta que expira la URL.
    """
    client = get_minio_client()
    return client.presigned_get_object(
        bucket_name=bucket,
        object_name=object_name,
        expires=timedelta(seconds=expires_in),
    )


def delete_file(bucket: str, object_name: str) -> None:
    """Elimina un archivo de MinIO."""
    client = get_minio_client()
    try:
        client.remove_object(bucket, object_name)
    except S3Error:
        pass  # Si no existe, no es un error
