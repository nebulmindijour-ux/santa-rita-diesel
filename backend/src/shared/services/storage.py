import io
import uuid
from datetime import timedelta

from minio import Minio
from minio.error import S3Error

from src.core.config import get_settings


def _get_client() -> Minio:
    settings = get_settings()
    return Minio(
        endpoint=settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=settings.minio_secure,
    )


BUCKET = "documents"


async def ensure_bucket() -> None:
    client = _get_client()
    if not client.bucket_exists(BUCKET):
        client.make_bucket(BUCKET)


def upload_file(
    file_data: bytes,
    content_type: str,
    original_name: str,
    category: str = "other",
) -> str:
    client = _get_client()
    if not client.bucket_exists(BUCKET):
        client.make_bucket(BUCKET)

    ext = original_name.rsplit(".", 1)[-1] if "." in original_name else "bin"
    storage_key = f"{category}/{uuid.uuid4().hex}.{ext}"

    client.put_object(
        bucket_name=BUCKET,
        object_name=storage_key,
        data=io.BytesIO(file_data),
        length=len(file_data),
        content_type=content_type,
    )
    return storage_key


def get_download_url(storage_key: str, expires_hours: int = 1) -> str:
    client = _get_client()
    return client.presigned_get_object(
        bucket_name=BUCKET,
        object_name=storage_key,
        expires=timedelta(hours=expires_hours),
    )


def delete_file(storage_key: str) -> None:
    client = _get_client()
    try:
        client.remove_object(bucket_name=BUCKET, object_name=storage_key)
    except S3Error:
        pass


def download_file(storage_key: str) -> tuple[bytes, str]:
    client = _get_client()
    response = client.get_object(bucket_name=BUCKET, object_name=storage_key)
    data = response.read()
    content_type = response.headers.get("Content-Type", "application/octet-stream")
    response.close()
    response.release_conn()
    return data, content_type
