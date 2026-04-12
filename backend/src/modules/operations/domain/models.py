import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


class Operation(Base):
    __tablename__ = "operations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )

    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False, index=True
    )
    vehicle_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True, index=True
    )
    driver_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("drivers.id", ondelete="SET NULL"), nullable=True, index=True
    )

    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="pending", index=True
    )

    origin_description: Mapped[str] = mapped_column(String(300), nullable=False)
    origin_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    origin_state: Mapped[str | None] = mapped_column(String(2), nullable=True)
    origin_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    origin_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    destination_description: Mapped[str] = mapped_column(String(300), nullable=False)
    destination_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    destination_state: Mapped[str | None] = mapped_column(String(2), nullable=True)
    destination_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    destination_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    distance_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    estimated_duration_hours: Mapped[float | None] = mapped_column(Float, nullable=True)

    cargo_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cargo_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    cargo_volume_m3: Mapped[float | None] = mapped_column(Float, nullable=True)

    odometer_start: Mapped[float | None] = mapped_column(Float, nullable=True)
    odometer_end: Mapped[float | None] = mapped_column(Float, nullable=True)

    scheduled_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    scheduled_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

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

    customer: Mapped["Customer"] = relationship("Customer", lazy="selectin")
    vehicle: Mapped["Vehicle | None"] = relationship("Vehicle", lazy="selectin")
    driver: Mapped["Driver | None"] = relationship("Driver", lazy="selectin")

    @property
    def actual_distance_km(self) -> float | None:
        if self.odometer_start is not None and self.odometer_end is not None:
            return self.odometer_end - self.odometer_start
        return None


from src.modules.customers.domain.models import Customer  # noqa: E402, F811
from src.modules.fleet.domain.models import Vehicle  # noqa: E402, F811
from src.modules.drivers.domain.models import Driver  # noqa: E402, F811
