import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, Pencil, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/design-system/components/page-header";
import { Button } from "@/design-system/components/button";
import { Badge } from "@/design-system/components/badge";
import { Drawer } from "@/design-system/components/drawer";
import { DataTable } from "@/design-system/components/data-table";
import type { DataTableColumn } from "@/design-system/components/data-table";
import { formatDate, formatNumber, formatPlate } from "@/shared/lib/formatters";
import { extractProblem } from "@/shared/lib/api-client";
import { maintenanceService } from "./service";
import type { MaintenanceSchedule } from "./types";
import { ScheduleForm } from "./components/schedule-form";

const FORM_ID = "schedule-form";

export function SchedulesPage() {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null);
  const [showOnlyDue, setShowOnlyDue] = useState(false);

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["maintenance-schedules", { showOnlyDue }],
    queryFn: () => maintenanceService.listSchedules(undefined, showOnlyDue),
  });

  const createMutation = useMutation({
    mutationFn: (p: Record<string, unknown>) => maintenanceService.createSchedule(p),
    onSuccess: () => {
      toast.success("Programação criada");
      queryClient.invalidateQueries({ queryKey: ["maintenance-schedules"] });
      setDrawerOpen(false);
      setEditingSchedule(null);
    },
    onError: async (err) => { const p = await extractProblem(err); toast.error(p?.detail || "Erro ao criar"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      maintenanceService.updateSchedule(id, payload),
    onSuccess: () => {
      toast.success("Programação atualizada");
      queryClient.invalidateQueries({ queryKey: ["maintenance-schedules"] });
      setDrawerOpen(false);
      setEditingSchedule(null);
    },
    onError: async (err) => { const p = await extractProblem(err); toast.error(p?.detail || "Erro ao atualizar"); },
  });

  function handleEdit(row: MaintenanceSchedule) {
    setEditingSchedule(row);
    setDrawerOpen(true);
  }
  function handleNew() { setEditingSchedule(null); setDrawerOpen(true); }
  function handleClose() {
    if (!createMutation.isPending && !updateMutation.isPending) {
      setDrawerOpen(false);
      setEditingSchedule(null);
    }
  }
  function handleSubmit(payload: Record<string, unknown>) {
    editingSchedule
      ? updateMutation.mutate({ id: editingSchedule.id, payload })
      : createMutation.mutate(payload);
  }

  const dueCount = schedules.filter((s) => s.is_due).length;

  const columns: DataTableColumn<MaintenanceSchedule>[] = [
    {
      key: "name", header: "Manutenção",
      cell: (row) => (
        <div>
          <p className="font-medium text-content-primary">{row.name}</p>
          {row.description && <p className="truncate text-xs text-content-tertiary">{row.description}</p>}
        </div>
      ),
    },
    {
      key: "scope", header: "Aplica a", width: "160px",
      cell: (row) => row.applies_to_all
        ? <Badge tone="info">Toda a frota</Badge>
        : <span className="font-mono text-xs text-content-secondary">{formatPlate(row.vehicle_plate || "")}</span>,
    },
    {
      key: "interval", header: "Intervalo", width: "180px",
      cell: (row) => (
        <div className="space-y-0.5 text-xs text-content-secondary">
          {row.interval_km && <p>{formatNumber(row.interval_km)} km</p>}
          {row.interval_days && <p>{row.interval_days} dias</p>}
        </div>
      ),
    },
    {
      key: "last", header: "Última execução", width: "180px",
      cell: (row) => (
        <div className="space-y-0.5 text-xs text-content-tertiary">
          {row.last_done_km !== null && <p>{formatNumber(row.last_done_km)} km</p>}
          {row.last_done_date && <p>{formatDate(row.last_done_date)}</p>}
          {row.last_done_km === null && !row.last_done_date && <p>Nunca executada</p>}
        </div>
      ),
    },
    {
      key: "remaining", header: "Situação", width: "200px",
      cell: (row) => {
        if (row.is_due) {
          return (
            <div className="flex items-center gap-1.5 text-status-error">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">Manutenção vencida</span>
            </div>
          );
        }
        const parts: string[] = [];
        if (row.km_remaining !== null && row.km_remaining > 0) {
          parts.push(`${formatNumber(row.km_remaining)} km`);
        }
        if (row.days_remaining !== null && row.days_remaining > 0) {
          parts.push(`${row.days_remaining} dias`);
        }
        if (parts.length === 0) {
          return <span className="text-xs text-content-tertiary">Sem dados</span>;
        }
        const isWarning =
          (row.km_remaining !== null && row.km_remaining < 1000) ||
          (row.days_remaining !== null && row.days_remaining < 15);
        return (
          <div className={`flex items-center gap-1.5 ${isWarning ? "text-status-warning" : "text-status-success"}`}>
            {isWarning ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            <span className="text-xs font-medium">Restam {parts.join(" / ")}</span>
          </div>
        );
      },
    },
    {
      key: "actions", header: "", width: "60px", align: "right",
      cell: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-content-tertiary hover:bg-surface-secondary hover:text-content-primary"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        title="Programações de manutenção"
        description="Alertas automáticos quando veículos precisam de manutenção preventiva"
        actions={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleNew}>Nova programação</Button>}
      />

      {dueCount > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-status-error bg-red-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-status-error" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-status-error">
              {dueCount} {dueCount === 1 ? "manutenção vencida" : "manutenções vencidas"}
            </p>
            <p className="text-xs text-red-700">
              Veículos precisam de atenção. Crie uma ordem de serviço para registrar a manutenção.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowOnlyDue(!showOnlyDue)}>
            {showOnlyDue ? "Ver todas" : "Ver apenas vencidas"}
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={schedules}
        keyField="id"
        isLoading={isLoading}
        onRowClick={handleEdit}
        emptyState={{
          icon: <Calendar className="h-6 w-6" />,
          title: showOnlyDue ? "Nenhuma manutenção vencida" : "Nenhuma programação cadastrada",
          description: showOnlyDue
            ? "Tudo em dia. Volte mais tarde."
            : "Cadastre manutenções recorrentes para receber alertas automáticos",
          action: !showOnlyDue && (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleNew}>Criar programação</Button>
          ),
        }}
      />

      <Drawer
        open={drawerOpen}
        onClose={handleClose}
        title={editingSchedule ? "Editar programação" : "Nova programação"}
        description={editingSchedule ? editingSchedule.name : "Configure uma manutenção recorrente por km ou dias"}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" form={FORM_ID} isLoading={isSubmitting}>
              {editingSchedule ? "Salvar" : "Criar"}
            </Button>
          </div>
        }
      >
        <ScheduleForm
          initialData={editingSchedule}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          formId={FORM_ID}
        />
      </Drawer>
    </div>
  );
}
