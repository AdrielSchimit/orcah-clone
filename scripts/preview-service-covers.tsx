import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { ramos } from "../prisma/data/ramos";
import { ServiceCoverPlaceholder } from "../src/components/service-cover-placeholder";
import { serviceCoverIcons } from "../src/lib/service-cover-themes";

const output = path.resolve(process.argv[2] || "artifacts/service-cover-catalog");
const escape = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");

async function main() {
  await mkdir(output, { recursive: true });
  const icons = Object.entries(serviceCoverIcons);
  for (let start = 0; start < icons.length; start += 48) {
    const cells = icons.slice(start, start + 48).map(([name, paths], i) => {
      const x = (i % 8) * 150;
      const y = Math.floor(i / 8) * 150;
      return `<g transform="translate(${x} ${y})"><rect width="150" height="150" fill="#f7f5ef" stroke="#e4e1da"/><svg x="25" y="8" width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="#59677f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths.map(d => `<path d="${d}"/>`).join("")}</svg><text x="75" y="130" text-anchor="middle" fill="#151f38" font-size="11" font-family="Arial">${escape(name)}</text></g>`;
    }).join("");
    const height = Math.ceil(Math.min(48, icons.length - start) / 8) * 150;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${height}"><rect width="1200" height="${height}" fill="#f7f5ef"/>${cells}</svg>`;
    await sharp(Buffer.from(svg)).png().toFile(path.join(output, `icons-${start / 48 + 1}.png`));
  }
  for (let start = 0; start < ramos.length; start += 12) {
    const cells = ramos.slice(start, start + 12).map((ramo, i) => {
      const html = renderToStaticMarkup(createElement(ServiceCoverPlaceholder, { category: ramo.slug }));
      const svg = html.match(/<svg[\s\S]*?<\/svg>/)![0];
      const contents = svg.slice(svg.indexOf(">") + 1, svg.lastIndexOf("</svg>"));
      const x = (i % 3) * 400;
      const y = Math.floor(i / 3) * 170;
      return `<g transform="translate(${x} ${y})"><text x="8" y="22" fill="#151f38" font-size="13" font-family="Arial">${escape(ramo.name)}</text><svg x="5" y="30" width="390" height="130" viewBox="0 0 1500 500" fill="none" stroke="#59677f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="1500" height="500" fill="#f7f5ef" stroke="none"/>${contents}</svg></g>`;
    }).join("");
    await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="680"><rect width="1200" height="680" fill="white"/>${cells}</svg>`)).png().toFile(path.join(output, `covers-${start / 12 + 1}.png`));
  }
  const cards = ramos.map(r => `<article><h2>${escape(r.name)}</h2>${renderToStaticMarkup(createElement(ServiceCoverPlaceholder, { category: r.slug }))}<small>${escape(r.slug)}</small></article>`).join("");
  await writeFile(path.join(output, "index.html"), `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Capas Orçah</title><style>body{margin:24px;font:14px Arial;background:#eceef2;color:#151f38}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:20px}article{background:white;padding:16px;border-radius:16px}h2{font-size:16px;margin:0 0 12px}small{display:block;margin-top:10px;color:#59677f}article>div{position:relative;aspect-ratio:3/1;width:100%;overflow:hidden;border-radius:12px}article>div>svg{position:absolute;inset:0;width:100%;height:100%}</style><h1>Capas Orçah · ${ramos.length} ramos</h1><main>${cards}</main></html>`);
  console.log(`${icons.length} ícones e ${ramos.length} capas: ${output}`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
