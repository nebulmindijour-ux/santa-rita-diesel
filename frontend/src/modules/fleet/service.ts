import { api } from "@/shared/lib/api-client";
import type { PaginatedResponse } from "@/modules/customers/types";
import type { CreateVehiclePayload, UpdateVehiclePayload, Vehicle, VehicleListItem, VehicleListParams } from "./types";

function buildParams(p: VehicleListParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (p.page) sp.set("page", String(p.page));
  if (p.page_size) sp.set("page_size", String(p.page_size));
  if (p.search) sp.set("search", p.search);
  if (p.vehicle_type) sp.set("vehicle_type", p.vehicle_type);
  if (p.status) sp.set("status", p.status);
  if (p.is_active !== undefined) sp.set("is_active", String(p.is_active));
  return sp;
}

export const fleetService = {
  async list(params: VehicleListParams = {}): Promise<PaginatedResponse<VehicleListItem>> {
    return api.get("vehicles", { searchParams: buildParams(params) }).json();
  },
  async getById(id: string): Promise<Vehicle> {
    return api.get(`vehicles/${id}`).json();
  },
  async create(payload: CreateVehiclePayload): Promise<Vehicle> {
    return api.post("vehicles", { json: payload }).json();
  },
  async update(id: string, payload: UpdateVehiclePayload): Promise<Vehicle> {
    return api.patch(`vehicles/${id}`, { json: payload }).json();
  },
  async remove(id: string): Promise<void> {
    await api.delete(`vehicles/${id}`);
  },
};
