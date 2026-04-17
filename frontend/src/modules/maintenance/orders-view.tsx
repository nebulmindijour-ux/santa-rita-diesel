import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Wrench, Pencil } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/design-system/components/page-header";
import { Button } from "@/design-system/components/button";
import { Input } from "@/design-system/components/input";
import { Select } from "@/design-system/components/select";
import { Badge } from "@/design-system/components/badge";
import { Drawer } from "@/design-system/components/drawer";
import { DataTable } from "@/design-system/components/data-table";
import type { DataTableColumn } from "@/design-system/components/data-table";
import { formatNumber, formatPlate } from "@/shared/lib/formatters";
import { extractProblem } from "@/shared/lib/api-client";
import { maintenanceService } from "./service";
import type { ServiceOrder, ServiceOrderListItem, CreateServiceOrderPayload } from "./types";
import {
  ORDER_TYPE_LABELS, ORDER_STATUS_LABELS, ORDER_STATUS_TONES,
  PRIORITY_LABELS, PRIORITY_TONES, ORDER_TYPE_OPTIONS,
} from "./types";
import { ServiceOrderForm } from "./components/service-order-form";

const FORM_ID = "service-order-form";

type TabKey = "all" | "open" | "in_progress" | "completed";
const TAB_MAP: Record<TabKey, string | undefined> = {
  all: undefined, open: "open", in_progress: "in_progress", completed: "completed",
};

export function OrdersView() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);

  const statusFilter = TAB_MAP[activeTab];

  const { data, isLoading } = useQuery({
    queryKey: ["service-orders", { page, search, statusFilter, typeFilter }],
    queryFn: () => maintenanceService.listOrders({
      page, page_size: 20, search: search || undefined,
      status: statusFilter, order_type: typeFilter || undefined,
    }),
  });

  const createMutation = useMutation({
    mutationFn: (p: CreateServiceOrderPayload) => maintenanceService.createOrder(p),
    onSuccess: (order) => {
      toast.success(`O.S. ${order.code} criada`);
      queryClient.invalidateQueries({ queryKey: ["service-orders"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-schedules"] });
      setDrawerOpen(false);
      setEditingOrder(null);
    },
    onError: async (err) => { const p = await extractProblem(err); toast.error(p?.detail || "Erro ao criar O.S."); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateServiceOrderPayload }) =>
      maintenanceService.updateOrder(id, payload),
    onSuccess: (order) => {
      toast.success(`O.S. ${order.code} atualizada`);
      queryClient.invalidateQueries({ queryKey: ["service-orders"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setDrawerOpen(false);
      setEditingOrder(null);
    },
    onError: async (err) => { const p = await extractProblem(err); toast.error(p?.detail || "Erro ao atualizar"); },
  });

  async function handleEdit(row: ServiceOrderListItem) {
    try {
      const full = await maintenanceService.getOrder(row.id);
      setEditingOrder(full);
      setDrawerOpen(true);
    } catch { toast.error("Erro ao carregar O.S."); }
  }

  function handleNew() { setEditingOrder(null); setDrawerOpen(true); }
  function handleClose() {
    if (!createMutation.isPending && !updateMutation.isPending) {
      setDrawerOpen(false);
      setEditingOrder(null);
    }
  }
  function handleSubmit(payload: CreateServiceOrderPayload) {
    editingOrder
      ? updateMutation.mutate({ id: editingOrder.id, payload })
      : createMutation.mutate(payload);
  }

  const columns: DataTableColumn<ServiceOrderListItem>[] = [
    { key: "code", header: "O.S.", width: "110px", cell: (row) => <span className="font-mono text-sm font-semibold text-brand-accent">{row.code}</span> },
    { key: "vehicle", header: "Veículo", width: "110px", cell: (row) => <span className="font-mono text-xs text-content-secondary">{formatPlate(row.vehicle_plate)}</span> },
    { key: "type", header: "Tipo", width: "110px", cell: (row) => <Badge tone={row.order_type === "preventive" ? "info" : "warning"}>{ORDER_TYPE_LABELS[row.order_type] || row.order_type}</Badge> },
    { key: "description", header: "Descrição", cell: (row) => <p className="truncate text-sm text-content-primary">{row.description}</p> },
    { key: "priority", header: "Prioridade", width: "110px", cell: (row) => <Badge tone={PRIORITY_TONES[row.priority] || "neutral"} dot>{PRIORITY_LABELS[row.priority] || row.priority}</Badge> },
    { key: "cost", header: "Custo", width: "110px", align: "right", cell: (row) => row.total_cost ? <span className="font-mono text-xs font-semibold text-content-primary">R$ {formatNumber(row.total_cost)}</span> : <span className="text-xs text-content-tertiary">—</span> },
    { key: "status", header: "Status", width: "140px", cell: (row) => <Badge tone={ORDER_STATUS_TONES[row.status] || "neutral"} dot>{ORDER_STATUS_LABELS[row.status] || row.status}</Badge> },
    { key: "actions", header: "", width: "60px", align: "right", cell: (row) => <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-content-tertiary hover:bg-surface-secondary hover:text-content-primary"><Pencil className="h-3.5 w-3.5" /></button> },
  ];

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader title="Ordens de serviço" description="Controle de manutenções corretivas e preventivas"
        actions={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleNew}>Nova O.S.</Button>} />

      <div className="mb-4 flex items-center gap-1 border-b border-border-default">
        {([
          { key: "all", label: "Todas" },
          { key: "open", label: "Abertas" },
          { key: "in_progress", label: "Em andamento" },
          { key: "completed", label: "Concluídas" },
        ] as const).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setPage(1); }}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${active ? "text-brand-accent" : "text-content-secondary hover:text-content-primary"}`}>
              {tab.label}
              {active && <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-brand-accent" />}
            </button>
          );
        })}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
        className="mb-4 flex items-center gap-3">
        <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por código ou descrição..." leftIcon={<Search className="h-4 w-4" />} containerClassName="flex-1" />
        <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          options={ORDER_TYPE_OPTIONS} placeholder="Todos os tipos" containerClassName="w-44" />
        <Button type="submit" variant="outline">Buscar</Button>
      </form>

      <DataTable columns={columns} data={data?.items || []} keyField="id" isLoading={isLoading} onRowClick={handleEdit}
        emptyState={{
          icon: <Wrench className="h-6 w-6" />,
          title: search ? "Nenhuma O.S. encontrada" : "Nenhuma ordem de serviço",
          description: search ? "Ajuste os filtros" : "Crie a primeira ordem de serviço para começar",
          action: !search && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleNew}>Criar O.S.</Button>,
        }}
        pagination={data ? { page: data.page, pageSize: data.page_size, total: data.total, totalPages: data.total_pages, onPageChange: setPage } : undefined}
      />

      <Drawer open={drawerOpen} onClose={handleClose}
        title={editingOrder ? `Editar ${editingOrder.code}` : "Nova ordem de serviço"}
        description={editingOrder ? `${ORDER_TYPE_LABELS[editingOrder.order_type]} — ${ORDER_STATUS_LABELS[editingOrder.status]}` : "Preencha os dados da ordem de serviço"}
        size="xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" form={FORM_ID} isLoading={isSubmitting}>
              {editingOrder ? "Salvar" : "Criar O.S."}
            </Button>
          </div>
        }>
        <ServiceOrderForm initialData={editingOrder} isSubmitting={isSubmitting} onSubmit={handleSubmit} formId={FORM_ID} />
      </Drawer>
    </div>
  );
}
