import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
  normalizeServiceInput,
  publicServiceOrder,
  reorderCompanyServices,
  saveServiceByName,
  updateCompanyService,
  type ServiceDb,
} from "../src/lib/services";
import { table, withTransaction } from "./helpers/fake-db";

const EMPRESA_A = 1;
const EMPRESA_B = 2;

let service: ReturnType<typeof table>;
let db: ServiceDb;

beforeEach(() => {
  service = table({ description: null, category: null, imagePath: null, featured: false, showPrice: false, active: true, sortOrder: 0, unit: "un" });
  db = withTransaction({ service }) as unknown as ServiceDb;
});

describe("serviços", () => {
  it("cria com os campos da página e preço escondido por padrão", async () => {
    const result = await saveServiceByName(db, EMPRESA_A, {
      name: "  Pintura   residencial ",
      category: "Pintura",
      defaultPrice: "35,50",
      unit: "m²",
      featured: true,
    });
    assert.ok("service" in result);
    const row = service.rows[0];
    assert.equal(row.name, "Pintura residencial");
    assert.equal(row.companyId, EMPRESA_A);
    assert.equal(row.defaultPrice, "35.50");
    assert.equal(row.showPrice, false);
    assert.equal(row.featured, true);
    assert.equal(row.sortOrder, 0);
  });

  it("não duplica serviço com o mesmo nome (salvar do orçamento só atualiza)", async () => {
    await saveServiceByName(db, EMPRESA_A, { name: "Textura", category: "Pintura", featured: true });
    await saveServiceByName(db, EMPRESA_A, { name: "Textura", unit: "m²", defaultPrice: 40 });
    assert.equal(service.rows.length, 1);
    // o que o orçamento não mandou continua como estava
    assert.equal(service.rows[0].category, "Pintura");
    assert.equal(service.rows[0].featured, true);
    assert.equal(service.rows[0].unit, "m²");
  });

  it("recusa nome curto e preço negativo", () => {
    assert.deepEqual(normalizeServiceInput({ name: "x" }, { requireName: true }), { error: "Informe o nome do serviço." });
    assert.ok("error" in normalizeServiceInput({ defaultPrice: -5 }));
  });

  it("edita e desativa só o serviço da própria empresa", async () => {
    const created = await saveServiceByName(db, EMPRESA_A, { name: "Pintura comercial" });
    assert.ok("service" in created);
    const id = created.service.id as number;

    const edited = await updateCompanyService(db, EMPRESA_A, id, { description: "Lojas e escritórios", showPrice: true });
    assert.ok("service" in edited);
    assert.equal(service.rows[0].description, "Lojas e escritórios");
    assert.equal(service.rows[0].showPrice, true);

    const off = await updateCompanyService(db, EMPRESA_A, id, { active: false });
    assert.ok("service" in off);
    assert.equal(service.rows[0].active, false);
  });

  it("empresa A não edita serviço da empresa B", async () => {
    const other = await saveServiceByName(db, EMPRESA_B, { name: "Serviço da B" });
    assert.ok("service" in other);
    const result = await updateCompanyService(db, EMPRESA_A, other.service.id as number, { name: "Invadido" });
    assert.deepEqual(result, { notFound: true });
    assert.equal(service.rows[0].name, "Serviço da B");
  });

  it("não deixa renomear para um nome que já existe", async () => {
    await saveServiceByName(db, EMPRESA_A, { name: "Textura" });
    const second = await saveServiceByName(db, EMPRESA_A, { name: "Grafiato" });
    assert.ok("service" in second);
    const result = await updateCompanyService(db, EMPRESA_A, second.service.id as number, { name: "Textura" });
    assert.deepEqual(result, { error: "Já existe um serviço com esse nome." });
  });

  it("ordena e mostra destaque primeiro", async () => {
    const ids: number[] = [];
    for (const name of ["Pintura residencial", "Pintura comercial", "Textura"]) {
      const result = await saveServiceByName(db, EMPRESA_A, { name });
      assert.ok("service" in result);
      ids.push(result.service.id as number);
    }
    const reordered = await reorderCompanyServices(db, EMPRESA_A, [ids[2], ids[0], ids[1]]);
    assert.deepEqual(reordered, { ok: true });
    await updateCompanyService(db, EMPRESA_A, ids[1], { featured: true });

    const listed = await service.findMany({ where: { companyId: EMPRESA_A }, orderBy: publicServiceOrder });
    assert.deepEqual(
      listed.map((row) => row.name),
      ["Pintura comercial", "Textura", "Pintura residencial"],
    );
  });

  it("reordenar com serviço de outra empresa é recusado e não mexe em nada", async () => {
    const mine = await saveServiceByName(db, EMPRESA_A, { name: "Meu" });
    const theirs = await saveServiceByName(db, EMPRESA_B, { name: "Deles" });
    assert.ok("service" in mine && "service" in theirs);
    const result = await reorderCompanyServices(db, EMPRESA_A, [theirs.service.id, mine.service.id]);
    assert.deepEqual(result, { error: "Serviço não encontrado." });
    assert.equal(service.rows.find((row) => row.name === "Deles")?.sortOrder, 0);
    assert.deepEqual(await reorderCompanyServices(db, EMPRESA_A, "nada"), { error: "Ordem inválida." });
    assert.deepEqual(await reorderCompanyServices(db, EMPRESA_A, [mine.service.id, mine.service.id]), { error: "Ordem inválida." });
  });
});
