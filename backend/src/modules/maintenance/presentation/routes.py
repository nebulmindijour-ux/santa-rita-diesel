import uuid

from fastapi import APIRouter, Query

from src.core.dependencies import DbSession, Pagination
from src.core.pagination import PaginatedResponse
from src.modules.auth.presentation.dependencies import CurrentUser
from src.modules.maintenance.application.dtos import (
    CreateMaintenanceScheduleRequest,
    CreateServiceOrderRequest,
    MaintenanceScheduleResponse,
    ServiceOrderListItem,
    ServiceOrderResponse,
    UpdateMaintenanceScheduleRequest,
    UpdateServiceOrderRequest,
)
from src.modules.maintenance.application.service import MaintenanceService

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


@router.post("/orders", response_model=ServiceOrderResponse, status_code=201)
async def create_order(data: CreateServiceOrderRequest, db: DbSession, current_user: CurrentUser) -> ServiceOrderResponse:
    return await MaintenanceService(db).create_order(data, created_by=current_user.id)


@router.get("/orders", response_model=PaginatedResponse[ServiceOrderListItem])
async def list_orders(
    db: DbSession, pagination: Pagination, current_user: CurrentUser,
    search: str | None = Query(None, max_length=100),
    status: str | None = Query(None),
    order_type: str | None = Query(None),
    vehicle_id: str | None = Query(None),
    priority: str | None = Query(None),
) -> PaginatedResponse[ServiceOrderListItem]:
    return await MaintenanceService(db).list_orders(
        params=pagination, search=search, status=status,
        order_type=order_type, vehicle_id=vehicle_id, priority=priority,
    )


@router.get("/orders/{order_id}", response_model=ServiceOrderResponse)
async def get_order(order_id: uuid.UUID, db: DbSession, current_user: CurrentUser) -> ServiceOrderResponse:
    return await MaintenanceService(db).get_order(order_id)


@router.patch("/orders/{order_id}", response_model=ServiceOrderResponse)
async def update_order(order_id: uuid.UUID, data: UpdateServiceOrderRequest, db: DbSession, current_user: CurrentUser) -> ServiceOrderResponse:
    return await MaintenanceService(db).update_order(order_id, data, updated_by=current_user.id)


@router.post("/schedules", response_model=MaintenanceScheduleResponse, status_code=201)
async def create_schedule(data: CreateMaintenanceScheduleRequest, db: DbSession, current_user: CurrentUser) -> MaintenanceScheduleResponse:
    return await MaintenanceService(db).create_schedule(data, created_by=current_user.id)


@router.get("/schedules", response_model=list[MaintenanceScheduleResponse])
async def list_schedules(
    db: DbSession, current_user: CurrentUser,
    vehicle_id: str | None = Query(None),
    due_only: bool = Query(False),
) -> list[MaintenanceScheduleResponse]:
    return await MaintenanceService(db).list_schedules(vehicle_id=vehicle_id, include_due_only=due_only)


@router.patch("/schedules/{schedule_id}", response_model=MaintenanceScheduleResponse)
async def update_schedule(schedule_id: uuid.UUID, data: UpdateMaintenanceScheduleRequest, db: DbSession, current_user: CurrentUser) -> MaintenanceScheduleResponse:
    return await MaintenanceService(db).update_schedule(schedule_id, data, updated_by=current_user.id)
