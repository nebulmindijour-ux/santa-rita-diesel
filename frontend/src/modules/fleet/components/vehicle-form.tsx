import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Input } from "@/design-system/components/input";
import { Textarea } from "@/design-system/components/textarea";
import { Select } from "@/design-system/components/select";
import { maskPlateInput } from "@/shared/lib/formatters";
import type { Vehicle, CreateVehiclePayload } from "../types";
import { VEHICLE_TYPE_OPTIONS, VEHICLE_STATUS_OPTIONS, FUEL_TYPE_OPTIONS } from "../types";

interface VehicleFormProps {
  initialData?: Vehicle | null;
  isSubmitting: boolean;
  onSubmit: (payload: CreateVehiclePayload) => void;
  formId: string;
}

function numStr(value: number | null | undefined, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function VehicleForm({ initialData, isSubmitting, onSubmit, formId }: VehicleFormProps) {
  const [plate, setPlate] = useState("");
  const [renavam, setRenavam] = useState("");
  const [chassis, setChassis] = useState("");
  const [vehicleType, setVehicleType] = useState("truck");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [yearManufacture, setYearManufacture] = useState(String(new Date().getFullYear()));
  const [yearModel, setYearModel] = useState(String(new Date().getFullYear()));
  const [color, setColor] = useState("");
  const [fuelType, setFuelType] = useState("diesel");
  const [axisCount, setAxisCount] = useState("");
  const [capacityKg, setCapacityKg] = useState("");
  const [odometer, setOdometer] = useState("");
  const [horimeter, setHorimeter] = useState("");
  const [crlvExpiry, setCrlvExpiry] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [insuranceCompany, setInsuranceCompany] = useState("");
  const [insurancePolicy, setInsurancePolicy] = useState("");
  const [anttCode, setAnttCode] = useState("");
  const [anttExpiry, setAnttExpiry] = useState("");
  const [trackerId, setTrackerId] = useState("");
  const [status, setStatus] = useState("available");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setPlate(initialData.plate);
      setRenavam(initialData.renavam || "");
      setChassis(initialData.chassis || "");
      setVehicleType(initialData.vehicle_type);
      setBrand(initialData.brand);
      setModel(initialData.model);
      setYearManufacture(String(initialData.year_manufacture));
      setYearModel(String(initialData.year_model));
      setColor(initialData.color || "");
      setFuelType(initialData.fuel_type);
      setAxisCount(numStr(initialData.axis_count));
      setCapacityKg(numStr(initialData.capacity_kg));
      setOdometer(numStr(initialData.odometer));
      setHorimeter(numStr(initialData.horimeter));
      setCrlvExpiry(initialData.crlv_expiry || "");
      setInsuranceExpiry(initialData.insurance_expiry || "");
      setInsuranceCompany(initialData.insurance_company || "");
      setInsurancePolicy(initialData.insurance_policy || "");
      setAnttCode(initialData.antt_code || "");
      setAnttExpiry(initialData.antt_expiry || "");
      setTrackerId(initialData.tracker_id || "");
      setStatus(initialData.status);
      setNotes(initialData.notes || "");
    }
  }, [initialData]);

  function handlePlateChange(value: string) {
    setPlate(maskPlateInput(value));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cleanPlate = plate.replace(/[^A-Z0-9]/g, "");
    const newErrors: Record<string, string> = {};
    if (cleanPlate.length !== 7) newErrors.plate = "Placa deve ter 7 caracteres (ex: ABC1D23)";
    if (!brand.trim()) newErrors.brand = "Marca é obrigatória";
    if (!model.trim()) newErrors.model = "Modelo é obrigatório";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const payload: CreateVehiclePayload = {
      plate: cleanPlate,
      renavam: renavam || undefined,
      chassis: chassis.toUpperCase() || undefined,
      vehicle_type: vehicleType as CreateVehiclePayload["vehicle_type"],
      brand: brand.trim(),
      model: model.trim(),
      year_manufacture: parseInt(yearManufacture) || new Date().getFullYear(),
      year_model: parseInt(yearModel) || new Date().getFullYear(),
      color: color || undefined,
      fuel_type: fuelType,
      axis_count: axisCount ? parseInt(axisCount) : undefined,
      capacity_kg: capacityKg ? parseFloat(capacityKg) : undefined,
      odometer: odometer ? parseFloat(odometer) : 0,
      horimeter: horimeter ? parseFloat(horimeter) : 0,
      crlv_expiry: crlvExpiry || undefined,
      insurance_expiry: insuranceExpiry || undefined,
      insurance_company: insuranceCompany || undefined,
      insurance_policy: insurancePolicy || undefined,
      antt_code: anttCode || undefined,
      antt_expiry: anttExpiry || undefined,
      tracker_id: trackerId || undefined,
      notes: notes || undefined,
    };
    onSubmit(payload);
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Identificação</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Placa" value={plate} onChange={(e) => handlePlateChange(e.target.value)} placeholder="ABC1D23" disabled={isEditing || isSubmitting} error={errors.plate} hint="Formato Mercosul: ABC1D23" required />
          <Input label="RENAVAM" value={renavam} onChange={(e) => setRenavam(e.target.value)} disabled={isEditing || isSubmitting} />
          <Input label="Chassi" value={chassis} onChange={(e) => setChassis(e.target.value.toUpperCase())} disabled={isEditing || isSubmitting} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Tipo" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} options={VEHICLE_TYPE_OPTIONS} required />
          <Select label="Combustível" value={fuelType} onChange={(e) => setFuelType(e.target.value)} options={FUEL_TYPE_OPTIONS} required />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Marca" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Volvo, Scania..." disabled={isSubmitting} error={errors.brand} required />
          <Input label="Modelo" value={model} onChange={(e) => setModel(e.target.value)} placeholder="FH 540..." disabled={isSubmitting} error={errors.model} required />
          <Input label="Cor" value={color} onChange={(e) => setColor(e.target.value)} disabled={isSubmitting} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Ano fabricação" type="number" value={yearManufacture} onChange={(e) => setYearManufacture(e.target.value)} disabled={isSubmitting} required />
          <Input label="Ano modelo" type="number" value={yearModel} onChange={(e) => setYearModel(e.target.value)} disabled={isSubmitting} required />
          <Input label="Eixos" type="number" value={axisCount} onChange={(e) => setAxisCount(e.target.value)} disabled={isSubmitting} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Operação</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Odômetro (km)" type="number" min="0" step="1" value={odometer} onChange={(e) => setOdometer(e.target.value)} placeholder="0" disabled={isSubmitting} />
          <Input label="Horímetro" type="number" min="0" step="0.1" value={horimeter} onChange={(e) => setHorimeter(e.target.value)} placeholder="0" disabled={isSubmitting} />
          <Input label="Capacidade (kg)" type="number" min="0" value={capacityKg} onChange={(e) => setCapacityKg(e.target.value)} placeholder="0" disabled={isSubmitting} />
        </div>
        {isEditing && (
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={VEHICLE_STATUS_OPTIONS} />
        )}
        <Input label="ID do rastreador (GPS)" value={trackerId} onChange={(e) => setTrackerId(e.target.value)} placeholder="ID do dispositivo GPS instalado" disabled={isSubmitting} hint="Será usado para integração futura com telemetria em tempo real" />
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Documentos e seguros</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="CRLV — Vencimento" type="date" value={crlvExpiry} onChange={(e) => setCrlvExpiry(e.target.value)} disabled={isSubmitting} />
          <Input label="ANTT — Código" value={anttCode} onChange={(e) => setAnttCode(e.target.value)} disabled={isSubmitting} />
          <Input label="ANTT — Vencimento" type="date" value={anttExpiry} onChange={(e) => setAnttExpiry(e.target.value)} disabled={isSubmitting} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Seguradora" value={insuranceCompany} onChange={(e) => setInsuranceCompany(e.target.value)} disabled={isSubmitting} />
          <Input label="Apólice" value={insurancePolicy} onChange={(e) => setInsurancePolicy(e.target.value)} disabled={isSubmitting} />
          <Input label="Seguro — Vencimento" type="date" value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)} disabled={isSubmitting} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Observações</h3>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas internas sobre o veículo..." rows={3} disabled={isSubmitting} />
      </section>
    </form>
  );
}
