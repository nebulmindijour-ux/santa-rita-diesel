import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

VEHICLE_TYPES = Literal["truck", "trailer", "support", "semi_trailer"]
VEHICLE_STATUSES = Literal["available", "in_route", "maintenance", "inactive"]
FUEL_TYPES = Literal["diesel", "gasoline", "ethanol", "flex", "electric", "cng"]


def _clean_plate(v: str) -> str:
    return v.upper().replace("-", "").replace(" ", "").strip()


class CreateVehicleRequest(BaseModel):
    plate: str = Field(min_length=7, max_length=10)
    renavam: str | None = Field(default=None, max_length=20)
    chassis: str | None = Field(default=None, max_length=30)
    vehicle_type: VEHICLE_TYPES = "truck"
    brand: str = Field(min_length=1, max_length=50)
    model: str = Field(min_length=1, max_length=100)
    year_manufacture: int = Field(ge=1950, le=2030)
    year_model: int = Field(ge=1950, le=2031)
    color: str | None = Field(default=None, max_length=30)
    fuel_type: FUEL_TYPES = "diesel"
    axis_count: int | None = Field(default=None, ge=1, le=12)
    capacity_kg: float | None = Field(default=None, ge=0)
    capacity_m3: float | None = Field(default=None, ge=0)
    odometer: float = Field(default=0, ge=0)
    horimeter: float = Field(default=0, ge=0)
    crlv_expiry: date | None = None
    insurance_expiry: date | None = None
    insurance_company: str | None = Field(default=None, max_length=100)
    insurance_policy: str | None = Field(default=None, max_length=50)
    antt_code: str | None = Field(default=None, max_length=30)
    antt_expiry: date | None = None
    tracker_id: str | None = Field(default=None, max_length=50)
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("plate")
    @classmethod
    def normalize_plate(cls, v: str) -> str:
        return _clean_plate(v)


class UpdateVehicleRequest(BaseModel):
    brand: str | None = Field(default=None, min_length=1, max_length=50)
    model: str | None = Field(default=None, min_length=1, max_length=100)
    color: str | None = Field(default=None, max_length=30)
    fuel_type: FUEL_TYPES | None = None
    axis_count: int | None = Field(default=None, ge=1, le=12)
    capacity_kg: float | None = Field(default=None, ge=0)
    capacity_m3: float | None = Field(default=None, ge=0)
    odometer: float | None = Field(default=None, ge=0)
    horimeter: float | None = Field(default=None, ge=0)
    status: VEHICLE_STATUSES | None = None
    crlv_expiry: date | None = None
    insurance_expiry: date | None = None
    insurance_company: str | None = Field(default=None, max_length=100)
    insurance_policy: str | None = Field(default=None, max_length=50)
    antt_code: str | None = Field(default=None, max_length=30)
    antt_expiry: date | None = None
    tracker_id: str | None = Field(default=None, max_length=50)
    notes: str | None = Field(default=None, max_length=2000)
    is_active: bool | None = None


class VehicleResponse(BaseModel):
    id: uuid.UUID
    plate: str
    renavam: str | None
    chassis: str | None
    vehicle_type: str
    brand: str
    model: str
    year_manufacture: int
    year_model: int
    color: str | None
    fuel_type: str
    axis_count: int | None
    capacity_kg: float | None
    capacity_m3: float | None
    odometer: float
    horimeter: float
    status: str
    crlv_expiry: date | None
    insurance_expiry: date | None
    insurance_company: str | None
    insurance_policy: str | None
    antt_code: str | None
    antt_expiry: date | None
    tracker_id: str | None
    notes: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VehicleListItem(BaseModel):
    id: uuid.UUID
    plate: str
    vehicle_type: str
    brand: str
    model: str
    year_model: int
    color: str | None
    odometer: float
    status: str
    is_active: bool
    crlv_expiry: date | None
    insurance_expiry: date | None
    antt_expiry: date | None
    created_at: datetime

    class Config:
        from_attributes = True
