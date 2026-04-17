import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Building2, Warehouse, Truck, Users, Package,
  Wrench, DollarSign, FileText, ShieldCheck, ChevronLeft,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";

const navGroups = [
  {
    label: "Visão geral",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { to: "/customers", label: "Clientes", icon: Building2 },
      { to: "/suppliers", label: "Fornecedores", icon: Warehouse },
    ],
  },
  {
    label: "Operação",
    items: [
      { to: "/fleet", label: "Frota", icon: Truck },
      { to: "/drivers", label: "Motoristas", icon: Users },
      { to: "/operations", label: "Operações", icon: Package },
      { to: "/maintenance", label: "Manutenção", icon: Wrench },
    ],
  },
  {
    label: "Gestão",
    items: [
      { to: "/finance", label: "Financeiro", icon: DollarSign },
      { to: "/documents", label: "Documentos", icon: FileText },
    ],
  },
  {
    label: "Administração",
    items: [
      { to: "/users", label: "Usuários", icon: ShieldCheck },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border-default bg-brand-primary text-white transition-all",
        collapsed ? "w-16" : "w-56",
      )}
    >
      <div className={cn("flex h-14 items-center gap-3 border-b border-white/10 px-4", collapsed && "justify-center")}>
        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-accent text-xs font-bold text-white">
          SR
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">Santa Rita Diesel</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {!collapsed && (
              <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    cn(
                      "mx-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-brand-accent text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white",
                      collapsed && "justify-center",
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 flex-none" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex h-10 items-center justify-center border-t border-white/10 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
        title={collapsed ? "Expandir" : "Recolher"}
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
      </button>
    </aside>
  );
}
