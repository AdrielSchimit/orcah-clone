import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadDashboard, loadReport, parsePeriod, summarizePeriod, type MetricsDb } from "../src/lib/business-metrics";
import {
  dailySeries,
  isBotUserAgent,
  isPageEvent,
  periodStart,
  recordPageEvent,
  statDay,
  sumStats,
  type StatsDb,
} from "../src/lib/page-stats";
import { table } from "./helpers/fake-db";

const CHROME = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36";
// 26/09/2026 às 10h em São Paulo
const NOW = new Date("2026-09-26T13:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

function statsDb() {
  const companyPageDailyStat = table({ views: 0, whatsappClicks: 0, quoteClicks: 0 });
  return { companyPageDailyStat, db: { companyPageDailyStat } as unknown as StatsDb };
}

describe("acessos da página", () => {
  it("view, clique no WhatsApp e pedido de orçamento incrementam a linha do dia", async () => {
    const { companyPageDailyStat, db } = statsDb();
    await recordPageEvent(db, 7, "view", NOW);
    await recordPageEvent(db, 7, "view", NOW);
    await recordPageEvent(db, 7, "whatsapp", NOW);
    await recordPageEvent(db, 7, "quote", NOW);
    assert.equal(companyPageDailyStat.rows.length, 1, "uma linha por empresa por dia");
    const [row] = companyPageDailyStat.rows;
    assert.equal(row.views, 2);
    assert.equal(row.whatsappClicks, 1);
    assert.equal(row.quoteClicks, 1);
    assert.equal((row.date as Date).toISOString(), "2026-09-26T00:00:00.000Z");
  });

  it("empresas diferentes e dias diferentes não se misturam", async () => {
    const { companyPageDailyStat, db } = statsDb();
    await recordPageEvent(db, 7, "view", NOW);
    await recordPageEvent(db, 8, "view", NOW);
    await recordPageEvent(db, 7, "view", new Date(NOW.getTime() + DAY));
    assert.equal(companyPageDailyStat.rows.length, 3);
  });

  it("usa o dia de São Paulo (23h de SP ainda é o mesmo dia)", () => {
    // 27/09 às 01:30 UTC = 26/09 às 22:30 em SP
    assert.equal(statDay(new Date("2026-09-27T01:30:00Z")).toISOString().slice(0, 10), "2026-09-26");
  });

  it("filtra robôs óbvios e aceita navegador de verdade", () => {
    assert.equal(isBotUserAgent(CHROME), false);
    for (const ua of ["", "curl/8.4", "Googlebot/2.1", "facebookexternalhit/1.1", "WhatsApp/2.24", "HeadlessChrome/120"]) {
      assert.equal(isBotUserAgent(ua), true, ua);
    }
    assert.equal(isPageEvent("view"), true);
    assert.equal(isPageEvent("delete"), false);
  });

  it("série diária preenche os dias sem acesso", () => {
    const rows = [
      { date: new Date("2026-09-26T00:00:00Z"), views: 5, whatsappClicks: 1, quoteClicks: 0 },
      { date: new Date("2026-09-24T00:00:00Z"), views: 2, whatsappClicks: 0, quoteClicks: 1 },
    ];
    const series = dailySeries(rows, 7, NOW);
    assert.equal(series.length, 7);
    assert.equal(series[0].date, "2026-09-20");
    assert.deepEqual(series.slice(-3).map((point) => point.views), [2, 0, 5]);
    assert.deepEqual(sumStats(rows), { views: 7, whatsappClicks: 1, quoteClicks: 1 });
  });
});

describe("relatórios 7/30/90 dias", () => {
  function metricsDb() {
    const companyPageDailyStat = table({ views: 0, whatsappClicks: 0, quoteClicks: 0 });
    const quoteRequest = table();
    const budget = table({ status: "draft", total: 0, approvedAt: null, serviceCity: null, serviceState: null });
    return { companyPageDailyStat, quoteRequest, budget, db: { companyPageDailyStat, quoteRequest, budget } as unknown as MetricsDb };
  }

  it("aceita só 7, 30 ou 90 (padrão 30)", () => {
    assert.equal(parsePeriod("7"), 7);
    assert.equal(parsePeriod("90"), 90);
    assert.equal(parsePeriod("365"), 30);
    assert.equal(parsePeriod(undefined), 30);
  });

  it("agrega por período sem pegar dados de outra empresa", async () => {
    const m = metricsDb();
    const day = (daysAgo: number) => new Date(statDay(NOW).getTime() - daysAgo * DAY);
    const at = (daysAgo: number) => new Date(NOW.getTime() - daysAgo * DAY);
    for (const [daysAgo, views] of [[0, 10], [5, 4], [20, 6], [60, 30], [100, 99]] as const) {
      await m.companyPageDailyStat.create({ data: { companyId: 7, date: day(daysAgo), views, whatsappClicks: 1, quoteClicks: 0 } });
    }
    await m.companyPageDailyStat.create({ data: { companyId: 8, date: day(0), views: 500 } });
    for (const daysAgo of [1, 10, 40]) await m.quoteRequest.create({ data: { companyId: 7, createdAt: at(daysAgo) } });
    await m.quoteRequest.create({ data: { companyId: 8, createdAt: at(1) } });
    await m.budget.create({ data: { companyId: 7, createdAt: at(2), status: "approved", approvedAt: at(1), total: 1000 } });
    await m.budget.create({ data: { companyId: 7, createdAt: at(3), status: "sent", total: 500 } });
    await m.budget.create({ data: { companyId: 7, createdAt: at(4), status: "draft", total: 100 } });
    await m.budget.create({ data: { companyId: 7, createdAt: at(50), status: "approved", approvedAt: at(45), total: 2000 } });

    const week = await loadReport(m.db, 7, 7, NOW);
    assert.equal(week.summary.views, 14);
    assert.equal(week.summary.whatsappClicks, 2);
    assert.equal(week.summary.quoteRequests, 1);
    assert.equal(week.summary.budgetsCreated, 3);
    assert.equal(week.summary.budgetsSent, 2);
    assert.equal(week.summary.approvedCount, 1);
    assert.equal(week.summary.approvedTotal, 1000);
    assert.equal(week.summary.approvalRate, 50);
    assert.equal(week.series.length, 7);

    const month = await loadReport(m.db, 7, 30, NOW);
    assert.equal(month.summary.views, 20);
    assert.equal(month.summary.quoteRequests, 2);

    const quarter = await loadReport(m.db, 7, 90, NOW);
    assert.equal(quarter.summary.views, 50);
    assert.equal(quarter.summary.quoteRequests, 3);
    assert.equal(quarter.summary.approvedCount, 2);
    assert.equal(quarter.summary.approvedTotal, 3000);
    assert.equal(quarter.series.length, 90);
  });

  it("sem orçamento enviado a taxa fica vazia (não inventa 0%)", () => {
    const summary = summarizePeriod({ stats: [], quoteRequests: 0, budgets: [{ status: "draft", total: 10 }], approvedCount: 0, approvedTotal: 0 });
    assert.equal(summary.approvalRate, null);
  });

  it("início compara a semana com a anterior", async () => {
    const m = metricsDb();
    const day = (daysAgo: number) => new Date(statDay(NOW).getTime() - daysAgo * DAY);
    await m.companyPageDailyStat.create({ data: { companyId: 7, date: day(1), views: 30 } });
    await m.companyPageDailyStat.create({ data: { companyId: 7, date: day(9), views: 12 } });
    const dash = await loadDashboard(m.db, 7, NOW);
    assert.equal(dash.views7, 30);
    assert.equal(dash.viewsDelta, 18);
    assert.equal(periodStart(7, NOW).toISOString().slice(0, 10), "2026-09-20");
  });
});
