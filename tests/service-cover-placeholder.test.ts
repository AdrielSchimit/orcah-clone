import assert from "node:assert/strict";
import { it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { ramos } from "../prisma/data/ramos";
import { resolveServiceCoverTheme, serviceCoverThemes, serviceCoverIcons } from "../src/lib/service-cover-themes";
import { ServiceCoverPlaceholder } from "../src/components/service-cover-placeholder";
import { ProviderProfileContent, type ProviderProfileData } from "../src/components/prestadores/provider-profile-content";

it("resolves configured names/slugs and safely falls back for other categories", () => {
  assert.equal(resolveServiceCoverTheme(" Pintor "), serviceCoverThemes.pintor);
  assert.equal(resolveServiceCoverTheme("ELETRICISTA"), serviceCoverThemes.eletricista);
  assert.equal(resolveServiceCoverTheme(" Pedreiro "), serviceCoverThemes.pedreiro);
  assert.equal(resolveServiceCoverTheme("Encanador / hidráulico"), serviceCoverThemes.encanador);
  assert.equal(resolveServiceCoverTheme("Pintor automotivo"), serviceCoverThemes["pintor-automotivo"]);
  assert.notEqual(resolveServiceCoverTheme("Pintor automotivo"), serviceCoverThemes.pintor);
  for (const category of [null, undefined, "", "Astronauta", "Pintor espacial", "constructor", "__proto__"]) {
    assert.equal(resolveServiceCoverTheme(category), serviceCoverThemes.generic);
  }
});

const profile: ProviderProfileData = {
  slug: "teste", name: "Prestador", category: "Pintor", place: "São Paulo",
  servesSearchRegion: false, description: null, logoPath: "/logo.webp",
  serviceAreaText: "São Paulo", serviceAreaLabel: "São Paulo", openingHours: null,
  reviewBadge: "Novo no Orçah", services: [], photos: [{ path: "/gallery.webp", title: null }],
};

it("uses the SVG when no custom cover exists, even with gallery photos or a logo", () => {
  const html = renderToStaticMarkup(createElement(ProviderProfileContent, { profile }));
  assert.match(html, /viewBox="0 0 1500 500"/);
  assert.doesNotMatch(html.split("<h2")[0], /<img/);
});

it("keeps the custom cover and its existing layout instead of rendering the placeholder", () => {
  const html = renderToStaticMarkup(createElement(ProviderProfileContent, { profile: { ...profile, coverPath: "/custom.webp" } }));
  assert.match(html, /src="\/custom.webp"/);
  assert.match(html, /aspect-\[21\/9\]/);
  assert.doesNotMatch(html, /viewBox="0 0 1500 500"/);
});

it("maps every catalog name and slug to the same configured cover and renders valid SVG", async () => {
  for (const ramo of ramos) {
    const theme = resolveServiceCoverTheme(ramo.slug);
    assert.notEqual(theme, serviceCoverThemes.generic, ramo.slug);
    assert.equal(resolveServiceCoverTheme(ramo.name), theme, ramo.name);
    const html = renderToStaticMarkup(createElement(ServiceCoverPlaceholder, { category: ramo.slug }));
    const svg = html.match(/<svg[\s\S]*?<\/svg>/)?.[0];
    assert.ok(svg, ramo.slug);
    const rendered = await sharp(Buffer.from(svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '))).resize(300, 100).png().toBuffer();
    assert.ok(rendered.length > 0, ramo.slug);
  }
});

it("keeps every shared drawing inside its 100 × 100 canvas without accidental clipping", async () => {
  const overflow: string[] = [];
  for (const [name, paths] of Object.entries(serviceCoverIcons)) {
    // Extra transparent margin detects paths that a normal viewBox would silently cut.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="-20 -20 140 140" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths.map(d => `<path d="${d}"/>`).join("")}</svg>`;
    const { data, info } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let outside = false;
    let visible = false;
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        if (data[(y * info.width + x) * info.channels + info.channels - 1] < 16) continue;
        visible = true;
        if (x < 20 || x >= 120 || y < 20 || y >= 120) outside = true;
      }
    }
    assert.ok(visible, `Empty icon: ${name}`);
    if (outside) overflow.push(name);
  }
  assert.deepEqual(overflow, [], `Drawings overflow their canvas: ${overflow.join(", ")}`);
});
