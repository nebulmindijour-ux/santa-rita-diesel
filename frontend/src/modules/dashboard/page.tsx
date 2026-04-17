import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Truck, Users, Package, Wrench, AlertTriangle, TrendingUp,
  CheckCircle2, Clock, ArrowRight, Calendar, DollarSign,
} from "lucide-react";
import { PageHeader } from "@/design-system/components/page-header";
import { Badge } from "@/design-system/components/badge";
import { formatDate, formatNumber, formatPlate } from "@/shared/lib/formatters";
import { dashboardService } from "./service";
import type { ReactNode } from "react";
import {
  OPERATION_STATUS_LABELS, OPERATION_STATUS_TONES,
} from "@/modules/operations/types";
import type { OperationStatus } from "@/modules/operations/types";

function StatCard({
  label, value, hint, icon, iconColor = "text-content-tertiary",
  accent = false, href,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ReactNode;
  iconColor?: string;
  accent?: boolean;
  href?: string;
}) {
  const content = (
    <div className={`rounded-xl border border-border-default bg-surface-primary p-4 transition-all ${href ? "hover:border-brand-accent/50 hover:shadow-sm cursor-pointer" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-content-tertiary">{label}</p>
          <p className={`mt-2 font-display text-3xl font-semibold ${accent ? "text-brand-accent" : "text-content-primary"}`}>{value}</p>
          {hint && <div className="mt-1 text-xs text-content-secondary">{hint}</div>}
        </div>
        <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-surface-secondary ${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
  return href ? <Link to={href}>{content}</Link> : content;
}

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-xl border border-border-default bg-surface-primary">
      <div className="flex items-center justify-between border-b border-border-default px-5 py-3">
        <h3 className="font-display text-sm font-semibold text-content-primary">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: () => dashboardService.getOverview(),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Visão geral das operações — Santa Rita Diesel" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-border-default bg-surface-secondary" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Visão geral das operações — Santa Rita Diesel" />
        <div className="rounded-xl border border-status-error/30 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto h-6 w-6 text-status-error" />
          <p className="mt-2 text-sm font-medium text-status-error">Erro ao carregar dados do dashboard</p>
        </div>
      </div>
    );
  }

  const { fleet, drivers, operations, maintenance, alerts, recent_operations } = data;

  const hasExpiredDocs = alerts.some((a) => a.is_expired);
  const expiredCount = alerts.filter((a) => a.is_expired).length;
  const expiringCount = alerts.filter((a) => !a.is_expired && a.days_remaining <= 30).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Visão geral das operações — Santa Rita Diesel" />

      {(hasExpiredDocs || maintenance.due_schedules > 0) && (
        <div className="space-y-2">
          {hasExpiredDocs && (
            <div className="flex items-center gap-3 rounded-lg border border-status-error bg-red-50 px-4 py-3">
              <AlertTriangle className="h-5 w-5 flex-none text-status-error" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-status-error">
                  {expiredCount} {expiredCount === 1 ? "documento vencido" : "documentos vencidos"}
                </p>
                <p className="text-xs text-red-700">Veículos ou motoristas com documentação em atraso requerem atenção imediata.</p>
              </div>
            </div>
          )}
          {maintenance.due_schedules > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-status-warning bg-amber-50 px-4 py-3">
              <Wrench className="h-5 w-5 flex-none text-status-warning" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-status-warning">
                  {maintenance.due_schedules} {maintenance.due_schedules === 1 ? "manutenção programada vencida" : "manutenções programadas vencidas"}
                </p>
                <p className="text-xs text-amber-700">Veículos precisam de manutenção preventiva.</p>
              </div>
              <Link to="/maintenance" className="text-xs font-medium text-status-warning hover:underline">
                Ver programações →
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Veículos ativos" value={fleet.total}
          hint={<><span className="text-status-success">{fleet.available} disponíveis</span> · {fleet.in_route} em rota{fleet.in_maintenance > 0 ? ` · ${fleet.in_maintenance} em manutenção` : ""}</>}
          icon={<Truck className="h-4 w-4" />} iconColor="text-brand-accent" href="/fleet"
        />
        <StatCard
          label="Entregas em andamento" value={operations.in_transit} accent={operations.in_transit > 0}
          hint={operations.pending > 0 ? `${operations.pending} pendentes` : "Nenhuma pendente"}
          icon={<Package className="h-4 w-4" />} iconColor="text-brand-accent" href="/operations"
        />
        <StatCard
          label="Motoristas em rota" value={drivers.in_route}
          hint={<><span className="text-status-success">{drivers.available} disponíveis</span>{drivers.vacation_or_leave > 0 ? ` · ${drivers.vacation_or_leave} afastados` : ""}</>}
          icon={<Users className="h-4 w-4" />} href="/drivers"
        />
        <StatCard
          label="Alertas pendentes" value={alerts.length} accent={alerts.length > 0}
          hint={alerts.length > 0 ? <span className="text-status-error">{expiredCount + maintenance.due_schedules} críticos</span> : "Tudo em ordem"}
          icon={<AlertTriangle className="h-4 w-4" />} iconColor={alerts.length > 0 ? "text-status-error" : "text-content-tertiary"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Entregas do mês" value={operations.total_month}
          hint={<><CheckCircle2 className="inline h-3 w-3 text-status-success" /> {operations.completed_month} concluídas · {operations.cancelled_month} canceladas</>}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="O.S. abertas" value={maintenance.open_orders}
          hint={maintenance.in_progress_orders > 0 ? `${maintenance.in_progress_orders} em andamento` : "Nenhuma em andamento"}
          icon={<Wrench className="h-4 w-4" />} href="/maintenance"
        />
        <StatCard
          label="Manutenções programadas" value={maintenance.due_schedules}
          hint={maintenance.due_schedules > 0 ? <span className="text-status-error">Vencidas</span> : "Todas em dia"}
          icon={<Calendar className="h-4 w-4" />}
          iconColor={maintenance.due_schedules > 0 ? "text-status-error" : "text-content-tertiary"}
          href="/maintenance"
        />
        <StatCard
          label="Custo de manutenção do mês" value={formatCurrency(maintenance.month_cost)}
          hint="Soma das O.S. concluídas no mês"
          icon={<DollarSign className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Section
            title="Operações recentes"
            action={<Link to="/operations" className="text-xs font-medium text-brand-accent hover:underline">Ver todas</Link>}
          >
            {recent_operations.length === 0 ? (
              <p className="py-6 text-center text-sm text-content-tertiary">Nenhuma operação registrada ainda.</p>
            ) : (
              <div className="space-y-1">
                {recent_operations.map((op) => (
                  <Link
                    key={op.id} to="/operations"
                    className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-secondary"
                  >
                    <span className="font-mono text-xs font-semibold text-brand-accent">{op.code}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-content-primary">{op.customer_name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-content-tertiary">
                        <span>{op.origin_city || "—"}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{op.destination_city || "—"}</span>
                        {op.vehicle_plate && (
                          <>
                            <span className="px-1">·</span>
                            <span className="font-mono">{formatPlate(op.vehicle_plate)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge tone={OPERATION_STATUS_TONES[op.status as OperationStatus] || "neutral"} dot>
                      {OPERATION_STATUS_LABELS[op.status as OperationStatus] || op.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className="lg:col-span-2">
          <Section title="Documentos vencendo" action={expiringCount > 0 && <span className="text-xs text-content-tertiary">{alerts.length} alertas</span>}>
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircle2 className="h-6 w-6 text-status-success" />
                <p className="text-sm text-content-tertiary">Todos os documentos em dia</p>
              </div>
            ) : (
              <div className="space-y-1">
                {alerts.slice(0, 8).map((alert, idx) => {
                  const isExpired = alert.is_expired;
                  const isCritical = !isExpired && alert.days_remaining <= 15;
                  const toneClass = isExpired ? "text-status-error" : isCritical ? "text-status-warning" : "text-content-secondary";
                  const href = alert.entity_type === "vehicle" ? "/fleet" : "/drivers";
                  return (
                    <Link
                      key={`${alert.entity_id}-${alert.document_type}-${idx}`} to={href}
                      className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-secondary"
                    >
                      <div className="flex-none pt-1">
                        {isExpired
                          ? <AlertTriangle className="h-3.5 w-3.5 text-status-error" />
                          : <Clock className={`h-3.5 w-3.5 ${isCritical ? "text-status-warning" : "text-content-tertiary"}`} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-content-primary">{alert.entity_label}</p>
                        <p className={`text-xs ${toneClass}`}>
                          {alert.document_type} — {isExpired ? `Vencido há ${Math.abs(alert.days_remaining)} dias` : `Vence em ${alert.days_remaining} dias`}
                          {" "}· {formatDate(alert.expires_at)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
