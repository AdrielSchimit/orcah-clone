"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  calculateDiscount,
  calculateDownPayment,
  type DiscountType,
  type PaymentCondition,
  type PaymentMethod,
} from "@/lib/commercial";
import { formatBRL, parseMoney } from "@/lib/money";
import type { BudgetExtras, BudgetFormLayout, CatalogItem, TemplateConfig } from "@/lib/templates";
import { defaultFormLayout } from "@/lib/templates";

type Customer = {
  id: number;
  name: string;
  phone: string;
};

type Item = {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discount: string;
  kind: string;
  groupName: string;
  notes: string;
  material: string;
  deadline: string;
  length: string;
  width: string;
  height: string;
  areaNote: string;
  powerNote: string;
  volumeNote: string;
};

type SavedService = {
  id: number;
  name: string;
  unit: string;
  defaultPrice: string;
  description: string | null;
};

type State = { id: number; name: string; uf: string };
type City = { id: number; name: string };

export type BudgetFormValues = {
  customerId?: number;
  customerName?: string;
  serviceStateId?: number | null;
  serviceCityId?: number | null;
  validityDate?: string;
  estimatedDays?: string;
  serviceAddress?: string;
  notes?: string;
  discount?: string;
  discountType?: DiscountType;
  discountValue?: string;
  paymentMethod?: PaymentMethod | null;
  acceptedPaymentMethods?: PaymentMethod[];
  paymentCondition?: PaymentCondition;
  downPaymentType?: DiscountType | null;
  downPaymentValue?: string;
  extras?: BudgetExtras | null;
  items?: Item[];
};

function money(value: string) {
  return parseMoney(value);
}

function itemTotal(item: Item) {
  return Math.max(0, money(item.quantity || "1") * money(item.unitPrice) - money(item.discount));
}

function emptyItem(template: TemplateConfig): Item {
  return {
    description: "",
    quantity: template.form?.itemLayout === "area-m2" ? "" : "1",
    unit: template.defaultUnit,
    unitPrice: "",
    discount: "0",
    kind: template.kinds?.[0]?.value ?? "",
    groupName: "",
    notes: "",
    material: "",
    deadline: "",
    length: "",
    width: "",
    height: "",
    areaNote: "",
    powerNote: "",
    volumeNote: "",
  };
}

function defaultValidity() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function formatChipPrice(value: string) {
  const n = money(value);
  if (!n) return "";
  return formatBRL(n);
}

const paymentMethodOptions: { value: PaymentMethod; label: string; tone: string }[] = [
  { value: "pix", label: "Pix", tone: "border-ok/30 bg-ok/10 text-text" },
  { value: "card", label: "Cartão", tone: "border-line bg-card text-text" },
  { value: "boleto", label: "Boleto", tone: "border-line bg-card text-text" },
  { value: "cash", label: "Dinheiro", tone: "border-line bg-card text-text" },
  { value: "transfer", label: "Transferência", tone: "border-line bg-card text-text" },
];

const paymentConditionOptions: { value: PaymentCondition; label: string }[] = [
  { value: "cash", label: "À vista" },
  { value: "deposit_balance", label: "Entrada + saldo" },
  { value: "installments_2", label: "2x" },
  { value: "installments_3", label: "3x" },
  { value: "custom", label: "Personalizado" },
];

const validityPresets = [
  { label: "7 dias", days: 7 },
  { label: "15 dias", days: 15 },
  { label: "30 dias", days: 30 },
];

function dateAfter(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function addressFieldLabel(form: BudgetFormLayout) {
  const optional = form.addressRequired ? "" : " (opcional)";
  if (form.addressLabel) return `${form.addressLabel}${optional}`;
  if (form.extraTitle === "Projeto") return `Endereço do projeto${optional}`;
  if (form.extraTitle === "Obra") return `Endereço da obra${optional}`;
  if (form.extraTitle === "Instalação") return `Endereço da instalação${optional}`;
  if (form.extraTitle === "Evento") return `Local do evento${optional}`;
  if (form.extraTitle === "Ensaio / Evento") return `Local${optional}`;
  return `Endereço do serviço${optional}`;
}

export function BudgetForm({
  budgetId,
  defaults,
  template,
}: {
  budgetId?: number;
  defaults?: BudgetFormValues;
  template: TemplateConfig;
}) {
  const router = useRouter();
  const form = template.form ?? defaultFormLayout(template);
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<number | "">(defaults?.customerId ?? "");
  const [customerLabel, setCustomerLabel] = useState(defaults?.customerName ?? "");
  const [newCustomer, setNewCustomer] = useState(false);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [stateId, setStateId] = useState(String(defaults?.serviceStateId ?? ""));
  const [cityId, setCityId] = useState(String(defaults?.serviceCityId ?? ""));
  const [items, setItems] = useState<Item[]>(
    defaults?.items?.length ? defaults.items.map((item) => ({ ...emptyItem(template), ...item })) : [emptyItem(template)],
  );
  const [discountType, setDiscountType] = useState<DiscountType>(defaults?.discountType ?? "amount");
  const [discountValue, setDiscountValue] = useState(
    defaults?.discountValue ?? defaults?.discount ?? (form.simplified ? "" : "0"),
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(defaults?.paymentMethod ?? "pix");
  const [acceptedPaymentMethods, setAcceptedPaymentMethods] = useState<PaymentMethod[]>(
    defaults?.acceptedPaymentMethods?.length ? defaults.acceptedPaymentMethods : [defaults?.paymentMethod ?? "pix"],
  );
  const [paymentCondition, setPaymentCondition] = useState<PaymentCondition>(defaults?.paymentCondition ?? "cash");
  const [downPaymentType, setDownPaymentType] = useState<DiscountType>(defaults?.downPaymentType ?? "percent");
  const [downPaymentValue, setDownPaymentValue] = useState(defaults?.downPaymentValue ?? "30");
  const [validityDate, setValidityDate] = useState(defaults?.validityDate ?? defaultValidity());
  const [estimatedDays, setEstimatedDays] = useState(defaults?.estimatedDays ?? "");
  const [showMoreOptions, setShowMoreOptions] = useState(Boolean(defaults?.serviceAddress));
  const [catalog, setCatalog] = useState<SavedService[]>([]);
  const [savingCatalogAt, setSavingCatalogAt] = useState<number | null>(null);
  const [extras, setExtras] = useState<BudgetExtras>(() => {
    const start = { ...(defaults?.extras ?? {}) };
    if (template.extras.includes("coats") && !start.coats) start.coats = "2";
    return start;
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!form.showStateCity) return;
    fetch("/api/localidades/estados")
      .then((response) => response.json())
      .then(setStates);
  }, [form.showStateCity]);

  useEffect(() => {
    if (!form.showStateCity || !stateId) return;
    fetch(`/api/localidades/cidades?stateId=${stateId}`)
      .then((response) => response.json())
      .then((data: City[]) => {
        setCities(data);
        setCityId((current) => (data.some((city) => String(city.id) === current) ? current : ""));
      });
  }, [form.showStateCity, stateId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const url = query.trim() ? `/api/clientes?q=${encodeURIComponent(query)}` : "/api/clientes";
      fetch(url)
        .then((response) => response.json())
        .then(setCustomers);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!form.catalogSave) return;
    fetch("/api/servicos")
      .then((response) => response.json())
      .then((data: SavedService[]) => {
        if (Array.isArray(data)) setCatalog(data);
      })
      .catch(() => undefined);
  }, [form.catalogSave]);

  const chips = useMemo(() => {
    if (!form.catalogSave) return template.suggestions;
    const saved: CatalogItem[] = catalog.map((service) => ({
      name: service.name,
      unit: service.unit,
      unitPrice: service.defaultPrice,
      notes: service.description ?? undefined,
    }));
    const savedNames = new Set(saved.map((item) => item.name.toLowerCase()));
    const extrasChips = template.suggestions.filter((item) => !savedNames.has(item.name.toLowerCase()));
    return [...saved, ...extrasChips];
  }, [catalog, form.catalogSave, template.suggestions]);

  const subtotal = items.reduce((sum, item) => sum + itemTotal(item), 0);
  const travel = form.showTravelFee ? money(extras.travelFee ?? "") : 0;
  const commercialSubtotal = subtotal + travel;
  const discountResult = calculateDiscount(commercialSubtotal, discountType, discountValue);
  const discountAmount = "error" in discountResult ? 0 : discountResult.discountAmount;
  const total = "error" in discountResult ? commercialSubtotal : discountResult.total;
  const downPaymentResult = paymentCondition === "deposit_balance"
    ? calculateDownPayment(total, downPaymentType, downPaymentValue)
    : null;
  const downPaymentAmount = downPaymentResult && !("error" in downPaymentResult)
    ? downPaymentResult.downPaymentAmount
    : 0;
  const balanceAmount = downPaymentResult && !("error" in downPaymentResult)
    ? downPaymentResult.balanceAmount
    : total;
  const discountError = "error" in discountResult ? discountResult.error : "";
  const downPaymentError = downPaymentResult && "error" in downPaymentResult ? downPaymentResult.error : "";
  const showExtraSection =
    form.showAddress ||
    template.extras.length > 0 ||
    (form.showStateCity && !form.simplified);
  const showValidityOutsideSummary = form.showValidity && !form.validityInSummary;
  const showPrazoOutsideSummary = form.showPrazo && !form.validityInSummary;

  function updateItem(index: number, patch: Partial<Item>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addSuggestion(suggestion: CatalogItem) {
    const next: Item = {
      ...emptyItem(template),
      description: suggestion.name,
      unit: suggestion.unit,
      quantity: form.itemLayout === "area-m2" && suggestion.unit === "m²" ? "" : "1",
      unitPrice: suggestion.unitPrice ?? "",
      kind: suggestion.kind ?? template.kinds?.[0]?.value ?? "",
      groupName: suggestion.groupName ?? "",
      notes: suggestion.notes ?? "",
    };
    setItems((current) => {
      if (current.length === 1 && !current[0].description.trim()) return [next];
      return [...current, next];
    });
  }

  async function saveToCatalog(index: number) {
    const item = items[index];
    if (!item?.description.trim()) return;
    setSavingCatalogAt(index);
    try {
      const response = await fetch("/api/servicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.description,
          unit: item.unit,
          defaultPrice: item.unitPrice,
          description: item.notes || null,
        }),
      });
      const data = (await response.json()) as { service?: SavedService };
      if (response.ok && data.service) {
        setCatalog((current) => {
          const rest = current.filter((service) => service.id !== data.service!.id && service.name !== data.service!.name);
          return [...rest, data.service!].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
        });
      }
    } finally {
      setSavingCatalogAt(null);
    }
  }

  async function ensureCustomer(formData: FormData) {
    if (customerId) return customerId;
    const name = String(formData.get("newName") ?? "").trim();
    const phone = String(formData.get("newPhone") ?? "");
    const response = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    const data = (await response.json()) as { error?: string; customer?: { id: number; name: string } };
    if (!response.ok || !data.customer) {
      throw new Error(data.error ?? "Não foi possível cadastrar o cliente.");
    }
    return data.customer.id;
  }

  function toggleAcceptedPayment(method: PaymentMethod) {
    setAcceptedPaymentMethods((current) => {
      if (current.includes(method)) {
        const next = current.filter((item) => item !== method);
        return next.length ? next : [paymentMethod];
      }
      return [...current, method];
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (discountError) {
      setError(discountError);
      return;
    }
    if (downPaymentError) {
      setError(downPaymentError);
      return;
    }
    if (!customerId && !newCustomer) {
      setError("Escolha ou cadastre um cliente.");
      return;
    }
    setLoading(true);
    const payloadForm = new FormData(event.currentTarget);

    try {
      const resolvedCustomerId = await ensureCustomer(payloadForm);
      const payload = {
        customerId: resolvedCustomerId,
        serviceStateId: stateId,
        serviceCityId: cityId,
        validityDate,
        estimatedDays,
        serviceAddress: payloadForm.get("serviceAddress"),
        notes: payloadForm.get("notes"),
        discountType,
        discountValue,
        paymentMethod,
        acceptedPaymentMethods,
        paymentCondition,
        downPaymentType,
        downPaymentValue,
        extras,
        items,
      };
      const url = budgetId ? `/api/orcamentos/${budgetId}` : "/api/orcamentos";
      const response = await fetch(url, {
        method: budgetId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string; budget?: { id: number } };
      if (!response.ok || !data.budget) {
        setError(data.error ?? "Não foi possível salvar o orçamento.");
        return;
      }
      router.push(`/painel/orcamentos/${data.budget.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass = "w-full rounded-btn border border-line bg-card px-4 py-3";
  const itemFieldClass = "w-full rounded-btn border border-line bg-card px-3 py-2";
  const areaLayout = form.itemLayout === "area-m2";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 pb-28 md:pb-4">
      <section className="rounded-box border border-line bg-card p-4">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.04em] text-text-soft">Cliente</h2>
        {!newCustomer ? (
          <>
            <input
              value={query || customerLabel}
              onChange={(event) => {
                setQuery(event.target.value);
                setCustomerLabel("");
                setCustomerId("");
              }}
              placeholder="Buscar por nome ou telefone"
              className={fieldClass}
            />
            {customers.length > 0 && !customerId ? (
              <ul className="mt-2 divide-y divide-line overflow-hidden rounded-btn border border-line">
                {customers.slice(0, 6).map((customer) => (
                  <li key={customer.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerId(customer.id);
                        setCustomerLabel(`${customer.name} · ${customer.phone}`);
                        setQuery("");
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-paper"
                    >
                      <span className="block font-medium">{customer.name}</span>
                      <span className="text-text-soft">{customer.phone}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {customerId ? <p className="mt-2 text-sm text-ok">Cliente selecionado.</p> : null}
            <button
              type="button"
              onClick={() => {
                setNewCustomer(true);
                setCustomerId("");
                setCustomerLabel("");
              }}
              className="mt-3 text-sm font-medium text-gold-deep"
            >
              + Novo cliente
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Nome</span>
              <input name="newName" required placeholder="Maria Souza" className={fieldClass} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Telefone</span>
              <input name="newPhone" required placeholder="49 99999-0000" className={fieldClass} />
            </label>
            <button type="button" onClick={() => setNewCustomer(false)} className="text-left text-sm text-text-soft">
              Usar cliente já cadastrado
            </button>
          </div>
        )}
      </section>

      {showExtraSection ? (
        <section className="rounded-box border border-line bg-card p-4">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.04em] text-text-soft">{form.extraTitle || "Serviço"}</h2>
          {template.extras.includes("workType") ? (
            <label className="mb-3 block">
              <span className="mb-1.5 block text-sm font-medium">Tipo de obra</span>
              <select
                value={extras.workType ?? ""}
                onChange={(event) => setExtras((current) => ({ ...current, workType: event.target.value }))}
                className={fieldClass}
              >
                <option value="">Selecione</option>
                <option value="construção">Construção</option>
                <option value="reforma">Reforma</option>
                <option value="ampliação">Ampliação</option>
              </select>
            </label>
          ) : null}
          {template.extras.includes("scope") ? (
            <label className="mb-3 block">
              <span className="mb-1.5 block text-sm font-medium">Interno / externo</span>
              <select
                value={extras.scope ?? ""}
                onChange={(event) => setExtras((current) => ({ ...current, scope: event.target.value }))}
                className={fieldClass}
              >
                <option value="">Selecione</option>
                <option value="interno">Interno</option>
                <option value="externo">Externo</option>
                <option value="ambos">Ambos</option>
              </select>
            </label>
          ) : null}
          {template.extras.includes("plate") ? (
            <label className="mb-3 block">
              <span className="mb-1.5 block text-sm font-medium">Placa (opcional)</span>
              <input
                value={extras.plate ?? ""}
                onChange={(event) => setExtras((current) => ({ ...current, plate: event.target.value }))}
                placeholder="ABC1D23"
                className={fieldClass}
              />
            </label>
          ) : null}
          {template.extras.includes("equipment") ? (
            <label className="mb-3 block">
              <span className="mb-1.5 block text-sm font-medium">
                {form.extraEquipmentLabel ?? (form.extraTitle === "Veículo" ? "Veículo (opcional)" : "Equipamento")}
              </span>
              <input
                value={extras.equipment ?? ""}
                onChange={(event) => setExtras((current) => ({ ...current, equipment: event.target.value }))}
                placeholder={
                  form.extraEquipmentLabel
                    ? "VW Gol, Honda Civic…"
                    : form.extraTitle === "Veículo"
                      ? "Gol, Civic, S10…"
                      : "TV, geladeira, notebook…"
                }
                className={fieldClass}
              />
            </label>
          ) : null}
          {template.extras.includes("year") || template.extras.includes("mileage") ? (
            <div className="mb-3 grid grid-cols-2 gap-3">
              {template.extras.includes("year") ? (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Ano (opcional)</span>
                  <input
                    value={extras.year ?? ""}
                    onChange={(event) => setExtras((current) => ({ ...current, year: event.target.value }))}
                    inputMode="numeric"
                    placeholder="2018"
                    className={fieldClass}
                  />
                </label>
              ) : null}
              {template.extras.includes("mileage") ? (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Quilometragem (opcional)</span>
                  <input
                    value={extras.mileage ?? ""}
                    onChange={(event) => setExtras((current) => ({ ...current, mileage: event.target.value }))}
                    inputMode="numeric"
                    placeholder="45.000"
                    className={fieldClass}
                  />
                </label>
              ) : null}
            </div>
          ) : null}
          {template.extras.includes("brand") || template.extras.includes("model") ? (
            <div className="mb-3 grid grid-cols-2 gap-3">
              {template.extras.includes("brand") ? (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Marca (opcional)</span>
                  <input
                    value={extras.brand ?? ""}
                    onChange={(event) => setExtras((current) => ({ ...current, brand: event.target.value }))}
                    className={fieldClass}
                  />
                </label>
              ) : null}
              {template.extras.includes("model") ? (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Modelo (opcional)</span>
                  <input
                    value={extras.model ?? ""}
                    onChange={(event) => setExtras((current) => ({ ...current, model: event.target.value }))}
                    className={fieldClass}
                  />
                </label>
              ) : null}
            </div>
          ) : null}
          {template.extras.includes("diagnosis") ? (
            <label className="mb-3 block">
              <span className="mb-1.5 block text-sm font-medium">Diagnóstico</span>
              <textarea
                value={extras.diagnosis ?? ""}
                onChange={(event) => setExtras((current) => ({ ...current, diagnosis: event.target.value }))}
                rows={2}
                placeholder="O que está com defeito e o que vai ser feito"
                className={fieldClass}
              />
            </label>
          ) : null}
          {template.extras.includes("color") || template.extras.includes("coats") || template.extras.includes("areaM2") ? (
            <div className="mb-3 grid grid-cols-2 gap-3">
              {template.extras.includes("color") ? (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Cor / referência</span>
                  <input
                    value={extras.color ?? ""}
                    onChange={(event) => setExtras((current) => ({ ...current, color: event.target.value }))}
                    placeholder="Nome ou código"
                    className={fieldClass}
                  />
                </label>
              ) : null}
              {template.extras.includes("coats") ? (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Demãos</span>
                  <input
                    value={extras.coats ?? "2"}
                    onChange={(event) => setExtras((current) => ({ ...current, coats: event.target.value }))}
                    inputMode="numeric"
                    className={fieldClass}
                  />
                </label>
              ) : null}
              {template.extras.includes("areaM2") ? (
                <label className="col-span-2 block">
                  <span className="mb-1.5 block text-sm font-medium">Área aproximada (m²)</span>
                  <input
                    value={extras.areaM2 ?? ""}
                    onChange={(event) => setExtras((current) => ({ ...current, areaM2: event.target.value }))}
                    inputMode="decimal"
                    placeholder="80"
                    className={fieldClass}
                  />
                </label>
              ) : null}
            </div>
          ) : null}
          {form.showAddress ? (
            <label className="mb-3 block">
              <span className="mb-1.5 block text-sm font-medium">{addressFieldLabel(form)}</span>
              <input
                name="serviceAddress"
                defaultValue={defaults?.serviceAddress}
                placeholder="Rua, número, bairro"
                required={form.addressRequired}
                className={fieldClass}
              />
            </label>
          ) : (
            <input type="hidden" name="serviceAddress" defaultValue={defaults?.serviceAddress} />
          )}
          {template.extras.includes("destAddress") ? (
            <label className="mb-3 block">
              <span className="mb-1.5 block text-sm font-medium">Endereço de destino (opcional)</span>
              <input
                value={extras.destAddress ?? ""}
                onChange={(event) => setExtras((current) => ({ ...current, destAddress: event.target.value }))}
                placeholder="Rua, número, bairro"
                className={fieldClass}
              />
            </label>
          ) : null}
          {template.extras.includes("city") ? (
            <label className="mb-3 block">
              <span className="mb-1.5 block text-sm font-medium">Cidade (opcional)</span>
              <input
                value={extras.city ?? ""}
                onChange={(event) => setExtras((current) => ({ ...current, city: event.target.value }))}
                placeholder="Cidade da obra"
                className={fieldClass}
              />
            </label>
          ) : null}
          {template.extras.includes("eventDate") ? (
            <label className="mb-3 block">
              <span className="mb-1.5 block text-sm font-medium">
                {form.extraEventDateLabel ??
                  (form.extraTitle === "Ensaio / Evento" ? "Data (opcional)" : "Data do evento (opcional)")}
              </span>
              <input
                type="date"
                value={extras.eventDate ?? ""}
                onChange={(event) => setExtras((current) => ({ ...current, eventDate: event.target.value }))}
                className={fieldClass}
              />
            </label>
          ) : null}
          {template.extras.includes("access") || template.extras.includes("elevator") ? (
            <div className="mb-3 grid grid-cols-2 gap-3">
              {template.extras.includes("access") ? (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Andares / acesso (opcional)</span>
                  <input
                    value={extras.access ?? ""}
                    onChange={(event) => setExtras((current) => ({ ...current, access: event.target.value }))}
                    placeholder="3º andar, escada…"
                    className={fieldClass}
                  />
                </label>
              ) : null}
              {template.extras.includes("elevator") ? (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Elevador (opcional)</span>
                  <input
                    value={extras.elevator ?? ""}
                    onChange={(event) => setExtras((current) => ({ ...current, elevator: event.target.value }))}
                    placeholder="Sim, não, serviço…"
                    className={fieldClass}
                  />
                </label>
              ) : null}
            </div>
          ) : null}
          {form.showStateCity ? (
            <>
              <label className="mb-3 block">
                <span className="mb-1.5 block text-sm font-medium">Estado</span>
                <select
                  value={stateId}
                  onChange={(event) => {
                    setStateId(event.target.value);
                    setCities([]);
                    setCityId("");
                  }}
                  required
                  className={fieldClass}
                >
                  <option value="">Selecione</option>
                  {states.map((state) => (
                    <option key={state.id} value={state.id}>
                      {state.name} ({state.uf})
                    </option>
                  ))}
                </select>
              </label>
              <label className="mb-3 block">
                <span className="mb-1.5 block text-sm font-medium">Cidade do serviço</span>
                <select
                  value={cityId}
                  onChange={(event) => setCityId(event.target.value)}
                  required
                  disabled={!stateId}
                  className={`${fieldClass} disabled:opacity-50`}
                >
                  <option value="">{stateId ? "Selecione" : "Escolha o estado primeiro"}</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
          {showValidityOutsideSummary || showPrazoOutsideSummary ? (
            <div className="grid grid-cols-2 gap-3">
              {showValidityOutsideSummary ? (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Validade</span>
                  <input
                    type="date"
                    name="validityDate"
                    value={validityDate}
                    onChange={(event) => setValidityDate(event.target.value)}
                    className="w-full rounded-btn border border-line bg-card px-3 py-3"
                  />
                </label>
              ) : null}
              {showPrazoOutsideSummary ? (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Prazo (dias)</span>
                  <input
                    type="number"
                    min={1}
                    name="estimatedDays"
                    value={estimatedDays}
                    onChange={(event) => setEstimatedDays(event.target.value)}
                    placeholder="7"
                    className="w-full rounded-btn border border-line bg-card px-3 py-3"
                  />
                </label>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : (
        <input type="hidden" name="serviceAddress" defaultValue={defaults?.serviceAddress} />
      )}

      <section className="rounded-box border border-line bg-card p-4">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.04em] text-text-soft">{form.simplified ? "Itens do orçamento" : "Itens"}</h2>
        {!form.hideGroups && template.groupSuggestions?.length ? (
          <div className="mb-4">
            <h3 className="mb-1 text-sm font-semibold">{template.groupSectionTitle ?? template.groupLabel}</h3>
            <p className="mb-2 text-xs text-text-soft">Toque para ligar o próximo item a um ambiente.</p>
            <div className="flex flex-wrap gap-2">
              {template.groupSuggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() =>
                    setItems((current) => {
                      const last = current[current.length - 1];
                      if (last && !last.description.trim()) {
                        return current.map((item, index) =>
                          index === current.length - 1 ? { ...item, groupName: name } : item,
                        );
                      }
                      return [...current, { ...emptyItem(template), groupName: name }];
                    })
                  }
                  className="rounded-full border border-line px-3 py-1.5 text-xs"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {form.catalogSave || chips.length > 0 ? (
          <div className="mb-4">
            <h3 className="mb-1 text-sm font-semibold">
              {form.catalogTitle ?? (form.catalogSave ? "Serviços salvos" : "Catálogo de serviços")}
            </h3>
            <p className="mb-2 text-xs text-text-soft">
              {form.catalogSave
                ? "Sugestões do seu catálogo — toque para incluir."
                : "Sugestão do ramo — toque para incluir. Pode apagar depois."}
            </p>
            {chips.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {chips.map((suggestion) => (
                  <button
                    key={suggestion.name}
                    type="button"
                    onClick={() => addSuggestion(suggestion)}
                    className="rounded-full bg-gold-wash px-3 py-1.5 text-xs font-medium text-text"
                  >
                    {suggestion.name}
                    {suggestion.unitPrice && money(suggestion.unitPrice) > 0
                      ? ` · ${formatChipPrice(suggestion.unitPrice)}`
                      : ""}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-soft">Nenhum ainda. Adicione um item e toque em Salvar no catálogo.</p>
            )}
          </div>
        ) : null}
        <div className="flex flex-col gap-4">
          {items.map((item, index) => {
            const pricedByM2 = areaLayout && item.unit === "m²";
            const m2HasOtherUnits = areaLayout && template.units.some((unit) => unit !== "m²");
            return (
              <div key={index} className="rounded-box border border-line bg-paper p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-soft">Item</p>
              {!form.hideGroups && template.groupLabel ? (
                <label className="mb-2 block">
                  <span className="mb-1.5 block text-sm font-medium">{template.groupLabel}</span>
                  <input
                    value={item.groupName}
                    onChange={(event) => updateItem(index, { groupName: event.target.value })}
                    placeholder={template.groupPlaceholder}
                    className={itemFieldClass}
                  />
                </label>
              ) : null}
              {!form.hideKinds && template.kinds?.length ? (
                <label className="mb-2 block">
                  <span className="mb-1.5 block text-sm font-medium">Tipo</span>
                  <select
                    value={item.kind}
                    onChange={(event) => updateItem(index, { kind: event.target.value })}
                    className={itemFieldClass}
                  >
                    {template.kinds.map((kind) => (
                      <option key={kind.value} value={kind.value}>
                        {kind.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">
                  {form.itemNameLabel ?? (form.simplified ? "Serviço" : "Descrição")}
                </span>
                <input
                  value={item.description}
                  onChange={(event) => updateItem(index, { description: event.target.value })}
                  required
                  placeholder="O que vai ser feito"
                  className={itemFieldClass}
                />
              </label>
              {form.itemNotes && !areaLayout ? (
                <label className="mt-2 block">
                  <span className="mb-1 block text-xs text-text-soft">Descrição (opcional)</span>
                  <input
                    value={item.notes}
                    onChange={(event) => updateItem(index, { notes: event.target.value })}
                    placeholder="Detalhe se precisar"
                    className={itemFieldClass}
                  />
                </label>
              ) : null}
              {form.itemAreaM2 ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-xs text-text-soft">Área (opcional)</span>
                    <input
                      value={item.areaNote}
                      onChange={(event) => updateItem(index, { areaNote: event.target.value })}
                      inputMode="decimal"
                      placeholder="0"
                      className={itemFieldClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-text-soft">m²</span>
                    <input value="m²" readOnly className={`${itemFieldClass} bg-paper`} />
                  </label>
                </div>
              ) : null}
              {form.itemPowerKwp ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-xs text-text-soft">Potência (opcional)</span>
                    <input
                      value={item.powerNote}
                      onChange={(event) => updateItem(index, { powerNote: event.target.value })}
                      inputMode="decimal"
                      placeholder="0"
                      className={itemFieldClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-text-soft">kWp</span>
                    <input value="kWp" readOnly className={`${itemFieldClass} bg-paper`} />
                  </label>
                </div>
              ) : null}
              {form.itemVolumeM3 ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-xs text-text-soft">Volume (opcional)</span>
                    <input
                      value={item.volumeNote}
                      onChange={(event) => updateItem(index, { volumeNote: event.target.value })}
                      inputMode="decimal"
                      placeholder="0"
                      className={itemFieldClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-text-soft">m³</span>
                    <input value="m³" readOnly className={`${itemFieldClass} bg-paper`} />
                  </label>
                </div>
              ) : null}
              {pricedByM2 ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-xs text-text-soft">Área</span>
                    <input
                      value={item.quantity}
                      onChange={(event) => updateItem(index, { quantity: event.target.value })}
                      inputMode="decimal"
                      placeholder="0"
                      className={itemFieldClass}
                    />
                  </label>
                  {m2HasOtherUnits ? (
                    <label className="block">
                      <span className="mb-1 block text-xs text-text-soft">Unidade</span>
                      <select
                        value={item.unit}
                        onChange={(event) => updateItem(index, { unit: event.target.value })}
                        className={itemFieldClass}
                      >
                        {[item.unit, ...template.units.filter((unit) => unit !== item.unit)].filter(Boolean).map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <label className="block">
                      <span className="mb-1 block text-xs text-text-soft">m²</span>
                      <input value="m²" readOnly className={`${itemFieldClass} bg-paper`} />
                    </label>
                  )}
                  <label className="col-span-2 block">
                    <span className="mb-1 block text-xs text-text-soft">Valor por m²</span>
                    <input
                      value={item.unitPrice}
                      onChange={(event) => updateItem(index, { unitPrice: event.target.value })}
                      inputMode="decimal"
                      placeholder="0,00"
                      className={itemFieldClass}
                    />
                  </label>
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-xs text-text-soft">Quantidade</span>
                    <input
                      value={item.quantity}
                      onChange={(event) => updateItem(index, { quantity: event.target.value })}
                      inputMode="decimal"
                      className={itemFieldClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-text-soft">Unidade</span>
                    <select
                      value={item.unit}
                      onChange={(event) => updateItem(index, { unit: event.target.value })}
                      className={itemFieldClass}
                    >
                      {[item.unit, ...template.units.filter((unit) => unit !== item.unit)].filter(Boolean).map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={form.hideItemDiscount ? "col-span-2 block" : "block"}>
                    <span className="mb-1 block text-xs text-text-soft">{form.simplified ? "Valor" : "Valor unitário"}</span>
                    <input
                      value={item.unitPrice}
                      onChange={(event) => updateItem(index, { unitPrice: event.target.value })}
                      inputMode="decimal"
                      placeholder="0,00"
                      className={itemFieldClass}
                    />
                  </label>
                  {!form.hideItemDiscount ? (
                    <label className="block">
                      <span className="mb-1 block text-xs text-text-soft">Desconto</span>
                      <input
                        value={item.discount}
                        onChange={(event) => updateItem(index, { discount: event.target.value })}
                        inputMode="decimal"
                        className={itemFieldClass}
                      />
                    </label>
                  ) : null}
                </div>
              )}
              {form.itemNotes && areaLayout ? (
                <label className="mt-2 block">
                  <span className="mb-1 block text-xs text-text-soft">Descrição (opcional)</span>
                  <input
                    value={item.notes}
                    onChange={(event) => updateItem(index, { notes: event.target.value })}
                    placeholder="Detalhe se precisar"
                    className={itemFieldClass}
                  />
                </label>
              ) : null}
              {form.itemMaterial ? (
                <label className="mt-2 block">
                  <span className="mb-1 block text-xs text-text-soft">
                    {form.itemMaterialLabel ?? "Peça/material (opcional)"}
                  </span>
                  <input
                    value={item.material}
                    onChange={(event) => updateItem(index, { material: event.target.value })}
                    placeholder={form.itemMaterialLabel ? "MDF, laca, madeira…" : "Peça, peça original…"}
                    className={itemFieldClass}
                  />
                </label>
              ) : null}
              {form.itemDeadline ? (
                <label className="mt-2 block">
                  <span className="mb-1 block text-xs text-text-soft">{form.itemDeadlineLabel ?? "Prazo (opcional)"}</span>
                  <input
                    value={item.deadline}
                    onChange={(event) => updateItem(index, { deadline: event.target.value })}
                    placeholder="7 dias, 2 semanas…"
                    className={itemFieldClass}
                  />
                </label>
              ) : null}
              {form.itemSizeWH ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-xs text-text-soft">Largura (opcional)</span>
                    <input
                      value={item.width}
                      onChange={(event) => updateItem(index, { width: event.target.value })}
                      inputMode="decimal"
                      className={itemFieldClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-text-soft">Altura (opcional)</span>
                    <input
                      value={item.height}
                      onChange={(event) => updateItem(index, { height: event.target.value })}
                      inputMode="decimal"
                      className={itemFieldClass}
                    />
                  </label>
                </div>
              ) : null}
              {form.itemSizeLW ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-xs text-text-soft">Comprimento (opcional)</span>
                    <input
                      value={item.length}
                      onChange={(event) => updateItem(index, { length: event.target.value })}
                      inputMode="decimal"
                      className={itemFieldClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-text-soft">Largura (opcional)</span>
                    <input
                      value={item.width}
                      onChange={(event) => updateItem(index, { width: event.target.value })}
                      inputMode="decimal"
                      className={itemFieldClass}
                    />
                  </label>
                </div>
              ) : null}
              {form.itemSizeWHD ? (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-xs text-text-soft">Largura (opcional)</span>
                    <input
                      value={item.width}
                      onChange={(event) => updateItem(index, { width: event.target.value })}
                      inputMode="decimal"
                      className={itemFieldClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-text-soft">Altura (opcional)</span>
                    <input
                      value={item.height}
                      onChange={(event) => updateItem(index, { height: event.target.value })}
                      inputMode="decimal"
                      className={itemFieldClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-text-soft">Profundidade (opcional)</span>
                    <input
                      value={item.length}
                      onChange={(event) => updateItem(index, { length: event.target.value })}
                      inputMode="decimal"
                      className={itemFieldClass}
                    />
                  </label>
                </div>
              ) : null}
              {form.itemMeasures ? (
                <div className="mt-2">
                  <p className="mb-1 text-xs text-text-soft">Medidas (opcional)</p>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="block">
                      <span className="mb-1 block text-xs text-text-soft">Comprimento</span>
                      <input
                        value={item.length}
                        onChange={(event) => updateItem(index, { length: event.target.value })}
                        inputMode="decimal"
                        className={itemFieldClass}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs text-text-soft">Largura</span>
                      <input
                        value={item.width}
                        onChange={(event) => updateItem(index, { width: event.target.value })}
                        inputMode="decimal"
                        className={itemFieldClass}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs text-text-soft">Altura</span>
                      <input
                        value={item.height}
                        onChange={(event) => updateItem(index, { height: event.target.value })}
                        inputMode="decimal"
                        className={itemFieldClass}
                      />
                    </label>
                  </div>
                </div>
              ) : null}
              {form.itemAreaNote ? (
                <label className="mt-2 block">
                  <span className="mb-1 block text-xs text-text-soft">Área / medidas (opcional)</span>
                  <input
                    value={item.areaNote}
                    onChange={(event) => updateItem(index, { areaNote: event.target.value })}
                    placeholder="40 m², 12 m³, 8x4…"
                    className={itemFieldClass}
                  />
                </label>
              ) : null}
              {form.itemPhotoHint ? (
                <p className="mt-2 text-xs text-text-soft">Foto (opcional): anexa depois de salvar o orçamento.</p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center justify-end gap-2 text-xs text-text-soft">
                <span>
                  {itemTotal(item).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
                <div className="flex gap-3">
                  {form.catalogSave && item.description.trim() ? (
                    <button
                      type="button"
                      onClick={() => saveToCatalog(index)}
                      className="text-gold-deep"
                    >
                      {savingCatalogAt === index ? "Salvando…" : "Salvar no catálogo"}
                    </button>
                  ) : null}
                  {items.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
                      className="text-no"
                    >
                      Remover
                    </button>
                  ) : null}
                </div>
              </div>
              </div>
              );
          })}
        </div>
        <button
          type="button"
          onClick={() => setItems((current) => [...current, emptyItem(template)])}
          className="mt-3 flex min-h-12 w-full items-center justify-center rounded-btn border border-line bg-card text-sm font-medium"
        >
          + Adicionar item
        </button>
        {template.photos.enabled && !budgetId ? (
          <p className="mt-3 text-sm text-text-soft">
            {template.photos.hint ?? "Fotos neste orçamento: depois de salvar, você anexa na tela do orçamento."}
          </p>
        ) : null}
      </section>

      <section className="rounded-box border border-line bg-card p-4">
        <h2 className="text-xs font-medium uppercase tracking-[0.04em] text-text-soft">Fechamento</h2>
        <p className="mt-1 text-lg font-semibold">Como fica para o cliente?</p>

        {form.showTravelFee ? (
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium">Deslocamento (opcional)</span>
            <input
              value={extras.travelFee ?? ""}
              onChange={(event) => setExtras((current) => ({ ...current, travelFee: event.target.value }))}
              inputMode="decimal"
              placeholder="0,00"
              className={fieldClass}
            />
          </label>
        ) : null}

        <div className="mt-4 rounded-box border border-line bg-paper p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">Desconto</span>
            <div className="grid grid-cols-2 overflow-hidden rounded-btn border border-line text-sm font-semibold">
              {(["percent", "amount"] as DiscountType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDiscountType(type)}
                  className={`min-h-10 px-4 ${discountType === type ? "bg-gold text-ink" : "bg-card text-text"}`}
                >
                  {type === "percent" ? "%" : "R$"}
                </button>
              ))}
            </div>
          </div>
          <input
            value={discountValue}
            onChange={(event) => setDiscountValue(event.target.value)}
            inputMode="decimal"
            placeholder={discountType === "percent" ? "10" : "0,00"}
            className={`${fieldClass} mt-3 bg-card`}
          />
          {discountError ? <p className="mt-2 text-sm text-no">{discountError}</p> : null}
        </div>

        <div className="mt-4 rounded-box border border-line bg-paper p-3">
          <p className="text-sm font-semibold">Como o cliente vai pagar?</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {paymentMethodOptions.map((option) => {
              const selected = paymentMethod === option.value;
              const accepted = acceptedPaymentMethods.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(option.value);
                    setAcceptedPaymentMethods((current) =>
                      current.includes(option.value) ? current : [option.value, ...current],
                    );
                  }}
                  className={`min-h-12 rounded-btn border px-3 text-sm font-semibold ${
                    selected ? "border-gold bg-gold text-ink" : option.tone
                  }`}
                >
                  {option.label}
                  {accepted && !selected ? <span className="ml-1 text-xs text-text-soft">aceita</span> : null}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-text-soft">Toque para escolher a forma principal.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {paymentMethodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleAcceptedPayment(option.value)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  acceptedPaymentMethods.includes(option.value)
                    ? "border-gold bg-gold-wash text-text"
                    : "border-line text-text-soft"
                }`}
              >
                {acceptedPaymentMethods.includes(option.value) ? "✓ " : "+ "}
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-box border border-line bg-paper p-3">
          <p className="text-sm font-semibold">Condição de pagamento</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {paymentConditionOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPaymentCondition(option.value)}
                className={`min-h-11 rounded-btn border px-3 text-sm font-medium ${
                  paymentCondition === option.value ? "border-gold bg-gold text-ink" : "border-line bg-card"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {paymentCondition === "deposit_balance" ? (
            <div className="mt-3 rounded-btn border border-line bg-card p-3">
              <div className="mb-2 grid grid-cols-2 overflow-hidden rounded-btn border border-line text-sm font-semibold">
                {(["percent", "amount"] as DiscountType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDownPaymentType(type)}
                    className={`min-h-10 px-4 ${downPaymentType === type ? "bg-gold text-ink" : "bg-card text-text"}`}
                  >
                    {type === "percent" ? "%" : "R$"}
                  </button>
                ))}
              </div>
              <input
                value={downPaymentValue}
                onChange={(event) => setDownPaymentValue(event.target.value)}
                inputMode="decimal"
                placeholder={downPaymentType === "percent" ? "30" : "500,00"}
                className={fieldClass}
              />
              {downPaymentError ? <p className="mt-2 text-sm text-no">{downPaymentError}</p> : null}
              {!downPaymentError ? (
                <div className="mt-3 space-y-1 text-sm">
                  <p className="flex justify-between">
                    <span>Entrada</span>
                    <span className="font-semibold">{formatBRL(downPaymentAmount)}</span>
                  </p>
                  <p className="flex justify-between text-text-soft">
                    <span>Saldo restante</span>
                    <span>{formatBRL(balanceAmount)}</span>
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-4 space-y-1 text-sm">
          <p className="flex justify-between text-text-soft">
            <span>Subtotal</span>
            <span>{formatBRL(subtotal)}</span>
          </p>
          {travel > 0 ? (
            <p className="flex justify-between text-text-soft">
              <span>Deslocamento</span>
              <span>{formatBRL(travel)}</span>
            </p>
          ) : null}
          <p className="flex justify-between text-text-soft">
            <span>Você está dando</span>
            <span>- {formatBRL(discountAmount)}</span>
          </p>
          <p className="flex justify-between text-xl font-semibold">
            <span>Total final</span>
            <span>{formatBRL(total)}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowMoreOptions((current) => !current)}
          className="mt-4 min-h-12 w-full rounded-btn border border-line bg-card text-sm font-semibold"
        >
          {showMoreOptions ? "Ocultar opções" : "Mais opções"}
        </button>

        {showMoreOptions || form.validityInSummary ? (
          <div className="mt-4 space-y-3">
            <div>
              <p className="mb-2 text-sm font-medium">Validade da proposta</p>
              <div className="grid grid-cols-3 gap-2">
                {validityPresets.map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => setValidityDate(dateAfter(preset.days))}
                    className="min-h-11 rounded-btn border border-line bg-card text-sm font-medium"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input
                type="date"
                name="validityDate"
                value={validityDate}
                onChange={(event) => setValidityDate(event.target.value)}
                className={`${fieldClass} mt-2`}
              />
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Prazo de execução</span>
              <input
                type="number"
                min={1}
                name="estimatedDays"
                value={estimatedDays}
                onChange={(event) => setEstimatedDays(event.target.value)}
                placeholder="Ex: 5 dias úteis"
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Observações (opcional)</span>
              <textarea
                name="notes"
                rows={3}
                defaultValue={defaults?.notes}
                placeholder="Ex: material incluso, prazo de execução de 5 dias úteis, garantia de 30 dias..."
                className={fieldClass}
              />
            </label>
          </div>
        ) : (
          <input type="hidden" name="notes" defaultValue={defaults?.notes} />
        )}
      </section>

      {error ? <p className="text-sm text-no">{error}</p> : null}
      <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-20 border-t border-line bg-card px-4 py-3 text-text md:static md:z-0 md:mt-2 md:rounded-box md:border md:border-line">
        <div className="mx-auto flex max-w-lg items-center gap-3 md:max-w-none">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-gold-deep">Total</p>
            <p className="truncate text-lg font-semibold">
              {formatBRL(total)}
            </p>
          </div>
          <button
            type="submit"
            disabled={loading || Boolean(discountError || downPaymentError)}
            className="min-h-12 shrink-0 rounded-btn bg-gold px-5 text-sm font-semibold text-ink hover:bg-gold-press disabled:opacity-60 md:px-6 md:text-base"
          >
            {loading ? "Salvando…" : budgetId ? "Salvar alterações" : "Salvar orçamento"}
          </button>
        </div>
      </div>
    </form>
  );
}
