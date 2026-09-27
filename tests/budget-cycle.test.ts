import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { table } from "./helpers/fake-db";
import {
  claimRepublish,
  type CycleStatus,
  isRepublishMetadata,
  nextBudgetVersion,
  publicCanRespond,
  republishEventMetadata,
  statusAfterProviderEdit,
} from "../src/lib/budget-cycle";

describe("ciclo de pedido de alteração", () => {
  it("mantém rascunho, enviado e visualizado como estão na edição", () => {
    assert.equal(statusAfterProviderEdit("draft"), "draft");
    assert.equal(statusAfterProviderEdit("sent"), "sent");
    assert.equal(statusAfterProviderEdit("viewed"), "viewed");
  });

  it("devolve alteração pedida para enviado e libera nova aprovação", () => {
    const status = statusAfterProviderEdit("waiting");
    assert.equal(status, "sent");
    assert.equal(publicCanRespond("waiting"), false);
    assert.equal(publicCanRespond(status), true);
  });

  it("aceita dois ciclos consecutivos", () => {
    let status: CycleStatus = "viewed";
    assert.equal(publicCanRespond(status), true);

    status = "waiting";
    assert.equal(publicCanRespond(status), false);
    status = statusAfterProviderEdit(status);
    assert.equal(status, "sent");
    assert.equal(publicCanRespond(status), true);

    status = "waiting";
    assert.equal(publicCanRespond(status), false);
    status = statusAfterProviderEdit(status);
    assert.equal(status, "sent");
    assert.equal(publicCanRespond(status), true);
  });

  it("não reabre orçamento aprovado, recusado ou expirado", () => {
    assert.equal(publicCanRespond("approved"), false);
    assert.equal(publicCanRespond("rejected"), false);
    assert.equal(publicCanRespond("expired"), false);
    assert.equal(statusAfterProviderEdit("approved"), "approved");
  });

  it("guarda o histórico mínimo: versão anterior, total anterior e total novo", () => {
    assert.equal(nextBudgetVersion(null), 1);
    assert.equal(nextBudgetVersion(1), 2);
    const metadata = republishEventMetadata({
      version: 1,
      total: "150.00",
      previousTotal: "187.50",
    });
    assert.equal(isRepublishMetadata(metadata), true);
    assert.equal(metadata.previousTotal, "187.50");
    assert.equal(metadata.total, "150.00");
    assert.equal(isRepublishMetadata({ message: "troca o prazo" }), false);
  });
});

describe("republicação dentro da transação", () => {
  function setup(status: string) {
    const db = { budget: table(), budgetVersion: table() };
    db.budget.rows.push({ id: 7, status, subtotal: "200.00", discount: "12.50", total: "187.50", notes: "à vista" });
    return db;
  }
  const snapshot = (db: ReturnType<typeof setup>) => {
    const row = db.budget.rows[0] as { id: number; subtotal: string; discount: string; total: string; notes: string };
    return { id: row.id, subtotal: row.subtotal, discount: row.discount, total: row.total, notes: row.notes };
  };

  it("guarda a versão anterior e devolve para enviado", async () => {
    const db = setup("waiting");
    const version = await claimRepublish(db as never, snapshot(db));
    assert.equal(version, 1);
    assert.equal(db.budget.rows[0].status, "sent");
    assert.deepEqual(
      { ...db.budgetVersion.rows[0], id: undefined, createdAt: undefined, updatedAt: undefined },
      { id: undefined, createdAt: undefined, updatedAt: undefined, budgetId: 7, version: 1, subtotal: "200.00", discount: "12.50", total: "187.50", notes: "à vista" },
    );
  });

  it("salvar duas vezes seguidas não duplica versão", async () => {
    const db = setup("waiting");
    const first = snapshot(db);
    assert.equal(await claimRepublish(db as never, first), 1);
    assert.equal(await claimRepublish(db as never, first), null);
    assert.equal(db.budgetVersion.rows.length, 1);
  });

  it("não reabre orçamento que o cliente já respondeu", async () => {
    for (const status of ["approved", "rejected", "expired", "sent", "draft"]) {
      const db = setup(status);
      assert.equal(await claimRepublish(db as never, snapshot(db)), null);
      assert.equal(db.budget.rows[0].status, status);
      assert.equal(db.budgetVersion.rows.length, 0);
    }
  });

  it("dois ciclos consecutivos geram versões 1 e 2 e terminam em aprovação", async () => {
    const db = setup("waiting");
    assert.equal(await claimRepublish(db as never, snapshot(db)), 1);
    Object.assign(db.budget.rows[0], { total: "150.00" });
    assert.equal(publicCanRespond(db.budget.rows[0].status as string), true);

    db.budget.rows[0].status = "waiting";
    assert.equal(publicCanRespond("waiting"), false);
    assert.equal(await claimRepublish(db as never, snapshot(db)), 2);
    assert.deepEqual(
      db.budgetVersion.rows.map((row) => [row.version, row.total]),
      [
        [1, "187.50"],
        [2, "150.00"],
      ],
    );
    assert.equal(publicCanRespond(db.budget.rows[0].status as string), true);
  });
});
