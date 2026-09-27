"use client";

import { useRouter } from "next/navigation";
import { MascoteVazio } from "@/components/mascote";
import { StatusPill, pedidoStatusTone } from "@/components/status-pill";
import { formatRelativeTime } from "@/lib/date";
import { formatPhoneBR } from "@/lib/phone";
import { whatsappHref } from "@/lib/whatsapp";

type Pedido = {
  id: number;
  customerName: string;
  customerPhone: string;
  desiredService: string | null;
  description: string | null;
  neighborhood: string | null;
  preferredTime: string | null;
  status: string;
  createdAt: string;
  city: { name: string } | null;
  state: { uf: string } | null;
};

const statusLabel: Record<string, string> = {
  new: "Novo",
  contacted: "Contatado",
  converted: "Convertido",
  archived: "Arquivado",
};

export function PedidosList({ pedidos }: { pedidos: Pedido[] }) {
  const router = useRouter();

  async function setStatus(id: number, status: string) {
    await fetch("/api/pedidos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    router.refresh();
  }

  if (pedidos.length === 0) {
    return (
      <>
        <p className="text-sm text-text-soft">Ainda não chegou nenhum pedido por aqui. Compartilhe sua página para começar.</p>
        <MascoteVazio
          pose="pensando"
          action={
            <a href="/painel/pagina" className="text-gold-deep underline underline-offset-4">
              Compartilhar minha página
            </a>
          }
        >
          Quando chegar um pedido, eu te aviso por aqui!
        </MascoteVazio>
      </>
    );
  }

  return (
    <ul className="space-y-3">
      {pedidos.map((pedido) => {
        const zap = whatsappHref(
          pedido.customerPhone,
          `Olá, ${pedido.customerName.split(" ")[0]}! Recebi seu pedido de orçamento no Orçah.`,
        );
        return (
          <li key={pedido.id} className="rounded-box border border-line bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{pedido.customerName}</p>
                <p className="text-sm font-medium">{formatPhoneBR(pedido.customerPhone)}</p>
              </div>
              <div className="text-right">
                <StatusPill tone={pedidoStatusTone(pedido.status)}>
                  {statusLabel[pedido.status] ?? pedido.status}
                </StatusPill>
                <p className="mt-1 text-xs text-text-soft">{formatRelativeTime(pedido.createdAt)}</p>
              </div>
            </div>
            {pedido.desiredService ? <p className="mt-2 text-sm">{pedido.desiredService}</p> : null}
            {pedido.description ? <p className="mt-1 text-sm text-text-soft">{pedido.description}</p> : null}
            {pedido.city && pedido.state ? (
              <p className="mt-1 text-xs text-text-soft">
                {pedido.city.name}-{pedido.state.uf}
                {pedido.neighborhood ? ` · ${pedido.neighborhood}` : ""}
              </p>
            ) : null}
            {pedido.preferredTime ? (
              <p className="text-xs text-text-soft">Horário: {pedido.preferredTime}</p>
            ) : null}
            <div className="mt-3 flex flex-col gap-2">
              {zap ? (
                <a
                  href={zap}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-btn bg-zap px-3 text-sm font-semibold text-ink"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                    <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.27-1.38a9.87 9.87 0 0 0 4.77 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01zm-7.01 15.24h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.42 5.83c0 4.54-3.7 8.23-8.25 8.23z" />
                  </svg>
                  Responder no WhatsApp
                </a>
              ) : null}
              {pedido.status === "new" ? (
                <button
                  type="button"
                  onClick={() => setStatus(pedido.id, "contacted")}
                  className="min-h-12 rounded-btn border border-line bg-card px-3 text-sm font-medium"
                >
                  Marcar como contatado
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStatus(pedido.id, "archived")}
                  className="text-sm text-text-soft"
                >
                  Arquivar
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
