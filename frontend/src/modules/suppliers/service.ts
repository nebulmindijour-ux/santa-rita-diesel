import { api } from "@/shared/lib/api-client";
import { customersService } from "@/modules/customers/service";
import type { PaginatedResponse } from "@/modules/customers/types";
import type {
  CreateSupplierPayload,
  Supplier,
  SupplierListItem,
  SupplierListParams,
} from "./types";

function buildSearchParams(params: SupplierListParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set("page", String(params.page));
  if (params.page_size !== undefined) sp.set("page_size", String(params.page_size));
  if (params.search) sp.set("search", params.search);
  if (params.category) sp.set("category", params.category);
  if (params.state) sp.set("state", params.state);
  if (params.is_active !== undefined) sp.set("is_active", String(params.is_active));
  return sp;
}

export const suppliersService = {
  async list(params: SupplierListParams = {}): Promise<PaginatedResponse<SupplierListItem>> {
    const searchParams = buildSearchParams(params);
    return await api
      .get("suppliers", { searchParams })
      .json<PaginatedResponse<SupplierListItem>>();
  },

  async getById(id: string): Promise<Supplier> {
    return await api.get(`suppliers/${id}`).json<Supplier>();
  },

  async create(payload: CreateSupplierPayload): Promise<Supplier> {
    return await api.post("suppliers", { json: payload }).json<Supplier>();
  },

  async update(id: string, payload: Partial<CreateSupplierPayload>): Promise<Supplier> {
    return await api.patch(`suppliers/${id}`, { json: payload }).json<Supplier>();
  },

  async toggleActive(id: string): Promise<Supplier> {
    return await api.post(`suppliers/${id}/toggle-active`).json<Supplier>();
  },

  lookupCep: customersService.lookupCep,
};
