import { create } from "zustand";
import type { UserProfile } from "@/shared/types/auth";

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  setSession: (user: UserProfile, accessToken: string) => void;
  clearSession: () => void;
  setBootstrapping: (value: boolean) => void;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  hasRole: (...roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isBootstrapping: true,

  setSession: (user, accessToken) =>
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isBootstrapping: false,
    }),

  clearSession: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isBootstrapping: false,
    }),

  setBootstrapping: (value) => set({ isBootstrapping: value }),

  hasPermission: (code) => {
    const user = get().user;
    return user ? user.permissions.includes(code) : false;
  },

  hasAnyPermission: (codes) => {
    const user = get().user;
    if (!user) return false;
    return codes.some((code) => user.permissions.includes(code));
  },

  hasRole: (...roles) => {
    const user = get().user;
    return user ? roles.includes(user.role_name) : false;
  },
}));
