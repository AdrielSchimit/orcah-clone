import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

/**
 * Imagens da página comercial (logo, galeria, serviços) no Supabase Storage.
 * Upload só no servidor com a service role; o caminho é sempre montado a partir
 * da empresa da sessão, nunca do que o navegador mandar.
 */

export const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const DEFAULT_BUCKET = "company-assets";

const ALLOWED: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

export type ImageKind = "logo" | "gallery" | "service";

const MAX_SIDE: Record<ImageKind, number> = { logo: 512, gallery: 1600, service: 1200 };

export class UploadError extends Error {}

export type StorageConfig = { url: string; key: string; bucket: string };

export function storageConfig(env: Record<string, string | undefined> = process.env): StorageConfig | null {
  const url = env.SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return { url, key, bucket: env.SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_BUCKET };
}

export function validateImageFile(file: { name?: string; type: string; size: number }) {
  const extensions = ALLOWED[file.type];
  if (!extensions) return "Use foto JPG, PNG ou WEBP.";
  const ext = (file.name ?? "").split(".").pop()?.toLowerCase() ?? "";
  // nome sem extensão é comum no celular (blob da câmera); com extensão, tem que bater com o tipo
  if (ext && file.name?.includes(".") && !Object.values(ALLOWED).flat().includes(ext)) {
    return "Use foto JPG, PNG ou WEBP.";
  }
  if (file.size <= 0) return "Escolha uma foto.";
  if (file.size > IMAGE_MAX_BYTES) return "Foto muito grande (máximo 8 MB).";
  return null;
}

export function companyAssetPrefix(companyId: number) {
  return `companies/${companyId}/`;
}

export function buildAssetPath(companyId: number, kind: ImageKind, serviceId?: number) {
  if (!Number.isInteger(companyId) || companyId <= 0) throw new UploadError("Empresa inválida.");
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.webp`;
  if (kind === "service") {
    if (!Number.isInteger(serviceId) || !serviceId || serviceId <= 0) throw new UploadError("Serviço inválido.");
    return `${companyAssetPrefix(companyId)}services/${serviceId}/${name}`;
  }
  return `${companyAssetPrefix(companyId)}${kind}/${name}`;
}

export function isOwnedAssetPath(companyId: number, assetPath: string) {
  return (
    assetPath.startsWith(companyAssetPrefix(companyId)) &&
    !assetPath.includes("..") &&
    !assetPath.includes("//") &&
    /^[a-z0-9/_.-]+$/i.test(assetPath)
  );
}

export function publicUrlFor(assetPath: string, config: StorageConfig) {
  return `${config.url}/storage/v1/object/public/${config.bucket}/${assetPath}`;
}

/** Converte o valor salvo no banco (URL pública ou /uploads/...) de volta para o caminho no bucket. */
export function assetPathFromStored(stored: string, config: StorageConfig | null) {
  if (config) {
    const prefix = `${config.url}/storage/v1/object/public/${config.bucket}/`;
    if (stored.startsWith(prefix)) return stored.slice(prefix.length);
  }
  if (stored.startsWith("/uploads/")) return stored.slice("/uploads/".length);
  return null;
}

export async function processImage(input: Buffer, kind: ImageKind) {
  try {
    const side = MAX_SIDE[kind];
    return await sharp(input, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: side, height: side, fit: "inside", withoutEnlargement: true })
      .webp({ quality: kind === "logo" ? 90 : 80 })
      .toBuffer();
  } catch {
    throw new UploadError("Não consegui ler essa imagem. Tente outra foto.");
  }
}

type StorageDeps = {
  config?: StorageConfig | null;
  fetchImpl?: typeof fetch;
  production?: boolean;
};

async function ensureBucket(config: StorageConfig, fetchImpl: typeof fetch) {
  // bucket público para leitura; escrita só com a service role
  await fetchImpl(`${config.url}/storage/v1/bucket`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.key}`, apikey: config.key, "Content-Type": "application/json" },
    body: JSON.stringify({
      id: config.bucket,
      name: config.bucket,
      public: true,
      file_size_limit: IMAGE_MAX_BYTES,
      allowed_mime_types: Object.keys(ALLOWED),
    }),
  });
}

async function putObject(config: StorageConfig, assetPath: string, body: Buffer, fetchImpl: typeof fetch) {
  return fetchImpl(`${config.url}/storage/v1/object/${config.bucket}/${assetPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.key}`,
      apikey: config.key,
      "Content-Type": "image/webp",
      "Cache-Control": "31536000",
      "x-upsert": "false",
    },
    body: new Uint8Array(body),
  });
}

/** Envia a imagem e devolve o valor a salvar no banco (URL pública). */
export async function uploadCompanyImage(
  { companyId, kind, serviceId, file }: { companyId: number; kind: ImageKind; serviceId?: number; file: File },
  { config = storageConfig(), fetchImpl = fetch, production = process.env.NODE_ENV === "production" }: StorageDeps = {},
) {
  const invalid = validateImageFile(file);
  if (invalid) throw new UploadError(invalid);

  const assetPath = buildAssetPath(companyId, kind, serviceId);
  const image = await processImage(Buffer.from(await file.arrayBuffer()), kind);

  if (!config) {
    if (production) throw new UploadError("Envio de fotos ainda não está configurado. Fale com o suporte.");
    // só em desenvolvimento local, sem Supabase: mesmo comportamento que o projeto já tinha
    const dir = path.join(process.cwd(), "public", "uploads", path.dirname(assetPath));
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(process.cwd(), "public", "uploads", assetPath), image);
    return `/uploads/${assetPath}`;
  }

  let response = await putObject(config, assetPath, image, fetchImpl);
  if (response.status === 404 || response.status === 400) {
    const text = await response.text().catch(() => "");
    if (/bucket not found/i.test(text)) {
      await ensureBucket(config, fetchImpl);
      response = await putObject(config, assetPath, image, fetchImpl);
    }
  }
  if (!response.ok) {
    console.error("[storage] upload recusado:", response.status);
    throw new UploadError("Não foi possível salvar a foto agora. Tente de novo.");
  }
  return publicUrlFor(assetPath, config);
}

/** Apaga uma imagem da empresa. Recusa qualquer caminho fora da pasta dela. */
export async function removeCompanyImage(
  companyId: number,
  stored: string | null | undefined,
  { config = storageConfig(), fetchImpl = fetch }: StorageDeps = {},
) {
  if (!stored) return false;
  const assetPath = assetPathFromStored(stored, config);
  // arquivos antigos (antes do storage) ficavam em /uploads/empresa/{id}/
  const legacyOwned = Boolean(assetPath && stored.startsWith("/uploads/") && assetPath.startsWith(`empresa/${companyId}/`) && !assetPath.includes(".."));
  if (!assetPath || !(isOwnedAssetPath(companyId, assetPath) || legacyOwned)) return false;

  if (stored.startsWith("/uploads/")) {
    await unlink(path.join(process.cwd(), "public", "uploads", assetPath)).catch(() => undefined);
    return true;
  }
  if (!config) return false;
  const response = await fetchImpl(`${config.url}/storage/v1/object/${config.bucket}/${assetPath}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${config.key}`, apikey: config.key },
  });
  return response.ok;
}
