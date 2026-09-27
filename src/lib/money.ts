export function parseMoney(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? roundMoney(value) : 0;
  }
  const raw = String(value ?? "")
    .trim()
    .replace(/[R$\s]/g, "");
  if (!raw) return 0;
  const normalized =
    raw.includes(",") && raw.includes(".")
      ? raw.replace(/\./g, "").replace(",", ".")
      : raw.replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? roundMoney(amount) : 0;
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function moneyString(value: number) {
  return roundMoney(value).toFixed(2);
}

/** Quantidade para leitura: 380 · 12,5 · 1,25 (sem ".00"). */
export function formatQuantity(value: number | string) {
  return Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function formatBRL(value: number | string) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
