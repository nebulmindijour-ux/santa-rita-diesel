export type OrderType = "preventive" | "corrective";
export type OrderStatus = "open" | "in_progress" | "waiting_parts" | "completed" | "cancelled";
export type Priority = "low" | "normal" | "high" | "urgent";
export type ItemType = "part" | "service" | "labor";

export interface ServiceOrderItem {
  id?: string;
  item_type: ItemType;
  description: string;
  quantity: number;
  unit_cost: number;
  total_cost?: number;
}

export interface ServiceOrder {
  id: string;
  code: string;
  vehicle_id: string;
  vehicle_plate: string;
  order_type: OrderType;
  status: OrderStatus;
  priority: Priority;
  description: string;
  vehicle_km: number | null;
  scheduled_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  labor_hours: number | null;
  labor_cost: number | null;
  parts_cost: number | null;
  total_cost: number | null;
  technician_name: string | null;
  notes: string | null;
  items: ServiceOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface ServiceOrderListItem {
  id: string;
  code: string;
  vehicle_plate: string;
  order_type: OrderType;
  status: OrderStatus;
  priority: Priority;
  description: string;
  vehicle_km: number | null;
  total_cost: number | null;
  scheduled_date: string | null;
  created_at: string;
}

export interface CreateServiceOrderPayload {
  vehicle_id: string;
  order_type: OrderType;
  priority?: Priority;
  description: string;
  vehicle_km?: number | null;
  scheduled_date?: string | null;
  technician_name?: string | null;
  notes?: string | null;
  items?: { item_type: ItemType; description: string; quantity: number; unit_cost: number }[];
}

export interface UpdateServiceOrderPayload {
  status?: OrderStatus;
  priority?: Priority;
  description?: string;
  vehicle_km?: number | null;
  technician_name?: string | null;
  labor_hours?: number | null;
  labor_cost?: number | null;
  notes?: string | null;
  items?: { item_type: ItemType; description: string; quantity: number; unit_cost: number }[];
}

export interface MaintenanceSchedule {
  id: string;
  vehicle_id: string | null;
  vehicle_plate: string | null;
  applies_to_all: boolean;
  name: string;
  description: string | null;
  interval_km: number | null;
  interval_days: number | null;
  last_done_km: number | null;
  last_done_date: string | null;
  is_active: boolean;
  is_due: boolean;
  km_remaining: number | null;
  days_remaining: number | null;
  created_at: string;
}

export interface ServiceOrderListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  order_type?: string;
  vehicle_id?: string;
  priority?: string;
}

export const ORDER_TYPE_LABELS: Record<OrderType, string> = { preventive: "Preventiva", corrective: "Corretiva" };
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = { open: "Aberta", in_progress: "Em andamento", waiting_parts: "Aguardando peças", completed: "Concluída", cancelled: "Cancelada" };
export const PRIORITY_LABELS: Record<Priority, string> = { low: "Baixa", normal: "Normal", high: "Alta", urgent: "Urgente" };
export const ITEM_TYPE_LABELS: Record<ItemType, string> = { part: "Peça", service: "Serviço", labor: "Mão de obra" };

export const ORDER_STATUS_TONES: Record<OrderStatus, "neutral" | "info" | "warning" | "success" | "error"> = { open: "info", in_progress: "warning", waiting_parts: "neutral", completed: "success", cancelled: "error" };
export const PRIORITY_TONES: Record<Priority, "neutral" | "info" | "warning" | "error"> = { low: "neutral", normal: "info", high: "warning", urgent: "error" };

export const ORDER_TYPE_OPTIONS = Object.entries(ORDER_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }));
export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));
export const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS).map(([v, l]) => ({ value: v, label: l }));
export const ITEM_TYPE_OPTIONS = Object.entries(ITEM_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }));
