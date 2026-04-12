import uuid

from fastapi import APIRouter, Query
from sqlalchemy import delete, select

from src.core.dependencies import DbSession, Pagination
from src.core.errors import NotFoundError
from src.core.pagination import PaginatedResponse
from src.modules.auth.presentation.dependencies import CurrentUser
from src.modules.drivers.application.dtos import CreateDriverRequest, DriverListItem, DriverResponse, UpdateDriverRequest
from src.modules.drivers.application.service import DriverService
from src.modules.drivers.domain.models import Driver
from src.modules.iam.domain.models import AuditLog

router = APIRouter(prefix="/drivers", tags=["drivers"])


@router.post("", response_model=DriverResponse, status_code=201)
async def create_driver(data: CreateDriverRequest, db: DbSession, current_user: CurrentUser) -> DriverResponse:
    return await DriverService(db).create(data, created_by=current_user.id)


@router.get("", response_model=PaginatedResponse[DriverListItem])
async def list_drivers(db: DbSession, pagination: Pagination, current_user: CurrentUser, search: str | None = Query(None, max_length=100), status: str | None = Query(None), is_active: bool | None = Query(None)) -> PaginatedResponse[DriverListItem]:
    return await DriverService(db).list(params=pagination, search=search, status=status, is_active=is_active)


@router.get("/{driver_id}", response_model=DriverResponse)
async def get_driver(driver_id: uuid.UUID, db: DbSession, current_user: CurrentUser) -> DriverResponse:
    return await DriverService(db).get_by_id(driver_id)


@router.patch("/{driver_id}", response_model=DriverResponse)
async def update_driver(driver_id: uuid.UUID, data: UpdateDriverRequest, db: DbSession, current_user: CurrentUser) -> DriverResponse:
    return await DriverService(db).update(driver_id, data, updated_by=current_user.id)


@router.delete("/{driver_id}", status_code=204)
async def delete_driver(driver_id: uuid.UUID, db: DbSession, current_user: CurrentUser) -> None:
    result = await db.execute(select(Driver).where(Driver.id == driver_id))
    driver = result.scalar_one_or_none()
    if not driver:
        raise NotFoundError("Motorista", str(driver_id))
    db.add(AuditLog(
        user_id=current_user.id,
        action="driver.deleted",
        entity_type="driver",
        entity_id=str(driver_id),
        detail=f"Driver {driver.full_name} permanently deleted",
    ))
    await db.execute(delete(Driver).where(Driver.id == driver_id))
