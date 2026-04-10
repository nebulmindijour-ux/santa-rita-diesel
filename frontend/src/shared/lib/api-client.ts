import ky, { HTTPError } from "ky";
import { useAuthStore } from "@/modules/auth/store";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        useAuthStore.getState().clearSession();
        return false;
      }

      const data = await response.json();
      useAuthStore.getState().setSession(data.user, data.access_token);
      return true;
    } catch {
      useAuthStore.getState().clearSession();
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export const api = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: 30_000,
  credentials: "include",
  retry: 0,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        if (response.status !== 401) return response;

        const url = new URL(request.url);
        if (url.pathname.includes("/auth/login") || url.pathname.includes("/auth/refresh")) {
          return response;
        }

        const refreshed = await attemptRefresh();
        if (!refreshed) {
          return response;
        }

        const newToken = useAuthStore.getState().accessToken;
        if (newToken) {
          request.headers.set("Authorization", `Bearer ${newToken}`);
        }
        return ky(request);
      },
    ],
  },
});

export interface FieldError {
  field: string;
  message: string;
  code: string;
}

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  error_code: string;
  instance?: string;
  errors?: FieldError[];
}

export async function extractProblem(error: unknown): Promise<ProblemDetail | null> {
  if (error instanceof HTTPError) {
    try {
      return (await error.response.json()) as ProblemDetail;
    } catch {
      return null;
    }
  }
  return null;
}
