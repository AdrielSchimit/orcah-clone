/** @ da conta, nunca o nome ou o endereço da página. */
export function instagramHandle(value: unknown) {
  let raw = String(value ?? "").trim();
  raw = raw.replace(/^https?:\/\/(www\.|m\.)?instagram\.com\//i, "");
  raw = raw.replace(/^@/, "");
  raw = raw.split(/[/?#]/)[0] ?? "";
  raw = raw.replace(/\.+$/, "");
  if (!/^[A-Za-z0-9._]{1,30}$/.test(raw)) return "";
  if (raw.replace(/\./g, "") === "") return "";
  return raw;
}

export function instagramUrl(value: unknown) {
  const handle = instagramHandle(value);
  return handle ? `https://instagram.com/${handle}` : "";
}
