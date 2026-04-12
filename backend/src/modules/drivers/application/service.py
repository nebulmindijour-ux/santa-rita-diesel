import uuid

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.errors import ConflictError, NotFoundError
from src.core.pagination import PaginatedResponse, PaginationParams
from src.modules.drivers.application.dtos import (
    CreateDriverRequest,
    DriverListItem,
    DriverResponse,
    UpdateDriverRequest,
)
from src.modules.drivers.domain.models import Driver
from src.modules.iam.domain.models import AuditLog


class DriverService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(self, data: CreateDriverRequest, created_by: uuid.UUID | None = None) -> DriverResponse:
        existing_cpf = await self._db.execute(select(Driver).where(Driver.cpf == data.cpf))
        if existing_cpf.scalar_one_or_none():
            raise ConflictError(f"Já existe um motorista com o CPF '{data.cpf}'.")

        existing_cnh = await self._db.execute(select(Driver).where(Driver.cnh_number == data.cnh_number))
        if existing_cnh.scalar_one_or_none():
            raise ConflictError(f"Já existe um motorista com a CNH '{data.cnh_number}'.")

        driver = Driver(**data.model_dump())
        self._db.add(driver)
        await self._db.flush()
        await self._db.refresh(driver)

        self._db.add(AuditLog(user_id=created_by, action="driver.created", entity_type="driver", entity_id=str(driver.id), detail=f"Driver {driver.full_name} created"))
        return self._to_response(driver)

    async def get_by_id(self, driver_id: uuid.UUID) -> DriverResponse:
        driver = await self._find_or_404(driver_id)
        return self._to_response(driver)

    async def list(self, params: PaginationParams, search: str | None = None, status: str | None = None, is_active: bool | None = None) -> PaginatedResponse[DriverListItem]:
        query = select(Driver)
        count_query = select(func.count()).select_from(Driver)
        filters = []
        if search:
            pattern = f"%{search}%"
            filters.append(or_(Driver.full_name.ilike(pattern), Driver.cpf.ilike(pattern), Driver.cnh_number.ilike(pattern)))
        if status:
            filters.append(Driver.status == status)
        if is_active is not None:
            filters.append(Driver.is_active == is_active)
        if filters:
            query = query.where(*filters)
            count_query = count_query.where(*filters)
        total = (await self._db.execute(count_query)).scalar_one()
        query = query.order_by(Driver.created_at.desc()).offset(params.offset).limit(params.page_size)
        drivers = (await self._db.execute(query)).scalars().all()
        items = [self._to_list_item(d) for d in drivers]
        return PaginatedResponse.create(items=items, total=total, params=params)

    async def update(self, driver_id: uuid.UUID, data: UpdateDriverRequest, updated_by: uuid.UUID | None = None) -> DriverResponse:
        driver = await self._find_or_404(driver_id)
        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            return self._to_response(driver)
        await self._db.execute(update(Driver).where(Driver.id == driver_id).values(**update_data))
        await self._db.refresh(driver)
        self._db.add(AuditLog(user_id=updated_by, action="driver.updated", entity_type="driver", entity_id=str(driver.id), detail=f"Fields: {', '.join(update_data.keys())}"))
        return self._to_response(driver)

    async def _find_or_404(self, driver_id: uuid.UUID) -> Driver:
        result = await self._db.execute(select(Driver).where(Driver.id == driver_id))
        driver = result.scalar_one_or_none()
        if not driver:
            raise NotFoundError("Motorista", str(driver_id))
        return driver

    def _to_response(self, d: Driver) -> DriverResponse:
        return DriverResponse(
            id=d.id, full_name=d.full_name, cpf=d.cpf, rg=d.rg,
            email=d.email, phone=d.phone, mobile=d.mobile, birth_date=d.birth_date,
            cnh_number=d.cnh_number, cnh_category=d.cnh_category,
            cnh_expiry=d.cnh_expiry, cnh_first_issue=d.cnh_first_issue,
            mopp=d.mopp, mopp_expiry=d.mopp_expiry,
            zip_code=d.zip_code, street=d.street, number=d.number,
            complement=d.complement, district=d.district, city=d.city, state=d.state,
            current_vehicle_id=d.current_vehicle_id,
            current_vehicle_plate=d.current_vehicle.plate if d.current_vehicle else None,
            status=d.status, hire_date=d.hire_date, termination_date=d.termination_date,
            emergency_contact_name=d.emergency_contact_name,
            emergency_contact_phone=d.emergency_contact_phone,
            notes=d.notes, is_active=d.is_active,
            created_at=d.created_at, updated_at=d.updated_at,
        )

    def _to_list_item(self, d: Driver) -> DriverListItem:
        return DriverListItem(
            id=d.id, full_name=d.full_name, cpf=d.cpf,
            cnh_category=d.cnh_category, cnh_expiry=d.cnh_expiry,
            phone=d.phone, status=d.status,
            current_vehicle_plate=d.current_vehicle.plate if d.current_vehicle else None,
            is_active=d.is_active, created_at=d.created_at,
        )
