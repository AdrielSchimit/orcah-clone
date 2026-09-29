import { writeFileSync } from "node:fs";
import { exportarCatalogo } from "../src/lib/ramo-catalogo";

const destino = new URL("../docs/catalogo-ramos.json", import.meta.url);
writeFileSync(destino, `${JSON.stringify(exportarCatalogo(), null, 2)}\n`);
console.log(`Catálogo exportado: ${destino.pathname}`);
