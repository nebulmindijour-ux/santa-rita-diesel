import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Users, Pencil, Trash2 } from "lucide-react";
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
import { formatCpfCnpj, formatPhone, formatDate } from "@/shared/lib/formatters";
import { extractProblem } from "@/shared/lib/api-client";
import { driversService } from "./service";
import type { Driver, DriverListItem, CreateDriverPayload } from "./types";
import { DRIVER_STATUS_LABELS, DRIVER_STATUS_TONES, DRIVER_STATUS_OPTIONS } from "./types";
import { DriverForm } from "./components/driver-form";

const FORM_ID = "driver-form";

function isCnhExpiringSoon(dateStr: string): boolean {
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < 60 * 24 * 60 * 60 * 1000;
}

function isCnhExpired(dateStr: string): boolean {
  return new Date(dateStr).getTime() < Date.now();
}

export function DriversPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DriverListItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["drivers", { page, search, statusFilter }],
    queryFn: () => driversService.list({ page, page_size: 20, search: search || undefined, status: statusFilter || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (p: CreateDriverPayload) => driversService.create(p),
    onSuccess: () => { toast.success("Motorista cadastrado"); queryClient.invalidateQueries({ queryKey: ["drivers"] }); setDrawerOpen(false); setEditingDriver(null); },
    onError: async (err) => { const p = await extractProblem(err); toast.error(p?.detail || "Erro ao cadastrar"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateDriverPayload }) => driversService.update(id, payload),
    onSuccess: () => { toast.success("Motorista atualizado"); queryClient.invalidateQueries({ queryKey: ["drivers"] }); setDrawerOpen(false); setEditingDriver(null); },
    onError: async (err) => { const p = await extractProblem(err); toast.error(p?.detail || "Erro ao atualizar"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => driversService.remove(id),
    onSuccess: () => { toast.success("Motorista excluído permanentemente"); queryClient.invalidateQueries({ queryKey: ["drivers"] }); setConfirmDelete(null); },
    onError: async (err) => { const p = await extractProblem(err); toast.error(p?.detail || "Erro ao excluir"); },
  });

  async function handleEdit(row: DriverListItem) {
    try { const full = await driversService.getById(row.id); setEditingDriver(full); setDrawerOpen(true); } catch { toast.error("Erro ao carregar motorista"); }
  }

  function handleNew() { setEditingDriver(null); setDrawerOpen(true); }
  function handleClose() { if (!createMutation.isPending && !updateMutation.isPending) { setDrawerOpen(false); setEditingDriver(null); } }
  function handleSubmit(payload: CreateDriverPayload) { editingDriver ? updateMutation.mutate({ id: editingDriver.id, payload }) : createMutation.mutate(payload); }

  const columns: DataTableColumn<DriverListItem>[] = [
    {
      key: "name", header: "Motorista",
      cell: (row) => (
        <div>
          <p className="font-medium text-content-primary">{row.full_name}</p>
          <p className="font-mono text-xs text-content-tertiary">{formatCpfCnpj(row.cpf)}</p>
        </div>
      ),
    },
    {
      key: "cnh", header: "CNH", width: "160px",
      cell: (row) => {
        const expired = isCnhExpired(row.cnh_expiry);
        const expiring = isCnhExpiringSoon(row.cnh_expiry);
        return (
          <div>
            <p className="text-sm text-content-primary">Cat. {row.cnh_category}</p>
            <p className={`text-xs ${expired ? "font-medium text-status-error" : expiring ? "font-medium text-status-warning" : "text-content-tertiary"}`}>
              {expired ? "Vencida " : expiring ? "Vence em breve " : ""}{formatDate(row.cnh_expiry)}
            </p>
          </div>
        );
      },
    },
    {
      key: "phone", header: "Contato", width: "160px",
      cell: (row) => row.phone ? <span className="text-xs text-content-secondary">{formatPhone(row.phone)}</span> : <span className="text-content-tertiary">—</span>,
    },
    {
      key: "vehicle", header: "Veículo", width: "130px",
      cell: (row) => row.current_vehicle_plate ? <Badge tone="brand">{row.current_vehicle_plate}</Badge> : <span className="text-xs text-content-tertiary">Sem veículo</span>,
    },
    {
      key: "status", header: "Status", width: "130px",
      cell: (row) => <Badge tone={DRIVER_STATUS_TONES[row.status] || "neutral"} dot>{DRIVER_STATUS_LABELS[row.status] || row.status}</Badge>,
    },
    {
      key: "actions", header: "", width: "100px", align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-content-tertiary transition-colors hover:bg-surface-secondary hover:text-content-primary" aria-label="Editar">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(row); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-content-tertiary transition-colors hover:bg-red-50 hover:text-status-error" aria-label="Excluir">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader title="Motoristas" description="Gestão de motoristas da operação" actions={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleNew}>Novo motorista</Button>} />

      <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="mb-4 flex items-center gap-3">
        <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Buscar por nome, CPF ou CNH..." leftIcon={<Search className="h-4 w-4" />} containerClassName="flex-1" />
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} options={DRIVER_STATUS_OPTIONS} placeholder="Todos os status" containerClassName="w-44" />
        <Button type="submit" variant="outline">Buscar</Button>
      </form>

      <DataTable columns={columns} data={data?.items || []} keyField="id" isLoading={isLoading} onRowClick={handleEdit}
        emptyState={{ icon: <Users className="h-6 w-6" />, title: search ? "Nenhum motorista encontrado" : "Nenhum motorista cadastrado", description: search ? "Ajuste os filtros" : "Cadastre o primeiro motorista", action: !search && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleNew}>Cadastrar motorista</Button> }}
        pagination={data ? { page: data.page, pageSize: data.page_size, total: data.total, totalPages: data.total_pages, onPageChange: setPage } : undefined}
      />

      <Drawer open={drawerOpen} onClose={handleClose} title={editingDriver ? "Editar motorista" : "Novo motorista"} description={editingDriver ? `Editando ${editingDriver.full_name}` : "Preencha os dados do motorista"} size="xl"
        footer={<div className="flex items-center justify-end gap-2"><Button variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancelar</Button><Button type="submit" form={FORM_ID} isLoading={isSubmitting}>{editingDriver ? "Salvar" : "Cadastrar"}</Button></div>}>
        <DriverForm initialData={editingDriver} isSubmitting={isSubmitting} onSubmit={handleSubmit} formId={FORM_ID} />
      </Drawer>

      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        title="Excluir motorista permanentemente?"
        description={`O motorista "${confirmDelete?.full_name}" será removido permanentemente do sistema. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir permanentemente"
        tone="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
