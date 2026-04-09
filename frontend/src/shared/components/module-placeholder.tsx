import { Construction } from "lucide-react";

interface ModulePlaceholderProps {
  title: string;
  description?: string;
}

export function ModulePlaceholder({ title, description }: ModulePlaceholderProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-20">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-accent-soft">
        <Construction className="h-7 w-7 text-brand-accent" />
      </div>
      <h2 className="mt-5 font-display text-xl font-bold text-content-primary">{title}</h2>
      <p className="mt-2 max-w-md text-center text-sm leading-relaxed text-content-secondary">
        {description || "Este módulo será construído nas próximas fases do projeto."}
      </p>
      <span className="mt-4 inline-flex items-center rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium text-content-tertiary">
        Em desenvolvimento
      </span>
    </div>
  );
}
