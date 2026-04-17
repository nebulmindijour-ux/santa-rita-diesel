import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/design-system/components/input";
import { Textarea } from "@/design-system/components/textarea";
import { Select } from "@/design-system/components/select";
import { Button } from "@/design-system/components/button";
import { api } from "@/shared/lib/api-client";
import { formatNumber } from "@/shared/lib/formatters";
import type { ServiceOrder, CreateServiceOrderPayload, ItemType } from "../types";
import { ORDER_TYPE_OPTIONS, ORDER_STATUS_OPTIONS, PRIORITY_OPTIONS, ITEM_TYPE_OPTIONS } from "../types";
import type { VehicleListItem } from "@/modules/fleet/types";
import type { PaginatedResponse } from "@/modules/customers/types";

interface FormItem {
  key: string;
  item_type: ItemType;
  description: string;
  quantity: string;
  unit_cost: string;
}

interface OrderFormProps {
  initialData?: ServiceOrder | null;
  isSubmitting: boolean;
  onSubmit: (payload: CreateServiceOrderPayload) => void;
  formId: string;
}

let itemKeyCounter = 0;
function nextKey() { return `item-${++itemKeyCounter}`; }

export function ServiceOrderForm({ initialData, isSubmitting, onSubmit, formId }: OrderFormProps) {
  const [vehicleId, setVehicleId] = useState("");
  const [orderType, setOrderType] = useState("corrective");
  const [priority, setPriority] = useState("normal");
  const [status, setStatus] = useState("open");
  const [description, setDescription] = useState("");
  const [vehicleKm, setVehicleKm] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [technicianName, setTechnicianName] = useState("");
  const [laborHours, setLaborHours] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<FormItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!initialData;

  const { data: vehiclesData } = useQuery({
    queryKey: ["maint-form-vehicles"],
    queryFn: () => api.get("vehicles", { searchParams: { page_size: "200" } }).json<PaginatedResponse<VehicleListItem>>(),
    staleTime: 60_000,
  });

  const vehicles = vehiclesData?.items || [];
  const vehicleOptions = vehicles.map((v) => ({
    value: v.id,
    label: `${v.plate} — ${v.brand} ${v.model} (${formatNumber(v.odometer)} km)`,
  }));

  function handleVehicleChange(id: string) {
    setVehicleId(id);
    if (!id || isEditing) return;
    const v = vehicles.find((x) => x.id === id);
    if (v && !vehicleKm) setVehicleKm(String(v.odometer));
  }

  useEffect(() => {
    if (!initialData) return;
    setVehicleId(initialData.vehicle_id);
    setOrderType(initialData.order_type);
    setPriority(initialData.priority);
    setStatus(initialData.status);
    setDescription(initialData.description);
    setVehicleKm(initialData.vehicle_km ? String(initialData.vehicle_km) : "");
    setScheduledDate(initialData.scheduled_date || "");
    setTechnicianName(initialData.technician_name || "");
    setLaborHours(initialData.labor_hours ? String(initialData.labor_hours) : "");
    setLaborCost(initialData.labor_cost ? String(initialData.labor_cost) : "");
    setNotes(initialData.notes || "");
    setItems(
      initialData.items.map((i) => ({
        key: nextKey(),
        item_type: i.item_type,
        description: i.description,
        quantity: String(i.quantity),
        unit_cost: String(i.unit_cost),
      })),
    );
  }, [initialData]);

  function addItem() {
    setItems((prev) => [...prev, { key: nextKey(), item_type: "part", description: "", quantity: "1", unit_cost: "0" }]);
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function updateItem(key: string, field: keyof FormItem, value: string) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, [field]: value } : i)));
  }

  const totalParts = items.reduce((sum, i) => {
    const q = parseFloat(i.quantity) || 0;
    const u = parseFloat(i.unit_cost) || 0;
    return sum + q * u;
  }, 0);

  const totalLabor = parseFloat(laborCost) || 0;
  const grandTotal = totalParts + totalLabor;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!vehicleId) newErrors.vehicleId = "Veículo é obrigatório";
    if (!description.trim()) newErrors.description = "Descrição é obrigatória";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const payload: CreateServiceOrderPayload & { status?: string; labor_hours?: number; labor_cost?: number } = {
      vehicle_id: vehicleId,
      order_type: orderType as CreateServiceOrderPayload["order_type"],
      priority: priority as CreateServiceOrderPayload["priority"],
      description: description.trim(),
      vehicle_km: vehicleKm ? parseFloat(vehicleKm) : undefined,
      scheduled_date: scheduledDate || undefined,
      technician_name: technicianName || undefined,
      notes: notes || undefined,
      items: items.filter((i) => i.description.trim()).map((i) => ({
        item_type: i.item_type,
        description: i.description.trim(),
        quantity: parseFloat(i.quantity) || 1,
        unit_cost: parseFloat(i.unit_cost) || 0,
      })),
    };

    if (isEditing) {
      (payload as Record<string, unknown>).status = status;
      if (laborHours) payload.labor_hours = parseFloat(laborHours);
      if (laborCost) payload.labor_cost = parseFloat(laborCost);
    }

    onSubmit(payload);
  }

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Informações gerais</h3>
        <Select label="Veículo" value={vehicleId} onChange={(e) => handleVehicleChange(e.target.value)} options={vehicleOptions} placeholder="Selecione o veículo" error={errors.vehicleId} required disabled={isEditing || isSubmitting} hint={selectedVehicle ? `Odômetro: ${formatNumber(selectedVehicle.odometer)} km` : `${vehicles.length} veículos`} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select label="Tipo" value={orderType} onChange={(e) => setOrderType(e.target.value)} options={ORDER_TYPE_OPTIONS} required disabled={isEditing || isSubmitting} />
          <Select label="Prioridade" value={priority} onChange={(e) => setPriority(e.target.value)} options={PRIORITY_OPTIONS} />
          {isEditing && <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={ORDER_STATUS_OPTIONS} />}
        </div>
        <Input label="Descrição do serviço" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o problema ou serviço a ser realizado" error={errors.description} disabled={isSubmitting} required />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Km do veículo" type="number" min="0" value={vehicleKm} onChange={(e) => setVehicleKm(e.target.value)} placeholder="Preenchido pelo veículo" disabled={isSubmitting} />
          <Input label="Data agendada" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} disabled={isSubmitting} />
          <Input label="Técnico responsável" value={technicianName} onChange={(e) => setTechnicianName(e.target.value)} disabled={isSubmitting} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Peças e serviços</h3>
          <Button type="button" variant="ghost" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={addItem}>
            Adicionar item
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-content-tertiary">Nenhum item adicionado. Clique em "Adicionar item" acima.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.key} className="flex items-start gap-2 rounded-lg border border-border-default bg-surface-primary p-3">
                <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-5">
                  <Select value={item.item_type} onChange={(e) => updateItem(item.key, "item_type", e.target.value)} options={ITEM_TYPE_OPTIONS} containerClassName="sm:col-span-1" />
                  <Input value={item.description} onChange={(e) => updateItem(item.key, "description", e.target.value)} placeholder="Descrição do item" containerClassName="sm:col-span-2" />
                  <Input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateItem(item.key, "quantity", e.target.value)} placeholder="Qtd" containerClassName="sm:col-span-1" />
                  <Input type="number" min="0" step="0.01" value={item.unit_cost} onChange={(e) => updateItem(item.key, "unit_cost", e.target.value)} placeholder="R$ unit." containerClassName="sm:col-span-1" />
                </div>
                <div className="flex flex-col items-end gap-1 pt-1">
                  <span className="text-xs font-semibold text-content-primary">
                    R$ {((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0)).toFixed(2)}
                  </span>
                  <button type="button" onClick={() => removeItem(item.key)} className="text-content-tertiary hover:text-status-error">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isEditing && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Horas de mão de obra" type="number" min="0" step="0.5" value={laborHours} onChange={(e) => setLaborHours(e.target.value)} disabled={isSubmitting} />
            <Input label="Custo mão de obra (R$)" type="number" min="0" step="0.01" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} disabled={isSubmitting} />
          </div>
        )}

        <div className="flex items-center justify-end gap-6 rounded-lg bg-surface-secondary px-4 py-3">
          <div className="text-right">
            <p className="text-xs text-content-tertiary">Peças/serviços</p>
            <p className="text-sm font-semibold text-content-primary">R$ {totalParts.toFixed(2)}</p>
          </div>
          {isEditing && (
            <div className="text-right">
              <p className="text-xs text-content-tertiary">Mão de obra</p>
              <p className="text-sm font-semibold text-content-primary">R$ {totalLabor.toFixed(2)}</p>
            </div>
          )}
          <div className="text-right">
            <p className="text-xs text-content-tertiary">Total</p>
            <p className="text-lg font-bold text-brand-accent">R$ {grandTotal.toFixed(2)}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Observações</h3>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} disabled={isSubmitting} />
      </section>
    </form>
  );
}
