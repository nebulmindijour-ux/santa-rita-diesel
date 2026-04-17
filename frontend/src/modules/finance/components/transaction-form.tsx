import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/design-system/components/input";
import { Textarea } from "@/design-system/components/textarea";
import { Select } from "@/design-system/components/select";
import { api } from "@/shared/lib/api-client";
import { financeService } from "../service";
import type { FinanceTransaction } from "../types";
import { DIRECTION_OPTIONS, PAYMENT_METHOD_OPTIONS } from "../types";
import type { PaginatedResponse } from "@/modules/customers/types";

interface TransactionFormProps {
  initialData?: FinanceTransaction | null;
  isSubmitting: boolean;
  onSubmit: (payload: Record<string, unknown>) => void;
  formId: string;
}

export function TransactionForm({ initialData, isSubmitting, onSubmit, formId }: TransactionFormProps) {
  const [direction, setDirection] = useState("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [referenceDate, setReferenceDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!initialData;

  const { data: categories = [] } = useQuery({
    queryKey: ["finance-categories", direction],
    queryFn: () => financeService.listCategories(direction),
    staleTime: 60_000,
  });

  const { data: suppliersData } = useQuery({
    queryKey: ["finance-suppliers"],
    queryFn: () => api.get("suppliers", { searchParams: { page_size: "200" } }).json<PaginatedResponse<{ id: string; legal_name: string }>>(),
    staleTime: 60_000,
    enabled: direction === "expense",
  });

  const { data: customersData } = useQuery({
    queryKey: ["finance-customers"],
    queryFn: () => api.get("customers", { searchParams: { page_size: "200" } }).json<PaginatedResponse<{ id: string; legal_name: string }>>(),
    staleTime: 60_000,
    enabled: direction === "income",
  });

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const supplierOptions = (suppliersData?.items || []).map((s) => ({ value: s.id, label: s.legal_name }));
  const customerOptions = (customersData?.items || []).map((c) => ({ value: c.id, label: c.legal_name }));

  useEffect(() => {
    if (!initialData) return;
    setDirection(initialData.direction);
    setDescription(initialData.description);
    setAmount(String(initialData.amount));
    setDueDate(initialData.due_date);
    setReferenceDate(initialData.reference_date || "");
    setCategoryId(initialData.category_id || "");
    setSupplierId(initialData.supplier_id || "");
    setCustomerId(initialData.customer_id || "");
    setPaymentMethod(initialData.payment_method || "");
    setDocumentNumber(initialData.document_number || "");
    setNotes(initialData.notes || "");
  }, [initialData]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!description.trim()) newErrors.description = "Descrição é obrigatória";
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = "Valor deve ser maior que zero";
    if (!dueDate) newErrors.dueDate = "Data de vencimento é obrigatória";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const payload: Record<string, unknown> = {
      direction,
      description: description.trim(),
      amount: parseFloat(amount),
      due_date: dueDate,
      reference_date: referenceDate || undefined,
      category_id: categoryId || undefined,
      supplier_id: direction === "expense" && supplierId ? supplierId : undefined,
      customer_id: direction === "income" && customerId ? customerId : undefined,
      payment_method: paymentMethod || undefined,
      document_number: documentNumber || undefined,
      notes: notes || undefined,
    };
    onSubmit(payload);
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Tipo</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Direção" value={direction} onChange={(e) => { setDirection(e.target.value); setCategoryId(""); setSupplierId(""); setCustomerId(""); }} options={DIRECTION_OPTIONS} required disabled={isEditing || isSubmitting} />
          <Select label="Categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} options={categoryOptions} placeholder="Selecione" disabled={isSubmitting} hint={`${categories.length} categorias`} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Detalhes</h3>
        <Input label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Abastecimento veículo ABC-1234" error={errors.description} disabled={isSubmitting} required />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Valor (R$)" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" error={errors.amount} disabled={isSubmitting} required />
          <Input label="Vencimento" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} error={errors.dueDate} disabled={isSubmitting} required />
          <Input label="Data de referência" type="date" value={referenceDate} onChange={(e) => setReferenceDate(e.target.value)} disabled={isSubmitting} hint="Mês de competência" />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Vínculo</h3>
        {direction === "expense" && (
          <Select label="Fornecedor" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} options={supplierOptions} placeholder="Nenhum" disabled={isSubmitting} />
        )}
        {direction === "income" && (
          <Select label="Cliente" value={customerId} onChange={(e) => setCustomerId(e.target.value)} options={customerOptions} placeholder="Nenhum" disabled={isSubmitting} />
        )}
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Pagamento</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Método" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} options={PAYMENT_METHOD_OPTIONS} placeholder="Selecione" disabled={isSubmitting} />
          <Input label="Nº do documento" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} placeholder="NF, boleto, recibo" disabled={isSubmitting} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-content-tertiary">Observações</h3>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} disabled={isSubmitting} />
      </section>
    </form>
  );
}
