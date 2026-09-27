import type { Prisma, PrismaClient } from "@prisma/client";
import { moneyString, parseMoney } from "@/lib/money";

/** Só o que o catálogo de serviços usa do Prisma; nos testes entra um banco em memória. */
export type ServiceDb = Pick<PrismaClient, "service" | "$transaction">;

export type ServiceInput = {
  name?: unknown;
  description?: unknown;
  category?: unknown;
  unit?: unknown;
  defaultPrice?: unknown;
  showPrice?: unknown;
  featured?: unknown;
  active?: unknown;
};

export type ServiceData = {
  name?: string;
  description?: string | null;
  category?: string | null;
  unit?: string;
  defaultPrice?: string;
  showPrice?: boolean;
  featured?: boolean;
  active?: boolean;
};

function text(value: unknown, max: number) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}

function flag(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "1";
}

/**
 * Valida o que veio do formulário. Só os campos enviados entram no resultado,
 * para o "salvar no catálogo" do orçamento não apagar categoria, foto ou destaque.
 */
export function normalizeServiceInput(input: ServiceInput, { requireName = false } = {}):
  | { data: ServiceData }
  | { error: string } {
  const data: ServiceData = {};
  if ("name" in input || requireName) {
    const name = text(input.name, 160);
    if (name.length < 2) return { error: "Informe o nome do serviço." };
    data.name = name;
  }
  if ("description" in input) data.description = String(input.description ?? "").trim().slice(0, 600) || null;
  if ("category" in input) data.category = text(input.category, 80) || null;
  if ("unit" in input) data.unit = text(input.unit, 20) || "un";
  if ("defaultPrice" in input) {
    const price = parseMoney(input.defaultPrice as string | number | null | undefined);
    if (price < 0) return { error: "Preço inválido." };
    data.defaultPrice = moneyString(price);
  }
  if ("showPrice" in input) data.showPrice = flag(input.showPrice);
  if ("featured" in input) data.featured = flag(input.featured);
  if ("active" in input) data.active = flag(input.active);
  return { data };
}

export const publicServiceOrder: Prisma.ServiceOrderByWithRelationInput[] = [
  { featured: "desc" },
  { sortOrder: "asc" },
  { name: "asc" },
];

export function serializeService(service: {
  id: number;
  name: string;
  description: string | null;
  unit: string;
  defaultPrice: { toString(): string } | number;
  category?: string | null;
  imagePath?: string | null;
  featured?: boolean;
  showPrice?: boolean;
  active?: boolean;
  sortOrder?: number;
}) {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    unit: service.unit,
    defaultPrice: moneyString(Number(service.defaultPrice)),
    category: service.category ?? null,
    imagePath: service.imagePath ?? null,
    featured: Boolean(service.featured),
    showPrice: Boolean(service.showPrice),
    active: service.active ?? true,
    sortOrder: service.sortOrder ?? 0,
  };
}

export async function findCompanyService(db: ServiceDb, companyId: number, id: number) {
  if (!Number.isInteger(id) || id <= 0) return null;
  return db.service.findFirst({ where: { id, companyId } });
}

/** Cria ou atualiza pelo nome (sem duplicar "Pintura" duas vezes na mesma empresa). */
export async function saveServiceByName(db: ServiceDb, companyId: number, input: ServiceInput) {
  const normalized = normalizeServiceInput(input, { requireName: true });
  if ("error" in normalized) return normalized;
  const { data } = normalized;
  const existing = await db.service.findFirst({ where: { companyId, name: data.name } });
  if (existing) {
    const service = await db.service.update({ where: { id: existing.id }, data: { ...data, active: data.active ?? true } });
    return { service, created: false };
  }
  const sortOrder = await db.service.count({ where: { companyId } });
  const service = await db.service.create({
    data: {
      companyId,
      name: data.name!,
      description: data.description ?? null,
      category: data.category ?? null,
      unit: data.unit ?? "un",
      defaultPrice: data.defaultPrice ?? "0.00",
      showPrice: data.showPrice ?? false,
      featured: data.featured ?? false,
      active: data.active ?? true,
      sortOrder,
    },
  });
  return { service, created: true };
}

export async function updateCompanyService(db: ServiceDb, companyId: number, id: number, input: ServiceInput) {
  const existing = await findCompanyService(db, companyId, id);
  if (!existing) return { notFound: true as const };
  const normalized = normalizeServiceInput(input);
  if ("error" in normalized) return normalized;
  if (normalized.data.name && normalized.data.name !== existing.name) {
    const clash = await db.service.findFirst({ where: { companyId, name: normalized.data.name } });
    if (clash && clash.id !== existing.id) return { error: "Já existe um serviço com esse nome." };
  }
  const service = await db.service.update({ where: { id: existing.id }, data: normalized.data });
  return { service };
}

/** Recebe a lista na nova ordem. Todos os ids precisam ser da empresa. */
export async function reorderCompanyServices(db: ServiceDb, companyId: number, ids: unknown) {
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 200) return { error: "Ordem inválida." };
  const clean = ids.map(Number);
  if (clean.some((id) => !Number.isInteger(id) || id <= 0) || new Set(clean).size !== clean.length) {
    return { error: "Ordem inválida." };
  }
  const owned = await db.service.count({ where: { companyId, id: { in: clean } } });
  if (owned !== clean.length) return { error: "Serviço não encontrado." };
  await db.$transaction(
    clean.map((id, index) => db.service.updateMany({ where: { id, companyId }, data: { sortOrder: index } })),
  );
  return { ok: true as const };
}
