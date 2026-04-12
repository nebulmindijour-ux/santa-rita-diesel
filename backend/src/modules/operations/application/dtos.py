import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

OPERATION_STATUSES = Literal[
    "pending", "assigned", "in_transit", "loading", "unloading",
    "completed", "cancelled", "delayed",
]


class CreateOperationRequest(BaseModel):
    customer_id: uuid.UUID
    vehicle_id: uuid.UUID | None = None
    driver_id: uuid.UUID | None = None

    origin_description: str = Field(min_length=2, max_length=300)
    origin_city: str | None = Field(default=None, max_length=100)
    origin_state: str | None = Field(default=None, max_length=2)
    origin_latitude: float | None = Field(default=None, ge=-90, le=90)
    origin_longitude: float | None = Field(default=None, ge=-180, le=180)

    destination_description: str = Field(min_length=2, max_length=300)
    destination_city: str | None = Field(default=None, max_length=100)
    destination_state: str | None = Field(default=None, max_length=2)
    destination_latitude: float | None = Field(default=None, ge=-90, le=90)
    destination_longitude: float | None = Field(default=None, ge=-180, le=180)

    distance_km: float | None = Field(default=None, ge=0)
    estimated_duration_hours: float | None = Field(default=None, ge=0)

    cargo_description: str | None = Field(default=None, max_length=500)
    cargo_weight_kg: float | None = Field(default=None, ge=0)
    cargo_volume_m3: float | None = Field(default=None, ge=0)

    odometer_start: float | None = Field(default=None, ge=0)

    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None

    notes: str | None = Field(default=None, max_length=5000)


class UpdateOperationRequest(BaseModel):
    vehicle_id: uuid.UUID | None = None
    driver_id: uuid.UUID | None = None
    status: OPERATION_STATUSES | None = None

    origin_description: str | None = Field(default=None, min_length=2, max_length=300)
    origin_city: str | None = Field(default=None, max_length=100)
    origin_state: str | None = Field(default=None, max_length=2)
    origin_latitude: float | None = Field(default=None, ge=-90, le=90)
    origin_longitude: float | None = Field(default=None, ge=-180, le=180)

    destination_description: str | None = Field(default=None, min_length=2, max_length=300)
    destination_city: str | None = Field(default=None, max_length=100)
    destination_state: str | None = Field(default=None, max_length=2)
    destination_latitude: float | None = Field(default=None, ge=-90, le=90)
    destination_longitude: float | None = Field(default=None, ge=-180, le=180)

    distance_km: float | None = Field(default=None, ge=0)
    estimated_duration_hours: float | None = Field(default=None, ge=0)

    cargo_description: str | None = Field(default=None, max_length=500)
    cargo_weight_kg: float | None = Field(default=None, ge=0)
    cargo_volume_m3: float | None = Field(default=None, ge=0)

    odometer_start: float | None = Field(default=None, ge=0)
    odometer_end: float | None = Field(default=None, ge=0)

    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None
    actual_start: datetime | None = None
    actual_end: datetime | None = None

    notes: str | None = Field(default=None, max_length=5000)


class OperationResponse(BaseModel):
    id: uuid.UUID
    code: str
    customer_id: uuid.UUID
    customer_name: str
    vehicle_id: uuid.UUID | None
    vehicle_plate: str | None
    driver_id: uuid.UUID | None
    driver_name: str | None
    status: str
    origin_description: str
    origin_city: str | None
    origin_state: str | None
    origin_latitude: float | None
    origin_longitude: float | None
    destination_description: str
    destination_city: str | None
    destination_state: str | None
    destination_latitude: float | None
    destination_longitude: float | None
    distance_km: float | None
    estimated_duration_hours: float | None
    cargo_description: str | None
    cargo_weight_kg: float | None
    cargo_volume_m3: float | None
    odometer_start: float | None
    odometer_end: float | None
    actual_distance_km: float | None
    scheduled_start: datetime | None
    scheduled_end: datetime | None
    actual_start: datetime | None
    actual_end: datetime | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OperationListItem(BaseModel):
    id: uuid.UUID
    code: str
    customer_name: str
    vehicle_plate: str | None
    driver_name: str | None
    status: str
    origin_city: str | None
    origin_state: str | None
    destination_city: str | None
    destination_state: str | None
    distance_km: float | None
    scheduled_start: datetime | None
    scheduled_end: datetime | None
    actual_start: datetime | None
    actual_end: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True
