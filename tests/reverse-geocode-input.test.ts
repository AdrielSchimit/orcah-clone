import assert from "node:assert/strict";
import { test } from "node:test";
import { GET } from "../src/app/api/publico/localizacao/reverse/route";

test("localização reversa recusa coordenadas ausentes, vazias e fora dos limites sem chamar a rede", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("network must not be called");
  });
  for (const query of ["", "lat=&lon=", "lat=%20&lon=10", "lat=10", "lat=91&lon=0", "lat=0&lon=-181", "lat=abc&lon=1", "lat=Infinity&lon=1"]) {
    const response = await GET(new Request(`http://localhost/api/publico/localizacao/reverse?${query}`));
    assert.equal(response.status, 400, query);
  }
  assert.equal(fetchMock.mock.callCount(), 0);
});
