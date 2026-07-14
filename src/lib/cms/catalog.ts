import "server-only";

import {
  readPublishedSanity,
  type SanityReadResult,
} from "./sanity-read-client";
import type { SanityApprovalGate, SanityAssetRecord } from "./homepage";
import {
  hasPublicCmsApprovalGate,
  isPublicCmsAsset,
  PUBLIC_CMS_APPROVAL,
} from "./public-content";
import {
  readDraftCatalogItems as readDraftCatalogItemsUnsorted,
  type DraftCatalogReadResult,
} from "./catalog-drafts";

const SITE_PAGE_CMS_RENDER_ENABLE_ENV = "PRESIDENTIAL_SITE_PAGE_CMS_RENDERING_ENABLED";
const DRAFT_CATALOG_CACHE_TTL_MS = 10_000;

type DraftCatalogCacheEntry = {
  readonly expiresAt: number;
  readonly promise: Promise<DraftCatalogReadResult>;
};

const draftCatalogReadCache = new Map<string, DraftCatalogCacheEntry>();

export const CATALOG_SERIES_ORDER = [
  "Silver Flavor Series",
  "Gold Strain Series",
  "Rose Gold Connoisseur Series",
  "Presidential Line",
  "Presidential House Line",
  "Presidential x THC Design",
] as const;

export type SanityCatalogItem = {
  readonly _id: string;
  readonly _type: "productCatalogItem";
  readonly name?: string;
  readonly productKey?: string;
  readonly series?: string;
  readonly productType?: string;
  readonly routeCandidate?: string;
  readonly description?: string;
  readonly commercePosture?: string;
  readonly publicUseStatus?: string;
  readonly approvalGate?: SanityApprovalGate;
  readonly images?: readonly SanityAssetRecord[];
};

type PublicCatalogReadResult = {
  readonly enabled: boolean;
  readonly items: readonly SanityCatalogItem[];
};

const CATALOG_ITEM_PROJECTION = `
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

// The published query is belt-and-suspenders: publicUseStatus "approved_public"
// is a quad-proof unlock value the guarded write lane refuses to seed, so a
// row can only satisfy this filter after a real owner publication.
const PUBLIC_CATALOG_QUERY = `*[_type == "productCatalogItem"
  && routeCandidate == $route
  && publicUseStatus == "${PUBLIC_CMS_APPROVAL}"
  && commercePosture == "commerce_fields_blocked"]{
${CATALOG_ITEM_PROJECTION}
}`;

function isSitePageCmsRenderingEnabled(): boolean {
  return process.env[SITE_PAGE_CMS_RENDER_ENABLE_ENV] === "true";
}

function seriesRank(series?: string): number {
  const index = CATALOG_SERIES_ORDER.indexOf(
    (series || "") as (typeof CATALOG_SERIES_ORDER)[number],
  );
  return index === -1 ? CATALOG_SERIES_ORDER.length : index;
}

export function sortCatalogItems(
  items: readonly SanityCatalogItem[],
): readonly SanityCatalogItem[] {
  return [...items].sort(
    (a, b) =>
      seriesRank(a.series) - seriesRank(b.series) ||
      (a.name || "").localeCompare(b.name || ""),
  );
}

function isCatalogItemApprovedForPublicRendering(
  item: SanityCatalogItem,
): boolean {
  return Boolean(
    item.name &&
      item.productKey &&
      item.publicUseStatus === PUBLIC_CMS_APPROVAL &&
      item.commercePosture === "commerce_fields_blocked" &&
      hasPublicCmsApprovalGate(item.approvalGate, {
        asset: false,
        routePublication: false,
        seo: false,
      }),
  );
}

function toPublicCatalogItem(item: SanityCatalogItem): SanityCatalogItem {
  return {
    ...item,
    images: (item.images || []).filter(isPublicCmsAsset),
  };
}

export function readPublishedCatalogItems(
  route: string,
  init: Pick<RequestInit, "signal" | "next"> = {},
): Promise<SanityReadResult<readonly SanityCatalogItem[]>> {
  return readPublishedSanity<readonly SanityCatalogItem[]>(
    PUBLIC_CATALOG_QUERY,
    { route },
    init,
  );
}

export async function readPublicRenderableCatalogItems(
  route: string,
  init: Pick<RequestInit, "signal" | "next"> = {},
): Promise<PublicCatalogReadResult> {
  if (!isSitePageCmsRenderingEnabled()) {
    return { enabled: false, items: [] };
  }

  try {
    const read = await readPublishedCatalogItems(route, init);
    const items = read.ok ? read.result || [] : [];

    return {
      enabled: true,
      items: sortCatalogItems(
        items.filter(isCatalogItemApprovedForPublicRendering).map(toPublicCatalogItem),
      ),
    };
  } catch {
    return { enabled: true, items: [] };
  }
}

export async function readDraftCatalogItems(
  route: string,
  init: Pick<RequestInit, "signal" | "next"> = {},
): Promise<DraftCatalogReadResult> {
  const cached = draftCatalogReadCache.get(route);
  const now = Date.now();

  if (!init.signal && cached && cached.expiresAt > now) {
    return cached.promise;
  }

  const promise = readDraftCatalogItemsUnsorted(route, init).then((read) =>
    read.ok ? { ...read, items: sortCatalogItems(read.items) } : read,
  );

  if (!init.signal) {
    draftCatalogReadCache.set(route, {
      expiresAt: now + DRAFT_CATALOG_CACHE_TTL_MS,
      promise,
    });
  }

  const read = await promise;

  if (!read.ok && draftCatalogReadCache.get(route)?.promise === promise) {
    draftCatalogReadCache.set(route, { expiresAt: 0, promise });
  }

  return read;
}

const SERIES_SLUG_PREFIXES = ["silver-", "gold-", "rose-gold-"] as const;

export function catalogItemSlug(item: Pick<SanityCatalogItem, "productKey">): string {
  const key = item.productKey || "";
  const prefix = SERIES_SLUG_PREFIXES.find((candidate) => key.startsWith(candidate));

  return prefix ? key.slice(prefix.length) : key;
}

function findCatalogItemBySlug(
  items: readonly SanityCatalogItem[],
  slug: string,
): SanityCatalogItem | null {
  return items.find((item) => catalogItemSlug(item) === slug) || null;
}

export type CatalogDetailRead = {
  readonly item: SanityCatalogItem | null;
  readonly mode: "public" | "preview";
};

// Static params for /moon-rocks/[product-or-strain]: public (published +
// owner-approved) slugs always; gated draft slugs ONLY when the draft-read
// flag + token are present (owner preview builds). Production builds without
// the flag emit zero params and every detail URL 404s.
export async function readCatalogProductParams(
  route: string,
): Promise<readonly string[]> {
  const publicRead = await readPublicRenderableCatalogItems(route);
  const slugs = new Set(publicRead.items.map(catalogItemSlug));

  const draftRead = await readDraftCatalogItems(route);
  if (draftRead.ok) {
    for (const item of draftRead.items) {
      slugs.add(catalogItemSlug(item));
    }
  }

  return [...slugs].filter(Boolean).sort();
}

export async function readCatalogItemBySlug(
  route: string,
  slug: string,
  init: Pick<RequestInit, "signal" | "next"> = {},
): Promise<CatalogDetailRead> {
  const publicRead = await readPublicRenderableCatalogItems(route, init);
  const publicItem = findCatalogItemBySlug(publicRead.items, slug);
  if (publicItem) {
    return { item: publicItem, mode: "public" };
  }

  const draftRead = await readDraftCatalogItems(route, init);
  if (draftRead.ok) {
    return { item: findCatalogItemBySlug(draftRead.items, slug), mode: "preview" };
  }

  return { item: null, mode: "public" };
}
