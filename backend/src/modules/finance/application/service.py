import uuid
from datetime import UTC, date, datetime

from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.errors import NotFoundError
from src.core.pagination import PaginatedResponse, PaginationParams
from src.modules.finance.application.dtos import (
    CategoryResponse, CreateCategoryRequest, CreateTransactionRequest,
    FinanceSummary, MarkPaidRequest, TransactionListItem, TransactionResponse,
    UpdateCategoryRequest, UpdateTransactionRequest,
)
from src.modules.finance.domain.models import FinanceCategory, FinanceTransaction
from src.modules.iam.domain.models import AuditLog


class FinanceService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create_category(
        self, data: CreateCategoryRequest, created_by: uuid.UUID | None = None
    ) -> CategoryResponse:
        category = FinanceCategory(**data.model_dump())
        self._db.add(category)
        await self._db.flush()
        await self._db.refresh(category)
        self._db.add(AuditLog(
            user_id=created_by, action="finance_category.created",
            entity_type="finance_category", entity_id=str(category.id),
        ))
        return CategoryResponse.model_validate(category)

    async def list_categories(
        self, direction: str | None = None, is_active: bool | None = None
    ) -> list[CategoryResponse]:
        query = select(FinanceCategory)
        if direction:
            query = query.where(FinanceCategory.direction == direction)
        if is_active is not None:
            query = query.where(FinanceCategory.is_active == is_active)
        query = query.order_by(FinanceCategory.name)
        results = (await self._db.execute(query)).scalars().all()
        return [CategoryResponse.model_validate(c) for c in results]

    async def update_category(
        self, category_id: uuid.UUID, data: UpdateCategoryRequest,
        updated_by: uuid.UUID | None = None,
    ) -> CategoryResponse:
        result = await self._db.execute(
            select(FinanceCategory).where(FinanceCategory.id == category_id)
        )
        category = result.scalar_one_or_none()
        if not category:
            raise NotFoundError("Categoria", str(category_id))
        update_data = data.model_dump(exclude_unset=True)
        if update_data:
            await self._db.execute(
                update(FinanceCategory).where(FinanceCategory.id == category_id).values(**update_data)
            )
            await self._db.refresh(category)
        return CategoryResponse.model_validate(category)

    async def create_transaction(
        self, data: CreateTransactionRequest, created_by: uuid.UUID | None = None
    ) -> TransactionResponse:
        tx = FinanceTransaction(**data.model_dump(), created_by=created_by)
        self._db.add(tx)
        await self._db.flush()
        await self._db.refresh(tx)
        self._db.add(AuditLog(
            user_id=created_by, action="finance_transaction.created",
            entity_type="finance_transaction", entity_id=str(tx.id),
            detail=f"{data.direction} {data.amount} — {data.description[:60]}",
        ))
        return self._to_response(tx)

    async def get_transaction(self, tx_id: uuid.UUID) -> TransactionResponse:
        tx = await self._find_tx_or_404(tx_id)
        return self._to_response(tx)

    async def list_transactions(
        self, params: PaginationParams, direction: str | None = None,
        status: str | None = None, category_id: str | None = None,
        supplier_id: str | None = None, customer_id: str | None = None,
        start_date: date | None = None, end_date: date | None = None,
        search: str | None = None,
    ) -> PaginatedResponse[TransactionListItem]:
        query = select(FinanceTransaction)
        count_query = select(func.count()).select_from(FinanceTransaction)
        filters = []

        if direction:
            filters.append(FinanceTransaction.direction == direction)
        if status:
            filters.append(FinanceTransaction.status == status)
        if category_id:
            filters.append(FinanceTransaction.category_id == uuid.UUID(category_id))
        if supplier_id:
            filters.append(FinanceTransaction.supplier_id == uuid.UUID(supplier_id))
        if customer_id:
            filters.append(FinanceTransaction.customer_id == uuid.UUID(customer_id))
        if start_date:
            filters.append(FinanceTransaction.due_date >= start_date)
        if end_date:
            filters.append(FinanceTransaction.due_date <= end_date)
        if search:
            p = f"%{search}%"
            filters.append(or_(
                FinanceTransaction.description.ilike(p),
                FinanceTransaction.document_number.ilike(p),
            ))

        if filters:
            query = query.where(*filters)
            count_query = count_query.where(*filters)

        total = (await self._db.execute(count_query)).scalar_one()
        query = query.order_by(FinanceTransaction.due_date.desc()).offset(params.offset).limit(params.page_size)
        txs = (await self._db.execute(query)).scalars().all()
        items = [self._to_list_item(tx) for tx in txs]
        return PaginatedResponse.create(items=items, total=total, params=params)

    async def update_transaction(
        self, tx_id: uuid.UUID, data: UpdateTransactionRequest,
        updated_by: uuid.UUID | None = None,
    ) -> TransactionResponse:
        tx = await self._find_tx_or_404(tx_id)
        update_data = data.model_dump(exclude_unset=True)
        if update_data:
            await self._db.execute(
                update(FinanceTransaction).where(FinanceTransaction.id == tx_id).values(**update_data)
            )
            await self._db.refresh(tx)
        return self._to_response(tx)

    async def mark_paid(
        self, tx_id: uuid.UUID, data: MarkPaidRequest,
        updated_by: uuid.UUID | None = None,
    ) -> TransactionResponse:
        tx = await self._find_tx_or_404(tx_id)
        values: dict = {"status": "paid", "paid_date": data.paid_date}
        if data.payment_method:
            values["payment_method"] = data.payment_method
        if data.notes:
            values["notes"] = (tx.notes or "") + ("\n" if tx.notes else "") + data.notes
        await self._db.execute(
            update(FinanceTransaction).where(FinanceTransaction.id == tx_id).values(**values)
        )
        await self._db.refresh(tx)
        self._db.add(AuditLog(
            user_id=updated_by, action="finance_transaction.paid",
            entity_type="finance_transaction", entity_id=str(tx_id),
            detail=f"Paid on {data.paid_date}",
        ))
        return self._to_response(tx)

    async def mark_cancelled(
        self, tx_id: uuid.UUID, updated_by: uuid.UUID | None = None
    ) -> TransactionResponse:
        tx = await self._find_tx_or_404(tx_id)
        await self._db.execute(
            update(FinanceTransaction).where(FinanceTransaction.id == tx_id).values(status="cancelled")
        )
        await self._db.refresh(tx)
        self._db.add(AuditLog(
            user_id=updated_by, action="finance_transaction.cancelled",
            entity_type="finance_transaction", entity_id=str(tx_id),
        ))
        return self._to_response(tx)

    async def get_summary(self) -> FinanceSummary:
        now = datetime.now(UTC).date()
        month_start = now.replace(day=1)
        if now.month == 12:
            month_end = date(now.year + 1, 1, 1)
        else:
            month_end = date(now.year, now.month + 1, 1)

        income_paid = await self._sum(
            direction="income", status="paid",
            start=month_start, end=month_end,
        )
        income_pending = await self._sum(
            direction="income", status="pending",
            start=month_start, end=month_end,
        )
        expense_paid = await self._sum(
            direction="expense", status="paid",
            start=month_start, end=month_end,
        )
        expense_pending = await self._sum(
            direction="expense", status="pending",
            start=month_start, end=month_end,
        )

        overdue_count_result = await self._db.execute(
            select(func.count()).select_from(FinanceTransaction).where(and_(
                FinanceTransaction.status == "pending",
                FinanceTransaction.due_date < now,
            ))
        )
        overdue_amount_result = await self._db.execute(
            select(func.coalesce(func.sum(FinanceTransaction.amount), 0)).where(and_(
                FinanceTransaction.status == "pending",
                FinanceTransaction.due_date < now,
            ))
        )

        return FinanceSummary(
            month_income=income_paid,
            month_income_pending=income_pending,
            month_expense=expense_paid,
            month_expense_pending=expense_pending,
            overdue_count=int(overdue_count_result.scalar_one()),
            overdue_amount=float(overdue_amount_result.scalar_one() or 0),
            balance_month=round(income_paid - expense_paid, 2),
        )

    async def _sum(self, direction: str, status: str, start: date, end: date) -> float:
        result = await self._db.execute(
            select(func.coalesce(func.sum(FinanceTransaction.amount), 0)).where(and_(
                FinanceTransaction.direction == direction,
                FinanceTransaction.status == status,
                FinanceTransaction.due_date >= start,
                FinanceTransaction.due_date < end,
            ))
        )
        return float(result.scalar_one() or 0)

    async def _find_tx_or_404(self, tx_id: uuid.UUID) -> FinanceTransaction:
        result = await self._db.execute(
            select(FinanceTransaction).where(FinanceTransaction.id == tx_id)
        )
        tx = result.scalar_one_or_none()
        if not tx:
            raise NotFoundError("Transação", str(tx_id))
        return tx

    def _to_response(self, tx: FinanceTransaction) -> TransactionResponse:
        return TransactionResponse(
            id=tx.id, direction=tx.direction, status=tx.status,
            description=tx.description, amount=tx.amount,
            due_date=tx.due_date, paid_date=tx.paid_date, reference_date=tx.reference_date,
            category_id=tx.category_id,
            category_name=tx.category.name if tx.category else None,
            category_color=tx.category.color if tx.category else None,
            supplier_id=tx.supplier_id,
            supplier_name=tx.supplier.legal_name if tx.supplier else None,
            customer_id=tx.customer_id,
            customer_name=tx.customer.legal_name if tx.customer else None,
            operation_id=tx.operation_id, service_order_id=tx.service_order_id,
            payment_method=tx.payment_method, document_number=tx.document_number,
            notes=tx.notes, created_at=tx.created_at,
        )

    def _to_list_item(self, tx: FinanceTransaction) -> TransactionListItem:
        return TransactionListItem(
            id=tx.id, direction=tx.direction, status=tx.status,
            description=tx.description, amount=tx.amount,
            due_date=tx.due_date, paid_date=tx.paid_date,
            category_name=tx.category.name if tx.category else None,
            category_color=tx.category.color if tx.category else None,
            supplier_name=tx.supplier.legal_name if tx.supplier else None,
            customer_name=tx.customer.legal_name if tx.customer else None,
            payment_method=tx.payment_method,
        )
