import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, User, LogOut, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/modules/auth/store";
import { authService } from "@/modules/auth/service";
import { toast } from "sonner";

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

export function Topbar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    try {
      await authService.logout();
    } catch {
      // proceed with local logout even if server call fails
    }
    clearSession();
    toast.success("Sessão encerrada com sucesso");
    navigate("/login", { replace: true });
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border-default bg-surface-elevated px-6">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-tertiary" />
          <input
            type="text"
            placeholder="Buscar..."
            className="h-9 w-72 rounded-lg border border-border-default bg-surface-primary pl-9 pr-3 text-sm text-content-primary placeholder:text-content-tertiary transition-colors focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-content-secondary transition-colors hover:bg-surface-secondary hover:text-content-primary">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-accent" />
        </button>

        <div className="mx-2 h-6 w-px bg-border-default" />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-surface-secondary"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary">
              <span className="text-xs font-semibold text-white">
                {user ? getInitials(user.full_name) : <User className="h-3.5 w-3.5" />}
              </span>
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-tight text-content-primary">
                {user?.full_name || "Usuário"}
              </p>
              <p className="text-xs leading-tight text-content-tertiary">
                {user?.role_display_name || ""}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-content-tertiary" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border-default bg-surface-elevated shadow-lg">
              <div className="border-b border-border-default p-4">
                <p className="truncate text-sm font-semibold text-content-primary">
                  {user?.full_name}
                </p>
                <p className="mt-0.5 truncate text-xs text-content-tertiary">{user?.email}</p>
                <span className="mt-2 inline-flex items-center rounded-full bg-brand-accent-soft px-2 py-0.5 text-xs font-medium text-brand-accent">
                  {user?.role_display_name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-medium text-content-secondary transition-colors hover:bg-surface-secondary hover:text-status-error"
              >
                <LogOut className="h-4 w-4" />
                Sair da conta
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
