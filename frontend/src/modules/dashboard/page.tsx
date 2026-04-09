import { Activity, Truck, Users, AlertTriangle } from "lucide-react";

interface StatCard {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ElementType;
}

const stats: StatCard[] = [
  { label: "Veículos ativos", value: "24", change: "+2 este mês", trend: "up", icon: Truck },
  { label: "Entregas em andamento", value: "12", change: "3 atrasadas", trend: "down", icon: Activity },
  { label: "Motoristas em rota", value: "18", change: "6 disponíveis", trend: "neutral", icon: Users },
  { label: "Alertas pendentes", value: "5", change: "2 críticos", trend: "down", icon: AlertTriangle },
];

export function DashboardPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-content-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-content-secondary">
          Visão geral das operações — Santa Rita Diesel
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border-default bg-surface-elevated p-5 shadow-xs transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-content-secondary">{stat.label}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-accent-soft">
                <stat.icon className="h-[18px] w-[18px] text-brand-accent" />
              </div>
            </div>
            <div className="mt-3">
              <span className="font-display text-2xl font-bold text-content-primary">
                {stat.value}
              </span>
              <p
                className={`mt-1 text-xs font-medium ${
                  stat.trend === "up"
                    ? "text-status-success"
                    : stat.trend === "down"
                      ? "text-status-error"
                      : "text-content-tertiary"
                }`}
              >
                {stat.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border-default bg-surface-elevated p-6 shadow-xs">
        <h2 className="font-display text-lg font-semibold text-content-primary">
          Sistema em construção
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-content-secondary">
          A fundação do projeto está configurada. Os módulos de negócio serão construídos a partir
          da Fase 2. Os dados acima são estáticos e servirão como referência visual do padrão
          de design.
        </p>
      </div>
    </div>
  );
}
