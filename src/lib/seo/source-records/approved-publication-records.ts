import { APPROVED_PUBLIC_SEO_ROUTES } from "../approved-public-routes";
import { buildRouteCanonicalUrl } from "../route-helpers";
import { getRouteShellSchemaContracts } from "../schema/route-contract";
import type {
  AssetProvenanceRecord,
  AssetRecord,
  ClaimRecord,
  ProofRecord,
  RouteContentRecord,
  RouteEntityRecord,
  RoutePublicationRecord,
  SchemaRecord,
  SeoMetadataRecord,
  SourceRecord,
} from "./types";

const OWNER_APPROVAL_SOURCE_ID = "source-owner-7734-publication-approval";
const PRE_ROLLS_APPROVAL_SOURCE_ID = "source-owner-0912-pre-rolls-publication-approval";
const BLUNTS_APPROVAL_SOURCE_ID = "source-owner-0912-blunts-publication-approval";
const SHARED_BRAND_ASSET_ID = "asset-presidential-header-banner";
const OWNER_APPROVAL_DATE = "2026-08-04";
const isPartners = (route: {path:string}) => route.path === '/partners' || route.path.startsWith('/partners/');
const isPreRolls = (route: {path:string}) => route.path === '/pre-rolls';
const isBlunts = (route: {path:string}) => route.path === '/blunts';
const approvalSource = (route: {path:string}) => isPartners(route)
  ? 'source-owner-0907-pres-kvrt-0010'
  : isPreRolls(route)
    ? PRE_ROLLS_APPROVAL_SOURCE_ID
    : isBlunts(route)
      ? BLUNTS_APPROVAL_SOURCE_ID
      : OWNER_APPROVAL_SOURCE_ID;
const approvalDate = (route: {path:string}) => isPartners(route)
  ? '2026-09-07'
  : isPreRolls(route)
    ? '2026-09-12'
    : isBlunts(route)
      ? '2026-09-12'
      : OWNER_APPROVAL_DATE;
const approvalLocator = (route: {path:string}) => isPartners(route)
  ? '0907-PRES-KVRT-0010 and owner count ruling, 2026-09-07'
  : isPreRolls(route)
    ? 'presidential-official-005 owner build, live-publication, navigation, indexing, and sitemap directive, 2026-09-12'
    : isBlunts(route)
      ? 'presidential-official-005 owner Blunts build and standing live-publication directive, 2026-09-12'
      : '7734-SPUD owner directive dated 2026-08-04';

function recordId(prefix: string, routeId: string): string {
  return `${prefix}-${routeId}`;
}

function publicationId(routeId: string): string {
  return recordId("route-publication", routeId);
}

function claimId(routeId: string): string {
  return recordId("claim", routeId);
}

function proofId(routeId: string): string {
  return recordId("proof-owner-approval", routeId);
}

export const APPROVED_PUBLICATION_SOURCE_RECORDS = [
  {sourceId:'source-owner-0907-pres-kvrt-0010',sourceName:'0907-PRES-KVRT-0010 owner publication ruling',sourceType:'client_provided',sourceLocator:'0907-PRES-KVRT-0010 and owner count ruling, 2026-09-07',allowedUsage:'production',confidentialityStatus:'public',publisherOrProvider:'PAULIEWOOD',confidenceScore:100,verifiedBy:'PAULIEWOOD',verifiedAt:'2026-09-07',notes:'Owner approved partners copy, staged logos, exclusions, production deployment, and indexing. Published headline totals intentionally differ from tile totals.'},
  {
    sourceId: PRE_ROLLS_APPROVAL_SOURCE_ID,
    sourceName: "0912-001 owner Pre-Rolls publication approval",
    sourceType: "client_provided",
    sourceLocator:
      "presidential-official-005 owner build and standing live-publication directive, 2026-09-12",
    allowedUsage: "production",
    confidentialityStatus: "public",
    publisherOrProvider: "PAULIEWOOD",
    confidenceScore: 100,
    verifiedBy: "PAULIEWOOD",
    verifiedAt: "2026-09-12",
    notes:
      "Owner supplied 27 Pre-Rolls graphics, approved their use on a new public page, and directed publication with menu, indexing, and sitemap integration.",
  },
  {
    sourceId: BLUNTS_APPROVAL_SOURCE_ID,
    sourceName: "0912-002 owner Blunts publication approval",
    sourceType: "client_provided",
    sourceLocator:
      "presidential-official-005 owner Blunts build and standing live-publication directive, 2026-09-12",
    allowedUsage: "production",
    confidentialityStatus: "public",
    publisherOrProvider: "PAULIEWOOD",
    confidenceScore: 100,
    verifiedBy: "PAULIEWOOD",
    verifiedAt: "2026-09-12",
    notes:
      "Owner supplied 42 Blunts files and directed one selected artwork per product after removing five duplicate treatments and one exact Crescendo duplicate, leaving 36 displayed graphics with Products-menu, footer, indexing, and sitemap integration.",
  },
  {
    sourceId: OWNER_APPROVAL_SOURCE_ID,
    sourceName: "7734-SPUD owner publication and indexing approval",
    sourceType: "client_provided",
    sourceLocator: "7734-SPUD owner directive dated 2026-08-04",
    allowedUsage: "production",
    confidentialityStatus: "public",
    publisherOrProvider: "PAULIEWOOD",
    confidenceScore: 100,
    verifiedBy: "PAULIEWOOD",
    verifiedAt: OWNER_APPROVAL_DATE,
    notes:
      "The owner, CTO, and legal authority explicitly approved the current copy and ordered public indexing on the production domain.",
  },
] as const satisfies readonly SourceRecord[];

export const APPROVED_PUBLICATION_ASSET_RECORDS = [
  {
    assetId: SHARED_BRAND_ASSET_ID,
    filename: "presidential-banner.png",
    storageUrl: "/media/brand/presidential-banner.png",
    assetType: "logo",
    width: 1839,
    height: 604,
    altText: "Presidential",
    usageTier: "public",
    relatedEntityIds: APPROVED_PUBLIC_SEO_ROUTES.map((route) => route.id),
    rightsStatus: "approved",
    approvalStatus: "approved",
  },
] as const satisfies readonly AssetRecord[];

export const APPROVED_PUBLICATION_ASSET_PROVENANCE_RECORDS = [
  {
    provenanceId: "provenance-presidential-header-banner",
    assetId: SHARED_BRAND_ASSET_ID,
    sourceId: OWNER_APPROVAL_SOURCE_ID,
    intakeMethod: "client_drop",
    originalLocator:
      "Owner-supplied Presidential banner mounted in commit 6de75eb7238b7f84a1a62642c770f0e2b397df78",
    clientProvider: "PAULIEWOOD",
    capturedAt: "2026-07-14T20:10:24.000Z",
    blacklistCheckStatus: "passed",
    verificationStatus: "approved",
    verifiedBy: "PAULIEWOOD",
    notes: "Public brand asset present in the shared header on every approved route.",
  },
] as const satisfies readonly AssetProvenanceRecord[];

export const APPROVED_PUBLICATION_ENTITY_RECORDS =
  APPROVED_PUBLIC_SEO_ROUTES.map(
    (route): RouteEntityRecord => ({
      entityId: recordId("entity", route.id),
      routeId: route.id,
      approvalStatus: "approved",
    }),
  );

export const APPROVED_PUBLICATION_CONTENT_RECORDS =
  APPROVED_PUBLIC_SEO_ROUTES.map(
    (route): RouteContentRecord => ({
      contentId: recordId("content", route.id),
      routeId: route.id,
      approvalStatus: "approved",
    }),
  );

export const APPROVED_PUBLICATION_METADATA_RECORDS =
  APPROVED_PUBLIC_SEO_ROUTES.map(
    (route): SeoMetadataRecord => ({
      seoId: recordId("metadata", route.id),
      routeId: route.id,
      h1: route.h1,
      metaTitle: route.title,
      metaDescription: route.description,
      canonicalUrl: buildRouteCanonicalUrl(route),
      robotsDirective: "index_follow",
      ogTitle: route.title,
      ogDescription: route.description,
      primaryKeyword: route.keywords[0] ?? route.h1.toLowerCase(),
      secondaryKeywords: route.keywords.slice(1),
      reviewedAt: approvalDate(route),
      approvalStatus: "approved",
    }),
  );

export const APPROVED_PUBLICATION_CLAIM_RECORDS =
  APPROVED_PUBLIC_SEO_ROUTES.map(
    (route): ClaimRecord => ({
      claimId: claimId(route.id),
      claimText: route.description,
      normalizedClaim: route.description.trim().toLowerCase(),
      claimType: route.kind === "store_locator" ? "availability" : "brand_positioning",
      relatedEntityType: "route_publication",
      relatedEntityId: publicationId(route.id),
      proofRequired: true,
      proofStatus: "verified",
      allowedUses: [route.path, "metadata", "schema"],
      disallowedUses: ["medical", "commerce", "pricing", "shipping"],
      complianceRiskScore: 10,
      clientConfirmationNeeded: false,
      legalReviewRequired: false,
      approvalStatus: "approved",
    }),
  );

export const APPROVED_PUBLICATION_PROOF_RECORDS =
  APPROVED_PUBLIC_SEO_ROUTES.map(
    (route): ProofRecord => ({
      proofId: proofId(route.id),
      sourceId: approvalSource(route),
      relatedRecordType: "route_publication",
      relatedRecordId: publicationId(route.id),
      evidenceType: "client_confirmation",
      evidenceLocator: approvalLocator(route),
      proofSummary:
        `PAULIEWOOD approved the current ${route.path} copy, metadata, compliance posture, and public indexing as owner, CTO, and legal authority.`,
      proofLevel: "client_confirmed",
      confidenceScore: 100,
      verifiedBy: "PAULIEWOOD",
      verifiedAt: approvalDate(route),
      approvalStatus: "approved",
    }),
  );

export const APPROVED_PUBLICATION_SCHEMA_RECORDS =
  APPROVED_PUBLIC_SEO_ROUTES.flatMap((route): readonly SchemaRecord[] =>
    getRouteShellSchemaContracts(route).map((contract) => ({
      schemaId: recordId(`schema-${contract.schemaType.toLowerCase()}`, route.id),
      routeId: route.id,
      schemaType: contract.schemaType,
      sourceFieldMap: contract.sourceFieldMap,
      claimsUsed: contract.schemaType === "WebPage" ? [claimId(route.id)] : [],
      visibleContentMatch: true,
      validationStatus: "approved",
      approvalStatus: "approved",
    })),
  );

export const APPROVED_PUBLICATION_ROUTE_RECORDS =
  APPROVED_PUBLIC_SEO_ROUTES.map(
    (route): RoutePublicationRecord => ({
      routePublicationId: publicationId(route.id),
      routeId: route.id,
      path: route.path,
      primaryEntityRecordId: recordId("entity", route.id),
      contentRecordIds: [recordId("content", route.id)],
      metadataRecordId: recordId("metadata", route.id),
      schemaRecordIds: getRouteShellSchemaContracts(route).map((contract) =>
        recordId(`schema-${contract.schemaType.toLowerCase()}`, route.id),
      ),
      assetRecordIds: [SHARED_BRAND_ASSET_ID],
      claimRecordIds: [claimId(route.id)],
      sourceRecordIds: [approvalSource(route)],
      proofRecordIds: [proofId(route.id)],
      complianceRecordIds: [proofId(route.id)],
      publicationStatus: "published",
      approvalStatus: "approved",
      confidentialityStatus: "public",
      indexability: "index_follow",
      sitemapPolicy: "include",
      canonicalStatus: "production",
      metadataApprovalStatus: "approved",
      schemaApprovalStatus: "approved",
      contentApprovalStatus: "approved",
      assetApprovalStatus: "approved",
      proofStatus: "verified",
      complianceStatus: "approved",
      lastReviewedAt: approvalDate(route),
      launchBlockers: [],
    }),
  );
