import uuid
from datetime import UTC, date, datetime

from sqlalchemy import delete, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.errors import NotFoundError
from src.core.pagination import PaginatedResponse, PaginationParams
from src.modules.fleet.domain.models import Vehicle
from src.modules.iam.domain.models import AuditLog
from src.modules.maintenance.application.dtos import (
    CreateMaintenanceScheduleRequest,
    CreateServiceOrderRequest,
    MaintenanceScheduleResponse,
    ServiceOrderItemResponse,
    ServiceOrderListItem,
    ServiceOrderResponse,
    UpdateMaintenanceScheduleRequest,
    UpdateServiceOrderRequest,
)
from src.modules.maintenance.domain.models import (
    MaintenanceSchedule,
    ServiceOrder,
    ServiceOrderItem,
)


class MaintenanceService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create_order(
        self, data: CreateServiceOrderRequest, created_by: uuid.UUID | None = None
    ) -> ServiceOrderResponse:
        code = await self._generate_code()

        parts_cost = sum(i.quantity * i.unit_cost for i in data.items if i.item_type == "part")
        labor_items_cost = sum(i.quantity * i.unit_cost for i in data.items if i.item_type in ("service", "labor"))
        total = parts_cost + labor_items_cost

        order = ServiceOrder(
            code=code,
            vehicle_id=data.vehicle_id,
            order_type=data.order_type,
            priority=data.priority,
            description=data.description,
            vehicle_km=data.vehicle_km,
            scheduled_date=data.scheduled_date,
            technician_name=data.technician_name,
            notes=data.notes,
            parts_cost=parts_cost if parts_cost > 0 else None,
            total_cost=total if total > 0 else None,
            created_by=created_by,
        )
        self._db.add(order)
        await self._db.flush()

        for item_data in data.items:
            item = ServiceOrderItem(
                service_order_id=order.id,
                item_type=item_data.item_type,
                description=item_data.description,
                quantity=item_data.quantity,
                unit_cost=item_data.unit_cost,
                total_cost=round(item_data.quantity * item_data.unit_cost, 2),
            )
            self._db.add(item)

        await self._db.flush()
        await self._db.refresh(order)

        if data.order_type == "corrective":
            await self._db.execute(
                update(Vehicle).where(Vehicle.id == data.vehicle_id).values(status="maintenance")
            )

        self._db.add(AuditLog(
            user_id=created_by, action="service_order.created",
            entity_type="service_order", entity_id=str(order.id),
            detail=f"OS {code} created for vehicle",
        ))

        return self._to_response(order)

    async def get_order(self, order_id: uuid.UUID) -> ServiceOrderResponse:
        order = await self._find_order_or_404(order_id)
        return self._to_response(order)

    async def list_orders(
        self, params: PaginationParams, search: str | None = None,
        status: str | None = None, order_type: str | None = None,
        vehicle_id: str | None = None, priority: str | None = None,
    ) -> PaginatedResponse[ServiceOrderListItem]:
        query = select(ServiceOrder)
        count_query = select(func.count()).select_from(ServiceOrder)
        filters = []
        if search:
            p = f"%{search}%"
            filters.append(or_(ServiceOrder.code.ilike(p), ServiceOrder.description.ilike(p)))
        if status:
            filters.append(ServiceOrder.status == status)
        if order_type:
            filters.append(ServiceOrder.order_type == order_type)
        if vehicle_id:
            filters.append(ServiceOrder.vehicle_id == uuid.UUID(vehicle_id))
        if priority:
            filters.append(ServiceOrder.priority == priority)
        if filters:
            query = query.where(*filters)
            count_query = count_query.where(*filters)
        total = (await self._db.execute(count_query)).scalar_one()
        query = query.order_by(ServiceOrder.created_at.desc()).offset(params.offset).limit(params.page_size)
        orders = (await self._db.execute(query)).scalars().all()
        items = [self._to_list_item(o) for o in orders]
        return PaginatedResponse.create(items=items, total=total, params=params)

    async def update_order(
        self, order_id: uuid.UUID, data: UpdateServiceOrderRequest,
        updated_by: uuid.UUID | None = None,
    ) -> ServiceOrderResponse:
        order = await self._find_order_or_404(order_id)
        update_data = data.model_dump(exclude_unset=True, exclude={"items"})
        new_status = update_data.get("status")

        if new_status == "in_progress" and order.status == "open":
            update_data.setdefault("started_at", datetime.now(UTC))
            await self._db.execute(
                update(Vehicle).where(Vehicle.id == order.vehicle_id).values(status="maintenance")
            )

        if new_status == "completed" and order.status != "completed":
            update_data.setdefault("completed_at", datetime.now(UTC))
            await self._db.execute(
                update(Vehicle).where(Vehicle.id == order.vehicle_id).values(status="available")
            )

        if new_status == "cancelled" and order.status not in ("completed", "cancelled"):
            await self._db.execute(
                update(Vehicle).where(Vehicle.id == order.vehicle_id).values(status="available")
            )

        if data.items is not None:
            await self._db.execute(
                delete(ServiceOrderItem).where(ServiceOrderItem.service_order_id == order_id)
            )
            parts_cost = 0.0
            total = 0.0
            for item_data in data.items:
                item_total = round(item_data.quantity * item_data.unit_cost, 2)
                self._db.add(ServiceOrderItem(
                    service_order_id=order_id,
                    item_type=item_data.item_type,
                    description=item_data.description,
                    quantity=item_data.quantity,
                    unit_cost=item_data.unit_cost,
                    total_cost=item_total,
                ))
                if item_data.item_type == "part":
                    parts_cost += item_total
                total += item_total
            labor_cost = update_data.get("labor_cost") or order.labor_cost or 0
            update_data["parts_cost"] = parts_cost
            update_data["total_cost"] = total + labor_cost

        if update_data:
            await self._db.execute(
                update(ServiceOrder).where(ServiceOrder.id == order_id).values(**update_data)
            )

        await self._db.flush()
        await self._db.refresh(order)

        self._db.add(AuditLog(
            user_id=updated_by, action=f"service_order.{new_status or 'updated'}",
            entity_type="service_order", entity_id=str(order_id),
        ))
        return self._to_response(order)

    async def create_schedule(
        self, data: CreateMaintenanceScheduleRequest, created_by: uuid.UUID | None = None
    ) -> MaintenanceScheduleResponse:
        schedule = MaintenanceSchedule(**data.model_dump())
        self._db.add(schedule)
        await self._db.flush()
        await self._db.refresh(schedule)
        self._db.add(AuditLog(
            user_id=created_by, action="maintenance_schedule.created",
            entity_type="maintenance_schedule", entity_id=str(schedule.id),
        ))
        return await self._schedule_to_response(schedule)

    async def list_schedules(
        self, vehicle_id: str | None = None, include_due_only: bool = False,
    ) -> list[MaintenanceScheduleResponse]:
        query = select(MaintenanceSchedule).where(MaintenanceSchedule.is_active == True)  # noqa: E712
        if vehicle_id:
            vid = uuid.UUID(vehicle_id)
            query = query.where(
                or_(MaintenanceSchedule.vehicle_id == vid, MaintenanceSchedule.applies_to_all == True)  # noqa: E712
            )
        query = query.order_by(MaintenanceSchedule.name)
        results = (await self._db.execute(query)).scalars().all()

        responses = []
        for s in results:
            resp = await self._schedule_to_response(s)
            if include_due_only and not resp.is_due:
                continue
            responses.append(resp)
        return responses

    async def update_schedule(
        self, schedule_id: uuid.UUID, data: UpdateMaintenanceScheduleRequest,
        updated_by: uuid.UUID | None = None,
    ) -> MaintenanceScheduleResponse:
        result = await self._db.execute(
            select(MaintenanceSchedule).where(MaintenanceSchedule.id == schedule_id)
        )
        schedule = result.scalar_one_or_none()
        if not schedule:
            raise NotFoundError("Programação de manutenção", str(schedule_id))
        update_data = data.model_dump(exclude_unset=True)
        if update_data:
            await self._db.execute(
                update(MaintenanceSchedule).where(MaintenanceSchedule.id == schedule_id).values(**update_data)
            )
            await self._db.refresh(schedule)
        return await self._schedule_to_response(schedule)

    async def _generate_code(self) -> str:
        now = datetime.now(UTC)
        prefix = f"OS-{now.strftime('%y%m')}"
        result = await self._db.execute(
            select(func.count()).select_from(ServiceOrder).where(ServiceOrder.code.like(f"{prefix}%"))
        )
        count = result.scalar_one()
        return f"{prefix}-{count + 1:04d}"

    async def _find_order_or_404(self, order_id: uuid.UUID) -> ServiceOrder:
        result = await self._db.execute(select(ServiceOrder).where(ServiceOrder.id == order_id))
        order = result.scalar_one_or_none()
        if not order:
            raise NotFoundError("Ordem de serviço", str(order_id))
        return order

    def _to_response(self, o: ServiceOrder) -> ServiceOrderResponse:
        return ServiceOrderResponse(
            id=o.id, code=o.code, vehicle_id=o.vehicle_id,
            vehicle_plate=o.vehicle.plate if o.vehicle else "—",
            order_type=o.order_type, status=o.status, priority=o.priority,
            description=o.description, vehicle_km=o.vehicle_km,
            scheduled_date=o.scheduled_date, started_at=o.started_at,
            completed_at=o.completed_at, labor_hours=o.labor_hours,
            labor_cost=o.labor_cost, parts_cost=o.parts_cost, total_cost=o.total_cost,
            technician_name=o.technician_name, notes=o.notes,
            items=[ServiceOrderItemResponse.model_validate(i) for i in o.items],
            created_at=o.created_at, updated_at=o.updated_at,
        )

    def _to_list_item(self, o: ServiceOrder) -> ServiceOrderListItem:
        return ServiceOrderListItem(
            id=o.id, code=o.code,
            vehicle_plate=o.vehicle.plate if o.vehicle else "—",
            order_type=o.order_type, status=o.status, priority=o.priority,
            description=o.description, vehicle_km=o.vehicle_km,
            total_cost=o.total_cost, scheduled_date=o.scheduled_date,
            created_at=o.created_at,
        )

    async def _schedule_to_response(self, s: MaintenanceSchedule) -> MaintenanceScheduleResponse:
        is_due = False
        km_remaining: int | None = None
        days_remaining: int | None = None

        if s.vehicle and s.interval_km and s.last_done_km is not None:
            next_km = s.last_done_km + s.interval_km
            km_remaining = int(next_km - s.vehicle.odometer)
            if km_remaining <= 0:
                is_due = True

        if s.interval_days and s.last_done_date:
            from datetime import timedelta
            next_date = s.last_done_date + timedelta(days=s.interval_days)
            days_remaining = (next_date - date.today()).days
            if days_remaining <= 0:
                is_due = True

        return MaintenanceScheduleResponse(
            id=s.id, vehicle_id=s.vehicle_id,
            vehicle_plate=s.vehicle.plate if s.vehicle else None,
            applies_to_all=s.applies_to_all, name=s.name,
            description=s.description, interval_km=s.interval_km,
            interval_days=s.interval_days, last_done_km=s.last_done_km,
            last_done_date=s.last_done_date, is_active=s.is_active,
            is_due=is_due, km_remaining=km_remaining,
            days_remaining=days_remaining, created_at=s.created_at,
        )
