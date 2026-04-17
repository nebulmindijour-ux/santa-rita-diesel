import uuid
from datetime import date

from fastapi import APIRouter, Query

from src.core.dependencies import DbSession, Pagination
from src.core.pagination import PaginatedResponse
from src.modules.auth.presentation.dependencies import CurrentUser
from src.modules.finance.application.dtos import (
    CategoryResponse, CreateCategoryRequest, CreateTransactionRequest,
    FinanceSummary, MarkPaidRequest, TransactionListItem, TransactionResponse,
    UpdateCategoryRequest, UpdateTransactionRequest,
)
from src.modules.finance.application.service import FinanceService

router = APIRouter(prefix="/finance", tags=["finance"])


@router.post("/categories", response_model=CategoryResponse, status_code=201)
async def create_category(data: CreateCategoryRequest, db: DbSession, current_user: CurrentUser) -> CategoryResponse:
    return await FinanceService(db).create_category(data, created_by=current_user.id)


@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(
    db: DbSession, current_user: CurrentUser,
    direction: str | None = Query(None),
    is_active: bool | None = Query(None),
) -> list[CategoryResponse]:
    return await FinanceService(db).list_categories(direction=direction, is_active=is_active)


@router.patch("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: uuid.UUID, data: UpdateCategoryRequest,
    db: DbSession, current_user: CurrentUser,
) -> CategoryResponse:
    return await FinanceService(db).update_category(category_id, data, updated_by=current_user.id)


@router.post("/transactions", response_model=TransactionResponse, status_code=201)
async def create_transaction(data: CreateTransactionRequest, db: DbSession, current_user: CurrentUser) -> TransactionResponse:
    return await FinanceService(db).create_transaction(data, created_by=current_user.id)


@router.get("/transactions", response_model=PaginatedResponse[TransactionListItem])
async def list_transactions(
    db: DbSession, pagination: Pagination, current_user: CurrentUser,
    direction: str | None = Query(None),
    status: str | None = Query(None),
    category_id: str | None = Query(None),
    supplier_id: str | None = Query(None),
    customer_id: str | None = Query(None),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    search: str | None = Query(None, max_length=100),
) -> PaginatedResponse[TransactionListItem]:
    return await FinanceService(db).list_transactions(
        params=pagination, direction=direction, status=status,
        category_id=category_id, supplier_id=supplier_id, customer_id=customer_id,
        start_date=start_date, end_date=end_date, search=search,
    )


@router.get("/transactions/{tx_id}", response_model=TransactionResponse)
async def get_transaction(tx_id: uuid.UUID, db: DbSession, current_user: CurrentUser) -> TransactionResponse:
    return await FinanceService(db).get_transaction(tx_id)


@router.patch("/transactions/{tx_id}", response_model=TransactionResponse)
async def update_transaction(
    tx_id: uuid.UUID, data: UpdateTransactionRequest,
    db: DbSession, current_user: CurrentUser,
) -> TransactionResponse:
    return await FinanceService(db).update_transaction(tx_id, data, updated_by=current_user.id)


@router.post("/transactions/{tx_id}/pay", response_model=TransactionResponse)
async def mark_paid(
    tx_id: uuid.UUID, data: MarkPaidRequest,
    db: DbSession, current_user: CurrentUser,
) -> TransactionResponse:
    return await FinanceService(db).mark_paid(tx_id, data, updated_by=current_user.id)


@router.post("/transactions/{tx_id}/cancel", response_model=TransactionResponse)
async def cancel_transaction(
    tx_id: uuid.UUID, db: DbSession, current_user: CurrentUser,
) -> TransactionResponse:
    return await FinanceService(db).mark_cancelled(tx_id, updated_by=current_user.id)


@router.get("/summary", response_model=FinanceSummary)
async def get_summary(db: DbSession, current_user: CurrentUser) -> FinanceSummary:
    return await FinanceService(db).get_summary()
