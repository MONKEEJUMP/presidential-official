import "server-only";

import { readPublishedSanity, type SanityReadResult } from "./sanity-read-client";

const HOMEPAGE_CMS_RENDER_ENABLE_ENV = "PRESIDENTIAL_HOMEPAGE_CMS_RENDERING_ENABLED";
const PUBLIC_RENDERABLE_ROUTE_PHASES = new Set(["approved_public"]);
const RENDERABLE_MODULE_ELIGIBILITY = "ready_for_implementation_candidate";

export type SanityHomepageModule = {
  readonly _key?: string;
  readonly _type?: string;
  readonly eyebrow?: string;
  readonly headline?: string;
  readonly heading?: string;
  readonly subheading?: string;
  readonly subheadline?: string;
  readonly actTitle?: string;
  readonly actNumber?: number;
  readonly beliefStatement?: string;
  readonly positioningLine?: string;
  readonly shortExplanation?: string;
  readonly description?: string;
  readonly legalTitle?: string;
  readonly intro?: string;
  readonly body?: string | readonly SanityPortableTextBlock[];
  readonly supportingCopy?: readonly SanityPortableTextBlock[];
  readonly storyCopy?: readonly SanityPortableTextBlock[];
  readonly callout?: string;
  readonly sourceNote?: string;
  readonly title?: string;
  readonly proofType?: string;
  readonly proofSource?: string;
  readonly sourceSystem?: string;
  readonly originalPathOrRoute?: string;
  readonly assetCategory?: string;
  readonly provenanceStatus?: string;
  readonly approvalStatus?: string;
  readonly allowedUsage?: string;
  readonly blockedUsage?: string;
  readonly fallbackLanguage?: string;
  readonly formIntent?: string;
  readonly stateCandidates?: readonly string[];
  readonly retailerDataStatus?: string;
  readonly legalGateStatus?: string;
  readonly ctaLabel?: string;
  readonly ctaHref?: string;
  readonly primaryCta?: SanityCta;
  readonly secondaryCta?: SanityCta;
  readonly cta?: SanityCta;
  readonly visibleCta?: SanityCta;
  readonly heroAssetRecord?: SanityAssetRecord;
  readonly assetRecord?: SanityAssetRecord;
  readonly assetRecords?: readonly SanityAssetRecord[];
  readonly assetRecordRefs?: readonly SanityAssetRecord[];
  readonly platform?: SanityLinkedRecord;
  readonly format?: SanityLinkedRecord;
  readonly contactProfile?: SanityContactProfile;
  readonly linkedLocatorRegion?: SanityLinkedRecord;
  readonly cards?: readonly SanityCard[];
  readonly featuredGuides?: readonly SanityLinkedRecord[];
  readonly relatedPlatforms?: readonly SanityLinkedRecord[];
  readonly relatedProductLinks?: readonly SanityLinkedRecord[];
  readonly events?: readonly SanityTimelineEvent[];
  readonly facts?: readonly SanityFact[];
  readonly columns?: readonly SanityColumn[];
  readonly question?: string;
  readonly answer?: string;
  readonly items?: readonly {
    readonly _id?: string;
    readonly _type?: string;
    readonly title?: string;
    readonly name?: string;
    readonly label?: string;
    readonly description?: string;
    readonly slug?: string;
  }[];
  readonly moduleControl?: {
    readonly moduleKey?: string;
    readonly internalLabel?: string;
    readonly componentKey?: string;
    readonly renderEligibility?: string;
    readonly sortIntent?: number;
  };
};

export type SanityCta = {
  readonly label?: string;
  readonly href?: string;
  readonly intent?: string;
};

export type SanityAssetRecord = {
  readonly _id?: string;
  readonly title?: string;
  readonly altText?: string;
  readonly assetName?: string;
  readonly savedFile?: string;
  readonly assetUrl?: string;
  readonly assetWidth?: number;
  readonly assetHeight?: number;
  readonly sourceSystem?: string;
  readonly approvalStatus?: string;
  readonly provenanceStatus?: string;
  readonly pageUsage?: readonly string[];
};

export type SanityLinkedRecord = {
  readonly _id?: string;
  readonly _type?: string;
  readonly title?: string;
  readonly name?: string;
  readonly slug?: string;
  readonly guideTopic?: string;
  readonly intro?: string;
  readonly positioningLine?: string;
  readonly shortDescription?: string;
  readonly description?: string;
  readonly publicStatus?: string;
};

export type SanityContactProfile = {
  readonly _id?: string;
  readonly _type?: "contactProfile";
  readonly title?: string;
  readonly phone?: string;
  readonly displayEmail?: string;
  readonly mailtoEmail?: string;
  readonly emailConflictStatus?: string;
  readonly publicUseStatus?: string;
};

export type SanityCard = {
  readonly title?: string;
  readonly route?: string;
  readonly sourceStatus?: string;
  readonly routeGate?: string;
  readonly assetRecord?: SanityAssetRecord;
  readonly contentRef?: SanityLinkedRecord;
};

export type SanityTimelineEvent = {
  readonly label?: string;
  readonly dateOrSequence?: string;
  readonly body?: readonly SanityPortableTextBlock[];
};

export type SanityFact = {
  readonly label?: string;
  readonly value?: string;
  readonly publicUseStatus?: string;
};

export type SanityColumn = {
  readonly title?: string;
  readonly body?: readonly SanityPortableTextBlock[];
  readonly contentRef?: SanityLinkedRecord;
};

export type SanityPortableTextBlock = {
  readonly _type?: "block";
  readonly children?: readonly {
    readonly text?: string;
  }[];
};

export type SanityHomepageRecord = {
  readonly _id: string;
  readonly _type: "sitePage";
  readonly title?: string;
  readonly slug?: string;
  readonly routePhase?: string;
  readonly summary?: string;
  readonly modules?: readonly SanityHomepageModule[];
};

export const SITE_PAGE_MODULE_PROJECTION = `
    _key,
    _type,
    eyebrow,
    headline,
    heading,
    subheading,
    subheadline,
    actTitle,
    actNumber,
    beliefStatement,
    positioningLine,
    shortExplanation,
    description,
    legalTitle,
    intro,
    body,
    supportingCopy,
    storyCopy,
    callout,
    sourceNote,
    proofType,
    proofSource,
    sourceSystem,
    originalPathOrRoute,
    assetCategory,
    provenanceStatus,
    approvalStatus,
    allowedUsage,
    blockedUsage,
    fallbackLanguage,
    formIntent,
    stateCandidates,
    retailerDataStatus,
    legalGateStatus,
    ctaLabel,
    ctaHref,
    primaryCta{label,href,intent},
    secondaryCta{label,href,intent},
    cta{label,href,intent},
    visibleCta{label,href,intent},
    question,
    answer,
    items[]->{_id,_type,title,name,"slug": slug.current},
    cards[]{
      title,
      route,
      sourceStatus,
      routeGate,
      assetRecord->{_id,title,altText,assetName,savedFile,"assetUrl": asset.asset->url,"assetWidth": coalesce(width, asset.asset->metadata.dimensions.width),"assetHeight": coalesce(height, asset.asset->metadata.dimensions.height),sourceSystem,approvalStatus,provenanceStatus,pageUsage},
      contentRef->{_id,_type,title,name,"slug": slug.current}
    },
    featuredGuides[]->{_id,_type,title,"slug": slug.current,guideTopic,intro},
    relatedPlatforms[]->{_id,_type,name,"slug": slug.current,positioningLine,shortDescription,publicStatus},
    relatedProductLinks[]->{_id,_type,name,title,"slug": slug.current,positioningLine,shortDescription},
    linkedLocatorRegion->{_id,_type,title,name,"slug": slug.current,description,publicStatus},
    contactProfile->{_id,_type,title,phone,displayEmail,mailtoEmail,emailConflictStatus,publicUseStatus},
    events[]{
      label,
      dateOrSequence,
      body
    },
    facts[]{
      label,
      value,
      publicUseStatus
    },
    columns[]{
      title,
      body,
      contentRef->{_id,_type,title,name,"slug": slug.current}
    },
    platform->{_id,_type,name,"slug": slug.current,positioningLine,shortDescription,publicStatus},
    format->{_id,_type,name,"slug": slug.current,description,publicStatus},
    assetRecord->{_id,title,altText,assetName,savedFile,"assetUrl": asset.asset->url,"assetWidth": coalesce(width, asset.asset->metadata.dimensions.width),"assetHeight": coalesce(height, asset.asset->metadata.dimensions.height),sourceSystem,approvalStatus,provenanceStatus,pageUsage},
    assetRecords[]->{_id,title,altText,assetName,savedFile,"assetUrl": asset.asset->url,"assetWidth": coalesce(width, asset.asset->metadata.dimensions.width),"assetHeight": coalesce(height, asset.asset->metadata.dimensions.height),sourceSystem,approvalStatus,provenanceStatus,pageUsage},
    heroAssetRecord->{_id,title,altText,assetName,savedFile,"assetUrl": asset.asset->url,"assetWidth": coalesce(width, asset.asset->metadata.dimensions.width),"assetHeight": coalesce(height, asset.asset->metadata.dimensions.height),sourceSystem,approvalStatus,provenanceStatus,pageUsage},
    assetRecordRefs[]->{_id,title,altText,assetName,savedFile,"assetUrl": asset.asset->url,"assetWidth": coalesce(width, asset.asset->metadata.dimensions.width),"assetHeight": coalesce(height, asset.asset->metadata.dimensions.height),sourceSystem,approvalStatus,provenanceStatus,pageUsage},
    moduleControl{
      moduleKey,
      internalLabel,
      componentKey,
      renderEligibility,
      sortIntent
    }
`;

type PublicHomepageReadResult = {
  readonly enabled: boolean;
  readonly record: SanityHomepageRecord | null;
  readonly modules: readonly SanityHomepageModule[];
};

const HOMEPAGE_QUERY = `*[_type == "sitePage" && slug.current == $slug][0]{
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

export function readPublishedHomepage(
  init: Pick<RequestInit, "signal" | "next"> = {},
): Promise<SanityReadResult<SanityHomepageRecord | null>> {
  return readPublishedSanity<SanityHomepageRecord | null>(
    HOMEPAGE_QUERY,
    { slug: "home" },
    init,
  );
}

function isHomepageCmsRenderingEnabled(): boolean {
  return process.env[HOMEPAGE_CMS_RENDER_ENABLE_ENV] === "true";
}

function getRenderableHomepageModules(
  record: SanityHomepageRecord | null,
): readonly SanityHomepageModule[] {
  if (!record || !PUBLIC_RENDERABLE_ROUTE_PHASES.has(record.routePhase || "")) {
    return [];
  }

  return (record.modules || []).filter(
    (module) => module.moduleControl?.renderEligibility === RENDERABLE_MODULE_ELIGIBILITY,
  );
}

export async function readPublicRenderableHomepage(
  init: Pick<RequestInit, "signal" | "next"> = {},
): Promise<PublicHomepageReadResult> {
  if (!isHomepageCmsRenderingEnabled()) {
    return {
      enabled: false,
      record: null,
      modules: [],
    };
  }

  try {
    const homepage = await readPublishedHomepage(init);
    const record = homepage.ok ? homepage.result : null;

    return {
      enabled: true,
      record,
      modules: getRenderableHomepageModules(record),
    };
  } catch {
    return {
      enabled: true,
      record: null,
      modules: [],
    };
  }
}
