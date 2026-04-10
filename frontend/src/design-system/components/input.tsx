import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, rightElement, containerClassName, className, id, required, ...rest },
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
        {leftIcon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          className={cn(
            "block h-10 w-full rounded-lg border bg-white px-3.5 text-sm text-content-primary placeholder:text-content-tertiary transition-colors",
            "focus:outline-none focus:ring-2",
            "disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:opacity-70",
            error
              ? "border-status-error focus:border-status-error focus:ring-status-error/20"
              : "border-border-default focus:border-brand-accent focus:ring-brand-accent/20",
            leftIcon && "pl-9",
            rightElement && "pr-10",
            className,
          )}
          {...rest}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-content-tertiary">
            {rightElement}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs font-medium text-status-error">{error}</p>
      ) : hint ? (
        <p className="text-xs text-content-tertiary">{hint}</p>
      ) : null}
    </div>
  );
});
