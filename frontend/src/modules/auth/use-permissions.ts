import { useAuthStore } from "@/modules/auth/store";

const ADMIN_ROLES = ["superadmin", "admin"];

export function useIsAdmin(): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  return (user.roles || []).some((role: string) => ADMIN_ROLES.includes(role));
}

export function useHasRole(...allowedRoles: string[]): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  return (user.roles || []).some((role: string) => allowedRoles.includes(role));
}
