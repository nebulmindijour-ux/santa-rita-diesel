import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type Tone = "neutral" | "success" | "warning" | "error" | "info" | "brand";

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

const toneStyles: Record<Tone, { bg: string; text: string; dot: string }> = {
  neutral: {
    bg: "bg-surface-secondary",
    text: "text-content-secondary",
    dot: "bg-content-tertiary",
  },
  success: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  warning: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  error: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  info: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  brand: {
    bg: "bg-brand-accent-soft",
    text: "text-brand-accent",
    dot: "bg-brand-accent",
  },
};

export function Badge({ tone = "neutral", children, className, dot = false }: BadgeProps) {
  const styles = toneStyles[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles.bg,
        styles.text,
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />}
      {children}
    </span>
  );
}
