from datetime import UTC, date, datetime, timedelta

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.dashboard.application.dtos import (
    DashboardResponse, DocumentAlert, DriverStats, FleetStats,
    MaintenanceStats, OperationStats, OperationTimelineItem,
)
from src.modules.drivers.domain.models import Driver
from src.modules.fleet.domain.models import Vehicle
from src.modules.maintenance.domain.models import MaintenanceSchedule, ServiceOrder
from src.modules.operations.domain.models import Operation


class DashboardService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_overview(self) -> DashboardResponse:
        fleet = await self._fleet_stats()
        drivers = await self._driver_stats()
        operations = await self._operation_stats()
        maintenance = await self._maintenance_stats()
        alerts = await self._document_alerts()
        recent = await self._recent_operations()

        return DashboardResponse(
            fleet=fleet, drivers=drivers, operations=operations,
            maintenance=maintenance, alerts=alerts, recent_operations=recent,
        )

    async def _fleet_stats(self) -> FleetStats:
        result = await self._db.execute(
            select(Vehicle.status, func.count())
            .where(Vehicle.is_active == True)  # noqa: E712
            .group_by(Vehicle.status)
        )
        counts = dict(result.all())
        total = sum(counts.values())
        return FleetStats(
            total=total,
            available=counts.get("available", 0),
            in_route=counts.get("in_route", 0),
            in_maintenance=counts.get("maintenance", 0),
            inactive=counts.get("inactive", 0),
        )

    async def _driver_stats(self) -> DriverStats:
        result = await self._db.execute(
            select(Driver.status, func.count())
            .where(Driver.is_active == True)  # noqa: E712
            .group_by(Driver.status)
        )
        counts = dict(result.all())
        total = sum(counts.values())
        return DriverStats(
            total=total,
            available=counts.get("available", 0),
            in_route=counts.get("in_route", 0),
            vacation_or_leave=counts.get("vacation", 0) + counts.get("leave", 0),
        )

    async def _operation_stats(self) -> OperationStats:
        now = datetime.now(UTC)
        month_start = datetime(now.year, now.month, 1, tzinfo=UTC)

        total_month = await self._count(
            select(func.count()).select_from(Operation).where(Operation.created_at >= month_start)
        )
        in_transit = await self._count(
            select(func.count()).select_from(Operation).where(Operation.status == "in_transit")
        )
        completed_month = await self._count(
            select(func.count()).select_from(Operation).where(
                and_(Operation.status == "completed", Operation.actual_end >= month_start)
            )
        )
        cancelled_month = await self._count(
            select(func.count()).select_from(Operation).where(
                and_(Operation.status == "cancelled", Operation.updated_at >= month_start)
            )
        )
        pending = await self._count(
            select(func.count()).select_from(Operation).where(
                Operation.status.in_(["pending", "assigned"])
            )
        )
        delayed = await self._count(
            select(func.count()).select_from(Operation).where(Operation.status == "delayed")
        )

        return OperationStats(
            total_month=total_month, in_transit=in_transit,
            completed_month=completed_month, cancelled_month=cancelled_month,
            pending=pending, delayed=delayed,
        )

    async def _maintenance_stats(self) -> MaintenanceStats:
        now = datetime.now(UTC)
        month_start = datetime(now.year, now.month, 1, tzinfo=UTC)

        open_orders = await self._count(
            select(func.count()).select_from(ServiceOrder).where(ServiceOrder.status == "open")
        )
        in_progress = await self._count(
            select(func.count()).select_from(ServiceOrder).where(ServiceOrder.status == "in_progress")
        )
        month_cost_result = await self._db.execute(
            select(func.coalesce(func.sum(ServiceOrder.total_cost), 0))
            .where(and_(
                ServiceOrder.status == "completed",
                ServiceOrder.completed_at >= month_start,
            ))
        )
        month_cost = float(month_cost_result.scalar_one() or 0)

        schedules = await self._db.execute(
            select(MaintenanceSchedule).where(MaintenanceSchedule.is_active == True)  # noqa: E712
        )
        due_count = 0
        today = date.today()
        for s in schedules.scalars().all():
            is_due = False
            if s.vehicle and s.interval_km and s.last_done_km is not None:
                if (s.last_done_km + s.interval_km) - s.vehicle.odometer <= 0:
                    is_due = True
            if not is_due and s.interval_days and s.last_done_date:
                next_date = s.last_done_date + timedelta(days=s.interval_days)
                if (next_date - today).days <= 0:
                    is_due = True
            if is_due:
                due_count += 1

        return MaintenanceStats(
            open_orders=open_orders, in_progress_orders=in_progress,
            due_schedules=due_count, month_cost=round(month_cost, 2),
        )

    async def _document_alerts(self, threshold_days: int = 60) -> list[DocumentAlert]:
        alerts: list[DocumentAlert] = []
        today = date.today()
        limit_date = today + timedelta(days=threshold_days)

        vehicles_result = await self._db.execute(
            select(Vehicle).where(and_(
                Vehicle.is_active == True,  # noqa: E712
                or_(
                    and_(Vehicle.crlv_expiry.isnot(None), Vehicle.crlv_expiry <= limit_date),
                    and_(Vehicle.insurance_expiry.isnot(None), Vehicle.insurance_expiry <= limit_date),
                    and_(Vehicle.antt_expiry.isnot(None), Vehicle.antt_expiry <= limit_date),
                ),
            ))
        )
        for v in vehicles_result.scalars().all():
            for doc_type, expires_at in [
                ("CRLV", v.crlv_expiry),
                ("Seguro", v.insurance_expiry),
                ("ANTT", v.antt_expiry),
            ]:
                if expires_at and expires_at <= limit_date:
                    days = (expires_at - today).days
                    alerts.append(DocumentAlert(
                        entity_type="vehicle", entity_id=str(v.id),
                        entity_label=f"{v.plate} — {v.brand} {v.model}",
                        document_type=doc_type, expires_at=expires_at,
                        days_remaining=days, is_expired=days < 0,
                    ))

        drivers_result = await self._db.execute(
            select(Driver).where(and_(
                Driver.is_active == True,  # noqa: E712
                Driver.cnh_expiry <= limit_date,
            ))
        )
        for d in drivers_result.scalars().all():
            days = (d.cnh_expiry - today).days
            alerts.append(DocumentAlert(
                entity_type="driver", entity_id=str(d.id),
                entity_label=d.full_name,
                document_type=f"CNH {d.cnh_category}", expires_at=d.cnh_expiry,
                days_remaining=days, is_expired=days < 0,
            ))

        alerts.sort(key=lambda a: a.days_remaining)
        return alerts[:20]

    async def _recent_operations(self) -> list[OperationTimelineItem]:
        result = await self._db.execute(
            select(Operation).order_by(Operation.created_at.desc()).limit(8)
        )
        ops = result.scalars().all()
        return [
            OperationTimelineItem(
                id=str(op.id), code=op.code, status=op.status,
                customer_name=op.customer.legal_name if op.customer else "—",
                vehicle_plate=op.vehicle.plate if op.vehicle else None,
                origin_city=op.origin_city, destination_city=op.destination_city,
                scheduled_start=op.scheduled_start,
            )
            for op in ops
        ]

    async def _count(self, query) -> int:
        result = await self._db.execute(query)
        return int(result.scalar_one())
