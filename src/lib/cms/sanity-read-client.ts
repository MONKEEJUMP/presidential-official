import "server-only";

const SANITY_PROJECT_ID = "4bl3xvem";
const SANITY_DATASET = "production";
const SANITY_API_VERSION = "v2025-02-19";
const SANITY_READ_HOST = `${SANITY_PROJECT_ID}.apicdn.sanity.io`;
const SANITY_READ_ENABLE_ENV = "PRESIDENTIAL_SANITY_READ_CLIENT_ENABLED";
const SANITY_QUERY_URL_LIMIT = 11000;

type SanityReadEnv = Record<string, string | undefined>;
type SanityQueryParam = string | number | boolean | null;
type SanityQueryParams = Readonly<Record<string, SanityQueryParam>>;

type SanityReadDisabledResult = {
  readonly ok: false;
  readonly skipped: true;
  readonly reason: "sanity_read_disabled";
};

type SanityReadSuccessResult<T> = {
  readonly ok: true;
  readonly skipped: false;
  readonly result: T;
};

type SanityReadFailureResult = {
  readonly ok: false;
  readonly skipped: false;
  readonly reason: "sanity_read_failed";
  readonly status: number;
  readonly statusText: string;
};

export type SanityReadResult<T> =
  | SanityReadDisabledResult
  | SanityReadSuccessResult<T>
  | SanityReadFailureResult;

export const SANITY_READ_CLIENT_CONFIG = {
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  host: SANITY_READ_HOST,
  endpoint: `https://${SANITY_READ_HOST}/${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`,
  defaultPerspective: "published",
  enabledEnvironmentVariable: SANITY_READ_ENABLE_ENV,
  publicRouteRenderingEnabled: false,
} as const;

function getRuntimeEnv(): SanityReadEnv {
  return typeof process === "undefined" ? {} : process.env;
}

export function isSanityReadClientEnabled(env: SanityReadEnv = getRuntimeEnv()): boolean {
  return env[SANITY_READ_ENABLE_ENV] === "true";
}

function assertPublishedReadQuery(query: string): void {
  if (!query.trim()) {
    throw new Error("Sanity read query cannot be empty.");
  }

  if (/drafts\.|path\(\s*["']drafts\.\*\*["']\s*\)/i.test(query)) {
    throw new Error("Sanity read query cannot request draft documents.");
  }
}

export function buildSanityReadQueryUrl(
  query: string,
  params: SanityQueryParams = {},
): URL {
  assertPublishedReadQuery(query);

  const url = new URL(SANITY_READ_CLIENT_CONFIG.endpoint);
  url.searchParams.set("query", query);
  url.searchParams.set("perspective", SANITY_READ_CLIENT_CONFIG.defaultPerspective);
  url.searchParams.set("returnQuery", "false");

  for (const [key, value] of Object.entries(params)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      throw new Error(`Invalid Sanity query parameter name: ${key}`);
    }

    url.searchParams.set(`$${key}`, JSON.stringify(value));
  }

  if (url.toString().length > SANITY_QUERY_URL_LIMIT) {
    throw new Error("Sanity read query URL is too long for the GET query endpoint.");
  }

  return url;
}

export async function readPublishedSanity<T>(
  query: string,
  params: SanityQueryParams = {},
  init: Pick<RequestInit, "signal" | "next"> = {},
  env: SanityReadEnv = getRuntimeEnv(),
): Promise<SanityReadResult<T>> {
  if (!isSanityReadClientEnabled(env)) {
    return {
      ok: false,
      skipped: true,
      reason: "sanity_read_disabled",
    };
  }

  const response = await fetch(buildSanityReadQueryUrl(query, params), {
    ...init,
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      ok: false,
      skipped: false,
      reason: "sanity_read_failed",
      status: response.status,
      statusText: response.statusText,
    };
  }

  const payload = (await response.json()) as { result: T };

  return {
    ok: true,
    skipped: false,
    result: payload.result,
  };
}
