import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { companyServesSearchCity } from "@/lib/provider-location";

describe("companyServesSearchCity", () => {
  const maravilha = { id: 1, name: "Maravilha", slug: "maravilha", stateId: 10, stateName: "Santa Catarina", uf: "SC" };

  it("atende na mesma cidade", () => {
    assert.equal(
      companyServesSearchCity({ cityId: 1, stateId: 10, servesRegion: false }, maravilha),
      true,
    );
  });

  it("atende região no mesmo estado", () => {
    assert.equal(
      companyServesSearchCity({ cityId: 2, stateId: 10, servesRegion: true }, maravilha),
      true,
    );
  });

  it("não atende outra cidade sem região", () => {
    assert.equal(
      companyServesSearchCity({ cityId: 2, stateId: 10, servesRegion: false }, maravilha),
      false,
    );
  });
});
