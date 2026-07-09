import "server-only";

import {
  SITE_PAGE_MODULE_PROJECTION,
  type SanityHomepageRecord,
} from "./homepage";

const SANITY_PROJECT_ID = "4bl3xvem";
const SANITY_DATASET = "production";
const SANITY_API_VERSION = "v2025-02-19";
const SANITY_DRAFT_READ_TOKEN_ENV = "SANITY_AUTH_TOKEN";
const SANITY_DRAFT_READ_ENABLE_ENV = "PRESIDENTIAL_SANITY_DRAFT_READ_ENABLED";
const SANITY_QUERY_URL_LIMIT = 14000;

type DraftReadResult =
  | {
      readonly ok: false;
      readonly skipped: true;
      readonly reason: "draft_read_disabled" | "missing_draft_read_token";
    }
  | {
      readonly ok: true;
      readonly skipped: false;
      readonly result: SanityHomepageRecord | null;
    }
  | {
      readonly ok: false;
      readonly skipped: false;
      readonly reason: "draft_read_failed";
      readonly status: number;
      readonly statusText: string;
    };

const DRAFT_HOMEPAGE_QUERY = `*[_type == "sitePage" && _id == "drafts.sitePage.home"][0]{
  _id,
  _type,
  title,
  "slug": slug.current,
  routePhase,
  summary,
  modules[]{
${SITE_PAGE_MODULE_PROJECTION}
  }
}`;

function isDraftReadEnabled(): boolean {
  return process.env[SANITY_DRAFT_READ_ENABLE_ENV] === "true";
}

function getDraftReadToken(): string {
  return process.env[SANITY_DRAFT_READ_TOKEN_ENV]?.trim() || "";
}

function buildDraftReadQueryUrl(query: string): URL {
  if (!query.includes('"drafts.sitePage.home"')) {
    throw new Error("Draft homepage reads must target drafts.sitePage.home.");
  }

  const url = new URL(
    `https://${SANITY_PROJECT_ID}.api.sanity.io/${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`,
  );
  url.searchParams.set("query", query);
  url.searchParams.set("perspective", "raw");
  url.searchParams.set("returnQuery", "false");

  if (url.toString().length > SANITY_QUERY_URL_LIMIT) {
    throw new Error("Sanity draft homepage query URL is too long.");
  }

  return url;
}

export async function readDraftHomepage(
  init: Pick<RequestInit, "signal" | "next"> = {},
): Promise<DraftReadResult> {
  if (!isDraftReadEnabled()) {
    return {
      ok: false,
      skipped: true,
      reason: "draft_read_disabled",
    };
  }

  const token = getDraftReadToken();
  if (!token) {
    return {
      ok: false,
      skipped: true,
      reason: "missing_draft_read_token",
    };
  }

  const response = await fetch(buildDraftReadQueryUrl(DRAFT_HOMEPAGE_QUERY), {
    ...init,
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      ok: false,
      skipped: false,
      reason: "draft_read_failed",
      status: response.status,
      statusText: response.statusText,
    };
  }

  const payload = (await response.json()) as { result: SanityHomepageRecord | null };

  return {
    ok: true,
    skipped: false,
    result: payload.result,
  };
}
