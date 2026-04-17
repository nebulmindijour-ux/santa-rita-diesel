import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/modules/auth/store";
import { authService } from "@/modules/auth/service";
import { NotificationsBell } from "@/modules/notifications/components/notifications-bell";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function Topbar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = user?.full_name || user?.email || "Usuário";
  const roleLabel = user?.roles?.[0]
    ? user.roles[0].charAt(0).toUpperCase() + user.roles[0].slice(1).replace("_", " ")
    : "";

  async function handleLogout() {
    try { await authService.logout(); } catch {}
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border-default bg-surface-primary px-6">
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-tertiary" />
        <input
          type="search"
          placeholder="Buscar..."
          className="h-9 w-full rounded-lg border border-border-default bg-surface-primary pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
        />
      </div>

      <div className="flex items-center gap-2">
        <NotificationsBell />

        <div className="h-6 w-px bg-border-default" />

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-surface-secondary"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent text-xs font-bold text-white">
              {getInitials(displayName)}
            </div>
            <div className="hidden flex-col items-start sm:flex">
              <p className="text-sm font-medium leading-tight text-content-primary">{displayName}</p>
              {roleLabel && (
                <p className="text-xs leading-tight text-content-tertiary">{roleLabel}</p>
              )}
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-content-tertiary" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-lg border border-border-default bg-surface-primary shadow-lg">
              <div className="border-b border-border-default px-4 py-3">
                <p className="truncate text-sm font-medium text-content-primary">{displayName}</p>
                <p className="truncate text-xs text-content-tertiary">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  disabled
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-content-tertiary"
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  Meu perfil
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-status-error transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
