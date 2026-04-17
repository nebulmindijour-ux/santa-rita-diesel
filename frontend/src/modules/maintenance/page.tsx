import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { maintenanceService } from "./service";
import { OrdersView } from "./orders-view";
import { SchedulesPage } from "./schedules-page";

type MainTab = "orders" | "schedules";

export function MaintenancePage() {
  const [mainTab, setMainTab] = useState<MainTab>("orders");

  const { data: dueSchedules = [] } = useQuery({
    queryKey: ["maintenance-schedules-due-badge"],
    queryFn: () => maintenanceService.listSchedules(undefined, true),
    staleTime: 30_000,
  });
  const dueCount = dueSchedules.length;

  return (
    <div>
      <div className="mb-6 flex items-center gap-1 border-b border-border-default">
        <button
          onClick={() => setMainTab("orders")}
          className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
            mainTab === "orders" ? "text-brand-accent" : "text-content-secondary hover:text-content-primary"
          }`}
        >
          Ordens de serviço
          {mainTab === "orders" && <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-brand-accent" />}
        </button>
        <button
          onClick={() => setMainTab("schedules")}
          className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            mainTab === "schedules" ? "text-brand-accent" : "text-content-secondary hover:text-content-primary"
          }`}
        >
          Programações
          {dueCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-status-error">
              <AlertTriangle className="h-2.5 w-2.5" />
              {dueCount}
            </span>
          )}
          {mainTab === "schedules" && <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-brand-accent" />}
        </button>
      </div>

      {mainTab === "orders" ? <OrdersView /> : <SchedulesPage />}
    </div>
  );
}
