import "server-only";

import {
  readPublishedSanity,
  type SanityReadResult,
} from "./sanity-read-client";
import {
  SITE_PAGE_MODULE_PROJECTION,
  type SanityHomepageModule,
} from "./homepage";

const SITE_PAGE_CMS_RENDER_ENABLE_ENV = "PRESIDENTIAL_SITE_PAGE_CMS_RENDERING_ENABLED";
const PUBLIC_SITE_PAGE_APPROVAL = "approved_public";
const PUBLIC_RENDERABLE_ROUTE_PHASES = new Set(["approved_public"]);
const RENDERABLE_MODULE_ELIGIBILITY = "ready_for_implementation_candidate";

type SanityApprovalGate = {
  readonly contentApprovalStatus?: string;
  readonly sourceProofStatus?: string;
  readonly legalReviewStatus?: string;
};

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
    legalReviewStatus
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
  return Boolean(
    record &&
      PUBLIC_RENDERABLE_ROUTE_PHASES.has(record.routePhase || "") &&
      record.approvalGate?.contentApprovalStatus === PUBLIC_SITE_PAGE_APPROVAL &&
      record.approvalGate.sourceProofStatus === PUBLIC_SITE_PAGE_APPROVAL &&
      record.approvalGate.legalReviewStatus === PUBLIC_SITE_PAGE_APPROVAL,
  );
}

function getRenderableSitePageModules(
  record: SanitySitePageRecord | null,
): readonly SanityHomepageModule[] {
  if (!isSitePageApprovedForPublicRendering(record)) {
    return [];
  }

  return (record.modules || []).filter(
    (module) => module.moduleControl?.renderEligibility === RENDERABLE_MODULE_ELIGIBILITY,
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
