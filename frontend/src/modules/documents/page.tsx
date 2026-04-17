import { useState, useRef } from "react";
import type { FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, FileText, Trash2, Download, Upload, File as FileIcon,
  Image, FileSpreadsheet, FileArchive,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/design-system/components/page-header";
import { Button } from "@/design-system/components/button";
import { Input } from "@/design-system/components/input";
import { Textarea } from "@/design-system/components/textarea";
import { Select } from "@/design-system/components/select";
import { Badge } from "@/design-system/components/badge";
import { Drawer } from "@/design-system/components/drawer";
import { ConfirmDialog } from "@/design-system/components/confirm-dialog";
import { DataTable } from "@/design-system/components/data-table";
import type { DataTableColumn } from "@/design-system/components/data-table";
import { formatDate } from "@/shared/lib/formatters";
import { extractProblem } from "@/shared/lib/api-client";
import { useIsAdmin } from "@/modules/auth/use-permissions";
import { documentsService } from "./service";
import type { DocumentItem } from "./types";
import { CATEGORY_LABELS, CATEGORY_OPTIONS, ENTITY_TYPE_LABELS } from "./types";
import type { DocumentCategory } from "./types";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ contentType }: { contentType: string }) {
  if (contentType.startsWith("image/")) return <Image className="h-4 w-4 text-blue-500" />;
  if (contentType.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
  if (contentType.includes("spreadsheet") || contentType.includes("excel")) return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
  if (contentType.includes("zip") || contentType.includes("rar")) return <FileArchive className="h-4 w-4 text-amber-500" />;
  return <FileIcon className="h-4 w-4 text-content-tertiary" />;
}

export function DocumentsPage() {
  const queryClient = useQueryClient();
  const isAdmin = useIsAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<DocumentItem | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["documents", { page, search, categoryFilter }],
    queryFn: () => documentsService.list({
      page, page_size: 20, search: search || undefined,
      category: categoryFilter || undefined,
    }),
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!selectedFile) throw new Error("Nenhum arquivo selecionado");
      return documentsService.upload(
        selectedFile, category, description || undefined,
        entityType || undefined, entityId || undefined,
      );
    },
    onSuccess: () => {
      toast.success("Documento enviado");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      resetForm();
      setDrawerOpen(false);
    },
    onError: async (err) => {
      const p = await extractProblem(err);
      toast.error(p?.detail || "Erro ao enviar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsService.remove(id),
    onSuccess: () => {
      toast.success("Documento excluído");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setConfirmDelete(null);
    },
    onError: async (err) => {
      const p = await extractProblem(err);
      toast.error(p?.detail || "Erro ao excluir");
    },
  });

  function resetForm() {
    setSelectedFile(null);
    setCategory("other");
    setDescription("");
    setEntityType("");
    setEntityId("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleNew() { resetForm(); setDrawerOpen(true); }

  async function handleDownload(doc: DocumentItem) {
    try {
      const detail = await documentsService.getById(doc.id);
      if (detail.download_url) {
        window.open(detail.download_url, "_blank");
      } else {
        toast.error("URL de download não disponível");
      }
    } catch {
      toast.error("Erro ao obter link de download");
    }
  }

  function handleUploadSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedFile) { toast.error("Selecione um arquivo"); return; }
    uploadMutation.mutate();
  }

  const ENTITY_OPTIONS = [
    { value: "vehicle", label: "Veículo" },
    { value: "driver", label: "Motorista" },
    { value: "customer", label: "Cliente" },
    { value: "supplier", label: "Fornecedor" },
    { value: "operation", label: "Operação" },
  ];

  const columns: DataTableColumn<DocumentItem>[] = [
    {
      key: "file", header: "Arquivo",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <FileTypeIcon contentType={row.content_type} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-content-primary">{row.original_name}</p>
            <p className="text-xs text-content-tertiary">{formatFileSize(row.file_size)}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category", header: "Categoria", width: "130px",
      cell: (row) => <Badge tone="brand">{CATEGORY_LABELS[row.category as DocumentCategory] || row.category}</Badge>,
    },
    {
      key: "entity", header: "Vínculo", width: "180px",
      cell: (row) => row.entity_type ? (
        <span className="text-xs text-content-secondary">
          {ENTITY_TYPE_LABELS[row.entity_type] || row.entity_type}
          {row.entity_id && ` · ${row.entity_id.slice(0, 8)}...`}
        </span>
      ) : <span className="text-xs text-content-tertiary">Sem vínculo</span>,
    },
    {
      key: "description", header: "Descrição", width: "200px",
      cell: (row) => row.description
        ? <p className="truncate text-xs text-content-secondary">{row.description}</p>
        : <span className="text-xs text-content-tertiary">—</span>,
    },
    {
      key: "date", header: "Data", width: "110px",
      cell: (row) => <span className="text-xs text-content-secondary">{formatDate(row.created_at)}</span>,
    },
    {
      key: "actions", header: "", width: "100px", align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); handleDownload(row); }} title="Download" className="flex h-8 w-8 items-center justify-center rounded-lg text-content-tertiary hover:bg-surface-secondary hover:text-content-primary">
            <Download className="h-3.5 w-3.5" />
          </button>
          {isAdmin && (
            <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(row); }} title="Excluir" className="flex h-8 w-8 items-center justify-center rounded-lg text-content-tertiary hover:bg-red-50 hover:text-status-error">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Documentos" description="Upload e gestão de documentos privados"
        actions={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleNew}>Enviar documento</Button>} />

      <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="mb-4 flex items-center gap-3">
        <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Buscar por nome ou descrição..." leftIcon={<Search className="h-4 w-4" />} containerClassName="flex-1" />
        <Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} options={CATEGORY_OPTIONS} placeholder="Todas as categorias" containerClassName="w-48" />
        <Button type="submit" variant="outline">Buscar</Button>
      </form>

      <DataTable columns={columns} data={data?.items || []} keyField="id" isLoading={isLoading}
        emptyState={{ icon: <FileText className="h-6 w-6" />, title: search ? "Nenhum documento encontrado" : "Nenhum documento enviado", description: search ? "Ajuste os filtros" : "Envie CRLVs, seguros, CNHs e outros documentos",
          action: !search && <Button leftIcon={<Upload className="h-4 w-4" />} onClick={handleNew}>Enviar documento</Button> }}
        pagination={data ? { page: data.page, pageSize: data.page_size, total: data.total, totalPages: data.total_pages, onPageChange: setPage } : undefined}
      />

      <Drawer open={drawerOpen} onClose={() => !uploadMutation.isPending && setDrawerOpen(false)} title="Enviar documento" description="Faça upload de um arquivo para o sistema" size="lg"
        footer={<div className="flex items-center justify-end gap-2"><Button variant="outline" onClick={() => setDrawerOpen(false)} disabled={uploadMutation.isPending}>Cancelar</Button><Button onClick={handleUploadSubmit} isLoading={uploadMutation.isPending} disabled={!selectedFile}>Enviar</Button></div>}>
        <form onSubmit={handleUploadSubmit} className="space-y-6">
          <section className="space-y-4">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Arquivo</h3>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border-default bg-surface-secondary p-8 transition-colors hover:border-brand-accent/40 hover:bg-brand-accent-soft"
            >
              <Upload className="h-8 w-8 text-content-tertiary" />
              {selectedFile ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-content-primary">{selectedFile.name}</p>
                  <p className="text-xs text-content-tertiary">{formatFileSize(selectedFile.size)}</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-medium text-content-primary">Clique para selecionar</p>
                  <p className="text-xs text-content-tertiary">PDF, imagens, planilhas — máximo 50 MB</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
          </section>

          <section className="space-y-4">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Classificação</h3>
            <Select label="Categoria" value={category} onChange={(e) => setCategory(e.target.value)} options={CATEGORY_OPTIONS} />
            <Textarea label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição do documento" rows={2} />
          </section>

          <section className="space-y-4">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Vínculo (opcional)</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select label="Tipo de entidade" value={entityType} onChange={(e) => setEntityType(e.target.value)} options={ENTITY_OPTIONS} placeholder="Nenhum" />
              <Input label="ID da entidade" value={entityId} onChange={(e) => setEntityId(e.target.value)} placeholder="UUID da entidade" disabled={!entityType} />
            </div>
          </section>
        </form>
      </Drawer>

      <ConfirmDialog open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)} title="Excluir documento?" description={`O arquivo "${confirmDelete?.original_name}" será removido permanentemente do sistema e do armazenamento.`} confirmLabel="Excluir" tone="danger" isLoading={deleteMutation.isPending} />
    </div>
  );
}
