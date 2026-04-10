import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/modules/auth/store";
import { authService } from "@/modules/auth/service";
import { extractProblem } from "@/shared/lib/api-client";

function resolveErrorMessage(problem: Awaited<ReturnType<typeof extractProblem>>): string {
  if (!problem) {
    return "Não foi possível realizar o login. Tente novamente.";
  }
  if (typeof problem.detail === "string" && problem.detail.length > 0) {
    return problem.detail;
  }
  if (problem.errors && problem.errors.length > 0) {
    const first = problem.errors[0];
    if (first && typeof first.message === "string") {
      return first.message;
    }
  }
  if (typeof problem.title === "string") {
    return problem.title;
  }
  return "Não foi possível realizar o login. Tente novamente.";
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isBootstrapping) {
    return null;
  }

  if (isAuthenticated) {
    const from = (location.state as { from?: string } | null)?.from || "/";
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });
      setSession(response.user, response.access_token);
      const from = (location.state as { from?: string } | null)?.from || "/";
      navigate(from, { replace: true });
    } catch (err) {
      const problem = await extractProblem(err);
      setError(resolveErrorMessage(problem));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-[480px] flex-col justify-between bg-sidebar-bg p-10 lg:flex xl:w-[540px]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent">
            <span className="text-base font-bold text-white">SR</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            Santa Rita Diesel
          </span>
        </div>

        <div className="space-y-6">
          <h1 className="font-display text-3xl font-bold leading-tight text-white">
            Gestão inteligente
            <br />
            da sua operação
          </h1>
          <p className="text-base leading-relaxed text-gray-400">
            Controle de frotas, entregas, manutenção, estoque e financeiro em uma plataforma
            unificada, segura e profissional.
          </p>
          <div className="flex gap-8 pt-2">
            <div>
              <p className="font-display text-2xl font-bold text-brand-accent">99.9%</p>
              <p className="mt-0.5 text-xs text-gray-500">Disponibilidade</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-brand-accent">256-bit</p>
              <p className="mt-0.5 text-xs text-gray-500">Criptografia</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-brand-accent">24/7</p>
              <p className="mt-0.5 text-xs text-gray-500">Monitoramento</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-600">
          &copy; {new Date().getFullYear()} Santa Rita Diesel. Todos os direitos reservados.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-surface-primary px-6">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent">
              <span className="text-base font-bold text-white">SR</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-content-primary">
              Santa Rita Diesel
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold text-content-primary">
              Acesse sua conta
            </h2>
            <p className="text-sm text-content-secondary">
              Entre com suas credenciais para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-status-error" />
                <p className="text-sm font-medium text-status-error">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-content-primary">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
                autoFocus
                disabled={isLoading}
                className="block h-11 w-full rounded-lg border border-border-default bg-white px-3.5 text-sm text-content-primary placeholder:text-content-tertiary transition-colors focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20 disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-content-primary"
                >
                  Senha
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-brand-accent transition-colors hover:text-brand-accent-hover"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="block h-11 w-full rounded-lg border border-border-default bg-white px-3.5 pr-11 text-sm text-content-primary placeholder:text-content-tertiary transition-colors focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-content-tertiary transition-colors hover:text-content-secondary"
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-11 w-full items-center justify-center rounded-lg bg-brand-accent text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-accent-hover focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="h-[18px] w-[18px] animate-spin" />
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-content-tertiary">
            Ambiente protegido com criptografia de ponta a ponta
          </p>
        </div>
      </div>
    </div>
  );
}
