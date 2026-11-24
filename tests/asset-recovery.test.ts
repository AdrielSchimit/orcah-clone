import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isLegacyLocalAsset, publicAssetOrNull } from "../src/lib/asset-recovery";
import { getPublicCompanyPage, type PublicPageDb } from "../src/lib/public-page";

describe("fotos antigas do provedor", () => {
  it("identifica links locais que não persistem em hospedagem serverless", () => {
    assert.equal(isLegacyLocalAsset("/uploads/companies/2/gallery/foto.webp"), true);
    assert.equal(isLegacyLocalAsset("/uploads/companies/2/cover/foto.webp"), true);
    assert.equal(isLegacyLocalAsset("https://project.supabase.co/storage/v1/object/public/company-assets/companies/2/gallery/foto.webp"), false);
    assert.equal(isLegacyLocalAsset(null), false);
    assert.equal(publicAssetOrNull("/uploads/companies/2/logo/a.webp", true), null);
    assert.equal(publicAssetOrNull("https://project.supabase.co/storage/v1/object/public/company-assets/companies/2/logo/a.webp"),
      "https://project.supabase.co/storage/v1/object/public/company-assets/companies/2/logo/a.webp");
  });

  it("mantém URLs persistentes, mas esconde caminhos locais quebrados na vitrine", async () => {
    const remote = "https://project.supabase.co/storage/v1/object/public/company-assets/companies/2/gallery/new.webp";
    const company = {
      slug: "pintada", name: "Empresa teste", description: null,
      phone: "11900000000", whatsapp: "11900000000", instagram: null, instagramConfirmed: false,
      facebook: null, website: null, openingHours: null, primaryColor: null, secondaryColor: null,
      logoPath: "/uploads/companies/2/logo/old.webp",
      coverPath: "/uploads/companies/2/cover/old.webp",
      servesRegion: false, customRamoName: "Pintura", businessCategory: null,
      city: { name: "Teste" }, state: { uf: "SP", name: "São Paulo" },
      photos: [
        { path: "/uploads/companies/2/gallery/old.webp", title: "Antiga" },
        { path: remote, title: "Recuperada" },
      ],
      services: [
        { name: "Pintura", description: null, category: null, imagePath: "/uploads/companies/2/services/1/old.webp",
          featured: true, showPrice: false, defaultPrice: 100, unit: "m²" },
      ],
    };
    const db = { company: { findUnique: async () => company } } as unknown as PublicPageDb;
    const result = await getPublicCompanyPage(db, "pintada", { production: true });
    assert.ok(result);
    assert.equal(result.logoPath, null);
    assert.equal(result.coverPath, null);
    assert.deepEqual(result.photos, [{ path: remote, title: "Recuperada" }]);
    assert.equal(result.services[0].imagePath, null);
    assert.equal(result.services[0].name, "Pintura");
  });
});
