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
  PUBLIC_MODULE_RENDER_ELIGIBILITY,
} from "./public-content";

const LEARN_GUIDE_CMS_RENDER_ENABLE_ENV = "PRESIDENTIAL_LEARN_GUIDE_CMS_RENDERING_ENABLED";

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

type SanityLearnGuideSlugRecord = {
  readonly slug?: string;
};

export type SanityLearnGuideSummaryRecord = {
  readonly slug: string;
  readonly title: string;
  readonly intro: string;
};

const LEARN_GUIDE_QUERY = `*[
  _type == "learnGuide" &&
  slug.current == $slug &&
  routePhase == "approved_public"
][0]{
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

const ORIGINAL_PUBLIC_LEARN_GUIDE_SLUGS_QUERY = `*[
  _type == "learnGuide" &&
  defined(slug.current) &&
  routePhase == "approved_public" &&
  approvalGate.contentApprovalStatus == "approved_public" &&
  approvalGate.sourceProofStatus == "approved_public" &&
  approvalGate.legalReviewStatus == "approved_public" &&
  approvalGate.assetApprovalStatus == "approved_public" &&
  approvalGate.seoApprovalStatus == "approved_public" &&
  approvalGate.routePublicationStatus == "index_follow_approved" &&
  count(bodyModules[moduleControl.renderEligibility == "approved_public"]) > 0
]{
  "slug": slug.current
}`;

const PUBLIC_LEARN_GUIDE_FILTER = `  _type == "learnGuide" &&
  defined(slug.current) &&
  routePhase == "approved_public" &&
  approvalGate.contentApprovalStatus == "approved_public" &&
  approvalGate.sourceProofStatus == "approved_public" &&
  approvalGate.legalReviewStatus == "approved_public" &&
  approvalGate.assetApprovalStatus == "approved_public" &&
  approvalGate.seoApprovalStatus == "approved_public" &&
  approvalGate.routePublicationStatus == "index_follow_approved" &&
  count(bodyModules[moduleControl.renderEligibility == "approved_public"]) > 0`;

const PUBLIC_LEARN_GUIDE_SLUGS_QUERY = `*[
${PUBLIC_LEARN_GUIDE_FILTER}
]{
  "slug": slug.current
}`;

export const PUBLIC_LEARN_GUIDE_SUMMARIES_QUERY = `*[
${PUBLIC_LEARN_GUIDE_FILTER}
]{
  "slug": slug.current,
  title,
  intro
}`;

if (PUBLIC_LEARN_GUIDE_SLUGS_QUERY !== ORIGINAL_PUBLIC_LEARN_GUIDE_SLUGS_QUERY) {
  throw new Error("The public Learn guide slug query changed during filter extraction.");
}

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
      isPublicRouteSlug(record.slug) &&
      record.routePhase === "approved_public" &&
      record.title?.trim() &&
      record.intro?.trim() &&
      record.guideTopic?.trim() &&
      hasPublicCmsApprovalGate(record.approvalGate),
  );
}

function getRenderableLearnGuideModules(
  record: SanityLearnGuideRecord | null,
): readonly SanityHomepageModule[] {
  if (!isLearnGuideApprovedForPublicRendering(record)) {
    return [];
  }

  return (record.bodyModules || []).filter(
    (module) => module.moduleControl?.renderEligibility === PUBLIC_MODULE_RENDER_ELIGIBILITY,
  );
}

function isPublicRouteSlug(value?: string): value is string {
  return Boolean(value && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value));
}

export async function readPublicRenderableLearnGuideSlugs(
  init: Pick<RequestInit, "signal" | "next"> = {},
): Promise<readonly string[]> {
  if (!isLearnGuideCmsRenderingEnabled()) {
    return [];
  }

  try {
    const slugs = await readPublishedSanity<readonly SanityLearnGuideSlugRecord[]>(
      PUBLIC_LEARN_GUIDE_SLUGS_QUERY,
      {},
      init,
    );

    return slugs.ok
      ? Array.from(new Set(slugs.result.map((record) => record.slug).filter(isPublicRouteSlug))).sort()
      : [];
  } catch {
    return [];
  }
}

export async function readPublicRenderableLearnGuideSummaries(
  init: Pick<RequestInit, "signal" | "next"> = {},
): Promise<readonly SanityLearnGuideSummaryRecord[]> {
  if (!isLearnGuideCmsRenderingEnabled()) {
    return [];
  }

  try {
    const summaries = await readPublishedSanity<readonly Partial<SanityLearnGuideSummaryRecord>[]>(
      PUBLIC_LEARN_GUIDE_SUMMARIES_QUERY,
      {},
      init,
    );

    if (!summaries.ok) {
      return [];
    }

    const uniqueSummaries = new Map<string, SanityLearnGuideSummaryRecord>();

    for (const summary of summaries.result) {
      const slug = summary.slug?.trim();
      const title = summary.title?.trim();
      const intro = summary.intro?.trim();

      if (!isPublicRouteSlug(slug) || !title || !intro) {
        continue;
      }

      uniqueSummaries.set(slug, { slug, title, intro });
    }

    return Array.from(uniqueSummaries.values()).sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  } catch {
    return [];
  }
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
    const modules = getRenderableLearnGuideModules(record);
    const approvedRecord = isLearnGuideApprovedForPublicRendering(record) && modules.length
      ? record
      : null;

    return {
      enabled: true,
      record: approvedRecord,
      modules: approvedRecord ? modules : [],
    };
  } catch {
    return {
      enabled: true,
      record: null,
      modules: [],
    };
  }
}
