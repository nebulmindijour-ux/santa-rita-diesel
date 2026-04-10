import uuid

from fastapi import APIRouter, Query

from src.core.dependencies import DbSession, Pagination
from src.core.pagination import PaginatedResponse
from src.modules.auth.presentation.dependencies import CurrentUser
from src.modules.suppliers.application.dtos import (
    CreateSupplierRequest,
    SupplierListItem,
    SupplierResponse,
    UpdateSupplierRequest,
)
from src.modules.suppliers.application.service import SupplierService

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.post("", response_model=SupplierResponse, status_code=201)
async def create_supplier(
    data: CreateSupplierRequest,
    db: DbSession,
    current_user: CurrentUser,
) -> SupplierResponse:
    service = SupplierService(db)
    return await service.create(data, created_by=current_user.id)


@router.get("", response_model=PaginatedResponse[SupplierListItem])
async def list_suppliers(
    db: DbSession,
    pagination: Pagination,
    current_user: CurrentUser,
    search: str | None = Query(default=None, max_length=100),
    category: str | None = Query(default=None, max_length=50),
    state: str | None = Query(default=None, max_length=2),
    is_active: bool | None = Query(default=None),
) -> PaginatedResponse[SupplierListItem]:
    service = SupplierService(db)
    return await service.list(
        params=pagination,
        search=search,
        category=category,
        state=state,
        is_active=is_active,
    )


@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(
    supplier_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> SupplierResponse:
    service = SupplierService(db)
    return await service.get_by_id(supplier_id)


@router.patch("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(
    supplier_id: uuid.UUID,
    data: UpdateSupplierRequest,
    db: DbSession,
    current_user: CurrentUser,
) -> SupplierResponse:
    service = SupplierService(db)
    return await service.update(supplier_id, data, updated_by=current_user.id)


@router.post("/{supplier_id}/toggle-active", response_model=SupplierResponse)
async def toggle_supplier_active(
    supplier_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> SupplierResponse:
    service = SupplierService(db)
    return await service.toggle_active(supplier_id, updated_by=current_user.id)
