import { api } from "@/shared/lib/api-client";
import type {
  CepLookupResult,
  CreateCustomerPayload,
  Customer,
  CustomerListItem,
  CustomerListParams,
  PaginatedResponse,
  UpdateCustomerPayload,
} from "./types";

function buildSearchParams(params: CustomerListParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set("page", String(params.page));
  if (params.page_size !== undefined) sp.set("page_size", String(params.page_size));
  if (params.search) sp.set("search", params.search);
  if (params.state) sp.set("state", params.state);
  if (params.city) sp.set("city", params.city);
  if (params.is_active !== undefined) sp.set("is_active", String(params.is_active));
  return sp;
}

export const customersService = {
  async list(params: CustomerListParams = {}): Promise<PaginatedResponse<CustomerListItem>> {
    const searchParams = buildSearchParams(params);
    return await api
      .get("customers", { searchParams })
      .json<PaginatedResponse<CustomerListItem>>();
  },

  async getById(id: string): Promise<Customer> {
    return await api.get(`customers/${id}`).json<Customer>();
  },

  async create(payload: CreateCustomerPayload): Promise<Customer> {
    return await api.post("customers", { json: payload }).json<Customer>();
  },

  async update(id: string, payload: UpdateCustomerPayload): Promise<Customer> {
    return await api.patch(`customers/${id}`, { json: payload }).json<Customer>();
  },

  async toggleActive(id: string): Promise<Customer> {
    return await api.post(`customers/${id}/toggle-active`).json<Customer>();
  },

  async lookupCep(cep: string): Promise<CepLookupResult> {
    const cleaned = cep.replace(/\D/g, "");
    return await api.get(`customers/cep/${cleaned}`).json<CepLookupResult>();
  },
};
