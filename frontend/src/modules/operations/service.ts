import { api } from "@/shared/lib/api-client";
import type { PaginatedResponse } from "@/modules/customers/types";
import type {
  CreateOperationPayload,
  Operation,
  OperationListItem,
  OperationListParams,
  UpdateOperationPayload,
} from "./types";

function buildParams(p: OperationListParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (p.page) sp.set("page", String(p.page));
  if (p.page_size) sp.set("page_size", String(p.page_size));
  if (p.search) sp.set("search", p.search);
  if (p.status) sp.set("status", p.status);
  if (p.customer_id) sp.set("customer_id", p.customer_id);
  if (p.vehicle_id) sp.set("vehicle_id", p.vehicle_id);
  if (p.driver_id) sp.set("driver_id", p.driver_id);
  return sp;
}

export const operationsService = {
  async list(params: OperationListParams = {}): Promise<PaginatedResponse<OperationListItem>> {
    return api.get("operations", { searchParams: buildParams(params) }).json();
  },
  async getById(id: string): Promise<Operation> {
    return api.get(`operations/${id}`).json();
  },
  async create(payload: CreateOperationPayload): Promise<Operation> {
    return api.post("operations", { json: payload }).json();
  },
  async update(id: string, payload: UpdateOperationPayload): Promise<Operation> {
    return api.patch(`operations/${id}`, { json: payload }).json();
  },
};
