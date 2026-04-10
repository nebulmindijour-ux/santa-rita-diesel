from fastapi import APIRouter, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import get_settings
from src.core.dependencies import DbSession
from src.modules.auth.application.dtos import AuthResponse, LoginRequest, RefreshRequest, UserProfile
from src.modules.auth.application.service import AuthService
from src.modules.auth.presentation.dependencies import CurrentUser

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE_NAME = "srd_refresh_token"
REFRESH_COOKIE_MAX_AGE = settings.jwt_refresh_token_expire_days * 24 * 60 * 60


def _set_refresh_cookie(response: Response, raw_refresh_token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=raw_refresh_token,
        max_age=REFRESH_COOKIE_MAX_AGE,
        httponly=True,
        secure=not settings.is_development,
        samesite="strict",
        path="/api/v1/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        httponly=True,
        secure=not settings.is_development,
        samesite="strict",
        path="/api/v1/auth",
    )


def _get_client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


@router.post("/login", response_model=AuthResponse)
async def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    db: DbSession,
) -> AuthResponse:
    service = AuthService(db)
    auth_response, raw_refresh = await service.login(
        data=data,
        ip_address=_get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    _set_refresh_cookie(response, raw_refresh)
    return auth_response


@router.post("/refresh", response_model=AuthResponse)
async def refresh(
    request: Request,
    response: Response,
    db: DbSession,
) -> AuthResponse:
    from src.core.errors import UnauthorizedError

    raw_refresh = request.cookies.get(REFRESH_COOKIE_NAME)
    if not raw_refresh:
        raise UnauthorizedError(
            detail="Sessão expirada. Faça login novamente.",
            error_code="AUTH_REFRESH_REVOKED",
        )

    service = AuthService(db)
    auth_response, new_raw_refresh = await service.refresh(
        raw_refresh_token=raw_refresh,
        ip_address=_get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )
    _set_refresh_cookie(response, new_raw_refresh)
    return auth_response


@router.post("/logout", status_code=204)
async def logout(
    request: Request,
    response: Response,
    db: DbSession,
) -> None:
    raw_refresh = request.cookies.get(REFRESH_COOKIE_NAME)
    if raw_refresh:
        service = AuthService(db)
        await service.logout(
            raw_refresh_token=raw_refresh,
            ip_address=_get_client_ip(request),
            user_agent=request.headers.get("User-Agent"),
        )
    _clear_refresh_cookie(response)


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: CurrentUser,
) -> UserProfile:
    return current_user
