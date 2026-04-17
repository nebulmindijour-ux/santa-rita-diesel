import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Truck, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/design-system/components/page-header";
import { Button } from "@/design-system/components/button";
import { Input } from "@/design-system/components/input";
import { Select } from "@/design-system/components/select";
import { Badge } from "@/design-system/components/badge";
import { Drawer } from "@/design-system/components/drawer";
import { ConfirmDialog } from "@/design-system/components/confirm-dialog";
import { DataTable } from "@/design-system/components/data-table";
import type { DataTableColumn } from "@/design-system/components/data-table";
import { formatDate, formatPlate, formatNumber } from "@/shared/lib/formatters";
import { extractProblem } from "@/shared/lib/api-client";
import { useIsAdmin } from "@/modules/auth/use-permissions";
import { fleetService } from "./service";
import type { Vehicle, VehicleListItem, CreateVehiclePayload } from "./types";
import { VEHICLE_TYPE_LABELS, VEHICLE_STATUS_LABELS, VEHICLE_STATUS_TONES, VEHICLE_TYPE_OPTIONS, VEHICLE_STATUS_OPTIONS } from "./types";
import { VehicleForm } from "./components/vehicle-form";

const FORM_ID = "vehicle-form";

function isExpiringSoon(d: string | null): boolean {
  if (!d) return false;
  const diff = new Date(d).getTime() - Date.now();
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
}
function isExpired(d: string | null): boolean {
  if (!d) return false;
  return new Date(d).getTime() < Date.now();
}

export function FleetPage() {
  const queryClient = useQueryClient();
  const isAdmin = useIsAdmin();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<VehicleListItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["vehicles", { page, search, typeFilter, statusFilter }],
    queryFn: () => fleetService.list({ page, page_size: 20, search: search || undefined, vehicle_type: typeFilter || undefined, status: statusFilter || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (p: CreateVehiclePayload) => fleetService.create(p),
    onSuccess: () => { toast.success("Veículo cadastrado"); queryClient.invalidateQueries({ queryKey: ["vehicles"] }); setDrawerOpen(false); setEditingVehicle(null); },
    onError: async (err) => { const p = await extractProblem(err); toast.error(p?.detail || "Erro ao cadastrar"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateVehiclePayload }) => fleetService.update(id, payload),
    onSuccess: () => { toast.success("Veículo atualizado"); queryClient.invalidateQueries({ queryKey: ["vehicles"] }); setDrawerOpen(false); setEditingVehicle(null); },
    onError: async (err) => { const p = await extractProblem(err); toast.error(p?.detail || "Erro ao atualizar"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fleetService.remove(id),
    onSuccess: () => { toast.success("Veículo excluído permanentemente"); queryClient.invalidateQueries({ queryKey: ["vehicles"] }); setConfirmDelete(null); },
    onError: async (err) => {
      const p = await extractProblem(err);
      if (p?.status === 403) { toast.error("Apenas administradores podem excluir veículos"); }
      else { toast.error(p?.detail || "Erro ao excluir"); }
    },
  });

  async function handleEdit(row: VehicleListItem) {
    try { const full = await fleetService.getById(row.id); setEditingVehicle(full); setDrawerOpen(true); } catch { toast.error("Erro ao carregar veículo"); }
  }

  function handleNew() { setEditingVehicle(null); setDrawerOpen(true); }
  function handleClose() { if (!createMutation.isPending && !updateMutation.isPending) { setDrawerOpen(false); setEditingVehicle(null); } }
  function handleSubmit(payload: CreateVehiclePayload) { editingVehicle ? updateMutation.mutate({ id: editingVehicle.id, payload }) : createMutation.mutate(payload); }

  const columns: DataTableColumn<VehicleListItem>[] = [
    {
      key: "vehicle", header: "Veículo",
      cell: (row) => (
        <div>
          <p className="font-mono font-semibold text-content-primary">{formatPlate(row.plate)}</p>
          <p className="text-xs text-content-tertiary">{row.brand} {row.model} {row.year_model}</p>
        </div>
      ),
    },
    { key: "type", header: "Tipo", width: "150px", cell: (row) => <Badge tone="brand">{VEHICLE_TYPE_LABELS[row.vehicle_type] || row.vehicle_type}</Badge> },
    { key: "odometer", header: "Odômetro", width: "130px", align: "right", cell: (row) => <span className="font-mono text-xs text-content-secondary">{formatNumber(row.odometer)} km</span> },
    {
      key: "docs", header: "Documentos", width: "180px",
      cell: (row) => {
        const items = [
          { label: "CRLV", date: row.crlv_expiry },
          { label: "Seguro", date: row.insurance_expiry },
          { label: "ANTT", date: row.antt_expiry },
        ];
        const alerts = items.filter((i) => i.date && (isExpired(i.date) || isExpiringSoon(i.date)));
        if (alerts.length === 0) return <span className="text-xs text-content-tertiary">OK</span>;
        return (
          <div className="space-y-0.5">
            {alerts.map((a) => (
              <p key={a.label} className={`text-xs font-medium ${isExpired(a.date) ? "text-status-error" : "text-status-warning"}`}>
                {a.label}: {formatDate(a.date)}
              </p>
            ))}
          </div>
        );
      },
    },
    { key: "status", header: "Status", width: "130px", cell: (row) => <Badge tone={VEHICLE_STATUS_TONES[row.status] || "neutral"} dot>{VEHICLE_STATUS_LABELS[row.status] || row.status}</Badge> },
    {
      key: "actions", header: "", width: isAdmin ? "100px" : "60px", align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-content-tertiary transition-colors hover:bg-surface-secondary hover:text-content-primary" aria-label="Editar">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {isAdmin && (
            <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(row); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-content-tertiary transition-colors hover:bg-red-50 hover:text-status-error" aria-label="Excluir (admin)" title="Excluir permanentemente — apenas administradores">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader title="Frota" description="Gestão de veículos da operação" actions={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleNew}>Novo veículo</Button>} />

      <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="mb-4 flex items-center gap-3">
        <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Buscar por placa, marca ou modelo..." leftIcon={<Search className="h-4 w-4" />} containerClassName="flex-1" />
        <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} options={VEHICLE_TYPE_OPTIONS} placeholder="Todos os tipos" containerClassName="w-48" />
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} options={VEHICLE_STATUS_OPTIONS} placeholder="Todos os status" containerClassName="w-44" />
        <Button type="submit" variant="outline">Buscar</Button>
      </form>

      <DataTable columns={columns} data={data?.items || []} keyField="id" isLoading={isLoading} onRowClick={handleEdit}
        emptyState={{ icon: <Truck className="h-6 w-6" />, title: search ? "Nenhum veículo encontrado" : "Nenhum veículo cadastrado", description: search ? "Ajuste os filtros" : "Cadastre o primeiro veículo da frota", action: !search && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleNew}>Cadastrar veículo</Button> }}
        pagination={data ? { page: data.page, pageSize: data.page_size, total: data.total, totalPages: data.total_pages, onPageChange: setPage } : undefined}
      />

      <Drawer open={drawerOpen} onClose={handleClose} title={editingVehicle ? "Editar veículo" : "Novo veículo"} description={editingVehicle ? `Editando ${formatPlate(editingVehicle.plate)}` : "Preencha os dados do veículo"} size="xl"
        footer={<div className="flex items-center justify-end gap-2"><Button variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancelar</Button><Button type="submit" form={FORM_ID} isLoading={isSubmitting}>{editingVehicle ? "Salvar" : "Cadastrar"}</Button></div>}>
        <VehicleForm initialData={editingVehicle} isSubmitting={isSubmitting} onSubmit={handleSubmit} formId={FORM_ID} />
      </Drawer>

      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        title="Excluir veículo permanentemente?"
        description={
          <div className="space-y-2">
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-status-error">
              <ShieldAlert className="h-4 w-4 flex-none" />
              <span>Ação restrita a administradores. Esta operação ficará registrada no log de auditoria e não pode ser desfeita.</span>
            </div>
            <p>O veículo <strong>{formatPlate(confirmDelete?.plate || "")}</strong> será removido permanentemente do sistema.</p>
          </div>
        }
        confirmLabel="Excluir permanentemente"
        tone="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
