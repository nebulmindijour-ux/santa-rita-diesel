export interface Driver {
  id: string;
  full_name: string;
  cpf: string;
  rg: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  birth_date: string | null;
  cnh_number: string;
  cnh_category: string;
  cnh_expiry: string;
  cnh_first_issue: string | null;
  mopp: boolean;
  mopp_expiry: string | null;
  zip_code: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  current_vehicle_id: string | null;
  current_vehicle_plate: string | null;
  status: DriverStatus;
  hire_date: string | null;
  termination_date: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DriverListItem {
  id: string;
  full_name: string;
  cpf: string;
  cnh_category: string;
  cnh_expiry: string;
  phone: string | null;
  status: DriverStatus;
  current_vehicle_plate: string | null;
  is_active: boolean;
  created_at: string;
}

export type DriverStatus = "available" | "in_route" | "vacation" | "leave" | "inactive";

export interface CreateDriverPayload {
  full_name: string;
  cpf: string;
  rg?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  birth_date?: string | null;
  cnh_number: string;
  cnh_category?: string;
  cnh_expiry: string;
  cnh_first_issue?: string | null;
  mopp?: boolean;
  mopp_expiry?: string | null;
  zip_code?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  current_vehicle_id?: string | null;
  hire_date?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  notes?: string | null;
}

export interface DriverListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  is_active?: boolean;
}

export const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  available: "Disponível",
  in_route: "Em rota",
  vacation: "Férias",
  leave: "Afastado",
  inactive: "Inativo",
};

export const DRIVER_STATUS_TONES: Record<DriverStatus, "success" | "info" | "warning" | "error" | "neutral"> = {
  available: "success",
  in_route: "info",
  vacation: "warning",
  leave: "error",
  inactive: "neutral",
};

export const DRIVER_STATUS_OPTIONS = Object.entries(DRIVER_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export const CNH_CATEGORY_OPTIONS = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "AB", label: "AB" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
  { value: "E", label: "E" },
  { value: "AC", label: "AC" },
  { value: "AD", label: "AD" },
  { value: "AE", label: "AE" },
];
