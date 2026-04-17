import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Input } from "@/design-system/components/input";
import { Button } from "@/design-system/components/button";
import { usersService } from "../service";
import type { CreateUserPayload, User } from "../types";
import { ROLE_LABELS } from "../types";

interface UserFormProps {
  initialData?: User | null;
  isSubmitting: boolean;
  onSubmit: (payload: CreateUserPayload | Partial<CreateUserPayload>) => void;
  formId: string;
}

export function UserForm({ initialData, isSubmitting, onSubmit, formId }: UserFormProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!initialData;

  const { data: rolesData = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: () => usersService.listRoles(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!initialData) return;
    setEmail(initialData.email);
    setFullName(initialData.full_name);
    setSelectedRoles(new Set(initialData.roles));
  }, [initialData]);

  function toggleRole(name: string) {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!isEditing && !email.trim()) newErrors.email = "E-mail é obrigatório";
    if (!fullName.trim()) newErrors.fullName = "Nome é obrigatório";
    if (!isEditing && password.length < 8) newErrors.password = "Senha deve ter pelo menos 8 caracteres";
    if (isEditing && changePassword && password.length < 8) newErrors.password = "Senha deve ter pelo menos 8 caracteres";
    if (selectedRoles.size === 0) newErrors.roles = "Selecione pelo menos um perfil";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    if (isEditing) {
      const payload: Partial<CreateUserPayload> = {
        full_name: fullName.trim(),
        role_names: Array.from(selectedRoles),
      };
      if (changePassword && password) payload.password = password;
      onSubmit(payload);
    } else {
      onSubmit({
        email: email.trim(),
        full_name: fullName.trim(),
        password,
        role_names: Array.from(selectedRoles),
      });
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">
          Dados de acesso
        </h3>
        <Input
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="usuario@empresa.com"
          error={errors.email}
          disabled={isEditing || isSubmitting}
          required
          hint={isEditing ? "E-mail não pode ser alterado" : undefined}
        />
        <Input
          label="Nome completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="João da Silva"
          error={errors.fullName}
          disabled={isSubmitting}
          required
        />
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">
          Senha
        </h3>
        {isEditing && (
          <label className="flex items-center gap-2 text-sm text-content-primary">
            <input
              type="checkbox"
              checked={changePassword}
              onChange={(e) => {
                setChangePassword(e.target.checked);
                if (!e.target.checked) setPassword("");
              }}
              className="h-4 w-4 rounded border-border-default text-brand-accent focus:ring-brand-accent/40"
            />
            Definir nova senha
          </label>
        )}
        {(!isEditing || changePassword) && (
          <Input
            label={isEditing ? "Nova senha" : "Senha inicial"}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            error={errors.password}
            disabled={isSubmitting}
            required={!isEditing}
            hint="Mínimo 8 caracteres. O usuário pode alterar depois."
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="pointer-events-auto text-content-tertiary hover:text-content-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand-accent" />
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">
            Perfis e permissões
          </h3>
        </div>
        {errors.roles && <p className="text-xs text-status-error">{errors.roles}</p>}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {rolesData.map((role) => {
            const checked = selectedRoles.has(role.name);
            return (
              <label
                key={role.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  checked
                    ? "border-brand-accent bg-brand-accent-soft"
                    : "border-border-default hover:border-brand-accent/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleRole(role.name)}
                  disabled={isSubmitting}
                  className="mt-0.5 h-4 w-4 rounded border-border-default text-brand-accent focus:ring-brand-accent/40"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-content-primary">
                    {ROLE_LABELS[role.name] || role.name}
                  </p>
                  {role.description && (
                    <p className="text-xs text-content-tertiary">{role.description}</p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </section>
    </form>
  );
}
