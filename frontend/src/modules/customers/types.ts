export interface Customer {
  id: string;
  document: string;
  document_type: "CNPJ" | "CPF";
  legal_name: string;
  trade_name: string | null;
  state_registration: string | null;
  municipal_registration: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  contact_name: string | null;
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

export interface CustomerListItem {
  id: string;
  document: string;
  document_type: "CNPJ" | "CPF";
  legal_name: string;
  trade_name: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateCustomerPayload {
  document: string;
  document_type: "CNPJ" | "CPF";
  legal_name: string;
  trade_name?: string | null;
  state_registration?: string | null;
  municipal_registration?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  contact_name?: string | null;
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

export type UpdateCustomerPayload = Partial<Omit<CreateCustomerPayload, "document" | "document_type">> & {
  is_active?: boolean;
};

export interface CepLookupResult {
  zip_code: string;
  street: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CustomerListParams {
  page?: number;
  page_size?: number;
  search?: string;
  state?: string;
  city?: string;
  is_active?: boolean;
}
