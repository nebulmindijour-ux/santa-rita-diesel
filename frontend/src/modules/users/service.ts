import { api } from "@/shared/lib/api-client";
import type { PaginatedResponse } from "@/modules/customers/types";
import type {
  CreateUserPayload, RoleOption, UpdateUserPayload, User, UserListItem, UserListParams,
} from "./types";

function buildParams(p: UserListParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (p.page) sp.set("page", String(p.page));
  if (p.page_size) sp.set("page_size", String(p.page_size));
  if (p.search) sp.set("search", p.search);
  if (p.is_active !== undefined) sp.set("is_active", String(p.is_active));
  return sp;
}

export const usersService = {
  async list(params: UserListParams = {}): Promise<PaginatedResponse<UserListItem>> {
    return api.get("users", { searchParams: buildParams(params) }).json();
  },
  async getById(id: string): Promise<User> {
    return api.get(`users/${id}`).json();
  },
  async create(payload: CreateUserPayload): Promise<User> {
    return api.post("users", { json: payload }).json();
  },
  async update(id: string, payload: UpdateUserPayload): Promise<User> {
    return api.patch(`users/${id}`, { json: payload }).json();
  },
  async toggleActive(id: string): Promise<User> {
    return api.post(`users/${id}/toggle-active`).json();
  },
  async unlock(id: string): Promise<User> {
    return api.post(`users/${id}/unlock`).json();
  },
  async listRoles(): Promise<RoleOption[]> {
    return api.get("users/roles").json();
  },
};
