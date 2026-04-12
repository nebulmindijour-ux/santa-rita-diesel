from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import get_settings
from src.core.errors import (
    AppError,
    app_error_handler,
    generic_error_handler,
    validation_error_handler,
)
from src.core.middleware import (
    RequestIdMiddleware,
    RequestLoggingMiddleware,
    SecurityHeadersMiddleware,
)
from src.modules.auth.presentation.routes import router as auth_router
from src.modules.customers.presentation.routes import router as customers_router
from src.modules.drivers.presentation.routes import router as drivers_router
from src.modules.fleet.presentation.routes import router as fleet_router
from src.modules.operations.presentation.routes import router as operations_router
from src.modules.suppliers.presentation.routes import router as suppliers_router
from src.modules.users.presentation.routes import router as users_router

settings = get_settings()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await logger.ainfo("application_starting", env=settings.app_env)
    yield
    await logger.ainfo("application_shutting_down")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
    openapi_url="/openapi.json" if settings.is_development else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RequestIdMiddleware)

app.add_exception_handler(AppError, app_error_handler)  # type: ignore[arg-type]
app.add_exception_handler(RequestValidationError, validation_error_handler)  # type: ignore[arg-type]
app.add_exception_handler(Exception, generic_error_handler)  # type: ignore[arg-type]


@app.get("/api/v1/health", tags=["health"])
async def healthcheck() -> dict[str, str]:
    return {
        "status": "healthy",
        "version": settings.app_version,
        "environment": settings.app_env,
    }


app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(customers_router, prefix="/api/v1")
app.include_router(suppliers_router, prefix="/api/v1")
app.include_router(fleet_router, prefix="/api/v1")
app.include_router(drivers_router, prefix="/api/v1")
app.include_router(operations_router, prefix="/api/v1")
