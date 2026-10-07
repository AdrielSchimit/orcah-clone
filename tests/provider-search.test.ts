import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { companyServesSearchCity, resolveCitySearchParam } from "@/lib/provider-location";

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

  it("cidade válida ainda não persistida só encontra atendimento regional", () => {
    const bora = { id: 0, name: "Borá", slug: "bora", stateId: 25, stateName: "São Paulo", uf: "SP" };
    assert.equal(companyServesSearchCity({ cityId: 99, stateId: 25, servesRegion: true }, bora), true);
    assert.equal(companyServesSearchCity({ cityId: 99, stateId: 25, servesRegion: false }, bora), false);
  });
});

describe("resolveCitySearchParam", () => {
  it("resolve município nacional mesmo antes de existir na tabela cities", async () => {
    const db = {
      state: {
        findUnique: async ({ where }: { where: { uf: string } }) =>
          where.uf === "SP" ? { id: 25, name: "São Paulo", uf: "SP" } : null,
      },
      city: {
        findUnique: async () => null,
      },
    };

    const city = await resolveCitySearchParam(db as never, "bora-sp");
    assert.deepEqual(city, {
      id: 0,
      name: "Borá",
      slug: "bora",
      stateId: 25,
      stateName: "São Paulo",
      uf: "SP",
    });
  });
});
