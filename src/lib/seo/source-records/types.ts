import type { SeoRoutePath } from "../route-types";

export type PublicationStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "scheduled"
  | "published"
  | "retired"
  | "blocked";

export type ApprovalStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "rejected"
  | "blocked";

export type ProofStatus =
  | "not_required"
  | "missing"
  | "partial"
  | "verified"
  | "rejected";

export type ComplianceStatus =
  | "not_required"
  | "needs_review"
  | "approved"
  | "rejected"
  | "blocked";

export type AssetStatus =
  | "not_required"
  | "needs_provenance"
  | "needs_alt_text"
  | "approved"
  | "blocked";

export type SchemaStatus =
  | "not_required"
  | "draft"
  | "visible_content_missing"
  | "source_mapping_missing"
  | "needs_validation"
  | "approved"
  | "blocked";

export type RoutePublicationIndexability =
  | "not_published"
  | "noindex_follow"
  | "conditional_index"
  | "index_follow"
  | "excluded_from_sitemap";

export type RoutePublicationSitemapPolicy =
  | "include"
  | "exclude"
  | "conditional";

export type ConfidentialityStatus =
  | "public"
  | "private"
  | "internal"
  | "confidential";

export type AllowedUsage =
  | "production"
  | "reference_only"
  | "internal_evidence"
  | "never_use";

export type ProofLevel =
  | "official_primary"
  | "client_confirmed"
  | "third_party_primary"
  | "modeled"
  | "unverified";

export type SourceType =
  | "owner_blueprint"
  | "client_provided"
  | "official_profile"
  | "official_site"
  | "official_marketplace"
  | "third_party_primary"
  | "internal_research"
  | "threat_research"
  | "draft_asset_reference";

export type ClaimType =
  | "heritage"
  | "founder_company"
  | "distribution"
  | "market_position"
  | "brand_positioning"
  | "product_fact"
  | "product_composition"
  | "technology"
  | "availability"
  | "education"
  | "compliance";

export type RelatedRecordType =
  | "company_entity"
  | "social_profile"
  | "asset"
  | "product_platform"
  | "product_series"
  | "product"
  | "learn_article"
  | "store"
  | "store_availability"
  | "seo_metadata"
  | "schema"
  | "route_publication";

export type EvidenceType =
  | "document"
  | "client_confirmation"
  | "official_url"
  | "asset_drop"
  | "marketplace_profile"
  | "manual_review";

export type SourceRecord = {
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  sourceLocator: string;
  allowedUsage: AllowedUsage;
  publisherOrProvider: string;
  confidenceScore: number;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
};

export type ProofRecord = {
  proofId: string;
  sourceId: SourceRecord["sourceId"];
  relatedRecordType: RelatedRecordType;
  relatedRecordId: string;
  evidenceType: EvidenceType;
  evidenceLocator: string;
  proofSummary: string;
  proofLevel: ProofLevel;
  confidenceScore: number;
  verifiedBy?: string;
  verifiedAt?: string;
  approvalStatus: ApprovalStatus;
};

export type ClaimRecord = {
  claimId: string;
  claimText: string;
  normalizedClaim: string;
  claimType: ClaimType;
  relatedEntityType: RelatedRecordType;
  relatedEntityId: string;
  proofRequired: boolean;
  proofStatus: ProofStatus;
  allowedUses: readonly string[];
  disallowedUses: readonly string[];
  complianceRiskScore: number;
  clientConfirmationNeeded: boolean;
  legalReviewRequired: boolean;
  approvalStatus: ApprovalStatus;
};

export type AssetRecord = {
  assetId: string;
  filename: string;
  storageUrl: string;
  assetType: "image" | "video" | "logo" | "document";
  width?: number;
  height?: number;
  altText?: string;
  caption?: string;
  usageTier: "public" | "internal" | "reference_only";
  relatedEntityIds: readonly string[];
  rightsStatus: AssetStatus;
  approvalStatus: ApprovalStatus;
};

export type AssetProvenanceRecord = {
  provenanceId: string;
  assetId: AssetRecord["assetId"];
  sourceId: SourceRecord["sourceId"];
  intakeMethod: "client_drop" | "official_download" | "draft_scrape" | "manual";
  originalLocator: string;
  clientProvider?: string;
  capturedAt: string;
  blacklistCheckStatus: "passed" | "failed" | "not_checked";
  verificationStatus: AssetStatus;
  verifiedBy?: string;
  notes?: string;
};

export type SeoMetadataRecord = {
  seoId: string;
  routeId: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  robotsDirective: "index_follow" | "noindex_follow";
  ogTitle: string;
  ogDescription: string;
  ogImageId?: AssetRecord["assetId"];
  primaryKeyword: string;
  secondaryKeywords: readonly string[];
  reviewedAt?: string;
  approvalStatus: ApprovalStatus;
};

export type SchemaRecord = {
  schemaId: string;
  routeId: string;
  schemaType:
    | "Organization"
    | "WebSite"
    | "WebPage"
    | "BreadcrumbList"
    | "Article"
    | "ItemList"
    | "Product"
    | "LocalBusiness";
  sourceFieldMap: Readonly<Record<string, string>>;
  claimsUsed: readonly ClaimRecord["claimId"][];
  visibleContentMatch: boolean;
  validationStatus: SchemaStatus;
  approvalStatus: ApprovalStatus;
};

export type RoutePublicationRecord = {
  routePublicationId: string;
  routeId: string;
  path: SeoRoutePath;
  primaryEntityRecordId?: string;
  contentRecordIds: readonly string[];
  metadataRecordId?: SeoMetadataRecord["seoId"];
  schemaRecordIds: readonly SchemaRecord["schemaId"][];
  assetRecordIds: readonly AssetRecord["assetId"][];
  claimRecordIds: readonly ClaimRecord["claimId"][];
  sourceRecordIds: readonly SourceRecord["sourceId"][];
  proofRecordIds: readonly ProofRecord["proofId"][];
  publicationStatus: PublicationStatus;
  approvalStatus: ApprovalStatus;
  confidentialityStatus: ConfidentialityStatus;
  indexability: RoutePublicationIndexability;
  sitemapPolicy: RoutePublicationSitemapPolicy;
  canonicalStatus: "production" | "non_production" | "unknown";
  metadataApprovalStatus: ApprovalStatus;
  schemaApprovalStatus: SchemaStatus;
  contentApprovalStatus: ApprovalStatus;
  assetApprovalStatus: AssetStatus;
  proofStatus: ProofStatus;
  complianceStatus: ComplianceStatus;
  lastReviewedAt?: string;
  launchBlockers: readonly string[];
};

export type SourceRecordGateResult = {
  allowed: boolean;
  blockReasons: readonly string[];
};

