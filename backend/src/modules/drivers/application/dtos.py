import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

DRIVER_STATUSES = Literal["available", "in_route", "vacation", "leave", "inactive"]
CNH_CATEGORIES = Literal["A", "B", "AB", "C", "D", "E", "AC", "AD", "AE"]


def _clean_digits(value: str | None) -> str | None:
    if value is None:
        return None
    return "".join(ch for ch in value if ch.isdigit()) or None


class CreateDriverRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=200)
    cpf: str = Field(min_length=11, max_length=14)
    rg: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    mobile: str | None = Field(default=None, max_length=30)
    birth_date: date | None = None
    cnh_number: str = Field(min_length=5, max_length=20)
    cnh_category: CNH_CATEGORIES = "E"
    cnh_expiry: date
    cnh_first_issue: date | None = None
    mopp: bool = False
    mopp_expiry: date | None = None
    zip_code: str | None = Field(default=None, max_length=10)
    street: str | None = Field(default=None, max_length=200)
    number: str | None = Field(default=None, max_length=20)
    complement: str | None = Field(default=None, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=2)
    current_vehicle_id: uuid.UUID | None = None
    hire_date: date | None = None
    emergency_contact_name: str | None = Field(default=None, max_length=200)
    emergency_contact_phone: str | None = Field(default=None, max_length=30)
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("cpf")
    @classmethod
    def clean_cpf(cls, v: str) -> str:
        cleaned = _clean_digits(v)
        if not cleaned or len(cleaned) != 11:
            raise ValueError("CPF deve ter 11 dígitos.")
        return cleaned

    @field_validator("phone", "mobile", "emergency_contact_phone")
    @classmethod
    def clean_phone(cls, v: str | None) -> str | None:
        return _clean_digits(v)

    @field_validator("zip_code")
    @classmethod
    def clean_zip(cls, v: str | None) -> str | None:
        return _clean_digits(v)

    @field_validator("state")
    @classmethod
    def uppercase_state(cls, v: str | None) -> str | None:
        return v.upper() if v else None


class UpdateDriverRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=200)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    mobile: str | None = Field(default=None, max_length=30)
    cnh_category: CNH_CATEGORIES | None = None
    cnh_expiry: date | None = None
    mopp: bool | None = None
    mopp_expiry: date | None = None
    zip_code: str | None = Field(default=None, max_length=10)
    street: str | None = Field(default=None, max_length=200)
    number: str | None = Field(default=None, max_length=20)
    complement: str | None = Field(default=None, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=2)
    current_vehicle_id: uuid.UUID | None = None
    status: DRIVER_STATUSES | None = None
    emergency_contact_name: str | None = Field(default=None, max_length=200)
    emergency_contact_phone: str | None = Field(default=None, max_length=30)
    notes: str | None = Field(default=None, max_length=2000)
    is_active: bool | None = None

    @field_validator("phone", "mobile", "emergency_contact_phone")
    @classmethod
    def clean_phone(cls, v: str | None) -> str | None:
        return _clean_digits(v)

    @field_validator("zip_code")
    @classmethod
    def clean_zip(cls, v: str | None) -> str | None:
        return _clean_digits(v)

    @field_validator("state")
    @classmethod
    def uppercase_state(cls, v: str | None) -> str | None:
        return v.upper() if v else None


class DriverResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    cpf: str
    rg: str | None
    email: str | None
    phone: str | None
    mobile: str | None
    birth_date: date | None
    cnh_number: str
    cnh_category: str
    cnh_expiry: date
    cnh_first_issue: date | None
    mopp: bool
    mopp_expiry: date | None
    zip_code: str | None
    street: str | None
    number: str | None
    complement: str | None
    district: str | None
    city: str | None
    state: str | None
    current_vehicle_id: uuid.UUID | None
    current_vehicle_plate: str | None
    status: str
    hire_date: date | None
    termination_date: date | None
    emergency_contact_name: str | None
    emergency_contact_phone: str | None
    notes: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DriverListItem(BaseModel):
    id: uuid.UUID
    full_name: str
    cpf: str
    cnh_category: str
    cnh_expiry: date
    phone: str | None
    status: str
    current_vehicle_plate: str | None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
