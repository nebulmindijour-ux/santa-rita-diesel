import { api } from "@/shared/lib/api-client";
import type { PaginatedResponse } from "@/modules/customers/types";
import type { CreateDriverPayload, Driver, DriverListItem, DriverListParams } from "./types";

function buildParams(p: DriverListParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (p.page) sp.set("page", String(p.page));
  if (p.page_size) sp.set("page_size", String(p.page_size));
  if (p.search) sp.set("search", p.search);
  if (p.status) sp.set("status", p.status);
  if (p.is_active !== undefined) sp.set("is_active", String(p.is_active));
  return sp;
}

export const driversService = {
  async list(params: DriverListParams = {}): Promise<PaginatedResponse<DriverListItem>> {
    return api.get("drivers", { searchParams: buildParams(params) }).json();
  },
  async getById(id: string): Promise<Driver> {
    return api.get(`drivers/${id}`).json();
  },
  async create(payload: CreateDriverPayload): Promise<Driver> {
    return api.post("drivers", { json: payload }).json();
  },
  async update(id: string, payload: Partial<CreateDriverPayload>): Promise<Driver> {
    return api.patch(`drivers/${id}`, { json: payload }).json();
  },
  async remove(id: string): Promise<void> {
    await api.delete(`drivers/${id}`);
  },
};
