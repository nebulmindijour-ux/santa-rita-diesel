import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


class ServiceOrder(Base):
    __tablename__ = "service_orders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)

    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False, index=True
    )
    order_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="corrective", index=True
    )
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="open", index=True
    )
    priority: Mapped[str] = mapped_column(
        String(20), nullable=False, default="normal"
    )

    description: Mapped[str] = mapped_column(Text, nullable=False)
    vehicle_km: Mapped[float | None] = mapped_column(Float, nullable=True)

    scheduled_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    labor_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    labor_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    parts_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_cost: Mapped[float | None] = mapped_column(Float, nullable=True)

    technician_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    vehicle: Mapped["Vehicle"] = relationship("Vehicle", lazy="selectin")
    items: Mapped[list["ServiceOrderItem"]] = relationship(
        back_populates="service_order", cascade="all, delete-orphan", lazy="selectin"
    )


class ServiceOrderItem(Base):
    __tablename__ = "service_order_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    service_order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("service_orders.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    item_type: Mapped[str] = mapped_column(String(20), nullable=False, default="part")
    description: Mapped[str] = mapped_column(String(300), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False, default=1)
    unit_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    total_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0)

    service_order: Mapped["ServiceOrder"] = relationship(back_populates="items")


class MaintenanceSchedule(Base):
    __tablename__ = "maintenance_schedules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    vehicle_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=True, index=True
    )
    applies_to_all: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    interval_km: Mapped[int | None] = mapped_column(Integer, nullable=True)
    interval_days: Mapped[int | None] = mapped_column(Integer, nullable=True)

    last_done_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_done_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    vehicle: Mapped["Vehicle | None"] = relationship("Vehicle", lazy="selectin")


from src.modules.fleet.domain.models import Vehicle  # noqa: E402, F811
