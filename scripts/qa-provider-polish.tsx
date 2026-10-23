/** Visual QA with the existing Playwright runtime; no browser dependency is installed. */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProviderShowcase } from "../src/components/provider-showcase";
import { getPublicCompanyPage, type PublicCompanyPage } from "../src/lib/public-page";
import { prisma } from "../src/lib/db";

const loadModule = createRequire(path.resolve("package.json"));
const { chromium } = loadModule(process.env.PLAYWRIGHT_MODULE || "playwright");
async function main() {
  const output = path.resolve("docs/prestador-polimento");
  const origin = "http://pintada.localhost:3000";
  const widths = [375, 390, 430, 768, 1024, 1440];
  const browser = await chromium.launch({ channel: process.env.PROVIDER_QA_BROWSER_CHANNEL || "chrome", headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const failures: string[] = [];
  page.on("pageerror", (error: Error) => failures.push(error.message));
  const report: object[] = [];
  await fs.mkdir(output, { recursive: true });

  try {
    // Do not create metrics or leads during automated verification.
    await page.route("**/api/publico/**/metrica", (route: { fulfill: (options: object) => Promise<void> }) => route.fulfill({ status: 204 }));
    const company = await getPublicCompanyPage(prisma, "pintada");
    assert.ok(company, "Pintada must already exist");

    for (const width of widths) {
      await page.setViewportSize({ width, height: width < 768 ? 800 : 1000 });
      await page.goto(origin, { waitUntil: "networkidle" });
      await page.evaluate(async () => { await Promise.all(Array.from(document.images, image => image.decode().catch(() => undefined))); });
      const size = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
      assert.ok(size.scroll <= width, `page overflow at ${width}`);
      assert.equal(await page.locator("nav").count(), 0);
      assert.equal(await page.locator("form").count(), 0);
      report.push({ scenario: "Pintada", ...size, photos: company.photos.length, services: company.services.length });

      if (width === 1440 || width === 390) {
        const label = width === 1440 ? "desktop" : "mobile";
        await page.screenshot({ path: path.join(output, `${label}-pagina.jpg`), fullPage: true });
        await page.locator("#provider-hero").screenshot({ path: path.join(output, `${label}-hero.jpg`) });
        await page.screenshot({ path: path.join(output, `${label}-primeira-dobra.jpg`) });
        for (const [id, name] of [["trabalhos", "trabalhos"], ["servicos", "servico"], ["contato", "contato"]]) {
          const section = page.locator(`section[aria-labelledby="${id}"]`);
          if (await section.count()) await section.screenshot({ path: path.join(output, `${label}-${name}.jpg`) });
        }
        if (width === 390) {
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          await page.waitForTimeout(100);
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          await page.locator(".provider-sticky:not([hidden])").waitFor({ state: "visible" });
          await page.screenshot({ path: path.join(output, "mobile-contato-footer-sticky.jpg") });
        }
        if (company.photos.length) {
          await page.locator(".provider-gallery button").first().click();
          await page.getByRole("dialog", { name: "Foto ampliada" }).waitFor();
          await page.screenshot({ path: path.join(output, `${label}-foto-ampliada.jpg`) });
          await page.keyboard.press("Escape");
          await page.getByRole("dialog", { name: "Foto ampliada" }).waitFor({ state: "detached" });
        }
      }

      const triggerLocator: { click: () => Promise<void>; elementHandle: () => Promise<unknown>; evaluate: (fn: (element: HTMLElement) => boolean) => Promise<boolean> } = company.services.length
        ? page.locator(".provider-service-card button").first()
        : page.locator("#provider-hero button").first();
      await triggerLocator.click();
      await page.locator("dialog[open]").waitFor();
      const dialog = await page.locator("dialog").evaluate((element: HTMLDialogElement) => {
        const bounds = element.getBoundingClientRect();
        return { left: bounds.left, right: bounds.right, bottom: bounds.bottom, height: innerHeight, overflow: element.scrollWidth > element.clientWidth, locked: document.documentElement.style.overflow };
      });
      assert.ok(dialog.left >= 0 && dialog.right <= width && !dialog.overflow);
      assert.equal(dialog.locked, "hidden");
      if (width < 768) assert.ok(Math.abs(dialog.bottom - dialog.height) < 1);
      if (company.services.length) assert.equal(await page.locator("[name=desiredService]").inputValue(), company.services[0].name);
      await page.getByRole("button", { name: "Fechar orçamento" }).press("Shift+Tab");
      assert.equal(await page.getByRole("button", { name: "Solicitar orçamento", exact: true }).evaluate((element: HTMLElement) => element === document.activeElement), true);
      await page.getByRole("button", { name: "Solicitar orçamento", exact: true }).press("Tab");
      assert.equal(await page.getByRole("button", { name: "Fechar orçamento" }).evaluate((element: HTMLElement) => element === document.activeElement), true);
      await page.getByRole("button", { name: "Fechar orçamento" }).press("Escape");
      assert.equal(await page.locator("dialog").count(), 0);
      await page.waitForFunction((element: HTMLElement) => element === document.activeElement, await triggerLocator.elementHandle());
      assert.equal(await triggerLocator.evaluate((element: HTMLElement) => element === document.activeElement), true);
    }

    // Read-only render fixtures use the provider's existing assets and content, never database writes.
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(origin, { waitUntil: "networkidle" });
    const styles = await page.locator('link[rel=stylesheet]').evaluateAll((links: HTMLLinkElement[]) => links.map(link => link.href));
    const buttonStyles = {
      gold: await page.locator("#provider-hero button").getAttribute("class"),
      secondary: company.services.length ? await page.locator(".provider-service-card button").first().getAttribute("class") : "bg-card border border-line",
    };
    const htmlClass = await page.locator("html").getAttribute("class");
    const fixturePage = await context.newPage();
    fixturePage.on("pageerror", (error: Error) => failures.push(error.message));
    // Establish the local origin without loading Next's HMR runtime into render fixtures.
    await fixturePage.goto(`${origin}/manifest.webmanifest`, { waitUntil: "domcontentloaded" });
    const fixtureHtml = (profile: PublicCompanyPage) => {
      const markup = renderToStaticMarkup(createElement(ProviderShowcase, { page: profile, buttonStyles }));
      return `<!doctype html><html class="${htmlClass}"><head><meta name="viewport" content="width=device-width, initial-scale=1"><base href="${origin}/">${styles.map((href: string) => `<link rel="stylesheet" href="${href}">`).join("")}</head><body class="min-h-full flex flex-col bg-paper text-text">${markup}</body></html>`;
    };
    const photo = company.photos[0] ?? (company.services[0]?.imagePath ? { path: company.services[0].imagePath, title: company.services[0].name } : null);
    for (const count of [1, 2, 3, 6]) {
      if (!photo || !company.services.length) continue;
      const fixture = { ...company, photos: Array.from({ length: count }, () => photo), services: Array.from({ length: count }, (_, index) => ({ ...company.services[0], name: `${company.services[0].name}${index ? ` · ${index + 1}` : ""}` })) };
      for (const width of widths) {
        await fixturePage.setViewportSize({ width, height: width < 768 ? 800 : 1000 });
        await fixturePage.setContent(fixtureHtml(fixture), { waitUntil: "networkidle" });
        await fixturePage.evaluate(async () => { await Promise.all(Array.from(document.images, image => image.decode().catch(() => undefined))); });
        const layout = await fixturePage.evaluate(() => {
          const gallery = document.querySelector<HTMLElement>(".provider-gallery")!;
          const services = document.querySelector<HTMLElement>(".provider-service-grid")!;
          return { width: innerWidth, scroll: document.documentElement.scrollWidth, photoWidth: gallery.firstElementChild!.getBoundingClientRect().width, serviceWidth: services.firstElementChild!.getBoundingClientRect().width, galleryColumns: getComputedStyle(gallery).gridTemplateColumns, serviceColumns: getComputedStyle(services).gridTemplateColumns, snap: getComputedStyle(gallery).scrollSnapType };
        });
        if (layout.scroll > width) {
          await fixturePage.screenshot({ path: path.join(output, "qa-overflow.jpg"), fullPage: true });
          console.log(JSON.stringify({ layout, overflow: await fixturePage.evaluate(() => Array.from(document.querySelectorAll("body *")).map(element => ({ tag: element.tagName, className: element.className, right: element.getBoundingClientRect().right })).filter(element => element.right > innerWidth + 1).slice(0, 8)) }));
        }
        assert.ok(layout.scroll <= width, `fixture ${count} overflow at ${width}`);
        if (width === 1440 && count === 1) {
          assert.ok(layout.photoWidth >= 360 && layout.photoWidth <= 460);
          assert.ok(layout.serviceWidth >= 320 && layout.serviceWidth <= 420);
        }
        if (width < 768 && count > 1) assert.equal(layout.snap, "x mandatory");
        report.push({ scenario: `read-only fixture ${count}`, ...layout });
        if (width === 1440 || width === 390) {
          await fixturePage.screenshot({ path: path.join(output, `fixture-${count}-${width}-pagina.jpg`), fullPage: true });
          if (count === 1) await fixturePage.locator('section[aria-labelledby="trabalhos"]').screenshot({ path: path.join(output, `fixture-1-${width}-trabalhos.jpg`) });
        }
      }
    }
    const sparseScenarios = [
      { label: "sem-conteudo", profile: { ...company, coverPath: null, logoPath: null, photos: [], services: [], instagram: null, phone: null, facebook: null, website: null } },
      { label: "somente-whatsapp", profile: { ...company, photos: [], services: [], instagram: null, phone: null, facebook: null, website: null } },
      { label: "textos-longos", profile: { ...company, name: company.name.repeat(30), description: (company.description || company.name).repeat(40) } },
    ];
    for (const { label, profile } of sparseScenarios) {
      for (const width of widths) {
        await fixturePage.setViewportSize({ width, height: 1000 });
        await fixturePage.setContent(fixtureHtml(profile), { waitUntil: "networkidle" });
        const size = await fixturePage.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
        assert.ok(size.scroll <= width, `${label} overflow at ${width}`);
        if (label === "textos-longos") {
          await fixturePage.locator(".provider-description-details summary").click();
          const description = await fixturePage.locator(".provider-description-full").boundingBox();
          assert.ok(description.height <= 140);
        } else {
          assert.equal(await fixturePage.locator("#trabalhos, #servicos").count(), 0);
          assert.equal(await fixturePage.locator('.provider-contact-actions a').count(), 1);
        }
        report.push({ scenario: `read-only fixture ${label}`, ...size });
        if (width === 390 || width === 1440) await fixturePage.screenshot({ path: path.join(output, `fixture-${label}-${width}.jpg`), fullPage: true });
      }
    }
    assert.deepEqual(failures, []);
    await fs.writeFile(path.join(output, "responsividade.json"), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ checks: report.length, actualPhotos: company.photos.length, actualServices: company.services.length, errors: failures, screenshots: output }));
  } finally {
    await context.close();
    await browser.close();
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
