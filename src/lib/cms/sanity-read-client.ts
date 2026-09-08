import "server-only";

const SANITY_PROJECT_ID = "4bl3xvem";
const SANITY_DATASET = "production";
const SANITY_API_VERSION = "v2025-02-19";
const SANITY_READ_HOST = `${SANITY_PROJECT_ID}.apicdn.sanity.io`;
const SANITY_READ_ENABLE_ENV = "PRESIDENTIAL_SANITY_READ_CLIENT_ENABLED";
const SANITY_QUERY_URL_LIMIT = 11000;
const SANITY_FETCH_TIMEOUT_MS = 5000;

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
  fetchTimeoutMs: SANITY_FETCH_TIMEOUT_MS,
  publicRouteRenderingEnabled: false,
} as const;

type SanityJsonFetchFailure =
  | "http_error"
  | "timeout"
  | "aborted"
  | "network"
  | "invalid_json";

type SanityJsonFetchResult<T> = {
  readonly response: Response;
  readonly payload: { readonly result: T } | null;
  readonly failure: SanityJsonFetchFailure | null;
};

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

function createBoundedSanitySignal(callerSignal?: AbortSignal | null): {
  readonly signal: AbortSignal;
  readonly didTimeout: () => boolean;
  readonly cleanup: () => void;
} {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort(callerSignal?.reason);
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort(new DOMException("Sanity read timed out.", "TimeoutError"));
  }, SANITY_FETCH_TIMEOUT_MS);

  if (callerSignal?.aborted) {
    abortFromCaller();
  } else {
    callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      clearTimeout(timeout);
      callerSignal?.removeEventListener("abort", abortFromCaller);
    },
  };
}

function createSanityFailureResult<T>(
  status: number,
  statusText: string,
  failure: Exclude<SanityJsonFetchFailure, "http_error">,
): SanityJsonFetchResult<T> {
  return {
    response: new Response(null, { status, statusText }),
    payload: null,
    failure,
  };
}

function isSanityResultPayload<T>(value: unknown): value is { readonly result: T } {
  return Boolean(
    value &&
      typeof value === "object" &&
      Object.prototype.hasOwnProperty.call(value, "result"),
  );
}

export async function fetchSanityJsonWithTimeout<T>(
  input: URL,
  init: RequestInit = {},
): Promise<SanityJsonFetchResult<T>> {
  const boundedSignal = createBoundedSanitySignal(init.signal);

  try {
    let response: Response;

    try {
      let fetchImplementation = fetch;
      const smokeFixture = process.env.PRESIDENTIAL_CMS_RUNTIME_SMOKE_FIXTURE;
      if (smokeFixture === "approved") {
        const fixtureModule = await import("../../../scripts/mock-sanity-fetch-approved-cms.cjs");
        fetchImplementation = fixtureModule.mockedSanityFetch ?? fixtureModule.default?.mockedSanityFetch;
      } else if (smokeFixture === "failure") {
        const fixtureModule = await import("../../../scripts/mock-sanity-fetch-failure.cjs");
        fetchImplementation = fixtureModule.mockedSanityFetch ?? fixtureModule.default?.mockedSanityFetch;
      }
      response = await fetchImplementation(input, {
        ...init,
        signal: boundedSignal.signal,
      });
    } catch {
      if (boundedSignal.didTimeout()) {
        return createSanityFailureResult(504, "Sanity read timed out", "timeout");
      }

      if (boundedSignal.signal.aborted) {
        return createSanityFailureResult(499, "Sanity read aborted", "aborted");
      }

      return createSanityFailureResult(502, "Sanity read network failure", "network");
    }

    if (!response.ok) {
      return { response, payload: null, failure: "http_error" };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      if (boundedSignal.didTimeout()) {
        return createSanityFailureResult(504, "Sanity read timed out", "timeout");
      }

      if (boundedSignal.signal.aborted) {
        return createSanityFailureResult(499, "Sanity read aborted", "aborted");
      }

      return createSanityFailureResult(502, "Invalid Sanity JSON response", "invalid_json");
    }

    return isSanityResultPayload<T>(payload)
      ? { response, payload, failure: null }
      : createSanityFailureResult(502, "Invalid Sanity JSON response", "invalid_json");
  } finally {
    boundedSignal.cleanup();
  }
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

  const { payload, response } = await fetchSanityJsonWithTimeout<T>(
    buildSanityReadQueryUrl(query, params),
    {
      ...init,
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "force-cache",
    },
  );

  if (!response.ok || !payload) {
    return {
      ok: false,
      skipped: false,
      reason: "sanity_read_failed",
      status: response.status,
      statusText: response.statusText,
    };
  }

  return {
    ok: true,
    skipped: false,
    result: payload.result,
  };
}
