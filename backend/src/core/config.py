from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Santa Rita Diesel"
    app_env: str = "development"
    app_debug: bool = False
    app_version: str = "0.1.0"

    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    backend_workers: int = 1
    backend_reload: bool = True

    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "santa_rita_diesel"
    postgres_user: str = "srd_app"
    postgres_password: str = "srd_dev_password_2026"

    redis_host: str = "localhost"
    redis_port: int = 6379

    minio_host: str = "localhost"
    minio_port: int = 9000
    minio_root_user: str = "srd_minio_admin"
    minio_root_password: str = "srd_minio_password_2026"
    minio_bucket: str = "santa-rita-diesel"

    jwt_secret_key: str = "CHANGE_ME_TO_A_RANDOM_64_CHAR_STRING_IN_PRODUCTION"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    cors_origins: str = "http://localhost:5173,http://localhost:5174"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def database_url_sync(self) -> str:
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_host}:{self.redis_port}/0"

    @property
    def minio_endpoint(self) -> str:
        return f"{self.minio_host}:{self.minio_port}"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
