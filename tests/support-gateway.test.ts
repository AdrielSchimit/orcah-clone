import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { POST } from "../src/app/api/internal/control/route";
import { gatewayOperator } from "../src/lib/support/control-gateway";
describe("rota interna de suporte", () => {
  it("rejeita requisição real sem segredo antes de qualquer leitura", async () => {
    const response = await POST(new Request("http://localhost/api/internal/control", { method: "POST", body: JSON.stringify({ action: "support", params: { operation: "inbox" } }) }));
    assert.equal(response.status, 401);
  });
  it("define nome canônico a partir da identidade autenticada da ponte", () => {
    assert.deepEqual(gatewayOperator({ id: "2", name: "Nome forjado", senderName: "Adriel" }), { kind: "operator", id: "2", name: "César" });
    assert.throws(() => gatewayOperator({ id: "9" }), { status: 403 });
    assert.throws(() => gatewayOperator(null), { status: 403 });
  });
});
