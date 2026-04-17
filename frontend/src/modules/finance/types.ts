export type Direction = "income" | "expense";
export type TransactionStatus = "pending" | "paid" | "overdue" | "cancelled";
export type PaymentMethod = "cash" | "pix" | "bank_slip" | "credit_card" | "debit_card" | "bank_transfer" | "check" | "other";

export interface FinanceCategory {
  id: string;
  name: string;
  direction: Direction;
  color: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FinanceTransaction {
  id: string;
  direction: Direction;
  status: TransactionStatus;
  description: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  reference_date: string | null;
  category_id: string | null;
  category_name: string | null;
  category_color: string | null;
  supplier_id: string | null;
  supplier_name: string | null;
  customer_id: string | null;
  customer_name: string | null;
  operation_id: string | null;
  service_order_id: string | null;
  payment_method: string | null;
  document_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface TransactionListItem {
  id: string;
  direction: Direction;
  status: TransactionStatus;
  description: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  category_name: string | null;
  category_color: string | null;
  supplier_name: string | null;
  customer_name: string | null;
  payment_method: string | null;
}

export interface FinanceSummary {
  month_income: number;
  month_income_pending: number;
  month_expense: number;
  month_expense_pending: number;
  overdue_count: number;
  overdue_amount: number;
  balance_month: number;
}

export interface TransactionListParams {
  page?: number;
  page_size?: number;
  direction?: string;
  status?: string;
  category_id?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export const DIRECTION_LABELS: Record<Direction, string> = { income: "Receita", expense: "Despesa" };
export const STATUS_LABELS: Record<TransactionStatus, string> = { pending: "Pendente", paid: "Pago", overdue: "Atrasado", cancelled: "Cancelado" };
export const STATUS_TONES: Record<TransactionStatus, "neutral" | "success" | "error" | "warning"> = { pending: "warning", paid: "success", overdue: "error", cancelled: "neutral" };

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Dinheiro", pix: "PIX", bank_slip: "Boleto", credit_card: "Cartão crédito",
  debit_card: "Cartão débito", bank_transfer: "Transferência", check: "Cheque", other: "Outro",
};
export const DIRECTION_OPTIONS = Object.entries(DIRECTION_LABELS).map(([v, l]) => ({ value: v, label: l }));
export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));
export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => ({ value: v, label: l }));
