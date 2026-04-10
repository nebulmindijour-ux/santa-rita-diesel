import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { EmptyState } from "./empty-state";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  width?: string;
  align?: "left" | "right" | "center";
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyField: keyof T;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  emptyState?: {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T>({
  columns,
  data,
  keyField,
  isLoading = false,
  onRowClick,
  emptyState,
  pagination,
}: DataTableProps<T>) {
  const showEmpty = !isLoading && data.length === 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border-default bg-surface-elevated">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border-default bg-surface-primary">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-content-secondary",
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                        ? "text-center"
                        : "text-left",
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-brand-accent" />
                    <span className="text-xs text-content-tertiary">Carregando...</span>
                  </div>
                </td>
              </tr>
            )}
            {showEmpty && emptyState && (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    icon={emptyState.icon}
                    title={emptyState.title}
                    description={emptyState.description}
                    action={emptyState.action}
                  />
                </td>
              </tr>
            )}
            {!isLoading &&
              data.map((row) => (
                <tr
                  key={String(row[keyField])}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b border-border-default last:border-b-0 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-surface-primary",
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3.5 text-sm text-content-primary",
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                            ? "text-center"
                            : "text-left",
                        col.className,
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {pagination && data.length > 0 && (
        <div className="flex items-center justify-between border-t border-border-default bg-surface-primary px-4 py-3">
          <p className="text-xs text-content-secondary">
            Página <span className="font-semibold text-content-primary">{pagination.page}</span> de{" "}
            <span className="font-semibold text-content-primary">{pagination.totalPages}</span>
            {" · "}
            <span className="font-semibold text-content-primary">{pagination.total}</span>{" "}
            {pagination.total === 1 ? "registro" : "registros"}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-content-secondary transition-colors hover:bg-surface-secondary hover:text-content-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-content-secondary transition-colors hover:bg-surface-secondary hover:text-content-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
