import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

ORDER_TYPES = Literal["preventive", "corrective"]
ORDER_STATUSES = Literal["open", "in_progress", "waiting_parts", "completed", "cancelled"]
PRIORITIES = Literal["low", "normal", "high", "urgent"]
ITEM_TYPES = Literal["part", "service", "labor"]


class ServiceOrderItemDTO(BaseModel):
    item_type: ITEM_TYPES = "part"
    description: str = Field(min_length=1, max_length=300)
    quantity: float = Field(ge=0.01, default=1)
    unit_cost: float = Field(ge=0, default=0)


class CreateServiceOrderRequest(BaseModel):
    vehicle_id: uuid.UUID
    order_type: ORDER_TYPES = "corrective"
    priority: PRIORITIES = "normal"
    description: str = Field(min_length=2, max_length=5000)
    vehicle_km: float | None = Field(default=None, ge=0)
    scheduled_date: date | None = None
    technician_name: str | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=5000)
    items: list[ServiceOrderItemDTO] = Field(default_factory=list)


class UpdateServiceOrderRequest(BaseModel):
    status: ORDER_STATUSES | None = None
    priority: PRIORITIES | None = None
    description: str | None = Field(default=None, min_length=2, max_length=5000)
    vehicle_km: float | None = Field(default=None, ge=0)
    scheduled_date: date | None = None
    technician_name: str | None = Field(default=None, max_length=200)
    labor_hours: float | None = Field(default=None, ge=0)
    labor_cost: float | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None, max_length=5000)
    items: list[ServiceOrderItemDTO] | None = None


class ServiceOrderItemResponse(BaseModel):
    id: uuid.UUID
    item_type: str
    description: str
    quantity: float
    unit_cost: float
    total_cost: float

    class Config:
        from_attributes = True


class ServiceOrderResponse(BaseModel):
    id: uuid.UUID
    code: str
    vehicle_id: uuid.UUID
    vehicle_plate: str
    order_type: str
    status: str
    priority: str
    description: str
    vehicle_km: float | None
    scheduled_date: date | None
    started_at: datetime | None
    completed_at: datetime | None
    labor_hours: float | None
    labor_cost: float | None
    parts_cost: float | None
    total_cost: float | None
    technician_name: str | None
    notes: str | None
    items: list[ServiceOrderItemResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ServiceOrderListItem(BaseModel):
    id: uuid.UUID
    code: str
    vehicle_plate: str
    order_type: str
    status: str
    priority: str
    description: str
    vehicle_km: float | None
    total_cost: float | None
    scheduled_date: date | None
    created_at: datetime

    class Config:
        from_attributes = True


class CreateMaintenanceScheduleRequest(BaseModel):
    vehicle_id: uuid.UUID | None = None
    applies_to_all: bool = False
    name: str = Field(min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=500)
    interval_km: int | None = Field(default=None, ge=100)
    interval_days: int | None = Field(default=None, ge=1)
    last_done_km: float | None = Field(default=None, ge=0)
    last_done_date: date | None = None


class UpdateMaintenanceScheduleRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=500)
    interval_km: int | None = Field(default=None, ge=100)
    interval_days: int | None = Field(default=None, ge=1)
    last_done_km: float | None = Field(default=None, ge=0)
    last_done_date: date | None = None
    is_active: bool | None = None


class MaintenanceScheduleResponse(BaseModel):
    id: uuid.UUID
    vehicle_id: uuid.UUID | None
    vehicle_plate: str | None
    applies_to_all: bool
    name: str
    description: str | None
    interval_km: int | None
    interval_days: int | None
    last_done_km: float | None
    last_done_date: date | None
    is_active: bool
    is_due: bool
    km_remaining: int | None
    days_remaining: int | None
    created_at: datetime

    class Config:
        from_attributes = True
