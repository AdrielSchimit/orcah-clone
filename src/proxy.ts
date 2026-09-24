import { NextRequest, NextResponse } from "next/server";
import {
  appOrigin,
  appUrl,
  companyPublicUrl,
  isApexAuthPath,
  sessionCookieIsShared,
  supportsCompanySubdomain,
  tenantSlugFromHost,
} from "@/lib/urls";
import { SESSION_COOKIE, readSessionToken } from "@/lib/session-token";

function pass(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-orcah-path", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") ?? "";
  const tenant = tenantSlugFromHost(host);
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let loggedIn = false;
  let slug = "";

  if (token && process.env.AUTH_SECRET) {
    try {
      const session = await readSessionToken(token);
      if (session) {
        loggedIn = true;
        slug = session.slug;
      }
    } catch {
      loggedIn = false;
    }
  }

  if (tenant) {
    if (isApexAuthPath(pathname)) {
      return NextResponse.redirect(`${appOrigin()}${pathname}${search}`);
    }

    if (pathname === "/" || pathname === "") {
      const url = request.nextUrl.clone();
      url.pathname = `/empresa/${tenant}`;
      return NextResponse.rewrite(url);
    }

    if (pathname === `/empresa/${tenant}` || pathname.startsWith(`/empresa/${tenant}/`)) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/painel") && !loggedIn) {
      return NextResponse.redirect(appUrl("/login"));
    }

    if (!pathname.startsWith("/painel")) {
      return NextResponse.redirect(`${appOrigin()}${pathname}${search}`);
    }

    return pass(request);
  }

  const store = pathname.match(/^\/empresa\/([^/]+)\/?$/);
  if (store && supportsCompanySubdomain(host)) {
    return NextResponse.redirect(companyPublicUrl(store[1]));
  }

  if (pathname === "/entrando") {
    if (!loggedIn) return NextResponse.redirect(new URL("/login", request.url));
    if (!slug) return NextResponse.redirect(new URL("/onboarding", request.url));
    return pass(request);
  }

  if (pathname.startsWith("/onboarding") && !loggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/painel")) {
    if (!loggedIn) return NextResponse.redirect(new URL("/login", request.url));
    if (slug && sessionCookieIsShared()) {
      return NextResponse.redirect(`${companyPublicUrl(slug)}${pathname}${search}`);
    }
    return pass(request);
  }

  return pass(request);
}

export const config = {
  matcher: [
    "/",
    "/empresa/:path*",
    "/painel/:path*",
    "/onboarding",
    "/entrando",
    "/login",
    "/cadastro",
    "/recuperar-senha",
    "/orcamento/:path*",
  ],
};
