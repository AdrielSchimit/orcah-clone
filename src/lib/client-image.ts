"use client";

/**
 * Reduz a foto no próprio celular antes de enviar (foto de câmera tem 3–8 MB e
 * a Vercel corta requisições acima de ~4,5 MB). Se o navegador não conseguir, manda a original.
 */
export async function shrinkImageForUpload(file: File, maxSide = 2000, quality = 0.85): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  if (file.size < 900 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    const base = file.name.replace(/\.[^.]+$/, "") || "foto";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export async function uploadImage(url: string, file: File, extra?: Record<string, string>) {
  const body = new FormData();
  body.set("file", await shrinkImageForUpload(file));
  for (const [key, value] of Object.entries(extra ?? {})) body.set(key, value);
  const response = await fetch(url, { method: "POST", body });
  if (response.status === 413) return { ok: false as const, error: "Foto muito grande. Tente outra." };
  const data = (await response.json().catch(() => ({}))) as { error?: string; [key: string]: unknown };
  if (!response.ok) return { ok: false as const, error: data.error ?? "Não foi possível enviar a foto." };
  return { ok: true as const, data };
}
