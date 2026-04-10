import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, containerClassName, className, id, required, rows = 4, ...rest },
  ref,
) {
  const inputId = id || rest.name;
  return (
    <div className={cn("space-y-1.5", containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-content-primary">
          {label}
          {required && <span className="ml-0.5 text-status-error">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        required={required}
        className={cn(
          "block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-content-primary placeholder:text-content-tertiary transition-colors",
          "focus:outline-none focus:ring-2",
          "disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:opacity-70",
          "resize-y",
          error
            ? "border-status-error focus:border-status-error focus:ring-status-error/20"
            : "border-border-default focus:border-brand-accent focus:ring-brand-accent/20",
          className,
        )}
        {...rest}
      />
      {error ? (
        <p className="text-xs font-medium text-status-error">{error}</p>
      ) : hint ? (
        <p className="text-xs text-content-tertiary">{hint}</p>
      ) : null}
    </div>
  );
});
