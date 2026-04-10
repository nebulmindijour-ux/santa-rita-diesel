import uuid

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.errors import ConflictError, NotFoundError
from src.core.pagination import PaginatedResponse, PaginationParams
from src.modules.customers.domain.models import Supplier
from src.modules.iam.domain.models import AuditLog
from src.modules.suppliers.application.dtos import (
    CreateSupplierRequest,
    SupplierListItem,
    SupplierResponse,
    UpdateSupplierRequest,
)
from src.shared.services.geocoding import geocoding_service
from src.shared.value_objects.address import AddressDTO


class SupplierService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(
        self, data: CreateSupplierRequest, created_by: uuid.UUID | None = None
    ) -> SupplierResponse:
        existing = await self._db.execute(
            select(Supplier).where(Supplier.document == data.document)
        )
        if existing.scalar_one_or_none():
            raise ConflictError(
                f"Já existe um fornecedor com o documento '{data.document}'."
            )

        latitude = data.latitude
        longitude = data.longitude

        if (latitude is None or longitude is None) and data.street and data.city and data.state:
            address = AddressDTO(
                zip_code=data.zip_code,
                street=data.street,
                number=data.number,
                district=data.district,
                city=data.city,
                state=data.state,
            )
            coords = await geocoding_service.geocode(address)
            if coords:
                latitude, longitude = coords

        supplier = Supplier(
            document=data.document,
            document_type=data.document_type,
            legal_name=data.legal_name,
            trade_name=data.trade_name,
            state_registration=data.state_registration,
            category=data.category,
            email=data.email,
            phone=data.phone,
            mobile=data.mobile,
            contact_name=data.contact_name,
            website=data.website,
            zip_code=data.zip_code,
            street=data.street,
            number=data.number,
            complement=data.complement,
            district=data.district,
            city=data.city,
            state=data.state,
            country=data.country,
            latitude=latitude,
            longitude=longitude,
            notes=data.notes,
        )
        self._db.add(supplier)
        await self._db.flush()
        await self._db.refresh(supplier)

        self._db.add(AuditLog(
            user_id=created_by,
            action="supplier.created",
            entity_type="supplier",
            entity_id=str(supplier.id),
            detail=f"Supplier {supplier.legal_name} created",
        ))

        return SupplierResponse.model_validate(supplier)

    async def get_by_id(self, supplier_id: uuid.UUID) -> SupplierResponse:
        supplier = await self._find_or_404(supplier_id)
        return SupplierResponse.model_validate(supplier)

    async def list(
        self,
        params: PaginationParams,
        search: str | None = None,
        category: str | None = None,
        state: str | None = None,
        is_active: bool | None = None,
    ) -> PaginatedResponse[SupplierListItem]:
        query = select(Supplier)
        count_query = select(func.count()).select_from(Supplier)

        filters = []
        if search:
            pattern = f"%{search}%"
            filters.append(
                or_(
                    Supplier.legal_name.ilike(pattern),
                    Supplier.trade_name.ilike(pattern),
                    Supplier.document.ilike(pattern),
                    Supplier.city.ilike(pattern),
                )
            )
        if category:
            filters.append(Supplier.category == category)
        if state:
            filters.append(Supplier.state == state.upper())
        if is_active is not None:
            filters.append(Supplier.is_active == is_active)

        if filters:
            query = query.where(*filters)
            count_query = count_query.where(*filters)

        total_result = await self._db.execute(count_query)
        total = total_result.scalar_one()

        query = (
            query.order_by(Supplier.created_at.desc())
            .offset(params.offset)
            .limit(params.page_size)
        )
        result = await self._db.execute(query)
        suppliers = result.scalars().all()

        items = [SupplierListItem.model_validate(s) for s in suppliers]
        return PaginatedResponse.create(items=items, total=total, params=params)

    async def update(
        self,
        supplier_id: uuid.UUID,
        data: UpdateSupplierRequest,
        updated_by: uuid.UUID | None = None,
    ) -> SupplierResponse:
        supplier = await self._find_or_404(supplier_id)

        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            return SupplierResponse.model_validate(supplier)

        address_changed = any(
            key in update_data for key in ("street", "number", "district", "city", "state", "zip_code")
        )
        explicit_coords = "latitude" in update_data or "longitude" in update_data

        if address_changed and not explicit_coords:
            address = AddressDTO(
                zip_code=update_data.get("zip_code", supplier.zip_code),
                street=update_data.get("street", supplier.street),
                number=update_data.get("number", supplier.number),
                district=update_data.get("district", supplier.district),
                city=update_data.get("city", supplier.city),
                state=update_data.get("state", supplier.state),
            )
            coords = await geocoding_service.geocode(address)
            if coords:
                update_data["latitude"] = coords[0]
                update_data["longitude"] = coords[1]

        await self._db.execute(
            update(Supplier).where(Supplier.id == supplier_id).values(**update_data)
        )
        await self._db.refresh(supplier)

        self._db.add(AuditLog(
            user_id=updated_by,
            action="supplier.updated",
            entity_type="supplier",
            entity_id=str(supplier.id),
            detail=f"Fields updated: {', '.join(update_data.keys())}",
        ))

        return SupplierResponse.model_validate(supplier)

    async def toggle_active(
        self, supplier_id: uuid.UUID, updated_by: uuid.UUID | None = None
    ) -> SupplierResponse:
        supplier = await self._find_or_404(supplier_id)
        new_status = not supplier.is_active
        await self._db.execute(
            update(Supplier).where(Supplier.id == supplier_id).values(is_active=new_status)
        )
        await self._db.refresh(supplier)

        action = "supplier.activated" if new_status else "supplier.deactivated"
        self._db.add(AuditLog(
            user_id=updated_by,
            action=action,
            entity_type="supplier",
            entity_id=str(supplier.id),
        ))
        return SupplierResponse.model_validate(supplier)

    async def _find_or_404(self, supplier_id: uuid.UUID) -> Supplier:
        result = await self._db.execute(select(Supplier).where(Supplier.id == supplier_id))
        supplier = result.scalar_one_or_none()
        if not supplier:
            raise NotFoundError("Fornecedor", str(supplier_id))
        return supplier
