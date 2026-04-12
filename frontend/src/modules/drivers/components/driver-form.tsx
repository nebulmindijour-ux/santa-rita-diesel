import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/design-system/components/input";
import { Textarea } from "@/design-system/components/textarea";
import { Select } from "@/design-system/components/select";
import { STATE_OPTIONS } from "@/shared/lib/brazilian-states";
import { maskCepInput, maskPhoneInput } from "@/shared/lib/formatters";
import { customersService } from "@/modules/customers/service";
import { fleetService } from "@/modules/fleet/service";
import type { Driver, CreateDriverPayload } from "../types";
import { CNH_CATEGORY_OPTIONS, DRIVER_STATUS_OPTIONS } from "../types";
import { toast } from "sonner";

interface DriverFormProps {
  initialData?: Driver | null;
  isSubmitting: boolean;
  onSubmit: (payload: CreateDriverPayload) => void;
  formId: string;
}

export function DriverForm({ initialData, isSubmitting, onSubmit, formId }: DriverFormProps) {
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cnhNumber, setCnhNumber] = useState("");
  const [cnhCategory, setCnhCategory] = useState("E");
  const [cnhExpiry, setCnhExpiry] = useState("");
  const [cnhFirstIssue, setCnhFirstIssue] = useState("");
  const [mopp, setMopp] = useState(false);
  const [moppExpiry, setMoppExpiry] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [currentVehicleId, setCurrentVehicleId] = useState("");
  const [status, setStatus] = useState("available");
  const [hireDate, setHireDate] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cepLoading, setCepLoading] = useState(false);

  const isEditing = !!initialData;

  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles-select"],
    queryFn: () => fleetService.list({ page_size: 100, is_active: true }),
  });

  const vehicleOptions = (vehiclesData?.items || []).map((v) => ({
    value: v.id,
    label: `${v.plate} — ${v.brand} ${v.model}`,
  }));

  useEffect(() => {
    if (!initialData) return;
    setFullName(initialData.full_name);
    setCpf(initialData.cpf);
    setRg(initialData.rg || "");
    setEmail(initialData.email || "");
    setPhone(initialData.phone ? maskPhoneInput(initialData.phone) : "");
    setMobile(initialData.mobile ? maskPhoneInput(initialData.mobile) : "");
    setBirthDate(initialData.birth_date || "");
    setCnhNumber(initialData.cnh_number);
    setCnhCategory(initialData.cnh_category);
    setCnhExpiry(initialData.cnh_expiry);
    setCnhFirstIssue(initialData.cnh_first_issue || "");
    setMopp(initialData.mopp);
    setMoppExpiry(initialData.mopp_expiry || "");
    setZipCode(initialData.zip_code ? maskCepInput(initialData.zip_code) : "");
    setStreet(initialData.street || "");
    setNumber(initialData.number || "");
    setComplement(initialData.complement || "");
    setDistrict(initialData.district || "");
    setCity(initialData.city || "");
    setState(initialData.state || "");
    setCurrentVehicleId(initialData.current_vehicle_id || "");
    setStatus(initialData.status);
    setHireDate(initialData.hire_date || "");
    setEmergencyName(initialData.emergency_contact_name || "");
    setEmergencyPhone(initialData.emergency_contact_phone ? maskPhoneInput(initialData.emergency_contact_phone) : "");
    setNotes(initialData.notes || "");
  }, [initialData]);

  async function handleCepLookup() {
    const cleaned = zipCode.replace(/\D/g, "");
    if (cleaned.length !== 8) { toast.error("CEP inválido"); return; }
    setCepLoading(true);
    try {
      const result = await customersService.lookupCep(cleaned);
      setStreet(result.street || street);
      setDistrict(result.district || district);
      setCity(result.city || city);
      setState(result.state || state);
      toast.success("Endereço preenchido");
    } catch { toast.error("CEP não encontrado"); }
    finally { setCepLoading(false); }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = "Nome é obrigatório";
    if (!isEditing && cpf.replace(/\D/g, "").length !== 11) newErrors.cpf = "CPF deve ter 11 dígitos";
    if (!cnhNumber.trim()) newErrors.cnhNumber = "CNH é obrigatória";
    if (!cnhExpiry) newErrors.cnhExpiry = "Validade da CNH é obrigatória";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const payload: CreateDriverPayload = {
      full_name: fullName.trim(),
      cpf: cpf.replace(/\D/g, ""),
      rg: rg || undefined,
      email: email || undefined,
      phone: phone.replace(/\D/g, "") || undefined,
      mobile: mobile.replace(/\D/g, "") || undefined,
      birth_date: birthDate || undefined,
      cnh_number: cnhNumber.trim(),
      cnh_category: cnhCategory,
      cnh_expiry: cnhExpiry,
      cnh_first_issue: cnhFirstIssue || undefined,
      mopp,
      mopp_expiry: mopp && moppExpiry ? moppExpiry : undefined,
      zip_code: zipCode.replace(/\D/g, "") || undefined,
      street: street || undefined,
      number: number || undefined,
      complement: complement || undefined,
      district: district || undefined,
      city: city || undefined,
      state: state || undefined,
      current_vehicle_id: currentVehicleId || undefined,
      hire_date: hireDate || undefined,
      emergency_contact_name: emergencyName || undefined,
      emergency_contact_phone: emergencyPhone.replace(/\D/g, "") || undefined,
      notes: notes || undefined,
    };
    onSubmit(payload);
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Dados pessoais</h3>
        <Input label="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} error={errors.fullName} disabled={isSubmitting} required />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="CPF" value={cpf} onChange={(e) => setCpf(e.target.value)} error={errors.cpf} disabled={isEditing || isSubmitting} required />
          <Input label="RG" value={rg} onChange={(e) => setRg(e.target.value)} disabled={isSubmitting} />
          <Input label="Data de nascimento" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} disabled={isSubmitting} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
          <Input label="Telefone" value={phone} onChange={(e) => setPhone(maskPhoneInput(e.target.value))} disabled={isSubmitting} />
          <Input label="Celular" value={mobile} onChange={(e) => setMobile(maskPhoneInput(e.target.value))} disabled={isSubmitting} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">CNH e habilitação</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Nº da CNH" value={cnhNumber} onChange={(e) => setCnhNumber(e.target.value)} error={errors.cnhNumber} disabled={isEditing || isSubmitting} required />
          <Select label="Categoria" value={cnhCategory} onChange={(e) => setCnhCategory(e.target.value)} options={CNH_CATEGORY_OPTIONS} required />
          <Input label="Validade" type="date" value={cnhExpiry} onChange={(e) => setCnhExpiry(e.target.value)} error={errors.cnhExpiry} disabled={isSubmitting} required />
        </div>
        <Input label="Primeira habilitação" type="date" value={cnhFirstIssue} onChange={(e) => setCnhFirstIssue(e.target.value)} disabled={isSubmitting} containerClassName="max-w-xs" />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-content-primary">
            <input type="checkbox" checked={mopp} onChange={(e) => setMopp(e.target.checked)} className="h-4 w-4 rounded border-border-default text-brand-accent focus:ring-brand-accent/40" />
            MOPP (Movimentação de Produtos Perigosos)
          </label>
        </div>
        {mopp && <Input label="MOPP — Validade" type="date" value={moppExpiry} onChange={(e) => setMoppExpiry(e.target.value)} disabled={isSubmitting} containerClassName="max-w-xs" />}
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Vínculo operacional</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Veículo atual" value={currentVehicleId} onChange={(e) => setCurrentVehicleId(e.target.value)} options={vehicleOptions} placeholder="Nenhum veículo vinculado" />
          {isEditing && <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={DRIVER_STATUS_OPTIONS} />}
        </div>
        <Input label="Data de admissão" type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} disabled={isSubmitting} containerClassName="max-w-xs" />
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Endereço</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="CEP" value={zipCode} onChange={(e) => setZipCode(maskCepInput(e.target.value))} disabled={isSubmitting}
            rightElement={<button type="button" onClick={handleCepLookup} disabled={cepLoading} className="pointer-events-auto text-brand-accent hover:text-brand-accent-hover disabled:opacity-50">{cepLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</button>} />
          <Input label="Logradouro" value={street} onChange={(e) => setStreet(e.target.value)} disabled={isSubmitting} containerClassName="sm:col-span-2" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Número" value={number} onChange={(e) => setNumber(e.target.value)} disabled={isSubmitting} />
          <Input label="Bairro" value={district} onChange={(e) => setDistrict(e.target.value)} disabled={isSubmitting} />
          <Input label="Complemento" value={complement} onChange={(e) => setComplement(e.target.value)} disabled={isSubmitting} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} disabled={isSubmitting} />
          <Select label="UF" value={state} onChange={(e) => setState(e.target.value)} options={STATE_OPTIONS} placeholder="Selecione" />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Contato de emergência</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Nome" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} disabled={isSubmitting} />
          <Input label="Telefone" value={emergencyPhone} onChange={(e) => setEmergencyPhone(maskPhoneInput(e.target.value))} disabled={isSubmitting} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Observações</h3>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} disabled={isSubmitting} />
      </section>
    </form>
  );
}
