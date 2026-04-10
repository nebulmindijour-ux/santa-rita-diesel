export interface Supplier {
  id: string;
  document: string;
  document_type: "CNPJ" | "CPF";
  legal_name: string;
  trade_name: string | null;
  state_registration: string | null;
  category: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  contact_name: string | null;
  website: string | null;
  zip_code: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierListItem {
  id: string;
  document: string;
  document_type: "CNPJ" | "CPF";
  legal_name: string;
  trade_name: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateSupplierPayload {
  document: string;
  document_type: "CNPJ" | "CPF";
  legal_name: string;
  trade_name?: string | null;
  state_registration?: string | null;
  category?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  contact_name?: string | null;
  website?: string | null;
  zip_code?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
}

export interface SupplierListParams {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  state?: string;
  is_active?: boolean;
}

export const SUPPLIER_CATEGORIES = [
  { value: "pecas", label: "Peças e componentes" },
  { value: "pneus", label: "Pneus" },
  { value: "lubrificantes", label: "Lubrificantes" },
  { value: "combustivel", label: "Combustível" },
  { value: "servicos", label: "Serviços" },
  { value: "equipamentos", label: "Equipamentos" },
  { value: "outros", label: "Outros" },
] as const;
