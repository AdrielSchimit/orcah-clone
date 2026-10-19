/**
 * Older images were saved in /public/uploads on transient Vercel instances.
 * Keep old database records intact so the provider can reupload a replacement.
 */
export function isLegacyLocalAsset(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith("/uploads/");
}

/**
 * Local development can legitimately serve /public/uploads. A deployed,
 * immutable production build cannot rely on runtime writes to that folder.
 */
export function isUnavailableLegacyAsset(value: string | null | undefined, production = process.env.NODE_ENV === "production") {
  return production && isLegacyLocalAsset(value);
}

export function publicAssetOrNull(value: string | null | undefined, production = process.env.NODE_ENV === "production"): string | null {
  if (!value || isUnavailableLegacyAsset(value, production)) return null;
  return value;
}
