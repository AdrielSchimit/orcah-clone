/**
 * Banco em memória com o pedaço da API do Prisma que as libs usam
 * (where com equals/in/not/gte/gt/lte/lt/OR, increment, upsert, aggregate).
 */

type Row = Record<string, unknown>;

const COMPOUND_KEYS: Record<string, string[]> = { companyId_date: ["companyId", "date"] };

function sameValue(a: unknown, b: unknown) {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  return a === b;
}

function toTime(value: unknown) {
  return value instanceof Date ? value.getTime() : typeof value === "number" ? value : NaN;
}

export function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, cond]) => {
    if (key === "OR") return (cond as Row[]).some((w) => matches(row, w));
    if (key === "AND") return (cond as Row[]).every((w) => matches(row, w));
    if (COMPOUND_KEYS[key]) {
      return COMPOUND_KEYS[key].every((field) => sameValue(row[field], (cond as Row)[field]));
    }
    const value = row[key];
    if (cond === null) return value === null || value === undefined;
    if (cond instanceof Date || typeof cond !== "object") return sameValue(value, cond);
    const c = cond as Row;
    if ("in" in c && !(c.in as unknown[]).some((item) => sameValue(item, value))) return false;
    if ("not" in c) {
      if (c.not === null && (value === null || value === undefined)) return false;
      if (c.not !== null && sameValue(value, c.not)) return false;
    }
    if ("equals" in c && !sameValue(value, c.equals)) return false;
    if ("gte" in c && !(toTime(value) >= toTime(c.gte))) return false;
    if ("gt" in c && !(toTime(value) > toTime(c.gt))) return false;
    if ("lte" in c && !(toTime(value) <= toTime(c.lte))) return false;
    if ("lt" in c && !(toTime(value) < toTime(c.lt))) return false;
    return true;
  });
}

function applyData(row: Row, data: Row) {
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === "object" && !(value instanceof Date) && "increment" in (value as Row)) {
      row[key] = Number(row[key] ?? 0) + Number((value as Row).increment);
    } else {
      row[key] = value;
    }
  }
  row.updatedAt = new Date();
  return row;
}

function sortRows(rows: Row[], orderBy: unknown) {
  const orders = (Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : []) as Record<string, "asc" | "desc">[];
  return [...rows].sort((a, b) => {
    for (const order of orders) {
      const [key, dir] = Object.entries(order)[0];
      const av = a[key] instanceof Date ? (a[key] as Date).getTime() : a[key];
      const bv = b[key] instanceof Date ? (b[key] as Date).getTime() : b[key];
      if (av === bv) continue;
      const cmp = (av as number | string | boolean) > (bv as number | string | boolean) ? 1 : -1;
      return dir === "desc" ? -cmp : cmp;
    }
    return 0;
  });
}

export function table(defaults: Row = {}) {
  const rows: Row[] = [];
  let seq = 0;
  const api = {
    rows,
    async count({ where }: { where?: Row } = {}) {
      return rows.filter((r) => matches(r, where)).length;
    },
    async create({ data }: { data: Row; select?: unknown }) {
      const row = { id: ++seq, createdAt: new Date(), updatedAt: new Date(), ...defaults, ...data };
      rows.push(row);
      return row;
    },
    async findUnique({ where }: { where: Row; select?: unknown }) {
      return rows.find((r) => matches(r, where)) ?? null;
    },
    async findFirst({ where, orderBy }: { where?: Row; orderBy?: unknown; select?: unknown }) {
      return sortRows(rows.filter((r) => matches(r, where)), orderBy)[0] ?? null;
    },
    async findMany({ where, orderBy, take }: { where?: Row; orderBy?: unknown; take?: number; select?: unknown } = {}) {
      const found = sortRows(rows.filter((r) => matches(r, where)), orderBy);
      return typeof take === "number" ? found.slice(0, take) : found;
    },
    async update({ where, data }: { where: Row; data: Row }) {
      const row = rows.find((r) => matches(r, where));
      if (!row) throw Object.assign(new Error("Record not found"), { code: "P2025" });
      return applyData(row, data);
    },
    async updateMany({ where, data }: { where?: Row; data: Row }) {
      const hit = rows.filter((r) => matches(r, where));
      hit.forEach((r) => applyData(r, data));
      return { count: hit.length };
    },
    async upsert({ where, create, update }: { where: Row; create: Row; update: Row }) {
      const row = rows.find((r) => matches(r, where));
      if (row) return applyData(row, update);
      return api.create({ data: create });
    },
    async deleteMany({ where }: { where?: Row } = {}) {
      const keep = rows.filter((r) => !matches(r, where));
      const count = rows.length - keep.length;
      rows.splice(0, rows.length, ...keep);
      return { count };
    },
    async aggregate({ where, _sum }: { where?: Row; _count?: unknown; _sum?: Record<string, boolean> }) {
      const hit = rows.filter((r) => matches(r, where));
      const sum: Record<string, number | null> = {};
      for (const key of Object.keys(_sum ?? {})) {
        sum[key] = hit.length ? hit.reduce((total, r) => total + Number(r[key] ?? 0), 0) : null;
      }
      return { _count: { _all: hit.length }, _sum: sum };
    },
  };
  return api;
}

export function withTransaction<T extends object>(db: T) {
  return Object.assign(db, {
    async $transaction(input: unknown) {
      if (typeof input === "function") return (input as (tx: T) => Promise<unknown>)(db);
      return Promise.all(input as Promise<unknown>[]);
    },
  });
}
