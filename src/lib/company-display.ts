export function serviceAreaLabel(company: {
  servesRegion: boolean;
  city?: { name: string } | null;
  state: { name: string; uf: string };
}) {
  if (company.city) {
    const place = `${company.city.name}-${company.state.uf}`;
    return company.servesRegion
      ? `Presta serviços em ${place} e Região`
      : `Presta serviços em ${place}`;
  }

  return company.servesRegion
    ? `Presta serviços em ${company.state.name} e Região`
    : `Presta serviços em ${company.state.name}`;
}

export function ramoLabel(company: {
  customRamoName?: string | null;
  businessCategory?: { name: string } | null;
}) {
  return company.customRamoName || company.businessCategory?.name || "Ramo";
}

export function instagramUrl(value?: string | null) {
  if (!value) return "";
  const handle = value.trim().replace(/^@/, "");
  if (!handle) return "";
  if (handle.startsWith("http")) return handle;
  return `https://instagram.com/${handle}`;
}

export function websiteUrl(value?: string | null) {
  if (!value) return "";
  const raw = value.trim();
  if (!raw) return "";
  if (raw.startsWith("http")) return raw;
  return `https://${raw}`;
}
