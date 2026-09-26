import assert from "node:assert/strict";
import { describe, it } from "node:test";
import sharp from "sharp";
import {
  buildAssetPath,
  IMAGE_MAX_BYTES,
  isOwnedAssetPath,
  processImage,
  removeCompanyImage,
  storageConfig,
  UploadError,
  uploadCompanyImage,
  validateImageFile,
} from "../src/lib/storage";

const config = { url: "https://proj.supabase.co", key: "service-role-de-teste", bucket: "company-assets" };

async function pngFile(name = "foto.png") {
  const buffer = await sharp({ create: { width: 40, height: 30, channels: 3, background: "#ffb020" } }).png().toBuffer();
  return new File([new Uint8Array(buffer)], name, { type: "image/png" });
}

function fakeFetch() {
  const calls: { url: string; method: string; headers: Record<string, string> }[] = [];
  const impl = (async (url: string, init?: RequestInit) => {
    calls.push({ url, method: String(init?.method), headers: init?.headers as Record<string, string> });
    return new Response("{}", { status: 200 });
  }) as unknown as typeof fetch;
  return { calls, impl };
}

describe("validação de imagem", () => {
  it("aceita JPG, PNG e WEBP", () => {
    assert.equal(validateImageFile({ name: "a.jpg", type: "image/jpeg", size: 1000 }), null);
    assert.equal(validateImageFile({ name: "a.png", type: "image/png", size: 1000 }), null);
    assert.equal(validateImageFile({ name: "a.webp", type: "image/webp", size: 1000 }), null);
    assert.equal(validateImageFile({ name: "blob", type: "image/jpeg", size: 1000 }), null);
  });

  it("rejeita formato inválido", () => {
    assert.equal(validateImageFile({ name: "a.gif", type: "image/gif", size: 1000 }), "Use foto JPG, PNG ou WEBP.");
    assert.equal(validateImageFile({ name: "virus.exe", type: "image/png", size: 1000 }), "Use foto JPG, PNG ou WEBP.");
    assert.equal(validateImageFile({ name: "a.svg", type: "image/svg+xml", size: 1000 }), "Use foto JPG, PNG ou WEBP.");
  });

  it("rejeita arquivo enorme", () => {
    assert.equal(validateImageFile({ name: "a.jpg", type: "image/jpeg", size: IMAGE_MAX_BYTES + 1 }), "Foto muito grande (máximo 8 MB).");
  });

  it("rejeita arquivo que diz ser imagem mas não é", async () => {
    await assert.rejects(processImage(Buffer.from("isto não é uma imagem"), "gallery"), UploadError);
  });

  it("reduz e converte para WEBP", async () => {
    const big = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#000" } }).jpeg().toBuffer();
    const out = await processImage(big, "gallery");
    const meta = await sharp(out).metadata();
    assert.equal(meta.format, "webp");
    assert.equal(meta.width, 1600);
  });
});

describe("dono do arquivo", () => {
  it("o caminho sai sempre da pasta da empresa da sessão", () => {
    assert.match(buildAssetPath(7, "logo"), /^companies\/7\/logo\/[\w-]+\.webp$/);
    assert.match(buildAssetPath(7, "gallery"), /^companies\/7\/gallery\//);
    assert.match(buildAssetPath(7, "service", 3), /^companies\/7\/services\/3\//);
    assert.throws(() => buildAssetPath(0, "logo"), UploadError);
    assert.throws(() => buildAssetPath(7, "service"), UploadError);
  });

  it("não reconhece como seu o caminho de outra empresa", () => {
    assert.equal(isOwnedAssetPath(7, "companies/7/gallery/a.webp"), true);
    assert.equal(isOwnedAssetPath(7, "companies/8/gallery/a.webp"), false);
    assert.equal(isOwnedAssetPath(7, "companies/7/../8/gallery/a.webp"), false);
    assert.equal(isOwnedAssetPath(7, "companies/70/gallery/a.webp"), false);
  });

  it("apagar arquivo de outra empresa é recusado sem chamar o storage", async () => {
    const { calls, impl } = fakeFetch();
    const stored = `${config.url}/storage/v1/object/public/company-assets/companies/8/logo/x.webp`;
    assert.equal(await removeCompanyImage(7, stored, { config, fetchImpl: impl }), false);
    assert.equal(calls.length, 0);

    const mine = `${config.url}/storage/v1/object/public/company-assets/companies/7/logo/x.webp`;
    assert.equal(await removeCompanyImage(7, mine, { config, fetchImpl: impl }), true);
    assert.equal(calls[0].method, "DELETE");
    assert.equal(calls[0].url, `${config.url}/storage/v1/object/company-assets/companies/7/logo/x.webp`);
  });
});

describe("envio para o Supabase Storage", () => {
  it("envia para a pasta da empresa com a service role só no servidor e devolve a URL pública", async () => {
    const { calls, impl } = fakeFetch();
    const url = await uploadCompanyImage({ companyId: 7, kind: "gallery", file: await pngFile() }, { config, fetchImpl: impl, production: true });
    assert.match(url, /^https:\/\/proj\.supabase\.co\/storage\/v1\/object\/public\/company-assets\/companies\/7\/gallery\/.+\.webp$/);
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\/storage\/v1\/object\/company-assets\/companies\/7\/gallery\//);
    assert.equal(calls[0].headers.Authorization, `Bearer ${config.key}`);
    assert.ok(!url.includes(config.key), "a chave nunca vai para a URL");
  });

  it("em produção sem storage configurado não salva no disco", async () => {
    const { calls, impl } = fakeFetch();
    await assert.rejects(
      uploadCompanyImage({ companyId: 7, kind: "logo", file: await pngFile() }, { config: null, fetchImpl: impl, production: true }),
      /não está configurado/,
    );
    assert.equal(calls.length, 0);
  });

  it("formato inválido não chega a ser enviado", async () => {
    const { calls, impl } = fakeFetch();
    const gif = new File([new Uint8Array([71, 73, 70])], "a.gif", { type: "image/gif" });
    await assert.rejects(uploadCompanyImage({ companyId: 7, kind: "gallery", file: gif }, { config, fetchImpl: impl }), UploadError);
    assert.equal(calls.length, 0);
  });

  it("lê a configuração só das envs do servidor", () => {
    assert.equal(storageConfig({}), null);
    assert.deepEqual(storageConfig({ SUPABASE_URL: "https://proj.supabase.co/", SUPABASE_SERVICE_ROLE_KEY: "k" }), {
      url: "https://proj.supabase.co",
      key: "k",
      bucket: "company-assets",
    });
  });
});
