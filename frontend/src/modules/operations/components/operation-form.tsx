import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { Input } from "@/design-system/components/input";
import { Textarea } from "@/design-system/components/textarea";
import { Select } from "@/design-system/components/select";
import { STATE_OPTIONS } from "@/shared/lib/brazilian-states";
import { customersService } from "@/modules/customers/service";
import { fleetService } from "@/modules/fleet/service";
import { driversService } from "@/modules/drivers/service";
import { formatNumber } from "@/shared/lib/formatters";
import type { Operation, CreateOperationPayload } from "../types";
import { OPERATION_STATUS_OPTIONS } from "../types";

interface OperationFormProps {
  initialData?: Operation | null;
  isSubmitting: boolean;
  onSubmit: (payload: CreateOperationPayload) => void;
  formId: string;
}

export function OperationForm({ initialData, isSubmitting, onSubmit, formId }: OperationFormProps) {
  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [status, setStatus] = useState("pending");

  const [originDescription, setOriginDescription] = useState("");
  const [originCity, setOriginCity] = useState("");
  const [originState, setOriginState] = useState("");
  const [originLat, setOriginLat] = useState("");
  const [originLng, setOriginLng] = useState("");

  const [destDescription, setDestDescription] = useState("");
  const [destCity, setDestCity] = useState("");
  const [destState, setDestState] = useState("");
  const [destLat, setDestLat] = useState("");
  const [destLng, setDestLng] = useState("");

  const [distanceKm, setDistanceKm] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");

  const [cargoDescription, setCargoDescription] = useState("");
  const [cargoWeight, setCargoWeight] = useState("");
  const [cargoVolume, setCargoVolume] = useState("");

  const [odometerStart, setOdometerStart] = useState("");
  const [odometerEnd, setOdometerEnd] = useState("");

  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!initialData;

  const { data: customersData } = useQuery({
    queryKey: ["customers-select"],
    queryFn: () => customersService.list({ page_size: 200, is_active: true }),
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles-select"],
    queryFn: () => fleetService.list({ page_size: 200, is_active: true }),
  });

  const { data: driversData } = useQuery({
    queryKey: ["drivers-select"],
    queryFn: () => driversService.list({ page_size: 200, is_active: true }),
  });

  const customers = customersData?.items || [];
  const vehicles = vehiclesData?.items || [];
  const drivers = driversData?.items || [];

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: `${c.legal_name}${c.city ? ` — ${c.city}/${c.state}` : ""}`,
  }));

  const vehicleOptions = vehicles.map((v) => ({
    value: v.id,
    label: `${v.plate} — ${v.brand} ${v.model} (${formatNumber(v.odometer)} km)`,
  }));

  const driverOptions = drivers.map((d) => ({
    value: d.id,
    label: `${d.full_name} — CNH ${d.cnh_category}`,
  }));

  function handleCustomerChange(newCustomerId: string) {
    setCustomerId(newCustomerId);
    if (!newCustomerId || isEditing) return;

    customersService.getById(newCustomerId).then((customer) => {
      const parts: string[] = [];
      if (customer.street) {
        let addr = customer.street;
        if (customer.number) addr += `, ${customer.number}`;
        parts.push(addr);
      }
      if (customer.district) parts.push(customer.district);
      if (customer.city) parts.push(customer.city);
      if (customer.state) parts.push(customer.state);

      if (parts.length > 0 && !destDescription) {
        setDestDescription(parts.join(", "));
      }
      if (customer.city && !destCity) setDestCity(customer.city);
      if (customer.state && !destState) setDestState(customer.state);
      if (customer.latitude && !destLat) setDestLat(String(customer.latitude));
      if (customer.longitude && !destLng) setDestLng(String(customer.longitude));
    }).catch(() => {});
  }

  function handleVehicleChange(newVehicleId: string) {
    setVehicleId(newVehicleId);
    if (!newVehicleId || isEditing) return;

    const vehicle = vehicles.find((v) => v.id === newVehicleId);
    if (vehicle && !odometerStart) {
      setOdometerStart(String(vehicle.odometer));
    }
  }

  useEffect(() => {
    if (!initialData) return;
    setCustomerId(initialData.customer_id);
    setVehicleId(initialData.vehicle_id || "");
    setDriverId(initialData.driver_id || "");
    setStatus(initialData.status);
    setOriginDescription(initialData.origin_description);
    setOriginCity(initialData.origin_city || "");
    setOriginState(initialData.origin_state || "");
    setOriginLat(initialData.origin_latitude ? String(initialData.origin_latitude) : "");
    setOriginLng(initialData.origin_longitude ? String(initialData.origin_longitude) : "");
    setDestDescription(initialData.destination_description);
    setDestCity(initialData.destination_city || "");
    setDestState(initialData.destination_state || "");
    setDestLat(initialData.destination_latitude ? String(initialData.destination_latitude) : "");
    setDestLng(initialData.destination_longitude ? String(initialData.destination_longitude) : "");
    setDistanceKm(initialData.distance_km ? String(initialData.distance_km) : "");
    setEstimatedHours(initialData.estimated_duration_hours ? String(initialData.estimated_duration_hours) : "");
    setCargoDescription(initialData.cargo_description || "");
    setCargoWeight(initialData.cargo_weight_kg ? String(initialData.cargo_weight_kg) : "");
    setCargoVolume(initialData.cargo_volume_m3 ? String(initialData.cargo_volume_m3) : "");
    setOdometerStart(initialData.odometer_start ? String(initialData.odometer_start) : "");
    setOdometerEnd(initialData.odometer_end ? String(initialData.odometer_end) : "");
    setScheduledStart(initialData.scheduled_start ? initialData.scheduled_start.slice(0, 16) : "");
    setScheduledEnd(initialData.scheduled_end ? initialData.scheduled_end.slice(0, 16) : "");
    setNotes(initialData.notes || "");
  }, [initialData]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!customerId) newErrors.customerId = "Cliente é obrigatório";
    if (!originDescription.trim()) newErrors.originDescription = "Origem é obrigatória";
    if (!destDescription.trim()) newErrors.destDescription = "Destino é obrigatório";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const payload: CreateOperationPayload & { status?: string; odometer_end?: number | null; origin_latitude?: number | null; origin_longitude?: number | null; destination_latitude?: number | null; destination_longitude?: number | null } = {
      customer_id: customerId,
      vehicle_id: vehicleId || undefined,
      driver_id: driverId || undefined,
      origin_description: originDescription.trim(),
      origin_city: originCity || undefined,
      origin_state: originState || undefined,
      origin_latitude: originLat ? parseFloat(originLat) : undefined,
      origin_longitude: originLng ? parseFloat(originLng) : undefined,
      destination_description: destDescription.trim(),
      destination_city: destCity || undefined,
      destination_state: destState || undefined,
      destination_latitude: destLat ? parseFloat(destLat) : undefined,
      destination_longitude: destLng ? parseFloat(destLng) : undefined,
      distance_km: distanceKm ? parseFloat(distanceKm) : undefined,
      estimated_duration_hours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      cargo_description: cargoDescription || undefined,
      cargo_weight_kg: cargoWeight ? parseFloat(cargoWeight) : undefined,
      cargo_volume_m3: cargoVolume ? parseFloat(cargoVolume) : undefined,
      odometer_start: odometerStart ? parseFloat(odometerStart) : undefined,
      scheduled_start: scheduledStart ? new Date(scheduledStart).toISOString() : undefined,
      scheduled_end: scheduledEnd ? new Date(scheduledEnd).toISOString() : undefined,
      notes: notes || undefined,
    };

    if (isEditing) {
      (payload as Record<string, unknown>).status = status;
      if (odometerEnd) {
        (payload as Record<string, unknown>).odometer_end = parseFloat(odometerEnd);
      }
    }

    onSubmit(payload);
  }

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Atribuição</h3>
        <Select label="Cliente" value={customerId} onChange={(e) => handleCustomerChange(e.target.value)} options={customerOptions} placeholder="Selecione o cliente" error={errors.customerId} required disabled={isEditing || isSubmitting} hint="Ao selecionar, o endereço do cliente preenche o destino automaticamente" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Veículo" value={vehicleId} onChange={(e) => handleVehicleChange(e.target.value)} options={vehicleOptions} placeholder="Selecione o veículo" disabled={isSubmitting} hint={selectedVehicle ? `Odômetro atual: ${formatNumber(selectedVehicle.odometer)} km` : undefined} />
          <Select label="Motorista" value={driverId} onChange={(e) => setDriverId(e.target.value)} options={driverOptions} placeholder="Selecione o motorista" disabled={isSubmitting} />
        </div>
        {isEditing && (
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={OPERATION_STATUS_OPTIONS} />
        )}
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Origem</h3>
        <Input label="Endereço de origem" value={originDescription} onChange={(e) => setOriginDescription(e.target.value)} placeholder="Rua, número, bairro — local de coleta" error={errors.originDescription} disabled={isSubmitting} required />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Cidade" value={originCity} onChange={(e) => setOriginCity(e.target.value)} disabled={isSubmitting} />
          <Select label="UF" value={originState} onChange={(e) => setOriginState(e.target.value)} options={STATE_OPTIONS} placeholder="Selecione" disabled={isSubmitting} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Latitude" type="number" step="any" value={originLat} onChange={(e) => setOriginLat(e.target.value)} placeholder="-21.000000" disabled={isSubmitting} leftIcon={<MapPin className="h-3.5 w-3.5" />} />
          <Input label="Longitude" type="number" step="any" value={originLng} onChange={(e) => setOriginLng(e.target.value)} placeholder="-45.000000" disabled={isSubmitting} leftIcon={<MapPin className="h-3.5 w-3.5" />} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Destino</h3>
        <Input label="Endereço de destino" value={destDescription} onChange={(e) => setDestDescription(e.target.value)} placeholder="Rua, número, bairro — local de entrega" error={errors.destDescription} disabled={isSubmitting} required />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Cidade" value={destCity} onChange={(e) => setDestCity(e.target.value)} disabled={isSubmitting} />
          <Select label="UF" value={destState} onChange={(e) => setDestState(e.target.value)} options={STATE_OPTIONS} placeholder="Selecione" disabled={isSubmitting} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Latitude" type="number" step="any" value={destLat} onChange={(e) => setDestLat(e.target.value)} placeholder="-23.550000" disabled={isSubmitting} leftIcon={<MapPin className="h-3.5 w-3.5" />} />
          <Input label="Longitude" type="number" step="any" value={destLng} onChange={(e) => setDestLng(e.target.value)} placeholder="-46.633000" disabled={isSubmitting} leftIcon={<MapPin className="h-3.5 w-3.5" />} />
        </div>
        <p className="flex items-center gap-1.5 text-xs text-content-tertiary">
          <MapPin className="h-3 w-3" />
          Na próxima versão, o mapa calculará rota, distância e tempo automaticamente
        </p>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Rota e carga</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Distância estimada (km)" type="number" min="0" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} disabled={isSubmitting} />
          <Input label="Tempo estimado (horas)" type="number" min="0" step="0.5" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} disabled={isSubmitting} />
        </div>
        <Input label="Descrição da carga" value={cargoDescription} onChange={(e) => setCargoDescription(e.target.value)} placeholder="Tipo de mercadoria transportada" disabled={isSubmitting} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Peso da carga (kg)" type="number" min="0" value={cargoWeight} onChange={(e) => setCargoWeight(e.target.value)} disabled={isSubmitting} />
          <Input label="Volume da carga (m³)" type="number" min="0" step="0.1" value={cargoVolume} onChange={(e) => setCargoVolume(e.target.value)} disabled={isSubmitting} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Odômetro</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Km na saída" type="number" min="0" value={odometerStart} onChange={(e) => setOdometerStart(e.target.value)} placeholder="Preenchido automaticamente pelo veículo" disabled={isSubmitting} hint={!isEditing && selectedVehicle ? `Odômetro atual do veículo: ${formatNumber(selectedVehicle.odometer)} km` : undefined} />
          {isEditing && (
            <Input label="Km na chegada" type="number" min="0" value={odometerEnd} onChange={(e) => setOdometerEnd(e.target.value)} placeholder="Informe ao concluir a operação" disabled={isSubmitting} hint="Ao concluir, o odômetro do veículo será atualizado automaticamente" />
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Agendamento</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Saída prevista" type="datetime-local" value={scheduledStart} onChange={(e) => setScheduledStart(e.target.value)} disabled={isSubmitting} />
          <Input label="Chegada prevista" type="datetime-local" value={scheduledEnd} onChange={(e) => setScheduledEnd(e.target.value)} disabled={isSubmitting} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Observações</h3>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} disabled={isSubmitting} />
      </section>
    </form>
  );
}
