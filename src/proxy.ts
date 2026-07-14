import { NextRequest, NextResponse } from "next/server";

import { ADULT_CONFIRMATION_COOKIE } from "@/app/age-gate-constants";
import { isGoogleAnalyticsEnabled } from "@/lib/analytics/google";
import { hasPrivateDraftRouteAccess } from "@/lib/cms/draft-route-access";

const canonicalHostname = "presidentialmoonrocks.com";
const nonCanonicalHostnames = new Set(["www.presidentialmoonrocks.com"]);
// Exact hashes for Next/Image's deterministic intrinsic and fill style attributes.
const nextImageStyleAttributeHashes = [
  "'sha256-zlqnbDt84zf1iSefLU/ImC54isoprH/MRiVZGskwexk='",
  "'sha256-ZDrxqUOB4m/L0JWL/+gS52g1CRH0l/qwMhjTw5Z/Fsc='",
] as const;

function buildContentSecurityPolicy(
  nonce: string,
  analyticsAllowed: boolean,
): string {
  const isDev = process.env.NODE_ENV === "development";
  const scriptSrc = [
    "script-src 'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    analyticsAllowed ? "https://www.googletagmanager.com" : "",
    isDev ? "'unsafe-eval'" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const connectSrc = [
    "connect-src 'self'",
    analyticsAllowed ? "https://www.google-analytics.com" : "",
    analyticsAllowed ? "https://analytics.google.com" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const imgSrc = [
    "img-src 'self'",
    analyticsAllowed ? "https://www.google-analytics.com" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const styleSrcAttr = [
    "style-src-attr 'unsafe-hashes'",
    ...nextImageStyleAttributeHashes,
  ].join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    scriptSrc,
    `style-src 'self' 'nonce-${nonce}'`,
    styleSrcAttr,
    connectSrc,
    "font-src 'self'",
    imgSrc,
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function buildCanonicalHostRedirect(request: NextRequest): NextResponse | null {
  const hostHeader = request.headers.get("host") ?? request.nextUrl.host;
  const hostname = hostHeader.split(":")[0]?.toLowerCase() ?? "";
  const forwardedProto = (
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(":", "")
  ).toLowerCase();
  const usesNonCanonicalHost = nonCanonicalHostnames.has(hostname);
  const usesHttpCanonicalHost =
    hostname === canonicalHostname && forwardedProto === "http";

  if (!usesNonCanonicalHost && !usesHttpCanonicalHost) {
    return null;
  }

  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.hostname = canonicalHostname;
  url.port = "";

  return NextResponse.redirect(url, 308);
}

export function proxy(request: NextRequest) {
  const canonicalRedirect = buildCanonicalHostRedirect(request);

  if (canonicalRedirect) {
    return canonicalRedirect;
  }

  const nonce = btoa(crypto.randomUUID());
  const adultConfirmed =
    request.cookies.get(ADULT_CONFIRMATION_COOKIE)?.value === "true";
  const csp = buildContentSecurityPolicy(
    nonce,
    adultConfirmed && isGoogleAnalyticsEnabled(),
  );
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  if (
    (request.nextUrl.pathname === "/drafts" ||
      request.nextUrl.pathname.startsWith("/drafts/")) &&
    !hasPrivateDraftRouteAccess(request.headers)
  ) {
    const response = new NextResponse("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
    response.headers.set("Content-Security-Policy", csp);
    return response;
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
