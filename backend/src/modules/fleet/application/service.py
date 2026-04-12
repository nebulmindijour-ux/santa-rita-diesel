import uuid

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.errors import ConflictError, NotFoundError
from src.core.pagination import PaginatedResponse, PaginationParams
from src.modules.fleet.application.dtos import (
    CreateVehicleRequest,
    UpdateVehicleRequest,
    VehicleListItem,
    VehicleResponse,
)
from src.modules.fleet.domain.models import Vehicle
from src.modules.iam.domain.models import AuditLog


class VehicleService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(self, data: CreateVehicleRequest, created_by: uuid.UUID | None = None) -> VehicleResponse:
        existing = await self._db.execute(select(Vehicle).where(Vehicle.plate == data.plate))
        if existing.scalar_one_or_none():
            raise ConflictError(f"Já existe um veículo com a placa '{data.plate}'.")

        vehicle = Vehicle(**data.model_dump())
        self._db.add(vehicle)
        await self._db.flush()
        await self._db.refresh(vehicle)

        self._db.add(AuditLog(user_id=created_by, action="vehicle.created", entity_type="vehicle", entity_id=str(vehicle.id), detail=f"Vehicle {vehicle.plate} created"))
        return VehicleResponse.model_validate(vehicle)

    async def get_by_id(self, vehicle_id: uuid.UUID) -> VehicleResponse:
        vehicle = await self._find_or_404(vehicle_id)
        return VehicleResponse.model_validate(vehicle)

    async def list(self, params: PaginationParams, search: str | None = None, vehicle_type: str | None = None, status: str | None = None, is_active: bool | None = None) -> PaginatedResponse[VehicleListItem]:
        query = select(Vehicle)
        count_query = select(func.count()).select_from(Vehicle)
        filters = []
        if search:
            pattern = f"%{search}%"
            filters.append(or_(Vehicle.plate.ilike(pattern), Vehicle.brand.ilike(pattern), Vehicle.model.ilike(pattern)))
        if vehicle_type:
            filters.append(Vehicle.vehicle_type == vehicle_type)
        if status:
            filters.append(Vehicle.status == status)
        if is_active is not None:
            filters.append(Vehicle.is_active == is_active)
        if filters:
            query = query.where(*filters)
            count_query = count_query.where(*filters)
        total = (await self._db.execute(count_query)).scalar_one()
        query = query.order_by(Vehicle.created_at.desc()).offset(params.offset).limit(params.page_size)
        vehicles = (await self._db.execute(query)).scalars().all()
        items = [VehicleListItem.model_validate(v) for v in vehicles]
        return PaginatedResponse.create(items=items, total=total, params=params)

    async def update(self, vehicle_id: uuid.UUID, data: UpdateVehicleRequest, updated_by: uuid.UUID | None = None) -> VehicleResponse:
        vehicle = await self._find_or_404(vehicle_id)
        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            return VehicleResponse.model_validate(vehicle)
        await self._db.execute(update(Vehicle).where(Vehicle.id == vehicle_id).values(**update_data))
        await self._db.refresh(vehicle)
        self._db.add(AuditLog(user_id=updated_by, action="vehicle.updated", entity_type="vehicle", entity_id=str(vehicle.id), detail=f"Fields: {', '.join(update_data.keys())}"))
        return VehicleResponse.model_validate(vehicle)

    async def _find_or_404(self, vehicle_id: uuid.UUID) -> Vehicle:
        result = await self._db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
        vehicle = result.scalar_one_or_none()
        if not vehicle:
            raise NotFoundError("Veículo", str(vehicle_id))
        return vehicle
