import type { PrismaClient } from "@prisma/client";

/**
 * Métrica simples da página pública: contadores por empresa por dia.
 * "Acessos", não "pessoas": atualizar a página conta de novo. Sem IP, sem cookie de rastreio.
 */

export type StatsDb = Pick<PrismaClient, "companyPageDailyStat">;

export const PAGE_EVENTS = {
  view: "views",
  whatsapp: "whatsappClicks",
  quote: "quoteClicks",
  instagram: "instagramClicks",
} as const;

export type PageEvent = keyof typeof PAGE_EVENTS;
export type PageOrigin = "instagram";

const STAT_FIELDS = ["views", "whatsappClicks", "quoteClicks", "instagramClicks", "instagramVisits"] as const;

/** Visita vinda do app do Instagram ou de um link da bio com ?utm_source=instagram. */
export function isInstagramOrigin(referrer: string | null | undefined, source: string | null | undefined) {
  const src = (source ?? "").trim().toLowerCase();
  if (src === "instagram" || src === "ig") return true;
  const ref = (referrer ?? "").trim();
  if (!ref) return false;
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "").toLowerCase();
    return host === "instagram.com" || host === "l.instagram.com" || host.endsWith(".instagram.com");
  } catch {
    return ref.toLowerCase().includes("instagram.com");
  }
}

export function isPageEvent(value: unknown): value is PageEvent {
  return typeof value === "string" && value in PAGE_EVENTS;
}

const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|undici|go-http|java\/|okhttp|postman/i;

export function isBotUserAgent(userAgent: string | null | undefined) {
  const ua = (userAgent ?? "").trim();
  if (ua.length < 10) return true;
  return BOT_PATTERN.test(ua);
}

const TIME_ZONE = "America/Sao_Paulo";
const DAY_MS = 24 * 60 * 60 * 1000;

/** Dia do calendário em São Paulo, como Date à meia-noite UTC (formato da coluna DATE). */
export function statDay(now = new Date()) {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return new Date(`${ymd}T00:00:00.000Z`);
}

export function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Primeiro dia (inclusive) de uma janela de N dias terminando hoje. */
export function periodStart(days: number, now = new Date()) {
  return new Date(statDay(now).getTime() - (days - 1) * DAY_MS);
}

async function incrementStat(
  db: StatsDb,
  companyId: number,
  field: (typeof STAT_FIELDS)[number],
  now: Date,
) {
  const date = statDay(now);
  const where = { companyId_date: { companyId, date } };
  const zeros = { views: 0, whatsappClicks: 0, quoteClicks: 0, instagramClicks: 0, instagramVisits: 0 };
  try {
    await db.companyPageDailyStat.upsert({
      where,
      create: { companyId, date, ...zeros, [field]: 1 },
      update: { [field]: { increment: 1 } },
    });
  } catch (error) {
    // duas visitas no mesmo instante criando a linha do dia: a segunda só incrementa
    if ((error as { code?: string })?.code !== "P2002") throw error;
    await db.companyPageDailyStat.update({ where, data: { [field]: { increment: 1 } } });
  }
}

export async function recordPageEvent(
  db: StatsDb,
  companyId: number,
  event: PageEvent,
  now = new Date(),
  origin?: PageOrigin | null,
) {
  await incrementStat(db, companyId, PAGE_EVENTS[event], now);
  if (event === "view" && origin === "instagram") {
    await incrementStat(db, companyId, "instagramVisits", now);
  }
}

export type StatRow = {
  date: Date;
  views: number;
  whatsappClicks: number;
  quoteClicks: number;
  instagramClicks?: number;
  instagramVisits?: number;
};

export function sumStats(rows: StatRow[]) {
  return rows.reduce(
    (total, row) => ({
      views: total.views + row.views,
      whatsappClicks: total.whatsappClicks + row.whatsappClicks,
      quoteClicks: total.quoteClicks + row.quoteClicks,
      instagramClicks: total.instagramClicks + (row.instagramClicks ?? 0),
      instagramVisits: total.instagramVisits + (row.instagramVisits ?? 0),
    }),
    { views: 0, whatsappClicks: 0, quoteClicks: 0, instagramClicks: 0, instagramVisits: 0 },
  );
}

/** Série diária para o gráfico, com zero nos dias sem acesso. */
export function dailySeries(rows: StatRow[], days: number, now = new Date()) {
  const byDay = new Map(rows.map((row) => [dayKey(row.date), row]));
  const start = periodStart(days, now).getTime();
  return Array.from({ length: days }, (_, index) => {
    const key = dayKey(new Date(start + index * DAY_MS));
    return { date: key, views: byDay.get(key)?.views ?? 0 };
  });
}

export async function statsForPeriod(db: StatsDb, companyId: number, days: number, now = new Date()) {
  return db.companyPageDailyStat.findMany({
    where: { companyId, date: { gte: periodStart(days, now), lte: statDay(now) } },
    select: { date: true, views: true, whatsappClicks: true, quoteClicks: true, instagramClicks: true, instagramVisits: true },
    orderBy: { date: "asc" },
  });
}
