import uuid
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.errors import ForbiddenError, UnauthorizedError
from src.core.security import decode_access_token
from src.modules.auth.application.dtos import UserProfile
from src.modules.iam.domain.models import User

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserProfile:
    if not credentials:
        raise UnauthorizedError(detail="Token de acesso não fornecido.")

    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise UnauthorizedError(
            detail="Token inválido ou expirado.",
            error_code="AUTH_SESSION_EXPIRED",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError(detail="Token inválido.")

    result = await db.execute(
        select(User).where(User.id == uuid.UUID(user_id))
    )
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise UnauthorizedError(detail="Conta não disponível.")

    permissions = payload.get("permissions", [])

    return UserProfile(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role_name=user.role.name,
        role_display_name=user.role.display_name,
        permissions=permissions,
        is_active=user.is_active,
        last_login_at=user.last_login_at,
    )


# ✅ Dependency base (perfeito como está)
CurrentUser = Annotated[UserProfile, Depends(get_current_user)]


# ✅ CORRIGIDO: NÃO retorna Depends
def require_permission(permission_code: str):
    def checker(current_user: CurrentUser) -> UserProfile:
        if permission_code not in current_user.permissions:
            raise ForbiddenError(
                detail=f"Permissão '{permission_code}' necessária para esta ação."
            )
        return current_user

    return checker


# ✅ CORRIGIDO: NÃO retorna Depends
def require_role(*role_names: str):
    def checker(current_user: CurrentUser) -> UserProfile:
        if current_user.role_name not in role_names:
            raise ForbiddenError(
                detail="Seu perfil não tem acesso a esta funcionalidade."
            )
        return current_user

    return checker