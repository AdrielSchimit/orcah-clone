import assert from "node:assert/strict";
import { it } from "node:test";
import { normalizeMunicipioSearch, searchMunicipios } from "../src/lib/municipios";
import { readMunicipios, resolveMunicipio, resolveSavedMunicipio } from "../src/lib/municipios-server";
import { mkdtemp, mkdir, writeFile, readFile, rm, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

it("base completa, IDs únicos, normalização e ordem", async () => {
  const items = await readMunicipios();
  assert.ok(items.length >= 5500);
  assert.equal(new Set(items.map(city => city.ibge)).size, items.length);
  for (const city of items) {
    assert.match(city.ibge, /^\d{7}$/);
    assert.deepEqual(Object.keys(city), ["ibge", "nome", "uf", "busca"]);
    assert.equal(city.busca, normalizeMunicipioSearch(`${city.nome} ${city.uf}`));
  }
  assert.deepEqual(items, [...items].sort((a,b) => a.nome.localeCompare(b.nome,"pt-BR") || a.uf.localeCompare(b.uf)));
});
it("busca local com caixa, acento, espaços, prefixos e UF", async () => {
  const items = await readMunicipios();
  for (const query of ["maravil", "MARAVIL", "maravilha sc"]) assert.ok(searchMunicipios(items, query).some(city => city.nome === "Maravilha" && city.uf === "SC"));
  for (const query of ["sao jose", "São José", "  SÃO   JOSÉ, SC  "]) assert.ok(searchMunicipios(items, query).some(city => city.nome === "São José" && city.uf === "SC"));
  for (const query of ["porto ale", "porto alegre rs"]) assert.ok(searchMunicipios(items, query).some(city => city.nome === "Porto Alegre" && city.uf === "RS"));
  assert.equal(searchMunicipios(items,"a").length, 0);
  assert.equal(searchMunicipios(items,"mar").length, 8);
  const sample = [items.find(city=>city.nome==="Amarante")!, items.find(city=>city.nome==="Maravilha")!];
  assert.equal(searchMunicipios(sample,"mar")[0].nome,"Maravilha");
});
it("servidor rejeita IDs arbitrários e recupera cidade salva ou legada", async () => {
  const items = await readMunicipios();
  const city = items.find(city => city.nome === "Maravilha" && city.uf === "SC")!;
  assert.equal(resolveMunicipio(items,"inventada"),null);
  assert.equal(resolveMunicipio(items,null),null);
  assert.deepEqual(resolveSavedMunicipio(items,{ibgeCode:city.ibge,name:city.nome},city.uf),{ibge:city.ibge,nome:city.nome,uf:city.uf});
  assert.deepEqual(resolveSavedMunicipio(items,{ibgeCode:null,name:city.nome},city.uf),{ibge:city.ibge,nome:city.nome,uf:city.uf});
});

it("falha de sincronização preserva exatamente o JSON anterior", async () => {
  const directory = await mkdtemp(join(tmpdir(), "orcah-sync-test-"));
  const dataDirectory = join(directory, "public", "data");
  const target = join(dataDirectory, "municipios-br.json");
  await mkdir(dataDirectory, { recursive: true });
  const previous = '[{"versao":"anterior"}]\n';
  await writeFile(target, previous);
  try {
    const script = pathToFileURL(resolve("scripts/update-municipios.ts")).href;
    const loader = pathToFileURL(require.resolve("tsx/esm")).href;
    const result = spawnSync(process.execPath, ["--import", loader, "--input-type=module", "-e", `globalThis.fetch = async () => { throw new Error('IBGE indisponível no teste'); }; await import(${JSON.stringify(script)});`], { cwd: directory, encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /versão anterior preservada/);
    assert.equal(await readFile(target, "utf8"), previous);
  } finally {
    await rm(target);
    await rmdir(dataDirectory);
    await rmdir(join(directory, "public"));
    await rmdir(directory);
  }
});
