import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Package, Power, Pencil } from "lucide-react";
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
import { formatCpfCnpj, formatPhone } from "@/shared/lib/formatters";
import { extractProblem } from "@/shared/lib/api-client";
import { suppliersService } from "./service";
import type {
  Supplier,
  SupplierListItem,
  CreateSupplierPayload,
} from "./types";
import { SUPPLIER_CATEGORIES } from "./types";
import { SupplierForm } from "./components/supplier-form";

const FORM_ID = "supplier-form";

export function SuppliersPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "inactive">("all");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<SupplierListItem | null>(null);

  const isActiveFilter = activeTab === "all" ? undefined : activeTab === "active";

  const { data, isLoading } = useQuery({
    queryKey: ["suppliers", { page, search, categoryFilter, isActiveFilter }],
    queryFn: () =>
      suppliersService.list({
        page,
        page_size: 20,
        search: search || undefined,
        category: categoryFilter || undefined,
        is_active: isActiveFilter,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateSupplierPayload) => suppliersService.create(payload),
    onSuccess: () => {
      toast.success("Fornecedor cadastrado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setDrawerOpen(false);
      setEditingSupplier(null);
    },
    onError: async (err) => {
      const problem = await extractProblem(err);
      toast.error(problem?.detail || "Erro ao cadastrar fornecedor");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateSupplierPayload }) =>
      suppliersService.update(id, payload),
    onSuccess: () => {
      toast.success("Fornecedor atualizado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setDrawerOpen(false);
      setEditingSupplier(null);
    },
    onError: async (err) => {
      const problem = await extractProblem(err);
      toast.error(problem?.detail || "Erro ao atualizar fornecedor");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => suppliersService.toggleActive(id),
    onSuccess: (supplier) => {
      toast.success(
        supplier.is_active ? "Fornecedor ativado com sucesso" : "Fornecedor desativado com sucesso",
      );
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setConfirmToggle(null);
    },
    onError: async (err) => {
      const problem = await extractProblem(err);
      toast.error(problem?.detail || "Erro ao alterar status");
    },
  });

  async function handleEditClick(row: SupplierListItem) {
    try {
      const full = await suppliersService.getById(row.id);
      setEditingSupplier(full);
      setDrawerOpen(true);
    } catch {
      toast.error("Erro ao carregar fornecedor");
    }
  }

  function handleNewClick() {
    setEditingSupplier(null);
    setDrawerOpen(true);
  }

  function handleDrawerClose() {
    if (createMutation.isPending || updateMutation.isPending) return;
    setDrawerOpen(false);
    setEditingSupplier(null);
  }

  function handleFormSubmit(payload: CreateSupplierPayload) {
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  const categoryLabel = (code: string | null) => {
    if (!code) return null;
    return SUPPLIER_CATEGORIES.find((c) => c.value === code)?.label || code;
  };

  const columns: DataTableColumn<SupplierListItem>[] = [
    {
      key: "legal_name",
      header: "Fornecedor",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-content-primary">{row.legal_name}</p>
          {row.trade_name && (
            <p className="truncate text-xs text-content-tertiary">{row.trade_name}</p>
          )}
        </div>
      ),
    },
    {
      key: "document",
      header: "Documento",
      cell: (row) => (
        <span className="font-mono text-xs text-content-secondary">
          {formatCpfCnpj(row.document)}
        </span>
      ),
      width: "180px",
    },
    {
      key: "category",
      header: "Categoria",
      cell: (row) =>
        row.category ? (
          <Badge tone="brand">{categoryLabel(row.category)}</Badge>
        ) : (
          <span className="text-content-tertiary">—</span>
        ),
      width: "180px",
    },
    {
      key: "location",
      header: "Localização",
      cell: (row) =>
        row.city ? (
          <span className="text-content-secondary">
            {row.city}
            {row.state && (
              <span className="ml-1 text-content-tertiary">/ {row.state}</span>
            )}
          </span>
        ) : (
          <span className="text-content-tertiary">—</span>
        ),
      width: "160px",
    },
    {
      key: "contact",
      header: "Contato",
      cell: (row) => (
        <div className="text-xs">
          {row.phone && <p className="text-content-secondary">{formatPhone(row.phone)}</p>}
          {row.email && <p className="truncate text-content-tertiary">{row.email}</p>}
          {!row.phone && !row.email && <span className="text-content-tertiary">—</span>}
        </div>
      ),
      width: "180px",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) =>
        row.is_active ? (
          <Badge tone="success" dot>
            Ativo
          </Badge>
        ) : (
          <Badge tone="neutral" dot>
            Inativo
          </Badge>
        ),
      width: "110px",
    },
    {
      key: "actions",
      header: "",
      width: "100px",
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(row);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-content-tertiary transition-colors hover:bg-surface-secondary hover:text-content-primary"
            aria-label="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmToggle(row);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-content-tertiary transition-colors hover:bg-surface-secondary hover:text-content-primary"
            aria-label={row.is_active ? "Desativar" : "Ativar"}
          >
            <Power className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        title="Fornecedores"
        description="Gestão de fornecedores cadastrados no sistema"
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleNewClick}>
            Novo fornecedor
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-1 border-b border-border-default">
        {(["all", "active", "inactive"] as const).map((tab) => {
          const labels = { all: "Todos", active: "Ativos", inactive: "Inativos" };
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
              }}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "text-brand-accent"
                  : "text-content-secondary hover:text-content-primary"
              }`}
            >
              {labels[tab]}
              {isActive && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-brand-accent" />
              )}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSearchSubmit} className="mb-4 flex items-center gap-3">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por razão social, nome fantasia, documento ou cidade..."
          leftIcon={<Search className="h-4 w-4" />}
          containerClassName="flex-1"
        />
        <Select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          options={[...SUPPLIER_CATEGORIES]}
          placeholder="Todas categorias"
          containerClassName="w-56"
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
        onRowClick={handleEditClick}
        emptyState={{
          icon: <Package className="h-6 w-6" />,
          title:
            search || categoryFilter ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado",
          description:
            search || categoryFilter
              ? "Tente ajustar os filtros de busca"
              : "Comece cadastrando seu primeiro fornecedor",
          action: !search && !categoryFilter && (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleNewClick}>
              Cadastrar fornecedor
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
        onClose={handleDrawerClose}
        title={editingSupplier ? "Editar fornecedor" : "Novo fornecedor"}
        description={
          editingSupplier
            ? "Atualize as informações do fornecedor"
            : "Preencha os dados para cadastrar um novo fornecedor"
        }
        size="xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleDrawerClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" form={FORM_ID} isLoading={isSubmitting}>
              {editingSupplier ? "Salvar alterações" : "Cadastrar fornecedor"}
            </Button>
          </div>
        }
      >
        <SupplierForm
          initialData={editingSupplier}
          isSubmitting={isSubmitting}
          onSubmit={handleFormSubmit}
          onCancel={handleDrawerClose}
          formId={FORM_ID}
        />
      </Drawer>

      <ConfirmDialog
        open={confirmToggle !== null}
        onClose={() => setConfirmToggle(null)}
        onConfirm={() => confirmToggle && toggleMutation.mutate(confirmToggle.id)}
        title={confirmToggle?.is_active ? "Desativar fornecedor?" : "Ativar fornecedor?"}
        description={
          confirmToggle?.is_active
            ? `O fornecedor "${confirmToggle.legal_name}" será marcado como inativo.`
            : `O fornecedor "${confirmToggle?.legal_name}" voltará a ficar ativo no sistema.`
        }
        confirmLabel={confirmToggle?.is_active ? "Desativar" : "Ativar"}
        tone={confirmToggle?.is_active ? "warning" : "info"}
        isLoading={toggleMutation.isPending}
      />
    </div>
  );
}
