import "server-only";

import { SITE_PAGE_MODULE_PROJECTION } from "./homepage";
import type { SanitySitePageRecord } from "./site-page";

const SANITY_PROJECT_ID = "4bl3xvem";
const SANITY_DATASET = "production";
const SANITY_API_VERSION = "v2025-02-19";
const SANITY_DRAFT_READ_TOKEN_ENV = "SANITY_AUTH_TOKEN";
const SANITY_DRAFT_READ_ENABLE_ENV = "PRESIDENTIAL_SANITY_DRAFT_READ_ENABLED";
const SANITY_QUERY_URL_LIMIT = 14000;

const DRAFT_SITE_PAGE_IDS = {
  "home": "drafts.sitePage.home",
  "moon-rocks": "drafts.sitePage.moon-rocks",
  "moon-pods": "drafts.sitePage.moon-pods",
  "orbit": "drafts.sitePage.orbit",
  "our-story": "drafts.sitePage.our-story",
  "learn": "drafts.sitePage.learn",
  "find-us": "drafts.sitePage.find-us",
  "contact": "drafts.sitePage.contact",
} as const;

export type DraftSitePageSlug = keyof typeof DRAFT_SITE_PAGE_IDS;

type DraftSitePageReadResult =
  | {
      readonly ok: false;
      readonly skipped: true;
      readonly reason: "draft_read_disabled" | "missing_draft_read_token" | "draft_slug_not_allowed";
    }
  | {
      readonly ok: true;
      readonly skipped: false;
      readonly result: SanitySitePageRecord | null;
    }
  | {
      readonly ok: false;
      readonly skipped: false;
      readonly reason: "draft_read_failed";
      readonly status: number;
      readonly statusText: string;
    };

const DRAFT_SITE_PAGE_QUERY = `*[_type == "sitePage" && _id == $id][0]{
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

export function isDraftSitePageSlug(value: string): value is DraftSitePageSlug {
  return Object.prototype.hasOwnProperty.call(DRAFT_SITE_PAGE_IDS, value);
}

export function listDraftSitePageSlugs(): readonly DraftSitePageSlug[] {
  return Object.keys(DRAFT_SITE_PAGE_IDS) as DraftSitePageSlug[];
}

function isDraftReadEnabled(): boolean {
  return process.env[SANITY_DRAFT_READ_ENABLE_ENV] === "true";
}

function getDraftReadToken(): string {
  return process.env[SANITY_DRAFT_READ_TOKEN_ENV]?.trim() || "";
}

function buildDraftReadQueryUrl(query: string, id: string): URL {
  if (!Object.values(DRAFT_SITE_PAGE_IDS).includes(id as (typeof DRAFT_SITE_PAGE_IDS)[DraftSitePageSlug])) {
    throw new Error("Draft site page reads must target an allowed Presidential draft page.");
  }

  const url = new URL(
    `https://${SANITY_PROJECT_ID}.api.sanity.io/${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`,
  );
  url.searchParams.set("query", query);
  url.searchParams.set("perspective", "raw");
  url.searchParams.set("returnQuery", "false");
  url.searchParams.set("$id", JSON.stringify(id));

  if (url.toString().length > SANITY_QUERY_URL_LIMIT) {
    throw new Error("Sanity draft site page query URL is too long.");
  }

  return url;
}

export async function readDraftSitePage(
  slug: string,
  init: Pick<RequestInit, "signal" | "next"> = {},
): Promise<DraftSitePageReadResult> {
  if (!isDraftSitePageSlug(slug)) {
    return {
      ok: false,
      skipped: true,
      reason: "draft_slug_not_allowed",
    };
  }

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

  const response = await fetch(buildDraftReadQueryUrl(DRAFT_SITE_PAGE_QUERY, DRAFT_SITE_PAGE_IDS[slug]), {
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

  const payload = (await response.json()) as { result: SanitySitePageRecord | null };

  return {
    ok: true,
    skipped: false,
    result: payload.result,
  };
}
