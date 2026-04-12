export interface Vehicle {
  id: string;
  plate: string;
  renavam: string | null;
  chassis: string | null;
  vehicle_type: VehicleType;
  brand: string;
  model: string;
  year_manufacture: number;
  year_model: number;
  color: string | null;
  fuel_type: string;
  axis_count: number | null;
  capacity_kg: number | null;
  capacity_m3: number | null;
  odometer: number;
  horimeter: number;
  status: VehicleStatus;
  crlv_expiry: string | null;
  insurance_expiry: string | null;
  insurance_company: string | null;
  insurance_policy: string | null;
  antt_code: string | null;
  antt_expiry: string | null;
  tracker_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleListItem {
  id: string;
  plate: string;
  vehicle_type: VehicleType;
  brand: string;
  model: string;
  year_model: number;
  color: string | null;
  odometer: number;
  status: VehicleStatus;
  is_active: boolean;
  crlv_expiry: string | null;
  insurance_expiry: string | null;
  antt_expiry: string | null;
  created_at: string;
}

export type VehicleType = "truck" | "trailer" | "support" | "semi_trailer";
export type VehicleStatus = "available" | "in_route" | "maintenance" | "inactive";

export interface CreateVehiclePayload {
  plate: string;
  renavam?: string | null;
  chassis?: string | null;
  vehicle_type: VehicleType;
  brand: string;
  model: string;
  year_manufacture: number;
  year_model: number;
  color?: string | null;
  fuel_type?: string;
  axis_count?: number | null;
  capacity_kg?: number | null;
  capacity_m3?: number | null;
  odometer?: number;
  horimeter?: number;
  crlv_expiry?: string | null;
  insurance_expiry?: string | null;
  insurance_company?: string | null;
  insurance_policy?: string | null;
  antt_code?: string | null;
  antt_expiry?: string | null;
  tracker_id?: string | null;
  notes?: string | null;
}

export type UpdateVehiclePayload = Partial<Omit<CreateVehiclePayload, "plate" | "renavam" | "chassis">> & {
  status?: VehicleStatus;
  is_active?: boolean;
};

export interface VehicleListParams {
  page?: number;
  page_size?: number;
  search?: string;
  vehicle_type?: string;
  status?: string;
  is_active?: boolean;
}

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  truck: "Caminhão",
  trailer: "Reboque",
  semi_trailer: "Semirreboque",
  support: "Veículo de apoio",
};

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  available: "Disponível",
  in_route: "Em rota",
  maintenance: "Manutenção",
  inactive: "Inativo",
};

export const VEHICLE_STATUS_TONES: Record<VehicleStatus, "success" | "info" | "warning" | "neutral"> = {
  available: "success",
  in_route: "info",
  maintenance: "warning",
  inactive: "neutral",
};

export const VEHICLE_TYPE_OPTIONS = Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => ({ value, label }));
export const VEHICLE_STATUS_OPTIONS = Object.entries(VEHICLE_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export const FUEL_TYPE_OPTIONS = [
  { value: "diesel", label: "Diesel" },
  { value: "gasoline", label: "Gasolina" },
  { value: "ethanol", label: "Etanol" },
  { value: "flex", label: "Flex" },
  { value: "electric", label: "Elétrico" },
  { value: "cng", label: "GNV" },
];
