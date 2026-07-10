import "server-only";

import { timingSafeEqual } from "node:crypto";

import { headers } from "next/headers";

const PRIVATE_DRAFTS_ROUTE_ENABLE_ENV = "PRESIDENTIAL_PRIVATE_DRAFTS_ROUTE_ENABLED";
const PRIVATE_DRAFTS_ACCESS_TOKEN_ENV = "PRESIDENTIAL_PRIVATE_DRAFTS_ACCESS_TOKEN";

type DraftRouteAccessEnv = Record<string, string | undefined>;

function readBearerToken(authorizationHeader: string | null): string {
  const match = authorizationHeader?.match(/^Bearer ([^\s,]+)$/i);
  return match?.[1] || "";
}

function tokensMatch(providedToken: string, expectedToken: string): boolean {
  const provided = Buffer.from(providedToken);
  const expected = Buffer.from(expectedToken);

  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export function hasPrivateDraftRouteAccess(
  requestHeaders: Pick<Headers, "get">,
  env: DraftRouteAccessEnv = process.env,
): boolean {
  if (env[PRIVATE_DRAFTS_ROUTE_ENABLE_ENV] !== "true") {
    return false;
  }

  const expectedToken = env[PRIVATE_DRAFTS_ACCESS_TOKEN_ENV]?.trim() || "";
  const providedToken = readBearerToken(requestHeaders.get("authorization"));

  return Boolean(
    expectedToken &&
      providedToken &&
      tokensMatch(providedToken, expectedToken),
  );
}

export async function hasAuthenticatedPrivateDraftRouteAccess(): Promise<boolean> {
  return hasPrivateDraftRouteAccess(await headers());
}
