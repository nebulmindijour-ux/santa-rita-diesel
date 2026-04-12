export interface Operation {
  id: string;
  code: string;
  customer_id: string;
  customer_name: string;
  vehicle_id: string | null;
  vehicle_plate: string | null;
  driver_id: string | null;
  driver_name: string | null;
  status: OperationStatus;
  origin_description: string;
  origin_city: string | null;
  origin_state: string | null;
  origin_latitude: number | null;
  origin_longitude: number | null;
  destination_description: string;
  destination_city: string | null;
  destination_state: string | null;
  destination_latitude: number | null;
  destination_longitude: number | null;
  distance_km: number | null;
  estimated_duration_hours: number | null;
  cargo_description: string | null;
  cargo_weight_kg: number | null;
  cargo_volume_m3: number | null;
  odometer_start: number | null;
  odometer_end: number | null;
  actual_distance_km: number | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OperationListItem {
  id: string;
  code: string;
  customer_name: string;
  vehicle_plate: string | null;
  driver_name: string | null;
  status: OperationStatus;
  origin_city: string | null;
  origin_state: string | null;
  destination_city: string | null;
  destination_state: string | null;
  distance_km: number | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  created_at: string;
}

export type OperationStatus =
  | "pending"
  | "assigned"
  | "in_transit"
  | "loading"
  | "unloading"
  | "completed"
  | "cancelled"
  | "delayed";

export interface CreateOperationPayload {
  customer_id: string;
  vehicle_id?: string | null;
  driver_id?: string | null;
  origin_description: string;
  origin_city?: string | null;
  origin_state?: string | null;
  destination_description: string;
  destination_city?: string | null;
  destination_state?: string | null;
  distance_km?: number | null;
  estimated_duration_hours?: number | null;
  cargo_description?: string | null;
  cargo_weight_kg?: number | null;
  cargo_volume_m3?: number | null;
  odometer_start?: number | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  notes?: string | null;
}

export interface UpdateOperationPayload extends Partial<CreateOperationPayload> {
  status?: OperationStatus;
  odometer_end?: number | null;
  actual_start?: string | null;
  actual_end?: string | null;
}

export interface OperationListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  customer_id?: string;
  vehicle_id?: string;
  driver_id?: string;
}

export const OPERATION_STATUS_LABELS: Record<OperationStatus, string> = {
  pending: "Pendente",
  assigned: "Atribuída",
  in_transit: "Em trânsito",
  loading: "Carregando",
  unloading: "Descarregando",
  completed: "Concluída",
  cancelled: "Cancelada",
  delayed: "Atrasada",
};

export const OPERATION_STATUS_TONES: Record<OperationStatus, "neutral" | "info" | "warning" | "success" | "error" | "brand"> = {
  pending: "neutral",
  assigned: "info",
  in_transit: "brand",
  loading: "warning",
  unloading: "warning",
  completed: "success",
  cancelled: "error",
  delayed: "error",
};

export const OPERATION_STATUS_OPTIONS = Object.entries(OPERATION_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);
