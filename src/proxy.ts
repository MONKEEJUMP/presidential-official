import { NextRequest, NextResponse } from "next/server";

const canonicalHostname = "presidentialmoonrocks.com";
const nonCanonicalHostnames = new Set(["www.presidentialmoonrocks.com"]);
const gaMeasurementIdPattern = /^G-[A-Z0-9]{6,}$/;

function isGoogleAnalyticsEnabled(): boolean {
  return (
    process.env.PRESIDENTIAL_ANALYTICS_ENABLED === "true" &&
    gaMeasurementIdPattern.test(
      process.env.NEXT_PUBLIC_PRESIDENTIAL_GA_MEASUREMENT_ID ?? "",
    )
  );
}

function buildContentSecurityPolicy(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  const analyticsEnabled = isGoogleAnalyticsEnabled();
  const scriptSrc = [
    "script-src 'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    analyticsEnabled ? "https://www.googletagmanager.com" : "",
    isDev ? "'unsafe-eval'" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const connectSrc = [
    "connect-src 'self'",
    analyticsEnabled ? "https://www.google-analytics.com" : "",
    analyticsEnabled ? "https://analytics.google.com" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const imgSrc = [
    "img-src 'self'",
    analyticsEnabled ? "https://www.google-analytics.com" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    scriptSrc,
    `style-src 'self' 'nonce-${nonce}'`,
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
  const csp = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

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
