export interface DocumentItem {
  id: string;
  original_name: string;
  content_type: string;
  file_size: number;
  category: DocumentCategory;
  description: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

export interface DocumentDetail extends DocumentItem {
  file_name: string;
  download_url: string | null;
}

export type DocumentCategory = "crlv" | "insurance" | "antt" | "cnh" | "contract" | "invoice" | "receipt" | "report" | "photo" | "other";

export interface DocumentListParams {
  page?: number;
  page_size?: number;
  category?: string;
  entity_type?: string;
  entity_id?: string;
  search?: string;
}

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  crlv: "CRLV", insurance: "Seguro", antt: "ANTT", cnh: "CNH",
  contract: "Contrato", invoice: "Nota fiscal", receipt: "Recibo",
  report: "Relatório", photo: "Foto", other: "Outro",
};

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  vehicle: "Veículo", driver: "Motorista", customer: "Cliente",
  supplier: "Fornecedor", operation: "Operação",
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }));
export const ENTITY_TYPE_OPTIONS = Object.entries(ENTITY_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }));
