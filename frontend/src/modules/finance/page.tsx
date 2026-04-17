import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  Pencil, CheckCircle2, XCircle, ArrowUpCircle, ArrowDownCircle,
} from "lucide-react";
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
import { formatDate } from "@/shared/lib/formatters";
import { extractProblem } from "@/shared/lib/api-client";
import { financeService } from "./service";
import type { FinanceTransaction, TransactionListItem } from "./types";
import { DIRECTION_LABELS, STATUS_LABELS, STATUS_TONES, DIRECTION_OPTIONS, STATUS_OPTIONS, PAYMENT_METHOD_LABELS } from "./types";
import type { Direction, TransactionStatus, PaymentMethod } from "./types";
import { TransactionForm } from "./components/transaction-form";

const FORM_ID = "transaction-form";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function SummaryCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-xl border border-border-default bg-surface-primary p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-content-tertiary">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-surface-secondary ${color}`}>{icon}</div>
      </div>
      <p className={`mt-2 font-display text-xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

export function FinancePage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [directionFilter, setDirectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<FinanceTransaction | null>(null);
  const [confirmPay, setConfirmPay] = useState<TransactionListItem | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<TransactionListItem | null>(null);

  const { data: summary } = useQuery({
    queryKey: ["finance-summary"],
    queryFn: () => financeService.getSummary(),
    refetchInterval: 60_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", { page, search, directionFilter, statusFilter }],
    queryFn: () => financeService.listTransactions({
      page, page_size: 20, search: search || undefined,
      direction: directionFilter || undefined, status: statusFilter || undefined,
    }),
  });

  const createMutation = useMutation({
    mutationFn: (p: Record<string, unknown>) => financeService.createTransaction(p),
    onSuccess: () => { toast.success("Lançamento criado"); queryClient.invalidateQueries({ queryKey: ["transactions"] }); queryClient.invalidateQueries({ queryKey: ["finance-summary"] }); setDrawerOpen(false); setEditingTx(null); },
    onError: async (err) => { const p = await extractProblem(err); toast.error(p?.detail || "Erro"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => financeService.updateTransaction(id, payload),
    onSuccess: () => { toast.success("Lançamento atualizado"); queryClient.invalidateQueries({ queryKey: ["transactions"] }); queryClient.invalidateQueries({ queryKey: ["finance-summary"] }); setDrawerOpen(false); setEditingTx(null); },
    onError: async (err) => { const p = await extractProblem(err); toast.error(p?.detail || "Erro"); },
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => financeService.markPaid(id, { paid_date: new Date().toISOString().split("T")[0] }),
    onSuccess: () => { toast.success("Marcado como pago"); queryClient.invalidateQueries({ queryKey: ["transactions"] }); queryClient.invalidateQueries({ queryKey: ["finance-summary"] }); setConfirmPay(null); },
    onError: async (err) => { const p = await extractProblem(err); toast.error(p?.detail || "Erro"); },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => financeService.cancelTransaction(id),
    onSuccess: () => { toast.success("Lançamento cancelado"); queryClient.invalidateQueries({ queryKey: ["transactions"] }); queryClient.invalidateQueries({ queryKey: ["finance-summary"] }); setConfirmCancel(null); },
    onError: async (err) => { const p = await extractProblem(err); toast.error(p?.detail || "Erro"); },
  });

  async function handleEdit(row: TransactionListItem) {
    try { const full = await financeService.getTransaction(row.id); setEditingTx(full); setDrawerOpen(true); } catch { toast.error("Erro ao carregar"); }
  }

  function handleNew() { setEditingTx(null); setDrawerOpen(true); }
  function handleClose() { if (!createMutation.isPending && !updateMutation.isPending) { setDrawerOpen(false); setEditingTx(null); } }
  function handleSubmit(payload: Record<string, unknown>) { editingTx ? updateMutation.mutate({ id: editingTx.id, payload }) : createMutation.mutate(payload); }

  const columns: DataTableColumn<TransactionListItem>[] = [
    {
      key: "direction", header: "", width: "40px",
      cell: (row) => row.direction === "income"
        ? <ArrowUpCircle className="h-4 w-4 text-status-success" />
        : <ArrowDownCircle className="h-4 w-4 text-status-error" />,
    },
    {
      key: "description", header: "Descrição",
      cell: (row) => (
        <div>
          <p className="truncate text-sm font-medium text-content-primary">{row.description}</p>
          <div className="flex items-center gap-2 text-xs text-content-tertiary">
            {row.category_name && <span>{row.category_name}</span>}
            {row.supplier_name && <><span>·</span><span>{row.supplier_name}</span></>}
            {row.customer_name && <><span>·</span><span>{row.customer_name}</span></>}
          </div>
        </div>
      ),
    },
    {
      key: "amount", header: "Valor", width: "140px", align: "right",
      cell: (row) => (
        <span className={`font-mono text-sm font-semibold ${row.direction === "income" ? "text-status-success" : "text-status-error"}`}>
          {row.direction === "income" ? "+" : "−"} {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: "due_date", header: "Vencimento", width: "120px",
      cell: (row) => <span className="text-xs text-content-secondary">{formatDate(row.due_date)}</span>,
    },
    {
      key: "payment", header: "Pagamento", width: "120px",
      cell: (row) => row.payment_method
        ? <span className="text-xs text-content-secondary">{PAYMENT_METHOD_LABELS[row.payment_method as PaymentMethod] || row.payment_method}</span>
        : <span className="text-xs text-content-tertiary">—</span>,
    },
    {
      key: "status", header: "Status", width: "120px",
      cell: (row) => <Badge tone={STATUS_TONES[row.status] || "neutral"} dot>{STATUS_LABELS[row.status] || row.status}</Badge>,
    },
    {
      key: "actions", header: "", width: "120px", align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          {row.status === "pending" && (
            <button onClick={(e) => { e.stopPropagation(); setConfirmPay(row); }} title="Marcar como pago" className="flex h-8 w-8 items-center justify-center rounded-lg text-content-tertiary hover:bg-emerald-50 hover:text-status-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} title="Editar" className="flex h-8 w-8 items-center justify-center rounded-lg text-content-tertiary hover:bg-surface-secondary hover:text-content-primary">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {row.status === "pending" && (
            <button onClick={(e) => { e.stopPropagation(); setConfirmCancel(row); }} title="Cancelar" className="flex h-8 w-8 items-center justify-center rounded-lg text-content-tertiary hover:bg-red-50 hover:text-status-error">
              <XCircle className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro" description="Contas a pagar, receber e fluxo de caixa"
        actions={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleNew}>Novo lançamento</Button>} />

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Receitas do mês" value={formatCurrency(summary.month_income)} icon={<TrendingUp className="h-4 w-4" />} color="text-status-success" />
          <SummaryCard label="Despesas do mês" value={formatCurrency(summary.month_expense)} icon={<TrendingDown className="h-4 w-4" />} color="text-status-error" />
          <SummaryCard label="Saldo do mês" value={formatCurrency(summary.balance_month)} icon={<DollarSign className="h-4 w-4" />} color={summary.balance_month >= 0 ? "text-status-success" : "text-status-error"} />
          <SummaryCard label="Em atraso" value={`${summary.overdue_count} (${formatCurrency(summary.overdue_amount)})`} icon={<AlertTriangle className="h-4 w-4" />} color={summary.overdue_count > 0 ? "text-status-error" : "text-content-tertiary"} />
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex items-center gap-3">
        <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Buscar por descrição ou documento..." leftIcon={<Search className="h-4 w-4" />} containerClassName="flex-1" />
        <Select value={directionFilter} onChange={(e) => { setDirectionFilter(e.target.value); setPage(1); }} options={DIRECTION_OPTIONS} placeholder="Todas" containerClassName="w-36" />
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} options={STATUS_OPTIONS} placeholder="Todos" containerClassName="w-36" />
        <Button type="submit" variant="outline">Buscar</Button>
      </form>

      <DataTable columns={columns} data={data?.items || []} keyField="id" isLoading={isLoading} onRowClick={handleEdit}
        emptyState={{ icon: <DollarSign className="h-6 w-6" />, title: search ? "Nenhum lançamento encontrado" : "Nenhum lançamento", description: search ? "Ajuste os filtros" : "Crie receitas e despesas para controlar o financeiro",
          action: !search && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleNew}>Novo lançamento</Button> }}
        pagination={data ? { page: data.page, pageSize: data.page_size, total: data.total, totalPages: data.total_pages, onPageChange: setPage } : undefined}
      />

      <Drawer open={drawerOpen} onClose={handleClose} title={editingTx ? "Editar lançamento" : "Novo lançamento"}
        description={editingTx ? `${DIRECTION_LABELS[editingTx.direction as Direction]} — ${STATUS_LABELS[editingTx.status as TransactionStatus]}` : "Registre uma receita ou despesa"} size="lg"
        footer={<div className="flex items-center justify-end gap-2"><Button variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancelar</Button><Button type="submit" form={FORM_ID} isLoading={isSubmitting}>{editingTx ? "Salvar" : "Criar"}</Button></div>}>
        <TransactionForm initialData={editingTx} isSubmitting={isSubmitting} onSubmit={handleSubmit} formId={FORM_ID} />
      </Drawer>

      <ConfirmDialog open={confirmPay !== null} onClose={() => setConfirmPay(null)} onConfirm={() => confirmPay && payMutation.mutate(confirmPay.id)} title="Confirmar pagamento?" description={`Marcar "${confirmPay?.description}" como pago na data de hoje?`} confirmLabel="Confirmar pagamento" isLoading={payMutation.isPending} />

      <ConfirmDialog open={confirmCancel !== null} onClose={() => setConfirmCancel(null)} onConfirm={() => confirmCancel && cancelMutation.mutate(confirmCancel.id)} title="Cancelar lançamento?" description={`O lançamento "${confirmCancel?.description}" será cancelado.`} confirmLabel="Cancelar lançamento" tone="danger" isLoading={cancelMutation.isPending} />
    </div>
  );
}
