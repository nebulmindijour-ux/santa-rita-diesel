import { useEffect } from "react";
import { useAuthStore } from "@/modules/auth/store";
import { authService } from "@/modules/auth/service";

export function useSessionBootstrap(): void {
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const response = await authService.refresh();
        if (!cancelled) {
          setSession(response.user, response.access_token);
        }
      } catch {
        if (!cancelled) {
          clearSession();
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [setSession, clearSession]);
}
