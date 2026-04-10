import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const iconBg =
    tone === "danger"
      ? "bg-red-50 text-status-error"
      : tone === "warning"
        ? "bg-amber-50 text-status-warning"
        : "bg-blue-50 text-status-info";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-xl bg-surface-elevated shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6">
          <div className={`flex h-11 w-11 items-center justify-center rounded-full ${iconBg}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold text-content-primary">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-content-secondary">{description}</p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border-default bg-surface-primary px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
