import { api } from "@/shared/lib/api-client";
import type { PaginatedResponse } from "@/modules/customers/types";
import type { DocumentDetail, DocumentItem, DocumentListParams } from "./types";

function buildParams(p: DocumentListParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (p.page) sp.set("page", String(p.page));
  if (p.page_size) sp.set("page_size", String(p.page_size));
  if (p.category) sp.set("category", p.category);
  if (p.entity_type) sp.set("entity_type", p.entity_type);
  if (p.entity_id) sp.set("entity_id", p.entity_id);
  if (p.search) sp.set("search", p.search);
  return sp;
}

export const documentsService = {
  async list(params: DocumentListParams = {}): Promise<PaginatedResponse<DocumentItem>> {
    return api.get("documents", { searchParams: buildParams(params) }).json();
  },
  async getById(id: string): Promise<DocumentDetail> {
    return api.get(`documents/${id}`).json();
  },
  async upload(
    file: File,
    category: string,
    description?: string,
    entityType?: string,
    entityId?: string,
  ): Promise<DocumentDetail> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    if (description) formData.append("description", description);
    if (entityType) formData.append("entity_type", entityType);
    if (entityId) formData.append("entity_id", entityId);

    return api.post("documents", { body: formData }).json();
  },
  async remove(id: string): Promise<void> {
    await api.delete(`documents/${id}`);
  },
};
