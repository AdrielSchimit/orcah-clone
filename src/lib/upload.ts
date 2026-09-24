import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 4 * 1024 * 1024;

export async function saveUpload(file: File, folder: string) {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Use foto JPG, PNG ou WEBP.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Foto até 4 MB.");
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const name = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buffer);
  return `/uploads/${folder}/${name}`;
}

export async function removeUpload(publicPath: string) {
  if (!publicPath.startsWith("/uploads/")) return;
  const full = path.join(process.cwd(), "public", publicPath);
  try {
    await unlink(full);
  } catch {
    // already gone
  }
}
