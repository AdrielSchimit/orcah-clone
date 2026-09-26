import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
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
    let status: "viewed" | "waiting" | "sent" = "viewed";
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
