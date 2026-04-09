import ky from "ky";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export const api = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: 30_000,
  retry: { limit: 1, statusCodes: [408, 500, 502, 503, 504] },
  hooks: {
    beforeRequest: [
      (request) => {
        const token = sessionStorage.getItem("access_token");
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        if (response.status === 401) {
          sessionStorage.removeItem("access_token");
          window.location.href = "/login";
        }
      },
    ],
  },
});

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  error_code: string;
  instance?: string;
  errors?: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
  code: string;
}

export async function extractProblem(error: unknown): Promise<ProblemDetail | null> {
  if (error instanceof ky.HTTPError) {
    try {
      return (await error.response.json()) as ProblemDetail;
    } catch {
      return null;
    }
  }
  return null;
}
