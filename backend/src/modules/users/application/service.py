import uuid

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.errors import ConflictError, NotFoundError
from src.core.pagination import PaginatedResponse, PaginationParams
from src.core.security import hash_password
from src.modules.iam.domain.models import AuditLog, User
from src.modules.users.application.dtos import (
    CreateUserRequest,
    UpdateUserRequest,
    UserListItem,
    UserResponse,
)


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(
        self, data: CreateUserRequest, created_by: uuid.UUID | None = None
    ) -> UserResponse:
        existing = await self._db.execute(
            select(User).where(User.email == data.email)
        )
        if existing.scalar_one_or_none():
            raise ConflictError(f"Já existe um usuário com o e-mail '{data.email}'.")

        user = User(
            email=data.email,
            full_name=data.full_name,
            password_hash=hash_password(data.password),
            role_id=data.role_id,
        )
        self._db.add(user)
        await self._db.flush()
        await self._db.refresh(user)

        self._db.add(AuditLog(
            user_id=created_by,
            action="user.created",
            entity_type="user",
            entity_id=str(user.id),
            detail=f"User {user.email} created",
        ))

        return self._to_response(user)

    async def get_by_id(self, user_id: uuid.UUID) -> UserResponse:
        user = await self._find_or_404(user_id)
        return self._to_response(user)

    async def list(
        self,
        params: PaginationParams,
        search: str | None = None,
        is_active: bool | None = None,
        role_name: str | None = None,
    ) -> PaginatedResponse[UserListItem]:
        query = select(User)
        count_query = select(func.count()).select_from(User)

        if search:
            pattern = f"%{search}%"
            query = query.where(
                (User.email.ilike(pattern)) | (User.full_name.ilike(pattern))
            )
            count_query = count_query.where(
                (User.email.ilike(pattern)) | (User.full_name.ilike(pattern))
            )

        if is_active is not None:
            query = query.where(User.is_active == is_active)
            count_query = count_query.where(User.is_active == is_active)

        total_result = await self._db.execute(count_query)
        total = total_result.scalar_one()

        query = query.order_by(User.created_at.desc()).offset(params.offset).limit(params.page_size)
        result = await self._db.execute(query)
        users = result.scalars().all()

        items = [
    UserListItem(
        id=u.id,
        email=u.email,
        full_name=u.full_name,
        roles=[u.role.name],  # era role_name=u.role.name
        is_active=u.is_active,
        is_locked=u.is_locked,
        last_login_at=u.last_login_at,
        created_at=u.created_at,
    )
    for u in users
]

        return PaginatedResponse.create(items=items, total=total, params=params)

    async def update(
        self,
        user_id: uuid.UUID,
        data: UpdateUserRequest,
        updated_by: uuid.UUID | None = None,
    ) -> UserResponse:
        user = await self._find_or_404(user_id)

        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            return self._to_response(user)

        await self._db.execute(
            update(User).where(User.id == user_id).values(**update_data)
        )
        await self._db.refresh(user)

        self._db.add(AuditLog(
            user_id=updated_by,
            action="user.updated",
            entity_type="user",
            entity_id=str(user.id),
            detail=f"Fields updated: {', '.join(update_data.keys())}",
        ))

        return self._to_response(user)

    async def toggle_active(
        self, user_id: uuid.UUID, updated_by: uuid.UUID | None = None
    ) -> UserResponse:
        user = await self._find_or_404(user_id)
        new_status = not user.is_active

        await self._db.execute(
            update(User).where(User.id == user_id).values(is_active=new_status)
        )
        await self._db.refresh(user)

        action = "user.activated" if new_status else "user.deactivated"
        self._db.add(AuditLog(
            user_id=updated_by,
            action=action,
            entity_type="user",
            entity_id=str(user.id),
        ))

        return self._to_response(user)

    async def unlock(
        self, user_id: uuid.UUID, updated_by: uuid.UUID | None = None
    ) -> UserResponse:
        user = await self._find_or_404(user_id)

        await self._db.execute(
            update(User)
            .where(User.id == user_id)
            .values(is_locked=False, failed_login_attempts=0, locked_until=None)
        )
        await self._db.refresh(user)

        self._db.add(AuditLog(
            user_id=updated_by,
            action="user.unlocked",
            entity_type="user",
            entity_id=str(user.id),
        ))

        return self._to_response(user)

    async def _find_or_404(self, user_id: uuid.UUID) -> User:
        result = await self._db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError("Usuário", str(user_id))
        return user

    def _to_response(self, user: User) -> UserResponse:
        return UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role_id=user.role_id,
            role_name=user.role.name,
            role_display_name=user.role.display_name,
            is_active=user.is_active,
            is_locked=user.is_locked,
            last_login_at=user.last_login_at,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
