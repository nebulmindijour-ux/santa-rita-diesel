import uuid
from datetime import UTC, datetime

import structlog
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import get_settings
from src.core.errors import ConflictError, NotFoundError, UnauthorizedError
from src.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from src.modules.auth.application.dtos import AuthResponse, LoginRequest, UserProfile
from src.modules.iam.domain.models import AuditLog, RefreshToken, Role, RolePermission, User

settings = get_settings()
logger = structlog.get_logger()

MAX_FAILED_ATTEMPTS = 5
LOCK_DURATION_MINUTES = 30


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def login(
        self,
        data: LoginRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[AuthResponse, str]:
        user = await self._get_user_by_email(data.email)

        if not user:
            await self._log_audit(None, "auth.login_failed", detail=f"Email not found: {data.email}", ip=ip_address, ua=user_agent)
            raise UnauthorizedError(
                detail="E-mail ou senha incorretos.",
                error_code="AUTH_INVALID_CREDENTIALS",
            )

        if user.is_locked and user.locked_until and user.locked_until > datetime.now(UTC):
            await self._log_audit(user.id, "auth.login_blocked", detail="Account locked", ip=ip_address, ua=user_agent)
            raise UnauthorizedError(
                detail="Conta bloqueada temporariamente. Tente novamente mais tarde.",
                error_code="AUTH_ACCOUNT_LOCKED",
            )

        if user.is_locked and user.locked_until and user.locked_until <= datetime.now(UTC):
            await self._unlock_user(user.id)
            user.is_locked = False
            user.failed_login_attempts = 0

        if not user.is_active:
            await self._log_audit(user.id, "auth.login_inactive", ip=ip_address, ua=user_agent)
            raise UnauthorizedError(
                detail="Conta desativada. Entre em contato com o administrador.",
                error_code="AUTH_ACCOUNT_INACTIVE",
            )

        if not verify_password(data.password, user.password_hash):
            attempts = user.failed_login_attempts + 1
            locked = attempts >= MAX_FAILED_ATTEMPTS
            locked_until = datetime.now(UTC).replace(second=0, microsecond=0)

            if locked:
                from datetime import timedelta
                locked_until = datetime.now(UTC) + timedelta(minutes=LOCK_DURATION_MINUTES)

            await self._db.execute(
                update(User)
                .where(User.id == user.id)
                .values(
                    failed_login_attempts=attempts,
                    is_locked=locked,
                    locked_until=locked_until if locked else None,
                )
            )
            await self._log_audit(user.id, "auth.login_failed", detail=f"Invalid password, attempt {attempts}", ip=ip_address, ua=user_agent)
            raise UnauthorizedError(
                detail="E-mail ou senha incorretos.",
                error_code="AUTH_INVALID_CREDENTIALS",
            )

        await self._db.execute(
            update(User)
            .where(User.id == user.id)
            .values(
                failed_login_attempts=0,
                is_locked=False,
                locked_until=None,
                last_login_at=datetime.now(UTC),
            )
        )

        permissions = await self._get_user_permissions(user.role_id)
        access_token = create_access_token(
            user_id=str(user.id),
            role_name=user.role.name,
            permissions=permissions,
        )

        raw_refresh, token_hash, expires_at = create_refresh_token()
        refresh_record = RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self._db.add(refresh_record)

        await self._log_audit(user.id, "auth.login_success", ip=ip_address, ua=user_agent)

        profile = UserProfile(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role_name=user.role.name,
            role_display_name=user.role.display_name,
            permissions=permissions,
            is_active=user.is_active,
            last_login_at=datetime.now(UTC),
        )

        auth_response = AuthResponse(
            user=profile,
            access_token=access_token,
            expires_in=settings.jwt_access_token_expire_minutes * 60,
        )

        return auth_response, raw_refresh

    async def refresh(
        self,
        raw_refresh_token: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[AuthResponse, str]:
        token_hash = hash_refresh_token(raw_refresh_token)
        result = await self._db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked == False,  # noqa: E712
            )
        )
        refresh_record = result.scalar_one_or_none()

        if not refresh_record or refresh_record.expires_at < datetime.now(UTC):
            raise UnauthorizedError(
                detail="Sessão expirada. Faça login novamente.",
                error_code="AUTH_REFRESH_REVOKED",
            )

        await self._db.execute(
            update(RefreshToken)
            .where(RefreshToken.id == refresh_record.id)
            .values(revoked=True, revoked_at=datetime.now(UTC))
        )

        user_result = await self._db.execute(
            select(User).where(User.id == refresh_record.user_id)
        )
        user = user_result.scalar_one_or_none()

        if not user or not user.is_active:
            raise UnauthorizedError(
                detail="Conta não disponível.",
                error_code="AUTH_ACCOUNT_INACTIVE",
            )

        permissions = await self._get_user_permissions(user.role_id)
        access_token = create_access_token(
            user_id=str(user.id),
            role_name=user.role.name,
            permissions=permissions,
        )

        raw_refresh, new_token_hash, expires_at = create_refresh_token()
        new_refresh = RefreshToken(
            user_id=user.id,
            token_hash=new_token_hash,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self._db.add(new_refresh)

        profile = UserProfile(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role_name=user.role.name,
            role_display_name=user.role.display_name,
            permissions=permissions,
            is_active=user.is_active,
            last_login_at=user.last_login_at,
        )

        auth_response = AuthResponse(
            user=profile,
            access_token=access_token,
            expires_in=settings.jwt_access_token_expire_minutes * 60,
        )

        return auth_response, raw_refresh

    async def logout(
        self,
        raw_refresh_token: str,
        user_id: uuid.UUID | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        token_hash = hash_refresh_token(raw_refresh_token)
        await self._db.execute(
            update(RefreshToken)
            .where(RefreshToken.token_hash == token_hash)
            .values(revoked=True, revoked_at=datetime.now(UTC))
        )
        await self._log_audit(user_id, "auth.logout", ip=ip_address, ua=user_agent)

    async def logout_all(self, user_id: uuid.UUID) -> None:
        await self._db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked == False)  # noqa: E712
            .values(revoked=True, revoked_at=datetime.now(UTC))
        )
        await self._log_audit(user_id, "auth.logout_all")

    async def _get_user_by_email(self, email: str) -> User | None:
        result = await self._db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def _get_user_permissions(self, role_id: uuid.UUID) -> list[str]:
        from src.modules.iam.domain.models import Permission

        result = await self._db.execute(
            select(Permission.code)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id == role_id)
        )
        return list(result.scalars().all())

    async def _unlock_user(self, user_id: uuid.UUID) -> None:
        await self._db.execute(
            update(User)
            .where(User.id == user_id)
            .values(is_locked=False, failed_login_attempts=0, locked_until=None)
        )

    async def _log_audit(
        self,
        user_id: uuid.UUID | None,
        action: str,
        detail: str | None = None,
        ip: str | None = None,
        ua: str | None = None,
    ) -> None:
        log = AuditLog(
            user_id=user_id,
            action=action,
            detail=detail,
            ip_address=ip,
            user_agent=ua,
        )
        self._db.add(log)
