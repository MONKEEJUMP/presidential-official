import "server-only";

import type { SanityLearnGuideRecord } from "./learn-guide";
import { SITE_PAGE_MODULE_PROJECTION } from "./homepage";
import {
  buildSanityReadQueryUrl,
  fetchSanityJsonWithTimeout,
  type SanityReadResult,
} from "./sanity-read-client";

const SANITY_PROJECT_ID = "4bl3xvem";
const SANITY_DATASET = "production";
const SANITY_API_VERSION = "v2025-02-19";
const SANITY_DRAFT_READ_TOKEN_ENV = "SANITY_AUTH_TOKEN";
const SANITY_DRAFT_READ_ENABLE_ENV = "PRESIDENTIAL_SANITY_DRAFT_READ_ENABLED";
const SANITY_PUBLISHED_READ_ENABLE_ENV = "PRESIDENTIAL_SANITY_READ_CLIENT_ENABLED";
const SANITY_QUERY_URL_LIMIT = 14000;

type SanityPublishedQueryParam = string | number | boolean | null;
type SanityPublishedQueryParams = Readonly<
  Record<string, SanityPublishedQueryParam>
>;

const DRAFT_LEARN_GUIDE_SLUGS = new Set([
  "what-are-moon-rocks",
  "what-is-live-resin",
  "what-is-live-rosin",
  "what-are-liquid-diamonds",
  "flavor-science",
  "infusion-science",
  "different-extracts-need-different-heat",
]);

type DraftLearnGuideReadResult =
  | {
      readonly ok: false;
      readonly skipped: true;
      readonly reason: "draft_read_disabled" | "missing_draft_read_token" | "draft_slug_not_allowed";
    }
  | {
      readonly ok: true;
      readonly skipped: false;
      readonly result: SanityLearnGuideRecord | null;
    }
  | {
      readonly ok: false;
      readonly skipped: false;
      readonly reason: "draft_read_failed";
      readonly status: number;
      readonly statusText: string;
    };

const DRAFT_LEARN_GUIDE_QUERY = `*[_type == "learnGuide" && slug.current == $slug] | order(_id in path("drafts.**") desc)[0]{
  _id,
  _type,
  title,
  "slug": slug.current,
  guideTopic,
  topicTaxonomy,
  intro,
  sourceProofList,
  approvalGate{
    contentApprovalStatus,
    sourceProofStatus,
    legalReviewStatus,
    assetApprovalStatus,
    seoApprovalStatus,
    routePublicationStatus
  },
  bodyModules[]{
${SITE_PAGE_MODULE_PROJECTION}
  }
}`;

function isDraftReadEnabled(): boolean {
  return process.env[SANITY_DRAFT_READ_ENABLE_ENV] === "true";
}

function getDraftReadToken(): string {
  return process.env[SANITY_DRAFT_READ_TOKEN_ENV]?.trim() || "";
}

function isPublishedReadEnabled(): boolean {
  return process.env[SANITY_PUBLISHED_READ_ENABLE_ENV] === "true";
}

function assertPublishedLearnGuideQuery(query: string): void {
  if (!/_type\s*==\s*["']learnGuide["']/.test(query) || /drafts\./i.test(query)) {
    throw new Error(
      "Authenticated published Learn reads must target only published learnGuide documents.",
    );
  }
}

export async function readPrivatePublishedLearnGuideQuery<T>(
  query: string,
  params: SanityPublishedQueryParams = {},
  init: Pick<RequestInit, "signal" | "next"> = {},
): Promise<SanityReadResult<T>> {
  if (!isPublishedReadEnabled()) {
    return {
      ok: false,
      skipped: true,
      reason: "sanity_read_disabled",
    };
  }

  assertPublishedLearnGuideQuery(query);

  const token = getDraftReadToken();
  if (!token) {
    return {
      ok: false,
      skipped: false,
      reason: "sanity_read_failed",
      status: 401,
      statusText: "Published Learn read token is unavailable",
    };
  }

  const { payload, response } = await fetchSanityJsonWithTimeout<T>(
    buildSanityReadQueryUrl(query, params),
    {
      ...init,
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
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

function buildDraftLearnGuideQueryUrl(slug: string): URL {
  if (!DRAFT_LEARN_GUIDE_SLUGS.has(slug)) {
    throw new Error("Draft learn guide reads must target an allowed Presidential guide slug.");
  }

  const url = new URL(
    `https://${SANITY_PROJECT_ID}.api.sanity.io/${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`,
  );
  url.searchParams.set("query", DRAFT_LEARN_GUIDE_QUERY);
  url.searchParams.set("perspective", "raw");
  url.searchParams.set("returnQuery", "false");
  url.searchParams.set("$slug", JSON.stringify(slug));

  if (url.toString().length > SANITY_QUERY_URL_LIMIT) {
    throw new Error("Sanity draft learn guide query URL is too long.");
  }

  return url;
}

export async function readDraftLearnGuide(
  slug: string,
  init: Pick<RequestInit, "signal" | "next"> = {},
): Promise<DraftLearnGuideReadResult> {
  if (!DRAFT_LEARN_GUIDE_SLUGS.has(slug)) {
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

  const { payload, response } = await fetchSanityJsonWithTimeout<SanityLearnGuideRecord | null>(
    buildDraftLearnGuideQueryUrl(slug),
    {
      ...init,
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return {
      ok: false,
      skipped: false,
      reason: "draft_read_failed",
      status: response.status,
      statusText: response.statusText,
    };
  }

  return {
    ok: true,
    skipped: false,
    result: payload?.result || null,
  };
}
