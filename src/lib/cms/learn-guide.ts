import "server-only";

import {
  readPublishedSanity,
  type SanityReadResult,
} from "./sanity-read-client";
import {
  SITE_PAGE_MODULE_PROJECTION,
  type SanityHomepageModule,
} from "./homepage";

const LEARN_GUIDE_CMS_RENDER_ENABLE_ENV = "PRESIDENTIAL_LEARN_GUIDE_CMS_RENDERING_ENABLED";
const PUBLIC_LEARN_GUIDE_APPROVAL = "approved_public";
const PUBLIC_RENDERABLE_ROUTE_PHASES = new Set(["approved_public"]);
const RENDERABLE_MODULE_ELIGIBILITY = "ready_for_implementation_candidate";

type SanityApprovalGate = {
  readonly contentApprovalStatus?: string;
  readonly sourceProofStatus?: string;
  readonly legalReviewStatus?: string;
  readonly assetApprovalStatus?: string;
  readonly seoApprovalStatus?: string;
  readonly routePublicationStatus?: string;
};

export type SanityLearnGuideRecord = {
  readonly _id: string;
  readonly _type: "learnGuide";
  readonly title?: string;
  readonly slug?: string;
  readonly routePhase?: string;
  readonly guideTopic?: string;
  readonly topicTaxonomy?: readonly string[];
  readonly intro?: string;
  readonly bodyModules?: readonly SanityHomepageModule[];
  readonly sourceProofList?: readonly string[];
  readonly approvalGate?: SanityApprovalGate;
};

type PublicLearnGuideReadResult = {
  readonly enabled: boolean;
  readonly record: SanityLearnGuideRecord | null;
  readonly modules: readonly SanityHomepageModule[];
};

const LEARN_GUIDE_QUERY = `*[_type == "learnGuide" && slug.current == $slug][0]{
  _id,
  _type,
  title,
  "slug": slug.current,
  routePhase,
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

function isLearnGuideCmsRenderingEnabled(): boolean {
  return process.env[LEARN_GUIDE_CMS_RENDER_ENABLE_ENV] === "true";
}

export function readPublishedLearnGuide(
  slug: string,
  init: Pick<RequestInit, "signal" | "next"> = {},
): Promise<SanityReadResult<SanityLearnGuideRecord | null>> {
  return readPublishedSanity<SanityLearnGuideRecord | null>(
    LEARN_GUIDE_QUERY,
    {slug},
    init,
  );
}

function isLearnGuideApprovedForPublicRendering(
  record: SanityLearnGuideRecord | null,
): record is SanityLearnGuideRecord {
  return Boolean(
    record &&
      PUBLIC_RENDERABLE_ROUTE_PHASES.has(record.routePhase || "") &&
      record.approvalGate?.contentApprovalStatus === PUBLIC_LEARN_GUIDE_APPROVAL &&
      record.approvalGate.sourceProofStatus === PUBLIC_LEARN_GUIDE_APPROVAL &&
      record.approvalGate.legalReviewStatus === PUBLIC_LEARN_GUIDE_APPROVAL,
  );
}

function getRenderableLearnGuideModules(
  record: SanityLearnGuideRecord | null,
): readonly SanityHomepageModule[] {
  if (!isLearnGuideApprovedForPublicRendering(record)) {
    return [];
  }

  return (record.bodyModules || []).filter(
    (module) => module.moduleControl?.renderEligibility === RENDERABLE_MODULE_ELIGIBILITY,
  );
}

export async function readPublicRenderableLearnGuide(
  slug: string,
  init: Pick<RequestInit, "signal" | "next"> = {},
): Promise<PublicLearnGuideReadResult> {
  if (!isLearnGuideCmsRenderingEnabled()) {
    return {
      enabled: false,
      record: null,
      modules: [],
    };
  }

  try {
    const guide = await readPublishedLearnGuide(slug, init);
    const record = guide.ok ? guide.result : null;
    const approvedRecord = isLearnGuideApprovedForPublicRendering(record) ? record : null;

    return {
      enabled: true,
      record: approvedRecord,
      modules: getRenderableLearnGuideModules(record),
    };
  } catch {
    return {
      enabled: true,
      record: null,
      modules: [],
    };
  }
}
