import { api } from "@/shared/lib/api-client";
import type { AuthResponse, LoginPayload, UserProfile } from "@/shared/types/auth";

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    return await api.post("auth/login", { json: payload }).json<AuthResponse>();
  },

  async logout(): Promise<void> {
    await api.post("auth/logout");
  },

  async refresh(): Promise<AuthResponse> {
    return await api.post("auth/refresh").json<AuthResponse>();
  },

  async me(): Promise<UserProfile> {
    return await api.get("auth/me").json<UserProfile>();
  },
};
