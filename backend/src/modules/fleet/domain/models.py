import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.core.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )

    plate: Mapped[str] = mapped_column(String(10), unique=True, nullable=False, index=True)
    renavam: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    chassis: Mapped[str | None] = mapped_column(String(30), unique=True, nullable=True)

    vehicle_type: Mapped[str] = mapped_column(
        String(30), nullable=False, index=True, default="truck"
    )
    brand: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    year_manufacture: Mapped[int] = mapped_column(Integer, nullable=False)
    year_model: Mapped[int] = mapped_column(Integer, nullable=False)
    color: Mapped[str | None] = mapped_column(String(30), nullable=True)
    fuel_type: Mapped[str] = mapped_column(String(20), nullable=False, default="diesel")

    axis_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    capacity_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    capacity_m3: Mapped[float | None] = mapped_column(Float, nullable=True)

    odometer: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    horimeter: Mapped[float] = mapped_column(Float, nullable=False, default=0)

    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="available", index=True
    )

    crlv_expiry: Mapped[date | None] = mapped_column(Date, nullable=True)
    insurance_expiry: Mapped[date | None] = mapped_column(Date, nullable=True)
    insurance_company: Mapped[str | None] = mapped_column(String(100), nullable=True)
    insurance_policy: Mapped[str | None] = mapped_column(String(50), nullable=True)
    antt_code: Mapped[str | None] = mapped_column(String(30), nullable=True)
    antt_expiry: Mapped[date | None] = mapped_column(Date, nullable=True)

    tracker_id: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)

    notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
