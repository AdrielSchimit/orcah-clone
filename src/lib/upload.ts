import { unlink } from "fs/promises";
import path from "path";

// fotos novas vão para o storage (src/lib/storage.ts); isto só limpa arquivos antigos em /uploads.
export async function removeUpload(publicPath: string) {
  if (!publicPath.startsWith("/uploads/")) return;
  const full = path.join(process.cwd(), "public", publicPath);
  try {
    await unlink(full);
  } catch {
    // already gone
  }
}
