import { Bell, Search, User } from "lucide-react";

export function Topbar() {
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

        <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-content-secondary transition-colors hover:bg-surface-secondary hover:text-content-primary">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary">
            <User className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-medium">Admin</span>
        </button>
      </div>
    </header>
  );
}
