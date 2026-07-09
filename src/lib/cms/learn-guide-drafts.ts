import "server-only";

import type { SanityLearnGuideRecord } from "./learn-guide";
import { SITE_PAGE_MODULE_PROJECTION } from "./homepage";

const SANITY_PROJECT_ID = "4bl3xvem";
const SANITY_DATASET = "production";
const SANITY_API_VERSION = "v2025-02-19";
const SANITY_DRAFT_READ_TOKEN_ENV = "SANITY_AUTH_TOKEN";
const SANITY_DRAFT_READ_ENABLE_ENV = "PRESIDENTIAL_SANITY_DRAFT_READ_ENABLED";
const SANITY_QUERY_URL_LIMIT = 14000;

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

  const response = await fetch(buildDraftLearnGuideQueryUrl(slug), {
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

  const payload = (await response.json()) as { result: SanityLearnGuideRecord | null };

  return {
    ok: true,
    skipped: false,
    result: payload.result,
  };
}
