import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCompanyDescription,
  normalizeCustomDescription,
  normalizeOnboardingPayload,
} from "../src/lib/onboarding";

describe("onboarding", () => {
  it("generates description for eletricista", () => {
    const result = buildCompanyDescription({
      categoryName: "Eletricista",
      categorySlug: "eletricista",
      cityName: "Barrinha",
      servesRegion: true,
    });

    assert.equal(result, "Serviços elétricos residenciais e comerciais em Barrinha e região.");
  });

  it("generates description for pedreiro", () => {
    const result = buildCompanyDescription({
      categoryName: "Pedreiro",
      categorySlug: "pedreiro",
      cityName: "Maravilha",
    });

    assert.equal(result, "Serviços de construção, reforma e manutenção em Maravilha.");
  });

  it("generates description for encanador", () => {
    const result = buildCompanyDescription({
      categoryName: "Encanador",
      categorySlug: "encanador",
      cityName: "Chapecó",
      servesRegion: true,
    });

    assert.equal(result, "Serviços hidráulicos residenciais e comerciais em Chapecó e região.");
  });

  it("generates description for custom ramo", () => {
    const result = buildCompanyDescription({
      categoryName: "Outro",
      categorySlug: "outro",
      customRamoName: "instalador de antenas",
      cityName: "Lages",
    });

    assert.equal(result, "Serviços de Instalador de Antenas em Lages.");
  });

  it("keeps city without region", () => {
    const result = buildCompanyDescription({
      categoryName: "Pintor",
      categorySlug: "pintor",
      cityName: "Curitiba",
      servesRegion: false,
    });

    assert.equal(result, "Serviços de pintura residencial e comercial em Curitiba.");
  });

  it("works with empty city", () => {
    const result = buildCompanyDescription({
      categoryName: "Serralheiro",
      categorySlug: "serralheiro",
      servesRegion: true,
    });

    assert.equal(result, "Serviços de serralheria sob medida.");
  });

  it("normalizes custom description", () => {
    assert.equal(
      normalizeCustomDescription("  material incluso, garantia de 30 dias  "),
      "material incluso, garantia de 30 dias",
    );
  });

  it("accepts valid onboarding payload", () => {
    const result = normalizeOnboardingPayload({
      name: "João Elétrica",
      whatsapp: "(16) 99999-9999",
      businessCategoryId: 10,
      customRamoName: "",
      stateId: 25,
      cityName: "barrinha",
      servesRegion: true,
      description: "Serviços elétricos em Barrinha e região.",
    });

    assert.deepEqual(result, {
      payload: {
        name: "João Elétrica",
        whatsapp: "16999999999",
        businessCategoryId: 10,
        customRamoName: "",
        stateId: 25,
        cityName: "Barrinha",
        servesRegion: true,
        description: "Serviços elétricos em Barrinha e região.",
      },
    });
  });
});
