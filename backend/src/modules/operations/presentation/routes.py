import uuid

from fastapi import APIRouter, Query

from src.core.dependencies import DbSession, Pagination
from src.core.pagination import PaginatedResponse
from src.modules.auth.presentation.dependencies import CurrentUser
from src.modules.operations.application.dtos import (
    CreateOperationRequest,
    OperationListItem,
    OperationResponse,
    UpdateOperationRequest,
)
from src.modules.operations.application.service import OperationService

router = APIRouter(prefix="/operations", tags=["operations"])


@router.post("", response_model=OperationResponse, status_code=201)
async def create_operation(
    data: CreateOperationRequest, db: DbSession, current_user: CurrentUser
) -> OperationResponse:
    return await OperationService(db).create(data, created_by=current_user.id)


@router.get("", response_model=PaginatedResponse[OperationListItem])
async def list_operations(
    db: DbSession,
    pagination: Pagination,
    current_user: CurrentUser,
    search: str | None = Query(None, max_length=100),
    status: str | None = Query(None),
    customer_id: str | None = Query(None),
    vehicle_id: str | None = Query(None),
    driver_id: str | None = Query(None),
) -> PaginatedResponse[OperationListItem]:
    return await OperationService(db).list(
        params=pagination,
        search=search,
        status=status,
        customer_id=customer_id,
        vehicle_id=vehicle_id,
        driver_id=driver_id,
    )


@router.get("/{operation_id}", response_model=OperationResponse)
async def get_operation(
    operation_id: uuid.UUID, db: DbSession, current_user: CurrentUser
) -> OperationResponse:
    return await OperationService(db).get_by_id(operation_id)


@router.patch("/{operation_id}", response_model=OperationResponse)
async def update_operation(
    operation_id: uuid.UUID,
    data: UpdateOperationRequest,
    db: DbSession,
    current_user: CurrentUser,
) -> OperationResponse:
    return await OperationService(db).update(operation_id, data, updated_by=current_user.id)
