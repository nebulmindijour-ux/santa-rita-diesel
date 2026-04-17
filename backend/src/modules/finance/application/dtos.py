import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

Direction = Literal["income", "expense"]
TransactionStatus = Literal["pending", "paid", "overdue", "cancelled"]
PaymentMethod = Literal["cash", "pix", "bank_slip", "credit_card", "debit_card", "bank_transfer", "check", "other"]


class CreateCategoryRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    direction: Direction = "expense"
    color: str | None = Field(default=None, max_length=20)


class UpdateCategoryRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    color: str | None = Field(default=None, max_length=20)
    is_active: bool | None = None


class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    direction: str
    color: str | None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CreateTransactionRequest(BaseModel):
    direction: Direction
    description: str = Field(min_length=2, max_length=300)
    amount: float = Field(gt=0)
    due_date: date
    reference_date: date | None = None
    category_id: uuid.UUID | None = None
    supplier_id: uuid.UUID | None = None
    customer_id: uuid.UUID | None = None
    operation_id: uuid.UUID | None = None
    service_order_id: uuid.UUID | None = None
    payment_method: PaymentMethod | None = None
    document_number: str | None = Field(default=None, max_length=50)
    notes: str | None = Field(default=None, max_length=2000)


class UpdateTransactionRequest(BaseModel):
    description: str | None = Field(default=None, min_length=2, max_length=300)
    amount: float | None = Field(default=None, gt=0)
    due_date: date | None = None
    reference_date: date | None = None
    category_id: uuid.UUID | None = None
    supplier_id: uuid.UUID | None = None
    customer_id: uuid.UUID | None = None
    payment_method: PaymentMethod | None = None
    document_number: str | None = Field(default=None, max_length=50)
    notes: str | None = Field(default=None, max_length=2000)


class MarkPaidRequest(BaseModel):
    paid_date: date
    payment_method: PaymentMethod | None = None
    notes: str | None = Field(default=None, max_length=2000)


class TransactionResponse(BaseModel):
    id: uuid.UUID
    direction: str
    status: str
    description: str
    amount: float
    due_date: date
    paid_date: date | None
    reference_date: date | None
    category_id: uuid.UUID | None
    category_name: str | None
    category_color: str | None
    supplier_id: uuid.UUID | None
    supplier_name: str | None
    customer_id: uuid.UUID | None
    customer_name: str | None
    operation_id: uuid.UUID | None
    service_order_id: uuid.UUID | None
    payment_method: str | None
    document_number: str | None
    notes: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionListItem(BaseModel):
    id: uuid.UUID
    direction: str
    status: str
    description: str
    amount: float
    due_date: date
    paid_date: date | None
    category_name: str | None
    category_color: str | None
    supplier_name: str | None
    customer_name: str | None
    payment_method: str | None

    class Config:
        from_attributes = True


class FinanceSummary(BaseModel):
    month_income: float
    month_income_pending: float
    month_expense: float
    month_expense_pending: float
    overdue_count: int
    overdue_amount: float
    balance_month: float
