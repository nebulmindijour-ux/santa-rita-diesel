import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    refresh_token: str


class UserProfile(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role_name: str
    role_display_name: str
    permissions: list[str]
    is_active: bool
    last_login_at: datetime | None

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    user: UserProfile
    access_token: str
    token_type: str = "bearer"
    expires_in: int
