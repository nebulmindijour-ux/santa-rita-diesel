import uuid

from fastapi import APIRouter, Query

from src.core.dependencies import DbSession, Pagination
from src.core.pagination import PaginatedResponse
from src.modules.auth.presentation.dependencies import CurrentUser, require_role
from src.modules.users.application.dtos import (
    CreateUserRequest,
    UpdateUserRequest,
    UserListItem,
    UserResponse,
)
from src.modules.users.application.service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    data: CreateUserRequest,
    db: DbSession,
    current_user: CurrentUser,
) -> UserResponse:
    service = UserService(db)
    return await service.create(data, created_by=current_user.id)


@router.get("", response_model=PaginatedResponse[UserListItem])
async def list_users(
    db: DbSession,
    pagination: Pagination,
    current_user: CurrentUser,
    search: str | None = Query(default=None, max_length=100),
    is_active: bool | None = Query(default=None),
) -> PaginatedResponse[UserListItem]:
    service = UserService(db)
    return await service.list(
        params=pagination,
        search=search,
        is_active=is_active,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> UserResponse:
    service = UserService(db)
    return await service.get_by_id(user_id)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    data: UpdateUserRequest,
    db: DbSession,
    current_user: CurrentUser,
) -> UserResponse:
    service = UserService(db)
    return await service.update(user_id, data, updated_by=current_user.id)


@router.post("/{user_id}/toggle-active", response_model=UserResponse)
async def toggle_user_active(
    user_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> UserResponse:
    service = UserService(db)
    return await service.toggle_active(user_id, updated_by=current_user.id)


@router.post("/{user_id}/unlock", response_model=UserResponse)
async def unlock_user(
    user_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> UserResponse:
    service = UserService(db)
    return await service.unlock(user_id, updated_by=current_user.id)
