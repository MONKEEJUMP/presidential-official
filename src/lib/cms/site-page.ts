import "server-only";

import {
  readPublishedSanity,
  type SanityReadResult,
} from "./sanity-read-client";
import {
  SITE_PAGE_MODULE_PROJECTION,
  type SanityApprovalGate,
  type SanityHomepageModule,
} from "./homepage";
import {
  hasPublicCmsApprovalGate,
  isPublicCmsAsset,
  PUBLIC_MODULE_RENDER_ELIGIBILITY,
} from "./public-content";

const SITE_PAGE_CMS_RENDER_ENABLE_ENV = "PRESIDENTIAL_SITE_PAGE_CMS_RENDERING_ENABLED";
const PUBLIC_RENDERABLE_ROUTE_PHASES = new Set(["approved_public"]);

export type SanitySitePageRecord = {
  readonly _id: string;
  readonly _type: "sitePage";
  readonly title?: string;
  readonly slug?: string;
  readonly routePhase?: string;
  readonly summary?: string;
  readonly approvalGate?: SanityApprovalGate;
  readonly modules?: readonly SanityHomepageModule[];
};

type PublicSitePageReadResult = {
  readonly enabled: boolean;
  readonly record: SanitySitePageRecord | null;
  readonly modules: readonly SanityHomepageModule[];
};

const SITE_PAGE_QUERY = `*[_type == "sitePage" && slug.current == $slug][0]{
  _id,
  _type,
  title,
  "slug": slug.current,
  routePhase,
  summary,
  approvalGate{
    contentApprovalStatus,
    sourceProofStatus,
    legalReviewStatus,
    assetApprovalStatus,
    seoApprovalStatus,
    routePublicationStatus
  },
  modules[]{
${SITE_PAGE_MODULE_PROJECTION}
  }
}`;

function isSitePageCmsRenderingEnabled(): boolean {
  return process.env[SITE_PAGE_CMS_RENDER_ENABLE_ENV] === "true";
}

function isSitePageApprovedForPublicRendering(
  record: SanitySitePageRecord | null,
): record is SanitySitePageRecord {
  const eligibleModules = (record?.modules || []).filter(
    (module) => module.moduleControl?.renderEligibility === PUBLIC_MODULE_RENDER_ELIGIBILITY,
  );
  const publicHeroes = eligibleModules.filter((module) => module._type === "heroBlock");

  return Boolean(
    record &&
      PUBLIC_RENDERABLE_ROUTE_PHASES.has(record.routePhase || "") &&
      hasPublicCmsApprovalGate(record.approvalGate) &&
      eligibleModules.length > 0 &&
      publicHeroes.length === 1 &&
      isPublicCmsAsset(publicHeroes[0].heroAssetRecord),
  );
}

function getRenderableSitePageModules(
  record: SanitySitePageRecord | null,
): readonly SanityHomepageModule[] {
  if (!isSitePageApprovedForPublicRendering(record)) {
    return [];
  }

  return (record.modules || []).filter(
    (module) => module.moduleControl?.renderEligibility === PUBLIC_MODULE_RENDER_ELIGIBILITY,
  );
}

export function readPublishedSitePage(
  slug: string,
  init: Pick<RequestInit, "signal" | "next"> = {},
): Promise<SanityReadResult<SanitySitePageRecord | null>> {
  return readPublishedSanity<SanitySitePageRecord | null>(
    SITE_PAGE_QUERY,
    {slug},
    init,
  );
}

export async function readPublicRenderableSitePage(
  slug: string,
  init: Pick<RequestInit, "signal" | "next"> = {},
): Promise<PublicSitePageReadResult> {
  if (!isSitePageCmsRenderingEnabled()) {
    return {
      enabled: false,
      record: null,
      modules: [],
    };
  }

  try {
    const page = await readPublishedSitePage(slug, init);
    const record = page.ok ? page.result : null;
    const approvedRecord = isSitePageApprovedForPublicRendering(record) ? record : null;

    return {
      enabled: true,
      record: approvedRecord,
      modules: getRenderableSitePageModules(record),
    };
  } catch {
    return {
      enabled: true,
      record: null,
      modules: [],
    };
  }
}
