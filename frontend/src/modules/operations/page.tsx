import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Package, Pencil, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/design-system/components/page-header";
import { Button } from "@/design-system/components/button";
import { Input } from "@/design-system/components/input";
import { Badge } from "@/design-system/components/badge";
import { Drawer } from "@/design-system/components/drawer";
import { DataTable } from "@/design-system/components/data-table";
import type { DataTableColumn } from "@/design-system/components/data-table";
import { formatDateTime, formatNumber, formatPlate } from "@/shared/lib/formatters";
import { extractProblem } from "@/shared/lib/api-client";
import { operationsService } from "./service";
import type { Operation, OperationListItem, CreateOperationPayload } from "./types";
import { OPERATION_STATUS_LABELS, OPERATION_STATUS_TONES } from "./types";
import { OperationForm } from "./components/operation-form";
import type { OperationStatus } from "./types";

const FORM_ID = "operation-form";

type TabKey = "all" | "active" | "completed" | "cancelled";
const TAB_STATUS_MAP: Record<TabKey, string | undefined> = {
  all: undefined,
  active: "in_transit",
  completed: "completed",
  cancelled: "cancelled",
};

export function OperationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<Operation | null>(null);

  const statusFilter = TAB_STATUS_MAP[activeTab];

  const { data, isLoading } = useQuery({
    queryKey: ["operations", { page, search, statusFilter }],
    queryFn: () =>
      operationsService.list({
        page,
        page_size: 20,
        search: search || undefined,
        status: statusFilter,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (p: CreateOperationPayload) => operationsService.create(p),
    onSuccess: (op) => {
      toast.success(`Operação ${op.code} criada`);
      queryClient.invalidateQueries({ queryKey: ["operations"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setDrawerOpen(false);
      setEditingOp(null);
    },
    onError: async (err) => {
      const p = await extractProblem(err);
      toast.error(p?.detail || "Erro ao criar operação");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateOperationPayload }) =>
      operationsService.update(id, payload),
    onSuccess: (op) => {
      toast.success(`Operação ${op.code} atualizada`);
      queryClient.invalidateQueries({ queryKey: ["operations"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setDrawerOpen(false);
      setEditingOp(null);
    },
    onError: async (err) => {
      const p = await extractProblem(err);
      toast.error(p?.detail || "Erro ao atualizar");
    },
  });

  async function handleEdit(row: OperationListItem) {
    try {
      const full = await operationsService.getById(row.id);
      setEditingOp(full);
      setDrawerOpen(true);
    } catch {
      toast.error("Erro ao carregar operação");
    }
  }

  function handleNew() {
    setEditingOp(null);
    setDrawerOpen(true);
  }
  function handleClose() {
    if (!createMutation.isPending && !updateMutation.isPending) {
      setDrawerOpen(false);
      setEditingOp(null);
    }
  }
  function handleSubmit(payload: CreateOperationPayload) {
    editingOp
      ? updateMutation.mutate({ id: editingOp.id, payload })
      : createMutation.mutate(payload);
  }

  function routeLabel(city: string | null, state: string | null): string {
    if (city && state) return `${city}/${state}`;
    if (city) return city;
    if (state) return state;
    return "—";
  }

  const columns: DataTableColumn<OperationListItem>[] = [
    {
      key: "code",
      header: "Código",
      width: "120px",
      cell: (row) => (
        <span className="font-mono text-sm font-semibold text-brand-accent">{row.code}</span>
      ),
    },
    {
      key: "customer",
      header: "Cliente",
      cell: (row) => (
        <p className="truncate font-medium text-content-primary">{row.customer_name}</p>
      ),
    },
    {
      key: "route",
      header: "Rota",
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-content-secondary">
          <span>{routeLabel(row.origin_city, row.origin_state)}</span>
          <ArrowRight className="h-3 w-3 text-content-tertiary" />
          <span>{routeLabel(row.destination_city, row.destination_state)}</span>
        </div>
      ),
    },
    {
      key: "vehicle",
      header: "Veículo",
      width: "110px",
      cell: (row) =>
        row.vehicle_plate ? (
          <span className="font-mono text-xs text-content-secondary">
            {formatPlate(row.vehicle_plate)}
          </span>
        ) : (
          <span className="text-xs text-content-tertiary">—</span>
        ),
    },
    {
      key: "driver",
      header: "Motorista",
      width: "150px",
      cell: (row) =>
        row.driver_name ? (
          <span className="truncate text-xs text-content-secondary">{row.driver_name}</span>
        ) : (
          <span className="text-xs text-content-tertiary">—</span>
        ),
    },
    {
      key: "schedule",
      header: "Agendamento",
      width: "150px",
      cell: (row) =>
        row.scheduled_start ? (
          <span className="text-xs text-content-secondary">
            {formatDateTime(row.scheduled_start)}
          </span>
        ) : (
          <span className="text-xs text-content-tertiary">Sem agenda</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      width: "130px",
      cell: (row) => (
        <Badge
          tone={OPERATION_STATUS_TONES[row.status as OperationStatus] || "neutral"}
          dot
        >
          {OPERATION_STATUS_LABELS[row.status as OperationStatus] || row.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "60px",
      align: "right",
      cell: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(row);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-content-tertiary transition-colors hover:bg-surface-secondary hover:text-content-primary"
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
        title="Operações"
        description="Gestão de entregas e operações logísticas"
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleNew}>
            Nova operação
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-1 border-b border-border-default">
        {(
          [
            { key: "all", label: "Todas" },
            { key: "active", label: "Em trânsito" },
            { key: "completed", label: "Concluídas" },
            { key: "cancelled", label: "Canceladas" },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "text-brand-accent"
                  : "text-content-secondary hover:text-content-primary"
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-brand-accent" />
              )}
            </button>
          );
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(searchInput);
          setPage(1);
        }}
        className="mb-4 flex items-center gap-3"
      >
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por código, origem, destino ou cidade..."
          leftIcon={<Search className="h-4 w-4" />}
          containerClassName="flex-1"
        />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      <DataTable
        columns={columns}
        data={data?.items || []}
        keyField="id"
        isLoading={isLoading}
        onRowClick={handleEdit}
        emptyState={{
          icon: <Package className="h-6 w-6" />,
          title: search ? "Nenhuma operação encontrada" : "Nenhuma operação cadastrada",
          description: search
            ? "Ajuste os filtros de busca"
            : "Crie a primeira operação para começar a rastrear entregas",
          action: !search && (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleNew}>
              Criar operação
            </Button>
          ),
        }}
        pagination={
          data
            ? {
                page: data.page,
                pageSize: data.page_size,
                total: data.total,
                totalPages: data.total_pages,
                onPageChange: setPage,
              }
            : undefined
        }
      />

      <Drawer
        open={drawerOpen}
        onClose={handleClose}
        title={editingOp ? `Editar ${editingOp.code}` : "Nova operação"}
        description={
          editingOp
            ? `Status atual: ${OPERATION_STATUS_LABELS[editingOp.status as OperationStatus] || editingOp.status}`
            : "Preencha os dados da operação de entrega"
        }
        size="xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" form={FORM_ID} isLoading={isSubmitting}>
              {editingOp ? "Salvar alterações" : "Criar operação"}
            </Button>
          </div>
        }
      >
        <OperationForm
          initialData={editingOp}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          formId={FORM_ID}
        />
      </Drawer>
    </div>
  );
}
