"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatBRL, formatQuantity } from "@/lib/money";
import { cheapestOfferIds } from "@/lib/product-quote";

type Item = { id: number; description: string; quantity: number };
type Supplier = { id: number; name: string; store: string | null; sent: boolean; responded: boolean };
type Offer = { id: number; itemId: number; quoteSupplierId: number; brand: string | null; unitPrice: number | null; selected: boolean };
export type SendResult = { id: number; name: string; href: string; sent: boolean };

function openWhatsApp(href: string) {
  if (!href) return false;
  return Boolean(window.open(href, "_blank", "noopener,noreferrer"));
}

function ResultList({ results }: { results: SendResult[] }) {
  return (
    <ul className="mt-2 flex flex-col gap-2">
      {results.map((result) => (
        <li key={result.id} className="flex min-h-12 items-center justify-between gap-3 rounded-btn border border-line bg-card px-3">
          <span className="min-w-0 truncate text-sm font-medium">{result.name}</span>
          {result.sent ? (
            <span className="text-sm font-medium text-ok">Enviado automático</span>
          ) : (
            <a
              href={result.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-10 items-center rounded-btn bg-zap px-3 text-sm font-semibold text-ink"
            >
              Mandar no WhatsApp
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ProductQuoteCompare({
  quoteId,
  robot,
  items,
  suppliers,
  offers,
  reserved,
}: {
  quoteId: number;
  robot: boolean;
  items: Item[];
  suppliers: Supplier[];
  offers: Offer[];
  reserved: SendResult[] | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(() => new Set(offers.filter((o) => o.selected).map((o) => o.id)));
  const [sending, setSending] = useState<number | "all" | null>(null);
  const [sendResults, setSendResults] = useState<SendResult[] | null>(null);
  const [reserveResults, setReserveResults] = useState<SendResult[] | null>(reserved);
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState("");

  const supplierById = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
  const priced = offers.filter((offer) => offer.unitPrice != null);
  const cheapest = new Set(cheapestOfferIds(priced));
  const itemById = new Map(items.map((item) => [item.id, item]));
  const total = priced
    .filter((offer) => selected.has(offer.id))
    .reduce((sum, offer) => sum + (offer.unitPrice as number) * (itemById.get(offer.itemId)?.quantity ?? 0), 0);

  async function send(target: number | "all") {
    setSending(target);
    setError("");
    try {
      const response = await fetch(`/api/cotacoes/${quoteId}/enviar`, {
        method: "POST",
        body: JSON.stringify(target === "all" ? {} : { quoteSupplierId: target }),
      });
      const data = (await response.json().catch(() => ({}))) as { results?: SendResult[]; error?: string };
      if (!response.ok || !data.results) {
        setError(data.error ?? "Não consegui enviar.");
        return;
      }
      if (target === "all") setSendResults(data.results.filter((result) => !result.sent).length ? data.results : null);
      else if (!openWhatsApp(data.results[0]?.href ?? "")) setSendResults(data.results);
      router.refresh();
    } catch {
      setError("Sem internet agora. Tente de novo.");
    } finally {
      setSending(null);
    }
  }

  function pick(offer: Offer) {
    setSelected((current) => {
      const next = new Set(current);
      const already = next.has(offer.id);
      // um vendedor por item: tira os outros do mesmo item
      for (const other of offers) if (other.itemId === offer.itemId) next.delete(other.id);
      if (!already) next.add(offer.id);
      return next;
    });
  }

  async function reserve() {
    setReserving(true);
    setError("");
    try {
      const response = await fetch(`/api/cotacoes/${quoteId}/reservar`, {
        method: "POST",
        body: JSON.stringify({ offerIds: [...selected] }),
      });
      const data = (await response.json().catch(() => ({}))) as { results?: SendResult[]; error?: string };
      if (!response.ok || !data.results) {
        setError(data.error ?? "Não consegui reservar.");
        return;
      }
      setReserveResults(data.results);
      router.refresh();
    } catch {
      setError("Sem internet agora. Tente de novo.");
    } finally {
      setReserving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-semibold">Vendedores</h2>
          <button type="button" onClick={() => router.refresh()} className="min-h-10 px-2 text-sm font-medium text-text-soft">
            Atualizar
          </button>
        </div>
        {robot ? (
          <button
            type="button"
            onClick={() => send("all")}
            disabled={sending != null}
            className="mb-2 min-h-12 w-full rounded-btn bg-zap px-4 text-sm font-semibold text-ink disabled:opacity-60"
          >
            {sending === "all" ? "Enviando…" : "Enviar para todos automático"}
          </button>
        ) : null}
        <ul className="divide-y divide-line overflow-hidden rounded-box border border-line bg-card">
          {suppliers.map((supplier) => (
            <li key={supplier.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{supplier.name}</p>
                <p className={`text-sm ${supplier.responded ? "font-medium text-ok" : "text-text-soft"}`}>
                  {supplier.responded ? "Respondeu" : supplier.sent ? "Enviado, esperando resposta" : "Ainda não enviado"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => send(supplier.id)}
                disabled={sending != null}
                aria-label={`Mandar pedido para ${supplier.name} no WhatsApp`}
                className={`min-h-12 shrink-0 rounded-btn px-3 text-sm font-semibold disabled:opacity-60 ${
                  supplier.sent ? "border border-line" : "bg-zap text-ink"
                }`}
              >
                {sending === supplier.id ? "Abrindo…" : supplier.sent ? "Reenviar" : "WhatsApp"}
              </button>
            </li>
          ))}
        </ul>
        {sendResults ? (
          <div className="mt-2">
            <p className="text-sm text-text-soft">Se o WhatsApp não abriu, toque aqui:</p>
            <ResultList results={sendResults} />
          </div>
        ) : null}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-semibold">Preços</h2>
          {priced.length ? (
            <button
              type="button"
              onClick={() => setSelected(cheapest)}
              className="min-h-10 rounded-btn border border-line bg-card px-3 text-sm font-medium"
            >
              Selecionar os mais baratos
            </button>
          ) : null}
        </div>
        {!priced.length ? <p className="text-sm text-text-soft">Os preços aparecem aqui quando os vendedores responderem.</p> : null}
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const options = priced
              .filter((offer) => offer.itemId === item.id)
              .sort((a, b) => (a.unitPrice as number) - (b.unitPrice as number));
            return (
              <li key={item.id} className="rounded-box border border-line bg-card p-3">
                <p className="font-medium">
                  {formatQuantity(item.quantity)}× {item.description}
                </p>
                {options.length ? (
                  <div className="mt-2 flex flex-col gap-2">
                    {options.map((offer) => {
                      const on = selected.has(offer.id);
                      const supplier = supplierById.get(offer.quoteSupplierId);
                      return (
                        <button
                          key={offer.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => pick(offer)}
                          className={`flex min-h-12 items-center justify-between gap-3 rounded-btn border px-3 py-2 text-left ${
                            on ? "border-gold bg-gold-wash" : "border-line"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {on ? "✓ " : ""}
                              {supplier?.store || supplier?.name}
                              {cheapest.has(offer.id) ? (
                                <span className="ml-2 rounded-full bg-ok-wash px-2 text-xs text-ok">mais barato</span>
                              ) : null}
                            </span>
                            {offer.brand ? <span className="block truncate text-xs text-text-soft">{offer.brand}</span> : null}
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-sm font-semibold">{formatBRL((offer.unitPrice as number) * item.quantity)}</span>
                            <span className="block text-xs text-text-soft">{formatBRL(offer.unitPrice as number)} un.</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-text-soft">Sem preço ainda.</p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {reserveResults ? (
        <section className="rounded-box border border-ok/30 bg-ok-wash p-4">
          <h2 className="font-semibold text-ok">Reserva pronta</h2>
          <p className="text-sm text-text-soft">Cada vendedor recebe só os itens dele.</p>
          <ResultList results={reserveResults} />
        </section>
      ) : null}

      {error ? <p className="text-sm text-no">{error}</p> : null}
      {priced.length ? (
        <div className="sticky bottom-24 flex items-center gap-3 rounded-box border border-line bg-card p-3 shadow-lg md:bottom-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-text-soft">Total escolhido</p>
            <p className="text-lg font-semibold">{formatBRL(total)}</p>
          </div>
          <button
            type="button"
            onClick={reserve}
            disabled={reserving || selected.size === 0}
            className="min-h-12 rounded-btn bg-gold px-5 text-sm font-semibold text-ink disabled:opacity-60"
          >
            {reserving ? "Reservando…" : "Reservar"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
