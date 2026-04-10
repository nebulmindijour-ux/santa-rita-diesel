import uuid

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.errors import ConflictError, NotFoundError
from src.core.pagination import PaginatedResponse, PaginationParams
from src.modules.customers.application.dtos import (
    CreateCustomerRequest,
    CustomerListItem,
    CustomerResponse,
    UpdateCustomerRequest,
)
from src.modules.customers.domain.models import Customer
from src.modules.iam.domain.models import AuditLog
from src.shared.services.geocoding import geocoding_service
from src.shared.value_objects.address import AddressDTO


class CustomerService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(
        self, data: CreateCustomerRequest, created_by: uuid.UUID | None = None
    ) -> CustomerResponse:
        existing = await self._db.execute(
            select(Customer).where(Customer.document == data.document)
        )
        if existing.scalar_one_or_none():
            raise ConflictError(
                f"Já existe um cliente com o documento '{data.document}'."
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

        customer = Customer(
            document=data.document,
            document_type=data.document_type,
            legal_name=data.legal_name,
            trade_name=data.trade_name,
            state_registration=data.state_registration,
            municipal_registration=data.municipal_registration,
            email=data.email,
            phone=data.phone,
            mobile=data.mobile,
            contact_name=data.contact_name,
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
        self._db.add(customer)
        await self._db.flush()
        await self._db.refresh(customer)

        self._db.add(AuditLog(
            user_id=created_by,
            action="customer.created",
            entity_type="customer",
            entity_id=str(customer.id),
            detail=f"Customer {customer.legal_name} created",
        ))

        return CustomerResponse.model_validate(customer)

    async def get_by_id(self, customer_id: uuid.UUID) -> CustomerResponse:
        customer = await self._find_or_404(customer_id)
        return CustomerResponse.model_validate(customer)

    async def list(
        self,
        params: PaginationParams,
        search: str | None = None,
        state: str | None = None,
        city: str | None = None,
        is_active: bool | None = None,
    ) -> PaginatedResponse[CustomerListItem]:
        query = select(Customer)
        count_query = select(func.count()).select_from(Customer)

        filters = []
        if search:
            pattern = f"%{search}%"
            filters.append(
                or_(
                    Customer.legal_name.ilike(pattern),
                    Customer.trade_name.ilike(pattern),
                    Customer.document.ilike(pattern),
                    Customer.city.ilike(pattern),
                )
            )
        if state:
            filters.append(Customer.state == state.upper())
        if city:
            filters.append(Customer.city.ilike(f"%{city}%"))
        if is_active is not None:
            filters.append(Customer.is_active == is_active)

        if filters:
            query = query.where(*filters)
            count_query = count_query.where(*filters)

        total_result = await self._db.execute(count_query)
        total = total_result.scalar_one()

        query = (
            query.order_by(Customer.created_at.desc())
            .offset(params.offset)
            .limit(params.page_size)
        )
        result = await self._db.execute(query)
        customers = result.scalars().all()

        items = [CustomerListItem.model_validate(c) for c in customers]
        return PaginatedResponse.create(items=items, total=total, params=params)

    async def update(
        self,
        customer_id: uuid.UUID,
        data: UpdateCustomerRequest,
        updated_by: uuid.UUID | None = None,
    ) -> CustomerResponse:
        customer = await self._find_or_404(customer_id)

        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            return CustomerResponse.model_validate(customer)

        address_changed = any(
            key in update_data for key in ("street", "number", "district", "city", "state", "zip_code")
        )
        explicit_coords = "latitude" in update_data or "longitude" in update_data

        if address_changed and not explicit_coords:
            address = AddressDTO(
                zip_code=update_data.get("zip_code", customer.zip_code),
                street=update_data.get("street", customer.street),
                number=update_data.get("number", customer.number),
                district=update_data.get("district", customer.district),
                city=update_data.get("city", customer.city),
                state=update_data.get("state", customer.state),
            )
            coords = await geocoding_service.geocode(address)
            if coords:
                update_data["latitude"] = coords[0]
                update_data["longitude"] = coords[1]

        await self._db.execute(
            update(Customer).where(Customer.id == customer_id).values(**update_data)
        )
        await self._db.refresh(customer)

        self._db.add(AuditLog(
            user_id=updated_by,
            action="customer.updated",
            entity_type="customer",
            entity_id=str(customer.id),
            detail=f"Fields updated: {', '.join(update_data.keys())}",
        ))

        return CustomerResponse.model_validate(customer)

    async def toggle_active(
        self, customer_id: uuid.UUID, updated_by: uuid.UUID | None = None
    ) -> CustomerResponse:
        customer = await self._find_or_404(customer_id)
        new_status = not customer.is_active
        await self._db.execute(
            update(Customer).where(Customer.id == customer_id).values(is_active=new_status)
        )
        await self._db.refresh(customer)

        action = "customer.activated" if new_status else "customer.deactivated"
        self._db.add(AuditLog(
            user_id=updated_by,
            action=action,
            entity_type="customer",
            entity_id=str(customer.id),
        ))
        return CustomerResponse.model_validate(customer)

    async def _find_or_404(self, customer_id: uuid.UUID) -> Customer:
        result = await self._db.execute(select(Customer).where(Customer.id == customer_id))
        customer = result.scalar_one_or_none()
        if not customer:
            raise NotFoundError("Cliente", str(customer_id))
        return customer
