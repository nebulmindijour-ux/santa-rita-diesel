import uuid
from datetime import UTC, datetime

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.errors import ConflictError, NotFoundError
from src.core.pagination import PaginatedResponse, PaginationParams
from src.modules.drivers.domain.models import Driver
from src.modules.fleet.domain.models import Vehicle
from src.modules.iam.domain.models import AuditLog
from src.modules.operations.application.dtos import (
    CreateOperationRequest,
    OperationListItem,
    OperationResponse,
    UpdateOperationRequest,
)
from src.modules.operations.domain.models import Operation


class OperationService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(
        self, data: CreateOperationRequest, created_by: uuid.UUID | None = None
    ) -> OperationResponse:
        code = await self._generate_code()

        operation = Operation(
            code=code,
            created_by=created_by,
            **data.model_dump(),
        )
        self._db.add(operation)
        await self._db.flush()
        await self._db.refresh(operation)

        if data.vehicle_id and data.driver_id:
            await self._db.execute(
                update(Vehicle).where(Vehicle.id == data.vehicle_id).values(status="in_route")
            )
            await self._db.execute(
                update(Driver).where(Driver.id == data.driver_id).values(
                    status="in_route", current_vehicle_id=data.vehicle_id
                )
            )

        self._db.add(AuditLog(
            user_id=created_by,
            action="operation.created",
            entity_type="operation",
            entity_id=str(operation.id),
            detail=f"Operation {code} created",
        ))

        return self._to_response(operation)

    async def get_by_id(self, operation_id: uuid.UUID) -> OperationResponse:
        op = await self._find_or_404(operation_id)
        return self._to_response(op)

    async def list(
        self,
        params: PaginationParams,
        search: str | None = None,
        status: str | None = None,
        customer_id: str | None = None,
        vehicle_id: str | None = None,
        driver_id: str | None = None,
    ) -> PaginatedResponse[OperationListItem]:
        from src.modules.customers.domain.models import Customer

        query = select(Operation)
        count_query = select(func.count()).select_from(Operation)
        filters = []

        if search:
            pattern = f"%{search}%"
            filters.append(
                or_(
                    Operation.code.ilike(pattern),
                    Operation.origin_description.ilike(pattern),
                    Operation.destination_description.ilike(pattern),
                    Operation.origin_city.ilike(pattern),
                    Operation.destination_city.ilike(pattern),
                )
            )
        if status:
            filters.append(Operation.status == status)
        if customer_id:
            filters.append(Operation.customer_id == uuid.UUID(customer_id))
        if vehicle_id:
            filters.append(Operation.vehicle_id == uuid.UUID(vehicle_id))
        if driver_id:
            filters.append(Operation.driver_id == uuid.UUID(driver_id))

        if filters:
            query = query.where(*filters)
            count_query = count_query.where(*filters)

        total = (await self._db.execute(count_query)).scalar_one()
        query = query.order_by(Operation.created_at.desc()).offset(params.offset).limit(params.page_size)
        operations = (await self._db.execute(query)).scalars().all()
        items = [self._to_list_item(op) for op in operations]
        return PaginatedResponse.create(items=items, total=total, params=params)

    async def update(
        self,
        operation_id: uuid.UUID,
        data: UpdateOperationRequest,
        updated_by: uuid.UUID | None = None,
    ) -> OperationResponse:
        op = await self._find_or_404(operation_id)
        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            return self._to_response(op)

        new_status = update_data.get("status")
        old_status = op.status

        if new_status == "in_transit" and old_status in ("pending", "assigned"):
            update_data.setdefault("actual_start", datetime.now(UTC))
            if op.vehicle_id:
                await self._db.execute(
                    update(Vehicle).where(Vehicle.id == op.vehicle_id).values(status="in_route")
                )
            if op.driver_id:
                await self._db.execute(
                    update(Driver).where(Driver.id == op.driver_id).values(status="in_route")
                )

        if new_status == "completed" and old_status != "completed":
            update_data.setdefault("actual_end", datetime.now(UTC))

            odometer_end = update_data.get("odometer_end") or op.odometer_end
            if odometer_end and op.vehicle_id:
                await self._db.execute(
                    update(Vehicle)
                    .where(Vehicle.id == op.vehicle_id)
                    .values(odometer=odometer_end, status="available")
                )

            if op.driver_id:
                await self._db.execute(
                    update(Driver).where(Driver.id == op.driver_id).values(status="available")
                )

        if new_status == "cancelled" and old_status not in ("completed", "cancelled"):
            if op.vehicle_id:
                await self._db.execute(
                    update(Vehicle).where(Vehicle.id == op.vehicle_id).values(status="available")
                )
            if op.driver_id:
                await self._db.execute(
                    update(Driver).where(Driver.id == op.driver_id).values(status="available")
                )

        await self._db.execute(
            update(Operation).where(Operation.id == operation_id).values(**update_data)
        )
        await self._db.refresh(op)

        self._db.add(AuditLog(
            user_id=updated_by,
            action=f"operation.{new_status or 'updated'}",
            entity_type="operation",
            entity_id=str(operation_id),
            detail=f"Fields: {', '.join(update_data.keys())}",
        ))

        return self._to_response(op)

    async def _generate_code(self) -> str:
        now = datetime.now(UTC)
        prefix = f"OP-{now.strftime('%y%m')}"
        result = await self._db.execute(
            select(func.count())
            .select_from(Operation)
            .where(Operation.code.like(f"{prefix}%"))
        )
        count = result.scalar_one()
        return f"{prefix}-{count + 1:04d}"

    async def _find_or_404(self, operation_id: uuid.UUID) -> Operation:
        result = await self._db.execute(
            select(Operation).where(Operation.id == operation_id)
        )
        op = result.scalar_one_or_none()
        if not op:
            raise NotFoundError("Operação", str(operation_id))
        return op

    def _to_response(self, op: Operation) -> OperationResponse:
        return OperationResponse(
            id=op.id,
            code=op.code,
            customer_id=op.customer_id,
            customer_name=op.customer.legal_name if op.customer else "—",
            vehicle_id=op.vehicle_id,
            vehicle_plate=op.vehicle.plate if op.vehicle else None,
            driver_id=op.driver_id,
            driver_name=op.driver.full_name if op.driver else None,
            status=op.status,
            origin_description=op.origin_description,
            origin_city=op.origin_city,
            origin_state=op.origin_state,
            origin_latitude=op.origin_latitude,
            origin_longitude=op.origin_longitude,
            destination_description=op.destination_description,
            destination_city=op.destination_city,
            destination_state=op.destination_state,
            destination_latitude=op.destination_latitude,
            destination_longitude=op.destination_longitude,
            distance_km=op.distance_km,
            estimated_duration_hours=op.estimated_duration_hours,
            cargo_description=op.cargo_description,
            cargo_weight_kg=op.cargo_weight_kg,
            cargo_volume_m3=op.cargo_volume_m3,
            odometer_start=op.odometer_start,
            odometer_end=op.odometer_end,
            actual_distance_km=op.actual_distance_km,
            scheduled_start=op.scheduled_start,
            scheduled_end=op.scheduled_end,
            actual_start=op.actual_start,
            actual_end=op.actual_end,
            notes=op.notes,
            created_at=op.created_at,
            updated_at=op.updated_at,
        )

    def _to_list_item(self, op: Operation) -> OperationListItem:
        return OperationListItem(
            id=op.id,
            code=op.code,
            customer_name=op.customer.legal_name if op.customer else "—",
            vehicle_plate=op.vehicle.plate if op.vehicle else None,
            driver_name=op.driver.full_name if op.driver else None,
            status=op.status,
            origin_city=op.origin_city,
            origin_state=op.origin_state,
            destination_city=op.destination_city,
            destination_state=op.destination_state,
            distance_km=op.distance_km,
            scheduled_start=op.scheduled_start,
            scheduled_end=op.scheduled_end,
            actual_start=op.actual_start,
            actual_end=op.actual_end,
            created_at=op.created_at,
        )
