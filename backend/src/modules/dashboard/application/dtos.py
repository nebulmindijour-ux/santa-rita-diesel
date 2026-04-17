from datetime import date, datetime

from pydantic import BaseModel


class MetricCount(BaseModel):
    total: int
    label: str


class FleetStats(BaseModel):
    total: int
    available: int
    in_route: int
    in_maintenance: int
    inactive: int


class DriverStats(BaseModel):
    total: int
    available: int
    in_route: int
    vacation_or_leave: int


class OperationStats(BaseModel):
    total_month: int
    in_transit: int
    completed_month: int
    cancelled_month: int
    pending: int
    delayed: int


class MaintenanceStats(BaseModel):
    open_orders: int
    in_progress_orders: int
    due_schedules: int
    month_cost: float


class DocumentAlert(BaseModel):
    entity_type: str
    entity_id: str
    entity_label: str
    document_type: str
    expires_at: date
    days_remaining: int
    is_expired: bool


class OperationTimelineItem(BaseModel):
    id: str
    code: str
    status: str
    customer_name: str
    vehicle_plate: str | None
    origin_city: str | None
    destination_city: str | None
    scheduled_start: datetime | None


class DashboardResponse(BaseModel):
    fleet: FleetStats
    drivers: DriverStats
    operations: OperationStats
    maintenance: MaintenanceStats
    alerts: list[DocumentAlert]
    recent_operations: list[OperationTimelineItem]
