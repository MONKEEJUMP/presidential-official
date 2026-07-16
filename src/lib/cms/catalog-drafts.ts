import "server-only";

import { fetchSanityJsonWithTimeout } from "./sanity-read-client";
import type { SanityCatalogItem } from "./catalog";

const SANITY_PROJECT_ID = "4bl3xvem";
const SANITY_DATASET = "production";
const SANITY_API_VERSION = "v2025-02-19";
const SANITY_DRAFT_READ_TOKEN_ENV = "SANITY_AUTH_TOKEN";
const SANITY_DRAFT_READ_ENABLE_ENV = "PRESIDENTIAL_SANITY_DRAFT_READ_ENABLED";
const SANITY_QUERY_URL_LIMIT = 14000;

export type DraftCatalogReadResult =
  | {
      readonly ok: false;
      readonly skipped: true;
      readonly reason: "draft_read_disabled" | "missing_draft_read_token";
    }
  | {
      readonly ok: true;
      readonly skipped: false;
      readonly items: readonly SanityCatalogItem[];
    }
  | {
      readonly ok: false;
      readonly skipped: false;
      readonly reason: "draft_read_failed";
      readonly status: number;
      readonly statusText: string;
    };

const DRAFT_CATALOG_ITEM_PROJECTION = `
  _id,
  _type,
  name,
  productKey,
  series,
  productType,
  routeCandidate,
  "description": internalDescriptionDraft,
  commercePosture,
  publicUseStatus,
  approvalGate{
    contentApprovalStatus,
    sourceProofStatus,
    legalReviewStatus,
    assetApprovalStatus,
    seoApprovalStatus,
    routePublicationStatus
  },
  "images": assetRefs[]->{
    "assetUrl": asset.asset->url,
    "altText": altText,
    "width": asset.asset->metadata.dimensions.width,
    "height": asset.asset->metadata.dimensions.height,
    approvalStatus,
    provenanceStatus
  }
`;

const DRAFT_CATALOG_QUERY = `*[_type == "productCatalogItem" && routeCandidate == $route]{
${DRAFT_CATALOG_ITEM_PROJECTION}
}`;

function isDraftReadEnabled(): boolean {
  return process.env[SANITY_DRAFT_READ_ENABLE_ENV] === "true";
}

function getDraftReadToken(): string {
  return process.env[SANITY_DRAFT_READ_TOKEN_ENV]?.trim() || "";
}

function buildDraftCatalogQueryUrl(route: string): URL {
  const url = new URL(
    `https://${SANITY_PROJECT_ID}.api.sanity.io/${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`,
  );
  url.searchParams.set("query", DRAFT_CATALOG_QUERY);
  url.searchParams.set("perspective", "raw");
  url.searchParams.set("returnQuery", "false");
  url.searchParams.set("$route", JSON.stringify(route));

  if (url.toString().length > SANITY_QUERY_URL_LIMIT) {
    throw new Error("Sanity draft catalog query URL is too long.");
  }

  return url;
}

export async function readDraftCatalogItems(
  route: string,
  init: Pick<RequestInit, "signal" | "next"> = {},
): Promise<DraftCatalogReadResult> {
  if (!isDraftReadEnabled()) {
    return { ok: false, skipped: true, reason: "draft_read_disabled" };
  }

  const token = getDraftReadToken();
  if (!token) {
    return { ok: false, skipped: true, reason: "missing_draft_read_token" };
  }

  const { payload, response } = await fetchSanityJsonWithTimeout<
    readonly SanityCatalogItem[]
  >(buildDraftCatalogQueryUrl(route), {
    signal: init.signal,
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok || !payload) {
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
    items: payload.result,
  };
}
