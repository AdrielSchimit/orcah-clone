/**
 * Legacy images saved in /public/uploads on temporary application instances.
 * Those files are not durable on Vercel. Keep database references intact so a
 * provider can replace an image without losing its title/order or cover history.
 *
 * IMPORTANT: this is a prefix classification, not a network existence check.
 * A public Supabase URL can also break; use storage inventory for deeper audits.
 */
export function isLegacyLocalAsset(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith("/uploads/");
}

export function publicAssetOrNull(value: string | null | undefined): string | null {
  if (!value || isLegacyLocalAsset(value)) return null;
  return value;
}
