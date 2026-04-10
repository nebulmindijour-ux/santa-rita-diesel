import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Users,
  Package,
  Wrench,
  DollarSign,
  FileText,
  Building2,
  Briefcase,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    label: "Visão geral",
    items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "Cadastros",
    items: [
      { label: "Clientes", href: "/customers", icon: Building2 },
      { label: "Fornecedores", href: "/suppliers", icon: Briefcase },
    ],
  },
  {
    label: "Operação",
    items: [
      { label: "Frota", href: "/fleet", icon: Truck },
      { label: "Motoristas", href: "/drivers", icon: Users },
      { label: "Operações", href: "/operations", icon: Package },
      { label: "Manutenção", href: "/maintenance", icon: Wrench },
    ],
  },
  {
    label: "Gestão",
    items: [
      { label: "Financeiro", href: "/finance", icon: DollarSign },
      { label: "Documentos", href: "/documents", icon: FileText },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col border-r border-white/5 bg-sidebar-bg transition-all duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex h-14 items-center gap-3 border-b border-white/5 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-accent">
          <span className="text-sm font-bold text-white">SR</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <span className="truncate text-sm font-semibold tracking-tight text-white">
              Santa Rita Diesel
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {navigation.map((group, groupIdx) => (
          <div key={group.label} className={groupIdx > 0 ? "mt-5" : ""}>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-sidebar-text hover:bg-white/5 hover:text-white"
                    } ${collapsed ? "justify-center" : ""}`
                  }
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-10 items-center justify-center border-t border-white/5 text-sidebar-text transition-colors hover:text-white"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
