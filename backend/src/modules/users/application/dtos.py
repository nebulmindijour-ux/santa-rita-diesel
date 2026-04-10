import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class CreateUserRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=200)
    password: str = Field(min_length=8, max_length=128)
    role_id: uuid.UUID


class UpdateUserRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=200)
    role_id: uuid.UUID | None = None
    is_active: bool | None = None


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role_id: uuid.UUID
    role_name: str
    role_display_name: str
    is_active: bool
    is_locked: bool
    last_login_at: datetime | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserListItem(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role_name: str
    is_active: bool
    is_locked: bool
    last_login_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True
