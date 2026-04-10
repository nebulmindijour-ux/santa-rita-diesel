import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    error,
    hint,
    options,
    placeholder,
    containerClassName,
    className,
    id,
    required,
    ...rest
  },
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
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          required={required}
          className={cn(
            "block h-10 w-full appearance-none rounded-lg border bg-white px-3.5 pr-10 text-sm text-content-primary transition-colors",
            "focus:outline-none focus:ring-2",
            "disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:opacity-70",
            error
              ? "border-status-error focus:border-status-error focus:ring-status-error/20"
              : "border-border-default focus:border-brand-accent focus:ring-brand-accent/20",
            className,
          )}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-tertiary" />
      </div>
      {error ? (
        <p className="text-xs font-medium text-status-error">{error}</p>
      ) : hint ? (
        <p className="text-xs text-content-tertiary">{hint}</p>
      ) : null}
    </div>
  );
});
