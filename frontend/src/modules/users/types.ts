export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_locked: boolean;
  failed_login_attempts: number;
  last_login_at: string | null;
  roles: string[];
  created_at: string;
  updated_at: string;
}

export interface UserListItem {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_locked: boolean;
  roles: string[];
  last_login_at: string | null;
  created_at: string;
}

export interface RoleOption {
  id: string;
  name: string;
  description: string | null;
}

export interface CreateUserPayload {
  email: string;
  full_name: string;
  password: string;
  role_names: string[];
}

export interface UpdateUserPayload {
  full_name?: string;
  password?: string;
  role_names?: string[];
  is_active?: boolean;
}

export interface UserListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
}

export const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Administrador",
  admin: "Administrador",
  gestor: "Gestor",
  operador: "Operador",
  financeiro: "Financeiro",
  motorista: "Motorista",
  cliente: "Cliente",
};
