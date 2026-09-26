import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildServiceDescription } from "../src/lib/onboarding-description";

describe("onboarding service description", () => {
  it("builds an electrician description with city and region", () => {
    assert.equal(
      buildServiceDescription({
        ramo: "Eletricista",
        city: "Barrinha",
        servesRegion: true,
      }),
      "Serviços elétricos residenciais e comerciais em Barrinha e região.",
    );
  });

  it("builds a plumber description without forcing region", () => {
    assert.equal(
      buildServiceDescription({
        ramo: "Encanador",
        city: "Ribeirão Preto",
        servesRegion: false,
      }),
      "Serviços hidráulicos residenciais e comerciais em Ribeirão Preto.",
    );
  });

  it("supports a custom ramo", () => {
    assert.equal(
      buildServiceDescription({
        ramo: "Instalador de antenas",
        city: "Sertãozinho",
        servesRegion: true,
      }),
      "Serviços de Instalador de Antenas em Sertãozinho e região.",
    );
  });

  it("does not invent a city when it is omitted", () => {
    assert.equal(
      buildServiceDescription({
        ramo: "Pintor",
        servesRegion: true,
      }),
      "Serviços de pintura residencial e comercial.",
    );
  });

  it("returns an empty suggestion until a ramo exists", () => {
    assert.equal(buildServiceDescription({ city: "Barrinha" }), "");
  });
});
