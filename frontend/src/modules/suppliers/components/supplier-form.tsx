import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Search, Loader2, MapPin } from "lucide-react";
import { Input } from "@/design-system/components/input";
import { Textarea } from "@/design-system/components/textarea";
import { Select } from "@/design-system/components/select";
import { STATE_OPTIONS } from "@/shared/lib/brazilian-states";
import { maskCpfCnpjInput, maskPhoneInput, maskCepInput } from "@/shared/lib/formatters";
import { suppliersService } from "../service";
import type { Supplier, CreateSupplierPayload } from "../types";
import { SUPPLIER_CATEGORIES } from "../types";
import { toast } from "sonner";

interface SupplierFormProps {
  initialData?: Supplier | null;
  isSubmitting: boolean;
  onSubmit: (payload: CreateSupplierPayload) => void;
  onCancel: () => void;
  formId: string;
}

interface FormState {
  document: string;
  document_type: "CNPJ" | "CPF";
  legal_name: string;
  trade_name: string;
  state_registration: string;
  category: string;
  email: string;
  phone: string;
  mobile: string;
  contact_name: string;
  website: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  notes: string;
}

const emptyForm: FormState = {
  document: "",
  document_type: "CNPJ",
  legal_name: "",
  trade_name: "",
  state_registration: "",
  category: "",
  email: "",
  phone: "",
  mobile: "",
  contact_name: "",
  website: "",
  zip_code: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  notes: "",
};

function supplierToForm(s: Supplier): FormState {
  return {
    document: maskCpfCnpjInput(s.document),
    document_type: s.document_type,
    legal_name: s.legal_name,
    trade_name: s.trade_name || "",
    state_registration: s.state_registration || "",
    category: s.category || "",
    email: s.email || "",
    phone: s.phone ? maskPhoneInput(s.phone) : "",
    mobile: s.mobile ? maskPhoneInput(s.mobile) : "",
    contact_name: s.contact_name || "",
    website: s.website || "",
    zip_code: s.zip_code ? maskCepInput(s.zip_code) : "",
    street: s.street || "",
    number: s.number || "",
    complement: s.complement || "",
    district: s.district || "",
    city: s.city || "",
    state: s.state || "",
    notes: s.notes || "",
  };
}

export function SupplierForm({
  initialData,
  isSubmitting,
  onSubmit,
  onCancel: _onCancel,
  formId,
}: SupplierFormProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [cepLoading, setCepLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setForm(supplierToForm(initialData));
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [initialData]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  }

  async function handleCepLookup() {
    const cleanedCep = form.zip_code.replace(/\D/g, "");
    if (cleanedCep.length !== 8) {
      toast.error("Digite um CEP válido com 8 dígitos");
      return;
    }
    setCepLoading(true);
    try {
      const result = await suppliersService.lookupCep(cleanedCep);
      setForm((prev) => ({
        ...prev,
        street: result.street || prev.street,
        district: result.district || prev.district,
        city: result.city || prev.city,
        state: result.state || prev.state,
        complement: result.complement || prev.complement,
      }));
      toast.success("Endereço preenchido automaticamente");
    } catch {
      toast.error("CEP não encontrado");
    } finally {
      setCepLoading(false);
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    const documentDigits = form.document.replace(/\D/g, "");

    if (!initialData) {
      if (!documentDigits) {
        newErrors.document = "Documento é obrigatório";
      } else if (form.document_type === "CPF" && documentDigits.length !== 11) {
        newErrors.document = "CPF deve ter 11 dígitos";
      } else if (form.document_type === "CNPJ" && documentDigits.length !== 14) {
        newErrors.document = "CNPJ deve ter 14 dígitos";
      }
    }

    if (!form.legal_name.trim() || form.legal_name.trim().length < 2) {
      newErrors.legal_name = "Razão social é obrigatória";
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "E-mail inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreateSupplierPayload = {
      document: form.document.replace(/\D/g, ""),
      document_type: form.document_type,
      legal_name: form.legal_name.trim(),
      trade_name: form.trade_name.trim() || null,
      state_registration: form.state_registration.trim() || null,
      category: form.category || null,
      email: form.email.trim() || null,
      phone: form.phone.replace(/\D/g, "") || null,
      mobile: form.mobile.replace(/\D/g, "") || null,
      contact_name: form.contact_name.trim() || null,
      website: form.website.trim() || null,
      zip_code: form.zip_code.replace(/\D/g, "") || null,
      street: form.street.trim() || null,
      number: form.number.trim() || null,
      complement: form.complement.trim() || null,
      district: form.district.trim() || null,
      city: form.city.trim() || null,
      state: form.state || null,
      notes: form.notes.trim() || null,
    };
    onSubmit(payload);
  }

  const isEditing = !!initialData;

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">
          Identificação
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            label="Tipo"
            value={form.document_type}
            onChange={(e) => update("document_type", e.target.value as "CNPJ" | "CPF")}
            disabled={isEditing}
            options={[
              { value: "CNPJ", label: "CNPJ" },
              { value: "CPF", label: "CPF" },
            ]}
            required
          />
          <Input
            label="Documento"
            value={form.document}
            onChange={(e) => update("document", maskCpfCnpjInput(e.target.value))}
            placeholder={form.document_type === "CNPJ" ? "00.000.000/0000-00" : "000.000.000-00"}
            disabled={isEditing || isSubmitting}
            error={errors.document}
            containerClassName="sm:col-span-2"
            required={!isEditing}
          />
        </div>
        <Input
          label="Razão social"
          value={form.legal_name}
          onChange={(e) => update("legal_name", e.target.value)}
          placeholder="Nome oficial do fornecedor"
          disabled={isSubmitting}
          error={errors.legal_name}
          required
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nome fantasia"
            value={form.trade_name}
            onChange={(e) => update("trade_name", e.target.value)}
            disabled={isSubmitting}
          />
          <Select
            label="Categoria"
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            options={[...SUPPLIER_CATEGORIES]}
            placeholder="Selecione uma categoria"
            disabled={isSubmitting}
          />
        </div>
        <Input
          label="Inscrição estadual"
          value={form.state_registration}
          onChange={(e) => update("state_registration", e.target.value)}
          disabled={isSubmitting}
        />
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">
          Contato
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="contato@fornecedor.com"
            disabled={isSubmitting}
            error={errors.email}
          />
          <Input
            label="Website"
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
            placeholder="https://"
            disabled={isSubmitting}
          />
          <Input
            label="Nome do contato"
            value={form.contact_name}
            onChange={(e) => update("contact_name", e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            label="Telefone"
            value={form.phone}
            onChange={(e) => update("phone", maskPhoneInput(e.target.value))}
            placeholder="(00) 0000-0000"
            disabled={isSubmitting}
          />
          <Input
            label="Celular"
            value={form.mobile}
            onChange={(e) => update("mobile", maskPhoneInput(e.target.value))}
            placeholder="(00) 00000-0000"
            disabled={isSubmitting}
            containerClassName="sm:col-span-2"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">
          Endereço
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="CEP"
            value={form.zip_code}
            onChange={(e) => update("zip_code", maskCepInput(e.target.value))}
            placeholder="00000-000"
            disabled={isSubmitting}
            rightElement={
              <button
                type="button"
                onClick={handleCepLookup}
                disabled={cepLoading || isSubmitting}
                className="pointer-events-auto text-brand-accent transition-colors hover:text-brand-accent-hover disabled:opacity-50"
                aria-label="Buscar CEP"
              >
                {cepLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </button>
            }
            hint="Digite e clique na lupa"
          />
          <Input
            label="Logradouro"
            value={form.street}
            onChange={(e) => update("street", e.target.value)}
            disabled={isSubmitting}
            containerClassName="sm:col-span-2"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Número"
            value={form.number}
            onChange={(e) => update("number", e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            label="Complemento"
            value={form.complement}
            onChange={(e) => update("complement", e.target.value)}
            disabled={isSubmitting}
            containerClassName="sm:col-span-2"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Bairro"
            value={form.district}
            onChange={(e) => update("district", e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            label="Cidade"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            disabled={isSubmitting}
          />
          <Select
            label="UF"
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
            options={STATE_OPTIONS}
            placeholder="Selecione"
            disabled={isSubmitting}
          />
        </div>
        {initialData?.latitude && initialData?.longitude && (
          <div className="flex items-center gap-2 rounded-lg bg-brand-accent-soft px-3 py-2 text-xs text-brand-accent">
            <MapPin className="h-3.5 w-3.5" />
            <span className="font-medium">
              Coordenadas: {initialData.latitude.toFixed(6)}, {initialData.longitude.toFixed(6)}
            </span>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">
          Observações
        </h3>
        <Textarea
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Notas internas sobre o fornecedor..."
          rows={3}
          disabled={isSubmitting}
        />
      </section>
    </form>
  );
}
