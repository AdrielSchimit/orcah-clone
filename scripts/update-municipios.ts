import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { normalizeMunicipioSearch, type Municipio } from "../src/lib/municipios";

async function main() {
  const target = resolve("public/data/municipios-br.json");
  const temporary = `${target}.${process.pid}.tmp`;
  try {
    console.log("✓ Consultando municípios do IBGE...");
    const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios", { signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`IBGE respondeu HTTP ${response.status}`);
    const raw = await response.json();
    if (!Array.isArray(raw) || raw.length < 5000) throw new Error("Resposta incompleta do IBGE.");
    const items: Municipio[] = raw.map(item => {
      const ibge = String(item.id);
      const nome = item.nome;
      const uf = item.microrregiao?.mesorregiao?.UF?.sigla ?? item["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla;
      if (!/^\d{7}$/.test(ibge) || typeof nome !== "string" || !nome.trim() || !/^[A-Z]{2}$/.test(uf ?? "")) throw new Error(`Município inválido: ${ibge}`);
      return { ibge, nome, uf, busca: normalizeMunicipioSearch(`${nome} ${uf}`) };
    });
    if (new Set(items.map(item => item.ibge)).size !== items.length) throw new Error("IDs duplicados na resposta do IBGE.");
    items.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR") || a.uf.localeCompare(b.uf));
    console.log(`✓ ${items.length} municípios encontrados`);
    console.log("✓ Dados normalizados");
    await mkdir(dirname(target), { recursive: true });
    await writeFile(temporary, JSON.stringify(items) + "\n", "utf8");
    await rename(temporary, target);
    console.log("✓ municipios-br.json atualizado");
  } catch (error) {
    await rm(temporary, { force: true });
    console.error("Falha ao atualizar municípios; versão anterior preservada:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
void main();
