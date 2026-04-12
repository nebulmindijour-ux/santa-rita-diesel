import uuid

from fastapi import APIRouter, Query
from sqlalchemy import delete, select

from src.core.dependencies import DbSession, Pagination
from src.core.errors import NotFoundError
from src.core.pagination import PaginatedResponse
from src.modules.auth.presentation.dependencies import CurrentUser
from src.modules.fleet.application.dtos import CreateVehicleRequest, UpdateVehicleRequest, VehicleListItem, VehicleResponse
from src.modules.fleet.application.service import VehicleService
from src.modules.fleet.domain.models import Vehicle
from src.modules.iam.domain.models import AuditLog

router = APIRouter(prefix="/vehicles", tags=["fleet"])


@router.post("", response_model=VehicleResponse, status_code=201)
async def create_vehicle(data: CreateVehicleRequest, db: DbSession, current_user: CurrentUser) -> VehicleResponse:
    return await VehicleService(db).create(data, created_by=current_user.id)


@router.get("", response_model=PaginatedResponse[VehicleListItem])
async def list_vehicles(db: DbSession, pagination: Pagination, current_user: CurrentUser, search: str | None = Query(None, max_length=100), vehicle_type: str | None = Query(None), status: str | None = Query(None), is_active: bool | None = Query(None)) -> PaginatedResponse[VehicleListItem]:
    return await VehicleService(db).list(params=pagination, search=search, vehicle_type=vehicle_type, status=status, is_active=is_active)


@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(vehicle_id: uuid.UUID, db: DbSession, current_user: CurrentUser) -> VehicleResponse:
    return await VehicleService(db).get_by_id(vehicle_id)


@router.patch("/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(vehicle_id: uuid.UUID, data: UpdateVehicleRequest, db: DbSession, current_user: CurrentUser) -> VehicleResponse:
    return await VehicleService(db).update(vehicle_id, data, updated_by=current_user.id)


@router.delete("/{vehicle_id}", status_code=204)
async def delete_vehicle(vehicle_id: uuid.UUID, db: DbSession, current_user: CurrentUser) -> None:
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise NotFoundError("Veículo", str(vehicle_id))
    db.add(AuditLog(
        user_id=current_user.id,
        action="vehicle.deleted",
        entity_type="vehicle",
        entity_id=str(vehicle_id),
        detail=f"Vehicle {vehicle.plate} permanently deleted",
    ))
    await db.execute(delete(Vehicle).where(Vehicle.id == vehicle_id))
