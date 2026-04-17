import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Users as UsersIcon, Pencil, Power, Unlock, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/design-system/components/page-header";
import { Button } from "@/design-system/components/button";
import { Input } from "@/design-system/components/input";
import { Badge } from "@/design-system/components/badge";
import { Drawer } from "@/design-system/components/drawer";
import { ConfirmDialog } from "@/design-system/components/confirm-dialog";
import { DataTable } from "@/design-system/components/data-table";
import type { DataTableColumn } from "@/design-system/components/data-table";
import { formatDateTime } from "@/shared/lib/formatters";
import { extractProblem } from "@/shared/lib/api-client";
import { useIsAdmin } from "@/modules/auth/use-permissions";
import { usersService } from "./service";
import type { User, UserListItem, CreateUserPayload } from "./types";
import { ROLE_LABELS } from "./types";
import { UserForm } from "./components/user-form";

const FORM_ID = "user-form";

type TabKey = "all" | "active" | "inactive";
const TAB_MAP: Record<TabKey, boolean | undefined> = {
  all: undefined, active: true, inactive: false,
};

export function UsersPage() {
  const queryClient = useQueryClient();
  const isAdmin = useIsAdmin();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<UserListItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["users", { page, search, activeTab }],
    queryFn: () => usersService.list({
      page, page_size: 20, search: search || undefined,
      is_active: TAB_MAP[activeTab],
    }),
  });

  const createMutation = useMutation({
    mutationFn: (p: CreateUserPayload) => usersService.create(p),
    onSuccess: (user) => {
      toast.success(`Usuário ${user.email} criado`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDrawerOpen(false);
      setEditingUser(null);
    },
    onError: async (err) => {
      const p = await extractProblem(err);
      toast.error(p?.detail || "Erro ao criar usuário");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateUserPayload> }) =>
      usersService.update(id, payload),
    onSuccess: () => {
      toast.success("Usuário atualizado");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDrawerOpen(false);
      setEditingUser(null);
    },
    onError: async (err) => {
      const p = await extractProblem(err);
      toast.error(p?.detail || "Erro ao atualizar");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => usersService.toggleActive(id),
    onSuccess: () => {
      toast.success("Status atualizado");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setConfirmToggle(null);
    },
    onError: async (err) => {
      const p = await extractProblem(err);
      toast.error(p?.detail || "Erro ao atualizar status");
    },
  });

  const unlockMutation = useMutation({
    mutationFn: (id: string) => usersService.unlock(id),
    onSuccess: () => {
      toast.success("Usuário desbloqueado");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: async (err) => {
      const p = await extractProblem(err);
      toast.error(p?.detail || "Erro ao desbloquear");
    },
  });

  async function handleEdit(row: UserListItem) {
    try {
      const full = await usersService.getById(row.id);
      setEditingUser(full);
      setDrawerOpen(true);
    } catch {
      toast.error("Erro ao carregar usuário");
    }
  }

  function handleNew() { setEditingUser(null); setDrawerOpen(true); }
  function handleClose() {
    if (!createMutation.isPending && !updateMutation.isPending) {
      setDrawerOpen(false);
      setEditingUser(null);
    }
  }
  function handleSubmit(payload: CreateUserPayload | Partial<CreateUserPayload>) {
    editingUser
      ? updateMutation.mutate({ id: editingUser.id, payload })
      : createMutation.mutate(payload as CreateUserPayload);
  }

  const columns: DataTableColumn<UserListItem>[] = [
    {
      key: "user", header: "Usuário",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-accent text-xs font-bold text-white">
            {row.full_name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-content-primary">{row.full_name}</p>
            <p className="truncate text-xs text-content-tertiary">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "roles", header: "Perfis", width: "280px",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.roles.length === 0 ? (
            <span className="text-xs text-content-tertiary">Sem perfil</span>
          ) : (
            row.roles.map((r) => (
              <Badge key={r} tone={r === "superadmin" || r === "admin" ? "brand" : "neutral"}>
                {ROLE_LABELS[r] || r}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      key: "last_login", header: "Último acesso", width: "160px",
      cell: (row) => row.last_login_at ? (
        <span className="text-xs text-content-secondary">{formatDateTime(row.last_login_at)}</span>
      ) : (
        <span className="text-xs text-content-tertiary">Nunca acessou</span>
      ),
    },
    {
      key: "status", header: "Status", width: "140px",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          {row.is_locked && (
            <Badge tone="error" dot>
              <Lock className="mr-1 h-3 w-3" />
              Bloqueado
            </Badge>
          )}
          {!row.is_locked && (
            <Badge tone={row.is_active ? "success" : "neutral"} dot>
              {row.is_active ? "Ativo" : "Inativo"}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "actions", header: "", width: "140px", align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          {row.is_locked && isAdmin && (
            <button
              onClick={(e) => { e.stopPropagation(); unlockMutation.mutate(row.id); }}
              title="Desbloquear usuário"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-content-tertiary transition-colors hover:bg-amber-50 hover:text-status-warning"
            >
              <Unlock className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
            title="Editar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-content-tertiary transition-colors hover:bg-surface-secondary hover:text-content-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {isAdmin && (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmToggle(row); }}
              title={row.is_active ? "Desativar" : "Ativar"}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                row.is_active
                  ? "text-content-tertiary hover:bg-red-50 hover:text-status-error"
                  : "text-content-tertiary hover:bg-emerald-50 hover:text-status-success"
              }`}
            >
              <Power className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Gestão de usuários e perfis de acesso"
        actions={
          isAdmin && (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleNew}>
              Novo usuário
            </Button>
          )
        }
      />

      {!isAdmin && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-status-warning/30 bg-amber-50 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-status-warning" />
          <div>
            <p className="text-sm font-medium text-status-warning">Acesso limitado</p>
            <p className="text-xs text-amber-800">
              Apenas administradores podem criar, editar ou desativar usuários. Você pode visualizar a lista.
            </p>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center gap-1 border-b border-border-default">
        {([
          { key: "all", label: "Todos" },
          { key: "active", label: "Ativos" },
          { key: "inactive", label: "Inativos" },
        ] as const).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                active ? "text-brand-accent" : "text-content-secondary hover:text-content-primary"
              }`}
            >
              {tab.label}
              {active && <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-brand-accent" />}
            </button>
          );
        })}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
        className="mb-4 flex items-center gap-3"
      >
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          leftIcon={<Search className="h-4 w-4" />}
          containerClassName="flex-1"
        />
        <Button type="submit" variant="outline">Buscar</Button>
      </form>

      <DataTable
        columns={columns}
        data={data?.items || []}
        keyField="id"
        isLoading={isLoading}
        onRowClick={isAdmin ? handleEdit : undefined}
        emptyState={{
          icon: <UsersIcon className="h-6 w-6" />,
          title: search ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado",
          description: search ? "Ajuste os filtros" : "Crie usuários para que outras pessoas acessem o sistema",
          action: !search && isAdmin && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleNew}>Cadastrar usuário</Button>,
        }}
        pagination={data ? { page: data.page, pageSize: data.page_size, total: data.total, totalPages: data.total_pages, onPageChange: setPage } : undefined}
      />

      <Drawer
        open={drawerOpen}
        onClose={handleClose}
        title={editingUser ? "Editar usuário" : "Novo usuário"}
        description={editingUser ? editingUser.email : "Crie um usuário com perfis específicos de acesso"}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" form={FORM_ID} isLoading={isSubmitting}>
              {editingUser ? "Salvar" : "Criar usuário"}
            </Button>
          </div>
        }
      >
        <UserForm initialData={editingUser} isSubmitting={isSubmitting} onSubmit={handleSubmit} formId={FORM_ID} />
      </Drawer>

      <ConfirmDialog
        open={confirmToggle !== null}
        onClose={() => setConfirmToggle(null)}
        onConfirm={() => confirmToggle && toggleMutation.mutate(confirmToggle.id)}
        title={confirmToggle?.is_active ? "Desativar usuário?" : "Ativar usuário?"}
        description={
          confirmToggle?.is_active
            ? `${confirmToggle?.full_name} não poderá mais fazer login. Você pode reativar a qualquer momento.`
            : `${confirmToggle?.full_name} poderá fazer login novamente.`
        }
        confirmLabel={confirmToggle?.is_active ? "Desativar" : "Ativar"}
        tone={confirmToggle?.is_active ? "danger" : "default"}
        isLoading={toggleMutation.isPending}
      />
    </div>
  );
}
