import { api } from "@/shared/lib/api-client";
import type { PaginatedResponse } from "@/modules/customers/types";
import type { FinanceCategory, FinanceSummary, FinanceTransaction, TransactionListItem, TransactionListParams } from "./types";

function buildParams(p: TransactionListParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (p.page) sp.set("page", String(p.page));
  if (p.page_size) sp.set("page_size", String(p.page_size));
  if (p.direction) sp.set("direction", p.direction);
  if (p.status) sp.set("status", p.status);
  if (p.category_id) sp.set("category_id", p.category_id);
  if (p.search) sp.set("search", p.search);
  if (p.start_date) sp.set("start_date", p.start_date);
  if (p.end_date) sp.set("end_date", p.end_date);
  return sp;
}

export const financeService = {
  async listCategories(direction?: string): Promise<FinanceCategory[]> {
    const sp = new URLSearchParams();
    if (direction) sp.set("direction", direction);
    sp.set("is_active", "true");
    return api.get("finance/categories", { searchParams: sp }).json();
  },
  async createCategory(payload: Record<string, unknown>): Promise<FinanceCategory> {
    return api.post("finance/categories", { json: payload }).json();
  },
  async listTransactions(params: TransactionListParams = {}): Promise<PaginatedResponse<TransactionListItem>> {
    return api.get("finance/transactions", { searchParams: buildParams(params) }).json();
  },
  async getTransaction(id: string): Promise<FinanceTransaction> {
    return api.get(`finance/transactions/${id}`).json();
  },
  async createTransaction(payload: Record<string, unknown>): Promise<FinanceTransaction> {
    return api.post("finance/transactions", { json: payload }).json();
  },
  async updateTransaction(id: string, payload: Record<string, unknown>): Promise<FinanceTransaction> {
    return api.patch(`finance/transactions/${id}`, { json: payload }).json();
  },
  async markPaid(id: string, payload: Record<string, unknown>): Promise<FinanceTransaction> {
    return api.post(`finance/transactions/${id}/pay`, { json: payload }).json();
  },
  async cancelTransaction(id: string): Promise<FinanceTransaction> {
    return api.post(`finance/transactions/${id}/cancel`).json();
  },
  async getSummary(): Promise<FinanceSummary> {
    return api.get("finance/summary").json();
  },
};
