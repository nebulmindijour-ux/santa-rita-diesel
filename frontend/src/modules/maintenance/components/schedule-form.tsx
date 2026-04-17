import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/design-system/components/input";
import { Textarea } from "@/design-system/components/textarea";
import { Select } from "@/design-system/components/select";
import { api } from "@/shared/lib/api-client";
import { formatNumber } from "@/shared/lib/formatters";
import type { MaintenanceSchedule } from "../types";
import type { VehicleListItem } from "@/modules/fleet/types";
import type { PaginatedResponse } from "@/modules/customers/types";

interface ScheduleFormProps {
  initialData?: MaintenanceSchedule | null;
  isSubmitting: boolean;
  onSubmit: (payload: Record<string, unknown>) => void;
  formId: string;
}

export function ScheduleForm({ initialData, isSubmitting, onSubmit, formId }: ScheduleFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [appliesToAll, setAppliesToAll] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [intervalKm, setIntervalKm] = useState("");
  const [intervalDays, setIntervalDays] = useState("");
  const [lastDoneKm, setLastDoneKm] = useState("");
  const [lastDoneDate, setLastDoneDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!initialData;

  const { data: vehiclesData } = useQuery({
    queryKey: ["schedule-form-vehicles"],
    queryFn: () => api.get("vehicles", { searchParams: { page_size: "200" } }).json<PaginatedResponse<VehicleListItem>>(),
    staleTime: 60_000,
  });

  const vehicles = vehiclesData?.items || [];
  const vehicleOptions = vehicles.map((v) => ({
    value: v.id,
    label: `${v.plate} — ${v.brand} ${v.model} (${formatNumber(v.odometer)} km)`,
  }));

  useEffect(() => {
    if (!initialData) return;
    setName(initialData.name);
    setDescription(initialData.description || "");
    setAppliesToAll(initialData.applies_to_all);
    setVehicleId(initialData.vehicle_id || "");
    setIntervalKm(initialData.interval_km ? String(initialData.interval_km) : "");
    setIntervalDays(initialData.interval_days ? String(initialData.interval_days) : "");
    setLastDoneKm(initialData.last_done_km ? String(initialData.last_done_km) : "");
    setLastDoneDate(initialData.last_done_date || "");
  }, [initialData]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Nome é obrigatório";
    if (!appliesToAll && !vehicleId) newErrors.vehicleId = "Selecione um veículo ou marque 'aplica a todos'";
    if (!intervalKm && !intervalDays) newErrors.interval = "Informe um intervalo em km ou dias";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const payload: Record<string, unknown> = {
      name: name.trim(),
      description: description || undefined,
      applies_to_all: appliesToAll,
      vehicle_id: appliesToAll ? undefined : vehicleId,
      interval_km: intervalKm ? parseInt(intervalKm) : undefined,
      interval_days: intervalDays ? parseInt(intervalDays) : undefined,
      last_done_km: lastDoneKm ? parseFloat(lastDoneKm) : undefined,
      last_done_date: lastDoneDate || undefined,
    };
    onSubmit(payload);
  }

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">
          Programação
        </h3>
        <Input
          label="Nome da manutenção"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Troca de óleo, Revisão geral, Alinhamento"
          error={errors.name}
          disabled={isSubmitting}
          required
        />
        <Textarea
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalhes do serviço a ser feito"
          rows={2}
          disabled={isSubmitting}
        />
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">
          Aplicação
        </h3>
        <label className="flex items-center gap-2 text-sm font-medium text-content-primary">
          <input
            type="checkbox"
            checked={appliesToAll}
            onChange={(e) => {
              setAppliesToAll(e.target.checked);
              if (e.target.checked) setVehicleId("");
            }}
            disabled={isEditing || isSubmitting}
            className="h-4 w-4 rounded border-border-default text-brand-accent focus:ring-brand-accent/40"
          />
          Aplicar a todos os veículos da frota
        </label>
        {!appliesToAll && (
          <Select
            label="Veículo específico"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            options={vehicleOptions}
            placeholder="Selecione o veículo"
            error={errors.vehicleId}
            disabled={isEditing || isSubmitting}
            hint={selectedVehicle ? `Odômetro atual: ${formatNumber(selectedVehicle.odometer)} km` : undefined}
          />
        )}
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">
          Intervalo
        </h3>
        <p className="text-xs text-content-tertiary">
          Informe pelo menos um intervalo. Se ambos forem informados, alerta será ativado pelo que vencer primeiro.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="A cada (km)"
            type="number"
            min="100"
            value={intervalKm}
            onChange={(e) => setIntervalKm(e.target.value)}
            placeholder="Ex: 10000"
            disabled={isSubmitting}
            error={errors.interval}
            hint="Ex: Troca de óleo a cada 10.000 km"
          />
          <Input
            label="A cada (dias)"
            type="number"
            min="1"
            value={intervalDays}
            onChange={(e) => setIntervalDays(e.target.value)}
            placeholder="Ex: 90"
            disabled={isSubmitting}
            hint="Ex: Revisão a cada 90 dias"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">
          Última execução
        </h3>
        <p className="text-xs text-content-tertiary">
          Informe quando foi a última vez que esta manutenção foi feita. O sistema calcula a próxima automaticamente.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Km na última execução"
            type="number"
            min="0"
            value={lastDoneKm}
            onChange={(e) => setLastDoneKm(e.target.value)}
            placeholder="Km do veículo quando foi feito"
            disabled={isSubmitting}
          />
          <Input
            label="Data da última execução"
            type="date"
            value={lastDoneDate}
            onChange={(e) => setLastDoneDate(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </section>
    </form>
  );
}
