import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


def _clean_digits(value: str | None) -> str | None:
    if value is None:
        return None
    return "".join(ch for ch in value if ch.isdigit()) or None


class CreateSupplierRequest(BaseModel):
    document: str = Field(min_length=11, max_length=20)
    document_type: Literal["CNPJ", "CPF"] = "CNPJ"
    legal_name: str = Field(min_length=2, max_length=200)
    trade_name: str | None = Field(default=None, max_length=200)
    state_registration: str | None = Field(default=None, max_length=30)
    category: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    mobile: str | None = Field(default=None, max_length=30)
    contact_name: str | None = Field(default=None, max_length=200)
    website: str | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=2000)

    zip_code: str | None = Field(default=None, max_length=10)
    street: str | None = Field(default=None, max_length=200)
    number: str | None = Field(default=None, max_length=20)
    complement: str | None = Field(default=None, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=2)
    country: str = Field(default="BR", max_length=2)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    @field_validator("document")
    @classmethod
    def clean_document(cls, v: str) -> str:
        cleaned = _clean_digits(v)
        if not cleaned:
            raise ValueError("Documento inválido.")
        return cleaned

    @field_validator("zip_code")
    @classmethod
    def clean_zip(cls, v: str | None) -> str | None:
        return _clean_digits(v)

    @field_validator("phone", "mobile")
    @classmethod
    def clean_phone(cls, v: str | None) -> str | None:
        return _clean_digits(v)

    @field_validator("state")
    @classmethod
    def uppercase_state(cls, v: str | None) -> str | None:
        return v.upper() if v else None


class UpdateSupplierRequest(BaseModel):
    legal_name: str | None = Field(default=None, min_length=2, max_length=200)
    trade_name: str | None = Field(default=None, max_length=200)
    state_registration: str | None = Field(default=None, max_length=30)
    category: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    mobile: str | None = Field(default=None, max_length=30)
    contact_name: str | None = Field(default=None, max_length=200)
    website: str | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=2000)
    is_active: bool | None = None

    zip_code: str | None = Field(default=None, max_length=10)
    street: str | None = Field(default=None, max_length=200)
    number: str | None = Field(default=None, max_length=20)
    complement: str | None = Field(default=None, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=2)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    @field_validator("zip_code")
    @classmethod
    def clean_zip(cls, v: str | None) -> str | None:
        return _clean_digits(v)

    @field_validator("phone", "mobile")
    @classmethod
    def clean_phone(cls, v: str | None) -> str | None:
        return _clean_digits(v)

    @field_validator("state")
    @classmethod
    def uppercase_state(cls, v: str | None) -> str | None:
        return v.upper() if v else None


class SupplierResponse(BaseModel):
    id: uuid.UUID
    document: str
    document_type: str
    legal_name: str
    trade_name: str | None
    state_registration: str | None
    category: str | None
    email: str | None
    phone: str | None
    mobile: str | None
    contact_name: str | None
    website: str | None

    zip_code: str | None
    street: str | None
    number: str | None
    complement: str | None
    district: str | None
    city: str | None
    state: str | None
    country: str
    latitude: float | None
    longitude: float | None

    notes: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SupplierListItem(BaseModel):
    id: uuid.UUID
    document: str
    document_type: str
    legal_name: str
    trade_name: str | None
    category: str | None
    city: str | None
    state: str | None
    phone: str | None
    email: str | None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
