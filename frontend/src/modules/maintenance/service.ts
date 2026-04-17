import { api } from "@/shared/lib/api-client";
import type { PaginatedResponse } from "@/modules/customers/types";
import type {
  CreateServiceOrderPayload, MaintenanceSchedule, ServiceOrder,
  ServiceOrderListItem, ServiceOrderListParams, UpdateServiceOrderPayload,
} from "./types";

function buildParams(p: ServiceOrderListParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (p.page) sp.set("page", String(p.page));
  if (p.page_size) sp.set("page_size", String(p.page_size));
  if (p.search) sp.set("search", p.search);
  if (p.status) sp.set("status", p.status);
  if (p.order_type) sp.set("order_type", p.order_type);
  if (p.vehicle_id) sp.set("vehicle_id", p.vehicle_id);
  if (p.priority) sp.set("priority", p.priority);
  return sp;
}

export const maintenanceService = {
  async listOrders(params: ServiceOrderListParams = {}): Promise<PaginatedResponse<ServiceOrderListItem>> {
    return api.get("maintenance/orders", { searchParams: buildParams(params) }).json();
  },
  async getOrder(id: string): Promise<ServiceOrder> {
    return api.get(`maintenance/orders/${id}`).json();
  },
  async createOrder(payload: CreateServiceOrderPayload): Promise<ServiceOrder> {
    return api.post("maintenance/orders", { json: payload }).json();
  },
  async updateOrder(id: string, payload: UpdateServiceOrderPayload): Promise<ServiceOrder> {
    return api.patch(`maintenance/orders/${id}`, { json: payload }).json();
  },
  async listSchedules(vehicleId?: string, dueOnly = false): Promise<MaintenanceSchedule[]> {
    const sp = new URLSearchParams();
    if (vehicleId) sp.set("vehicle_id", vehicleId);
    if (dueOnly) sp.set("due_only", "true");
    return api.get("maintenance/schedules", { searchParams: sp }).json();
  },
  async createSchedule(payload: Record<string, unknown>): Promise<MaintenanceSchedule> {
    return api.post("maintenance/schedules", { json: payload }).json();
  },
  async updateSchedule(id: string, payload: Record<string, unknown>): Promise<MaintenanceSchedule> {
    return api.patch(`maintenance/schedules/${id}`, { json: payload }).json();
  },
};
