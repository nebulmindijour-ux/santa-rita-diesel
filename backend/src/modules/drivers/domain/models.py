import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )

    full_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    cpf: Mapped[str] = mapped_column(String(14), unique=True, nullable=False, index=True)
    rg: Mapped[str | None] = mapped_column(String(20), nullable=True)

    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    mobile: Mapped[str | None] = mapped_column(String(30), nullable=True)

    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    cnh_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    cnh_category: Mapped[str] = mapped_column(String(5), nullable=False, default="E")
    cnh_expiry: Mapped[date] = mapped_column(Date, nullable=False)
    cnh_first_issue: Mapped[date | None] = mapped_column(Date, nullable=True)

    mopp: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    mopp_expiry: Mapped[date | None] = mapped_column(Date, nullable=True)

    zip_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    street: Mapped[str | None] = mapped_column(String(200), nullable=True)
    number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    complement: Mapped[str | None] = mapped_column(String(100), nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(2), nullable=True)

    current_vehicle_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="SET NULL"),
        nullable=True, index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="available", index=True
    )

    hire_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    termination_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    emergency_contact_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(30), nullable=True)

    notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    current_vehicle: Mapped["Vehicle | None"] = relationship(
        "Vehicle", lazy="selectin", foreign_keys=[current_vehicle_id]
    )


from src.modules.fleet.domain.models import Vehicle  # noqa: E402
