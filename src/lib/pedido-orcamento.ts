export type PedidoContexto = {
  desiredService?: string | null;
  description?: string | null;
  neighborhood?: string | null;
  preferredTime?: string | null;
};

export function contextoDoPedido(pedido: PedidoContexto) {
  const service = pedido.desiredService?.trim() ?? "";
  const notes = [
    pedido.description?.trim() ?? "",
    pedido.preferredTime?.trim() ? `Horário preferido: ${pedido.preferredTime.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    service,
    notes,
    address: pedido.neighborhood?.trim() ?? "",
  };
}
