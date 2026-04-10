import uuid

from fastapi import APIRouter, Query

from src.core.dependencies import DbSession, Pagination
from src.core.errors import NotFoundError
from src.core.pagination import PaginatedResponse
from src.modules.auth.presentation.dependencies import CurrentUser
from src.modules.customers.application.dtos import (
    CepLookupResponse,
    CreateCustomerRequest,
    CustomerListItem,
    CustomerResponse,
    UpdateCustomerRequest,
)
from src.modules.customers.application.service import CustomerService
from src.shared.services.geocoding import geocoding_service

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("/cep/{cep}", response_model=CepLookupResponse)
async def lookup_cep(
    cep: str,
    current_user: CurrentUser,
) -> CepLookupResponse:
    result = await geocoding_service.lookup_cep(cep)
    if not result:
        raise NotFoundError("CEP", cep)
    return CepLookupResponse(**result)


@router.post("", response_model=CustomerResponse, status_code=201)
async def create_customer(
    data: CreateCustomerRequest,
    db: DbSession,
    current_user: CurrentUser,
) -> CustomerResponse:
    service = CustomerService(db)
    return await service.create(data, created_by=current_user.id)


@router.get("", response_model=PaginatedResponse[CustomerListItem])
async def list_customers(
    db: DbSession,
    pagination: Pagination,
    current_user: CurrentUser,
    search: str | None = Query(default=None, max_length=100),
    state: str | None = Query(default=None, max_length=2),
    city: str | None = Query(default=None, max_length=100),
    is_active: bool | None = Query(default=None),
) -> PaginatedResponse[CustomerListItem]:
    service = CustomerService(db)
    return await service.list(
        params=pagination,
        search=search,
        state=state,
        city=city,
        is_active=is_active,
    )


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> CustomerResponse:
    service = CustomerService(db)
    return await service.get_by_id(customer_id)


@router.patch("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: uuid.UUID,
    data: UpdateCustomerRequest,
    db: DbSession,
    current_user: CurrentUser,
) -> CustomerResponse:
    service = CustomerService(db)
    return await service.update(customer_id, data, updated_by=current_user.id)


@router.post("/{customer_id}/toggle-active", response_model=CustomerResponse)
async def toggle_customer_active(
    customer_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> CustomerResponse:
    service = CustomerService(db)
    return await service.toggle_active(customer_id, updated_by=current_user.id)
