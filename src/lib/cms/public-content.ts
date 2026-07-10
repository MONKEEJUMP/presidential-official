import type {
  SanityApprovalGate,
  SanityAssetRecord,
  SanityCard,
  SanityContactProfile,
  SanityCta,
  SanityFaqItem,
  SanityFact,
  SanityHomepageModule,
  SanityLinkedRecord,
} from "./homepage";

export const PUBLIC_CMS_APPROVAL = "approved_public";
export const PUBLIC_ROUTE_PUBLICATION_APPROVAL = "index_follow_approved";
export const PUBLIC_MODULE_RENDER_ELIGIBILITY = "approved_public";

type PublicApprovalRequirements = {
  readonly asset?: boolean;
  readonly routePublication?: boolean;
  readonly seo?: boolean;
};

export function hasPublicCmsApprovalGate(
  gate?: SanityApprovalGate,
  requirements: PublicApprovalRequirements = {
    asset: true,
    routePublication: true,
    seo: true,
  },
): boolean {
  return Boolean(
    gate &&
      gate.contentApprovalStatus === PUBLIC_CMS_APPROVAL &&
      gate.sourceProofStatus === PUBLIC_CMS_APPROVAL &&
      gate.legalReviewStatus === PUBLIC_CMS_APPROVAL &&
      (!requirements.asset || gate.assetApprovalStatus === PUBLIC_CMS_APPROVAL) &&
      (!requirements.seo || gate.seoApprovalStatus === PUBLIC_CMS_APPROVAL) &&
      (!requirements.routePublication ||
        gate.routePublicationStatus === PUBLIC_ROUTE_PUBLICATION_APPROVAL),
  );
}

export function isPublicCmsAsset(asset?: SanityAssetRecord): asset is SanityAssetRecord {
  return Boolean(
    asset?.assetUrl &&
      asset.altText &&
      asset.approvalStatus === PUBLIC_CMS_APPROVAL &&
      asset.provenanceStatus === PUBLIC_CMS_APPROVAL,
  );
}

export function isPublicCmsLinkedRecord(
  record?: SanityLinkedRecord,
): record is SanityLinkedRecord {
  if (!record) {
    return false;
  }

  if (record.approvalGate) {
    return hasPublicCmsApprovalGate(record.approvalGate);
  }

  return Boolean(
    record.publicStatus === PUBLIC_CMS_APPROVAL &&
      (!record.legalReviewStatus || record.legalReviewStatus === PUBLIC_CMS_APPROVAL),
  );
}

export function isPublicCmsFact(fact?: SanityFact): fact is SanityFact {
  return Boolean(
    fact?.label &&
      fact.value &&
      fact.publicUseStatus === PUBLIC_CMS_APPROVAL,
  );
}

export function isPublicCmsContactProfile(
  profile?: SanityContactProfile,
): profile is SanityContactProfile {
  return Boolean(
    profile?.publicUseStatus === PUBLIC_CMS_APPROVAL &&
      (!profile.emailConflictStatus || profile.emailConflictStatus === PUBLIC_CMS_APPROVAL),
  );
}

export function isPublicCmsCard(card?: SanityCard): card is SanityCard {
  return Boolean(
    card?.title &&
      card.sourceStatus === PUBLIC_CMS_APPROVAL &&
      card.routeGate === PUBLIC_ROUTE_PUBLICATION_APPROVAL &&
      (!card.contentRef || isPublicCmsLinkedRecord(card.contentRef)) &&
      (!card.assetRecord || isPublicCmsAsset(card.assetRecord)),
  );
}

export function isPublicCmsFaqItem(item?: SanityFaqItem): item is SanityFaqItem {
  return Boolean(
    item?.question &&
      item.answer?.length &&
      hasPublicCmsApprovalGate(item.approvalGate, {
        asset: false,
        routePublication: false,
        seo: false,
      }),
  );
}

function sanitizePublicCta(cta?: SanityCta): SanityCta | undefined {
  return cta?.visibilityStatus === PUBLIC_CMS_APPROVAL ? cta : undefined;
}

function sanitizePublicLinkedRecord(
  record?: SanityLinkedRecord,
): SanityLinkedRecord | undefined {
  return isPublicCmsLinkedRecord(record) ? record : undefined;
}

export function sanitizePublicCmsModule(
  module: SanityHomepageModule,
): SanityHomepageModule {
  const publicAssets = [
    ...(module.assetRecords || []),
    ...(module.assetRecordRefs || []),
  ].filter(isPublicCmsAsset);
  const publicItems = module._type === "faqBlock"
    ? (module.items || []).filter(isPublicCmsFaqItem)
    : (module.items || []).filter(isPublicCmsLinkedRecord);

  return {
    ...module,
    proofType: undefined,
    proofSource: undefined,
    sourceSystem: undefined,
    originalPathOrRoute: undefined,
    assetCategory: undefined,
    provenanceStatus: undefined,
    approvalStatus: undefined,
    allowedUsage: undefined,
    blockedUsage: undefined,
    sourceNote: undefined,
    fallbackLanguage: undefined,
    formIntent: undefined,
    stateCandidates: undefined,
    retailerDataStatus: undefined,
    legalGateStatus: undefined,
    primaryCta: sanitizePublicCta(module.primaryCta),
    secondaryCta: sanitizePublicCta(module.secondaryCta),
    cta: sanitizePublicCta(module.cta),
    visibleCta: sanitizePublicCta(module.visibleCta),
    ctaLabel: undefined,
    ctaHref: undefined,
    moduleControl: module.moduleControl
      ? {
          ...module.moduleControl,
          internalLabel: undefined,
        }
      : undefined,
    heroAssetRecord: isPublicCmsAsset(module.heroAssetRecord)
      ? module.heroAssetRecord
      : undefined,
    assetRecord: isPublicCmsAsset(module.assetRecord)
      ? module.assetRecord
      : undefined,
    assetRecords: publicAssets,
    assetRecordRefs: [],
    platform: sanitizePublicLinkedRecord(module.platform),
    format: sanitizePublicLinkedRecord(module.format),
    linkedLocatorRegion: sanitizePublicLinkedRecord(module.linkedLocatorRegion),
    contactProfile: isPublicCmsContactProfile(module.contactProfile)
      ? module.contactProfile
      : undefined,
    cards: (module.cards || []).filter(isPublicCmsCard),
    featuredGuides: (module.featuredGuides || []).filter(isPublicCmsLinkedRecord),
    relatedPlatforms: (module.relatedPlatforms || []).filter(isPublicCmsLinkedRecord),
    relatedProductLinks: (module.relatedProductLinks || []).filter(isPublicCmsLinkedRecord),
    facts: (module.facts || []).filter(isPublicCmsFact),
    columns: (module.columns || []).filter(
      (column) => !column.contentRef || isPublicCmsLinkedRecord(column.contentRef),
    ),
    items: publicItems,
  };
}
