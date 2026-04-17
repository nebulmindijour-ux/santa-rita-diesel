from datetime import date, datetime, timedelta

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.drivers.domain.models import Driver
from src.modules.fleet.domain.models import Vehicle
from src.modules.maintenance.domain.models import MaintenanceSchedule
from src.modules.notifications.application.dtos import NotificationItem, NotificationsSummary


class NotificationsService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_summary(self, threshold_days: int = 30) -> NotificationsSummary:
        items: list[NotificationItem] = []
        today = date.today()
        limit_date = today + timedelta(days=threshold_days)

        vehicles = await self._db.execute(
            select(Vehicle).where(and_(
                Vehicle.is_active == True,  # noqa: E712
                or_(
                    and_(Vehicle.crlv_expiry.isnot(None), Vehicle.crlv_expiry <= limit_date),
                    and_(Vehicle.insurance_expiry.isnot(None), Vehicle.insurance_expiry <= limit_date),
                    and_(Vehicle.antt_expiry.isnot(None), Vehicle.antt_expiry <= limit_date),
                ),
            ))
        )
        for v in vehicles.scalars().all():
            for doc_type, expiry in [
                ("CRLV", v.crlv_expiry),
                ("Seguro", v.insurance_expiry),
                ("ANTT", v.antt_expiry),
            ]:
                if not expiry or expiry > limit_date:
                    continue
                days = (expiry - today).days
                severity = "critical" if days < 0 else ("warning" if days <= 15 else "info")
                msg = (
                    f"{doc_type} vencido há {abs(days)} dias" if days < 0
                    else f"{doc_type} vence em {days} dias"
                )
                items.append(NotificationItem(
                    id=f"vehicle-{v.id}-{doc_type.lower()}",
                    category="document", severity=severity,
                    title=f"{v.plate} — {doc_type}",
                    message=msg, link="/fleet", date_reference=expiry,
                ))

        drivers = await self._db.execute(
            select(Driver).where(and_(
                Driver.is_active == True,  # noqa: E712
                Driver.cnh_expiry <= limit_date,
            ))
        )
        for d in drivers.scalars().all():
            days = (d.cnh_expiry - today).days
            severity = "critical" if days < 0 else ("warning" if days <= 15 else "info")
            msg = (
                f"CNH vencida há {abs(days)} dias" if days < 0
                else f"CNH vence em {days} dias"
            )
            items.append(NotificationItem(
                id=f"driver-{d.id}-cnh",
                category="document", severity=severity,
                title=f"{d.full_name} — CNH {d.cnh_category}",
                message=msg, link="/drivers", date_reference=d.cnh_expiry,
            ))

        schedules = await self._db.execute(
            select(MaintenanceSchedule).where(MaintenanceSchedule.is_active == True)  # noqa: E712
        )
        for s in schedules.scalars().all():
            is_due = False
            severity: str = "info"
            message = ""

            if s.vehicle and s.interval_km and s.last_done_km is not None:
                next_km = s.last_done_km + s.interval_km
                km_remaining = int(next_km - s.vehicle.odometer)
                if km_remaining <= 0:
                    is_due = True
                    severity = "critical"
                    message = f"Manutenção vencida há {abs(km_remaining)} km"
                elif km_remaining <= 1000:
                    is_due = True
                    severity = "warning"
                    message = f"Faltam {km_remaining} km"

            if s.interval_days and s.last_done_date:
                next_date = s.last_done_date + timedelta(days=s.interval_days)
                days_rem = (next_date - today).days
                if days_rem <= 0 and not is_due:
                    is_due = True
                    severity = "critical"
                    message = f"Manutenção vencida há {abs(days_rem)} dias"
                elif days_rem <= 15 and not is_due:
                    is_due = True
                    severity = "warning"
                    message = f"Vence em {days_rem} dias"

            if is_due:
                scope = s.vehicle.plate if s.vehicle else "Toda a frota"
                items.append(NotificationItem(
                    id=f"schedule-{s.id}",
                    category="maintenance",
                    severity=severity,  # type: ignore[arg-type]
                    title=f"{scope} — {s.name}",
                    message=message, link="/maintenance",
                ))

        order = {"critical": 0, "warning": 1, "info": 2}
        items.sort(key=lambda n: (order.get(n.severity, 3), n.date_reference or date.max))

        critical = sum(1 for n in items if n.severity == "critical")
        warning = sum(1 for n in items if n.severity == "warning")

        return NotificationsSummary(
            total=len(items),
            critical_count=critical,
            warning_count=warning,
            items=items[:50],
        )
