import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  budgetListHref,
  budgetListOrderBy,
  budgetListWhere,
  companyCustomerWhere,
  customerBudgetsWhere,
  customerSummary,
  formatUpdatedAt,
  hasActiveFilters,
  parseBudgetListFilters,
  parseCustomerInput,
  parseId,
  updateCompanyCustomer,
  type BudgetListFilters,
} from "../src/lib/crm";

// Avaliador mínimo dos formatos de where/orderBy que o lib/crm gera,
// para testar comportamento sem banco.
type Row = Record<string, unknown>;

function matchesField(value: unknown, condition: unknown): boolean {
  if (condition === null || typeof condition !== "object" || condition instanceof Date) {
    return value === condition;
  }
  const c = condition as Record<string, unknown>;
  if ("contains" in c || "endsWith" in c || "gte" in c) {
    if ("gte" in c) return (value as Date).getTime() >= (c.gte as Date).getTime();
    const insensitive = c.mode === "insensitive";
    const text = insensitive ? String(value).toLowerCase() : String(value);
    if ("contains" in c) {
      const needle = insensitive ? String(c.contains).toLowerCase() : String(c.contains);
      return text.includes(needle);
    }
    return text.endsWith(String(c.endsWith));
  }
  return matches(value as Row, c);
}

function matches(row: Row, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, condition]) => {
    if (key === "AND") return (condition as Record<string, unknown>[]).every((part) => matches(row, part));
    if (key === "OR") return (condition as Record<string, unknown>[]).some((part) => matches(row, part));
    return matchesField(row[key], condition);
  });
}

function sortRows<T extends Row>(rows: T[], orderBy: Record<string, "asc" | "desc">[]) {
  return [...rows].sort((a, b) => {
    for (const rule of orderBy) {
      const [key, dir] = Object.entries(rule)[0];
      const av = a[key] instanceof Date ? (a[key] as Date).getTime() : Number(a[key]);
      const bv = b[key] instanceof Date ? (b[key] as Date).getTime() : Number(b[key]);
      if (av !== bv) return dir === "asc" ? av - bv : bv - av;
    }
    return 0;
  });
}

const now = new Date("2026-09-25T15:00:00Z");
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000);

const joao = { id: 1, companyId: 10, name: "João da Silva", phone: "16999990000" };
const maria = { id: 2, companyId: 10, name: "Maria Souza", phone: "49988887777" };
const intruso = { id: 3, companyId: 20, name: "João Outra Empresa", phone: "11977776666" };

const budgets = [
  {
    id: 1,
    companyId: 10,
    customerId: 1,
    customer: joao,
    number: "ORÇ-2026-001042",
    status: "sent",
    total: 3480,
    updatedAt: daysAgo(0),
  },
  {
    id: 2,
    companyId: 10,
    customerId: 2,
    customer: maria,
    number: "ORÇ-2026-001043",
    status: "approved",
    total: 5270,
    updatedAt: daysAgo(3),
  },
  {
    id: 3,
    companyId: 10,
    customerId: 1,
    customer: joao,
    number: "ORÇ-2026-001044",
    status: "draft",
    total: 900,
    updatedAt: daysAgo(20),
  },
  {
    id: 4,
    companyId: 10,
    customerId: 1,
    customer: joao,
    number: "ORÇ-2026-001045",
    status: "approved",
    total: 4370,
    updatedAt: daysAgo(60),
  },
  {
    id: 5,
    companyId: 20,
    customerId: 3,
    customer: intruso,
    number: "ORÇ-2026-001042",
    status: "sent",
    total: 9999,
    updatedAt: daysAgo(0),
  },
];

function list(companyId: number, params: Record<string, string> = {}) {
  const filters = parseBudgetListFilters(params);
  const rows = budgets.filter((row) =>
    matches(row, budgetListWhere(companyId, filters, now) as Record<string, unknown>),
  );
  return sortRows(rows, budgetListOrderBy(filters.sort) as Record<string, "asc" | "desc">[]).map((row) => row.id);
}

describe("lista de orçamentos", () => {
  it("empresa vê só os próprios orçamentos", () => {
    assert.deepEqual(list(10).sort(), [1, 2, 3, 4]);
    assert.deepEqual(list(20), [5]);
  });

  it("outra empresa não vê, nem buscando pelo mesmo número ou nome", () => {
    assert.ok(!list(10, { q: "001042" }).includes(5));
    assert.ok(!list(10, { q: "outra empresa" }).length);
    assert.ok(!list(20, { q: "joão da silva" }).length);
  });

  it("filtro da URL não sobrescreve a empresa", () => {
    const where = budgetListWhere(10, parseBudgetListFilters({ companyId: "20", q: "x", status: "sent" }));
    assert.equal(where.companyId, 10);
  });

  it("busca por cliente sem diferenciar maiúsculas", () => {
    assert.deepEqual(list(10, { q: "JOÃO" }).sort(), [1, 3, 4]);
    assert.deepEqual(list(10, { q: "maria" }), [2]);
  });

  it("busca por número do orçamento", () => {
    assert.deepEqual(list(10, { q: "1043" }), [2]);
    assert.deepEqual(list(10, { q: "orç-2026-001044" }), [3]);
  });

  it("busca por telefone com ou sem máscara", () => {
    assert.deepEqual(list(10, { q: "(49) 98888" }), [2]);
    assert.deepEqual(list(10, { q: "16999990000" }).sort(), [1, 3, 4]);
  });

  it("filtra por status real do enum", () => {
    assert.deepEqual(list(10, { status: "approved" }).sort(), [2, 4]);
    assert.deepEqual(list(10, { status: "draft" }), [3]);
  });

  it("ignora status inventado", () => {
    assert.equal(parseBudgetListFilters({ status: "alteracao" }).status, null);
    assert.equal(list(10, { status: "alteracao" }).length, 4);
  });

  it("filtra por período", () => {
    assert.deepEqual(list(10, { periodo: "7d" }), [1, 2]);
    assert.deepEqual(list(10, { periodo: "30d" }), [1, 2, 3]);
  });

  it("ordena por atualização e por valor", () => {
    assert.deepEqual(list(10), [1, 2, 3, 4]);
    assert.deepEqual(list(10, { ordem: "antigos" }), [4, 3, 2, 1]);
    assert.deepEqual(list(10, { ordem: "maior-valor" }), [2, 4, 1, 3]);
    assert.deepEqual(list(10, { ordem: "menor-valor" }), [3, 1, 4, 2]);
  });

  it("combina filtros", () => {
    assert.deepEqual(list(10, { q: "joão", status: "approved" }), [4]);
    assert.deepEqual(list(10, { q: "joão", status: "approved", periodo: "30d" }), []);
  });

  it("distingue lista vazia de filtro sem resultado", () => {
    const semFiltro = parseBudgetListFilters({});
    const comFiltro = parseBudgetListFilters({ q: "ninguém" });
    assert.equal(hasActiveFilters(semFiltro), false);
    assert.equal(hasActiveFilters(comFiltro), true);
    assert.equal(hasActiveFilters(parseBudgetListFilters({ ordem: "maior-valor" })), false);
    assert.deepEqual(list(10, { q: "ninguém" }), []);
    assert.deepEqual(list(99), []);
  });

  it("monta URL só com o que mudou", () => {
    const base: BudgetListFilters = { q: "joão", status: null, period: "todos", sort: "recentes" };
    assert.equal(budgetListHref(base, {}), "/painel/orcamentos?q=jo%C3%A3o");
    assert.equal(budgetListHref(base, { q: "", status: "sent" }), "/painel/orcamentos?status=sent");
    assert.equal(budgetListHref({ ...base, q: "" }, {}), "/painel/orcamentos");
  });

  it("mostra atualização no fuso de Brasília", () => {
    assert.equal(formatUpdatedAt(new Date("2026-09-25T17:32:00Z"), now), "hoje, 14:32");
    assert.equal(formatUpdatedAt(new Date("2026-09-24T12:10:00Z"), now), "ontem, 09:10");
    assert.equal(formatUpdatedAt(new Date("2026-09-12T12:00:00Z"), now), "12/09/2026");
  });
});

describe("cliente", () => {
  const customers = [joao, maria, intruso];
  const find = (companyId: number, id: number) =>
    customers.find((row) => matches(row, companyCustomerWhere(companyId, id) as Record<string, unknown>));

  it("abre cliente próprio", () => {
    assert.equal(find(10, 1)?.name, "João da Silva");
  });

  it("nega cliente de outra empresa", () => {
    assert.equal(find(10, 3), undefined);
    assert.equal(find(20, 1), undefined);
  });

  it("aceita só ID numérico válido", () => {
    assert.equal(parseId("12"), 12);
    assert.equal(parseId(["7", "8"]), 7);
    for (const bad of ["", "0", "-1", "1.5", "abc", "1;drop", undefined]) assert.equal(parseId(bad), null);
  });

  it("histórico traz só orçamentos do cliente certo", () => {
    const history = (companyId: number, customerId: number) =>
      budgets
        .filter((row) => matches(row, customerBudgetsWhere(companyId, customerId) as Record<string, unknown>))
        .map((row) => row.id);
    assert.deepEqual(history(10, 1), [1, 3, 4]);
    assert.deepEqual(history(10, 2), [2]);
    assert.deepEqual(history(10, 3), []);
    assert.deepEqual(history(20, 1), []);
  });

  it("resume orçamentos do cliente", () => {
    const summary = customerSummary([
      { status: "sent", _count: { _all: 1 }, _sum: { total: 3480 } },
      { status: "draft", _count: { _all: 1 }, _sum: { total: "900.00" } },
      { status: "approved", _count: { _all: 1 }, _sum: { total: 4370 } },
    ]);
    assert.deepEqual(summary, { count: 3, total: 8750, approved: 1 });
    assert.deepEqual(customerSummary([]), { count: 0, total: 0, approved: 0 });
  });

  function fakeDb() {
    const rows = customers.map((row) => ({ ...row }));
    const calls: string[] = [];
    return {
      rows,
      calls,
      customer: {
        async updateMany(args: { where: { id: number; companyId: number }; data: Record<string, unknown> }) {
          calls.push("updateMany");
          const hit = rows.filter((row) => row.id === args.where.id && row.companyId === args.where.companyId);
          hit.forEach((row) => Object.assign(row, args.data));
          return { count: hit.length };
        },
      },
    };
  }

  it("edita sem duplicar e mantém o ID", async () => {
    const db = fakeDb();
    const parsed = parseCustomerInput({ name: "  João Silva Jr. ", phone: "(16) 98888-1111", email: "JOAO@Email.com" });
    assert.ok("data" in parsed);
    const ok = await updateCompanyCustomer(db, 10, 1, parsed.data);
    assert.equal(ok, true);
    assert.equal(db.rows.length, 3);
    assert.deepEqual(db.calls, ["updateMany"]);
    const updated = db.rows.find((row) => row.id === 1) as Record<string, unknown>;
    assert.equal(updated.name, "João Silva Jr.");
    assert.equal(updated.phone, "16988881111");
    assert.equal(updated.email, "joao@email.com");
    assert.equal(updated.companyId, 10);
  });

  it("não edita cliente de outra empresa", async () => {
    const db = fakeDb();
    const parsed = parseCustomerInput({ name: "Invasor", phone: "11900000000" });
    assert.ok("data" in parsed);
    assert.equal(await updateCompanyCustomer(db, 10, 3, parsed.data), false);
    assert.equal(db.rows.find((row) => row.id === 3)?.name, "João Outra Empresa");
    assert.equal(await updateCompanyCustomer(db, 10, 0, parsed.data), false);
  });

  it("valida os campos do cliente", () => {
    assert.deepEqual(parseCustomerInput({ name: "A", phone: "16999990000" }), { error: "Informe o nome do cliente." });
    assert.deepEqual(parseCustomerInput({ name: "Ana", phone: "123" }), { error: "Informe o telefone do cliente." });
    assert.deepEqual(parseCustomerInput({ name: "Ana", phone: "16999990000", stateId: 1 }), {
      error: "Escolha estado e cidade juntos.",
    });
    const parsed = parseCustomerInput({ name: "Ana", phone: "16 99999-0000", email: "", notes: " " });
    assert.ok("data" in parsed);
    assert.equal(parsed.data.whatsapp, "16999990000");
    assert.equal(parsed.data.email, null);
    assert.equal(parsed.data.notes, null);
  });

  it("novo orçamento recebe o cliente certo pela URL", () => {
    const fromUrl = (companyId: number, raw: string) => {
      const id = parseId(raw);
      return id ? (find(companyId, id)?.id ?? null) : null;
    };
    assert.equal(fromUrl(10, "1"), 1);
    assert.equal(fromUrl(10, "2"), 2);
    assert.equal(fromUrl(10, "3"), null);
    assert.equal(fromUrl(10, "abc"), null);
  });
});
