const RESERVED_COMPANY_SLUGS = new Set([
  "www",
  "app",
  "api",
  "mail",
  "ftp",
  "cdn",
  "static",
  "painel",
  "admin",
  "login",
  "cadastro",
  "onboarding",
  "orcamento",
  "empresa",
  "orcah",
  "staging",
  "dev",
]);

export function isReservedCompanySlug(slug: string) {
  return RESERVED_COMPANY_SLUGS.has(slug.trim().toLowerCase());
}

export function appOrigin() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function appUrl(path = "/") {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${appOrigin()}${suffix}`;
}

export function isApexAuthPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/cadastro" ||
    pathname === "/onboarding" ||
    pathname === "/entrando" ||
    pathname === "/recuperar-senha"
  );
}

export function appRootHost() {
  return new URL(appOrigin()).hostname.replace(/^www\./, "").toLowerCase();
}

export function sessionCookieIsShared() {
  const host = appRootHost();
  return (
    process.env.NODE_ENV === "production" &&
    Boolean(host) &&
    host !== "localhost" &&
    !host.endsWith(".localhost")
  );
}

export function hostName(hostHeader: string) {
  return hostHeader.split(":")[0].trim().toLowerCase();
}

export function supportsCompanySubdomain(hostHeader?: string) {
  const host = hostName(hostHeader ?? new URL(appOrigin()).host);
  return !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
}

export function tenantSlugFromHost(hostHeader: string) {
  const host = hostName(hostHeader);
  const root = appRootHost();
  if (!host || host === root || host === `www.${root}`) return null;
  if (!host.endsWith(`.${root}`)) return null;
  const slug = host.slice(0, -(root.length + 1));
  if (!slug || slug.includes(".") || isReservedCompanySlug(slug)) return null;
  return slug;
}

export function companyPublicUrl(slug: string) {
  const origin = new URL(appOrigin());
  const root = origin.hostname.replace(/^www\./, "");
  const port = origin.port ? `:${origin.port}` : "";
  if (!supportsCompanySubdomain(origin.host)) {
    return `${origin.protocol}//${origin.host}/empresa/${slug}`;
  }
  return `${origin.protocol}//${slug}.${root}${port}`;
}

export function budgetPublicUrl(token: string) {
  return `${appOrigin()}/orcamento/${token}`;
}
