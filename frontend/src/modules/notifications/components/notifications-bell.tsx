import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell, AlertTriangle, Clock, Info, CheckCircle2, FileText, Wrench } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { formatDate } from "@/shared/lib/formatters";
import { notificationsService } from "./service";
import type { NotificationCategory, NotificationItem, NotificationSeverity } from "./service";

function SeverityIcon({ severity }: { severity: NotificationSeverity }) {
  if (severity === "critical")
    return <AlertTriangle className="h-3.5 w-3.5 text-status-error" />;
  if (severity === "warning")
    return <Clock className="h-3.5 w-3.5 text-status-warning" />;
  return <Info className="h-3.5 w-3.5 text-status-info" />;
}

function CategoryIcon({ category }: { category: NotificationCategory }) {
  if (category === "maintenance")
    return <Wrench className="h-3.5 w-3.5" />;
  return <FileText className="h-3.5 w-3.5" />;
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications-summary"],
    queryFn: () => notificationsService.getSummary(),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const total = data?.total ?? 0;
  const critical = data?.critical_count ?? 0;
  const items = data?.items ?? [];

  const badgeColor = critical > 0 ? "bg-status-error" : "bg-status-warning";

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-content-secondary transition-colors hover:bg-surface-secondary hover:text-content-primary"
        aria-label="Notificações"
      >
        <Bell className="h-4 w-4" />
        {total > 0 && (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white",
              badgeColor,
            )}
          >
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-96 overflow-hidden rounded-xl border border-border-default bg-surface-primary shadow-lg">
          <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
            <div>
              <h3 className="font-display text-sm font-semibold text-content-primary">Notificações</h3>
              {total > 0 && (
                <p className="text-xs text-content-tertiary">
                  {critical > 0 && <span className="font-medium text-status-error">{critical} críticas</span>}
                  {critical > 0 && (data?.warning_count ?? 0) > 0 && <span> · </span>}
                  {(data?.warning_count ?? 0) > 0 && (
                    <span className="font-medium text-status-warning">
                      {data?.warning_count} em atenção
                    </span>
                  )}
                </p>
              )}
            </div>
            {total > 0 && (
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-brand-accent hover:underline"
              >
                Ver no dashboard
              </Link>
            )}
          </div>

          <div className="max-h-[480px] overflow-y-auto">
            {isLoading ? (
              <div className="py-10 text-center text-sm text-content-tertiary">Carregando...</div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <CheckCircle2 className="h-8 w-8 text-status-success" />
                <p className="text-sm font-medium text-content-primary">Tudo em dia</p>
                <p className="text-xs text-content-tertiary">Nenhuma notificação pendente</p>
              </div>
            ) : (
              <div className="divide-y divide-border-default">
                {items.map((n: NotificationItem) => (
                  <Link
                    key={n.id}
                    to={n.link}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-secondary"
                  >
                    <div className="flex-none pt-0.5">
                      <SeverityIcon severity={n.severity} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <CategoryIcon category={n.category} />
                        <p className="truncate text-sm font-medium text-content-primary">
                          {n.title}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "mt-0.5 text-xs",
                          n.severity === "critical" ? "font-medium text-status-error" :
                          n.severity === "warning" ? "font-medium text-status-warning" :
                          "text-content-secondary",
                        )}
                      >
                        {n.message}
                      </p>
                      {n.date_reference && (
                        <p className="mt-0.5 text-[11px] text-content-tertiary">
                          {formatDate(n.date_reference)}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
