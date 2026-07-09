import type { SeoRouteRecord } from "../route-types";
import { buildRouteCanonicalUrl } from "../route-helpers";
import { ROUTE_REGISTRY } from "../routes";
import type {
  AssetProvenanceRecord,
  AssetRecord,
  ClaimRecord,
  ProofRecord,
  RoutePublicationRecord,
  SchemaRecord,
  SeoMetadataRecord,
  SourceRecord,
  SourceRecordGateResult,
} from "./types";

export const APPROVED_ROUTE_PUBLICATIONS = [] as const satisfies readonly RoutePublicationRecord[];
export const ROUTE_PUBLICATION_APPROVAL_SEQUENCE = [
  "home",
  "moon-rocks",
  "our-story",
  "learn",
  "find-us",
  "contact",
] as const;

export type NextRoutePublicationCandidate = {
  readonly route: SeoRouteRecord;
  readonly publicationBlockReasons: readonly string[];
  readonly sitemapBlockReasons: readonly string[];
};

export type RoutePublicationGateContext = {
  readonly metadataRecords?: readonly SeoMetadataRecord[];
  readonly schemaRecords?: readonly SchemaRecord[];
  readonly sourceRecords?: readonly SourceRecord[];
  readonly proofRecords?: readonly ProofRecord[];
  readonly claimRecords?: readonly ClaimRecord[];
  readonly assetRecords?: readonly AssetRecord[];
  readonly assetProvenanceRecords?: readonly AssetProvenanceRecord[];
};

export const APPROVED_SEO_METADATA_RECORDS = [] as const satisfies readonly SeoMetadataRecord[];
export const APPROVED_SCHEMA_RECORDS = [] as const satisfies readonly SchemaRecord[];
export const APPROVED_SOURCE_RECORDS = [] as const satisfies readonly SourceRecord[];
export const APPROVED_PROOF_RECORDS = [] as const satisfies readonly ProofRecord[];
export const APPROVED_CLAIM_RECORDS = [] as const satisfies readonly ClaimRecord[];
export const APPROVED_ASSET_RECORDS = [] as const satisfies readonly AssetRecord[];
export const APPROVED_ASSET_PROVENANCE_RECORDS = [] as const satisfies readonly AssetProvenanceRecord[];
export const APPROVED_ROUTE_PUBLICATION_CONTEXT = {
  metadataRecords: APPROVED_SEO_METADATA_RECORDS,
  schemaRecords: APPROVED_SCHEMA_RECORDS,
  sourceRecords: APPROVED_SOURCE_RECORDS,
  proofRecords: APPROVED_PROOF_RECORDS,
  claimRecords: APPROVED_CLAIM_RECORDS,
  assetRecords: APPROVED_ASSET_RECORDS,
  assetProvenanceRecords: APPROVED_ASSET_PROVENANCE_RECORDS,
} as const satisfies RoutePublicationGateContext;

function getRecordsById<T>(
  records: readonly T[] | undefined,
  getId: (record: T) => string,
): Map<string, T> {
  return new Map((records ?? []).map((record) => [getId(record), record]));
}

function pushMissingRecordReasons(
  reasons: string[],
  prefix: string,
  ids: readonly string[],
  recordsById: ReadonlyMap<string, unknown>,
): void {
  for (const id of ids) {
    if (!recordsById.has(id)) {
      reasons.push(`source_record:${prefix}:missing:${id}`);
    }
  }
}

function routeRequiresClaimEvidence(route: SeoRouteRecord): boolean {
  return (
    route.requiredData.includes("claims") ||
    route.requiredApprovals.some((approval) => /claim/i.test(approval))
  );
}

function routePublicationEvidenceCount(record: RoutePublicationRecord): number {
  return [
    record.primaryEntityRecordId,
    record.metadataRecordId,
    ...record.contentRecordIds,
    ...record.schemaRecordIds,
    ...record.assetRecordIds,
    ...record.claimRecordIds,
    ...record.sourceRecordIds,
    ...record.proofRecordIds,
    ...(record.complianceRecordIds ?? []),
  ].filter(Boolean).length;
}

function previousRoutePublicationIds(route: SeoRouteRecord): readonly string[] {
  const routeIndex = ROUTE_PUBLICATION_APPROVAL_SEQUENCE.findIndex(
    (routeId) => routeId === route.id,
  );

  if (routeIndex <= 0) {
    return [];
  }

  return ROUTE_PUBLICATION_APPROVAL_SEQUENCE.slice(0, routeIndex);
}

export function getRoutePublicationRecord(
  route: SeoRouteRecord,
  records: readonly RoutePublicationRecord[] = APPROVED_ROUTE_PUBLICATIONS,
): RoutePublicationRecord | undefined {
  return records.find(
    (record) => record.routeId === route.id && record.path === route.path,
  );
}

export function getNextRoutePublicationCandidate(
  records: readonly RoutePublicationRecord[] = APPROVED_ROUTE_PUBLICATIONS,
  context: RoutePublicationGateContext = APPROVED_ROUTE_PUBLICATION_CONTEXT,
): NextRoutePublicationCandidate | undefined {
  for (const routeId of ROUTE_PUBLICATION_APPROVAL_SEQUENCE) {
    const route = ROUTE_REGISTRY.find(
      (candidate) => candidate.id === routeId,
    ) as SeoRouteRecord | undefined;

    if (!route) {
      continue;
    }

    const publicationBlockReasons = getRoutePublicationGateBlockReasons(
      route,
      records,
      context,
    );
    const sitemapBlockReasons = [
      ...(route.status !== "approved" ? [`status:${route.status}`] : []),
      ...(route.indexability !== "index_follow"
        ? [`indexability:${route.indexability}`]
        : []),
      ...(route.sitemap !== "include" ? [`sitemap:${route.sitemap}`] : []),
      ...route.blocks.map((block) => `block:${block}`),
      ...publicationBlockReasons,
    ];

    if (publicationBlockReasons.length > 0 || sitemapBlockReasons.length > 0) {
      return {
        route,
        publicationBlockReasons,
        sitemapBlockReasons,
      };
    }
  }

  return undefined;
}

export function getRoutePublicationGateBlockReasons(
  route: SeoRouteRecord,
  records: readonly RoutePublicationRecord[] = APPROVED_ROUTE_PUBLICATIONS,
  context: RoutePublicationGateContext = APPROVED_ROUTE_PUBLICATION_CONTEXT,
  options: { readonly skipSequence?: boolean } = {},
): readonly string[] {
  const matchingRecords = records.filter(
    (candidate) => candidate.routeId === route.id && candidate.path === route.path,
  );
  const record = matchingRecords[0];

  if (!record) {
    return ["source_record:route_publication_missing"];
  }

  const reasons: string[] = [];

  if (matchingRecords.length > 1) {
    reasons.push("source_record:route_publication_duplicate");
  }

  if (record.publicationStatus !== "published") {
    reasons.push(`source_record:publication:${record.publicationStatus}`);
  }

  if (record.approvalStatus !== "approved") {
    reasons.push(`source_record:approval:${record.approvalStatus}`);
  }

  if (record.confidentialityStatus !== "public") {
    reasons.push(`source_record:confidentiality:${record.confidentialityStatus}`);
  }

  if (record.indexability !== "index_follow") {
    reasons.push(`source_record:indexability:${record.indexability}`);
  }

  if (record.sitemapPolicy !== "include") {
    reasons.push(`source_record:sitemap:${record.sitemapPolicy}`);
  }

  if (record.canonicalStatus !== "production") {
    reasons.push(`source_record:canonical:${record.canonicalStatus}`);
  }

  if (routePublicationEvidenceCount(record) === 0) {
    reasons.push("source_record:evidence:required");
  }

  if (record.metadataApprovalStatus !== "approved") {
    reasons.push(`source_record:metadata:${record.metadataApprovalStatus}`);
  }

  if (
    record.metadataApprovalStatus === "approved" &&
    !record.metadataRecordId
  ) {
    reasons.push("source_record:metadata_record:required");
  }

  if (record.schemaApprovalStatus !== "approved") {
    reasons.push(`source_record:schema:${record.schemaApprovalStatus}`);
  }

  if (
    record.schemaApprovalStatus === "approved" &&
    route.schema.length > 0 &&
    record.schemaRecordIds.length === 0
  ) {
    reasons.push("source_record:schema_record:required");
  }

  if (record.contentApprovalStatus !== "approved") {
    reasons.push(`source_record:content:${record.contentApprovalStatus}`);
  }

  if (
    record.contentApprovalStatus === "approved" &&
    record.contentRecordIds.length === 0
  ) {
    reasons.push("source_record:content_record:required");
  }

  if (record.assetApprovalStatus !== "approved") {
    reasons.push(`source_record:asset:${record.assetApprovalStatus}`);
  }

  if (
    record.assetApprovalStatus === "approved" &&
    record.assetRecordIds.length === 0
  ) {
    reasons.push("source_record:asset:required");
  }

  if (
    record.proofStatus !== "verified" &&
    record.proofStatus !== "not_required"
  ) {
    reasons.push(`source_record:proof:${record.proofStatus}`);
  }

  if (record.proofStatus === "verified" && record.proofRecordIds.length === 0) {
    reasons.push("source_record:proof:required");
  }

  if (
    record.complianceStatus !== "approved" &&
    record.complianceStatus !== "not_required"
  ) {
    reasons.push(`source_record:compliance:${record.complianceStatus}`);
  }

  if (
    record.complianceStatus === "approved" &&
    (record.complianceRecordIds?.length ?? 0) === 0
  ) {
    reasons.push("source_record:compliance_record:required");
  }

  for (const complianceRecordId of record.complianceRecordIds ?? []) {
    if (!record.proofRecordIds.includes(complianceRecordId)) {
      reasons.push(`source_record:compliance_record:not_in_proof_evidence:${complianceRecordId}`);
    }
  }

  if (!options.skipSequence) {
    for (const previousRouteId of previousRoutePublicationIds(route)) {
      const previousRoute = ROUTE_REGISTRY.find(
        (candidate) => candidate.id === previousRouteId,
      );

      if (!previousRoute) {
        reasons.push(`source_record:publication_sequence:route_missing:${previousRouteId}`);
        continue;
      }

      if (
        getRoutePublicationGateBlockReasons(previousRoute, records, context, {
          skipSequence: true,
        }).length > 0
      ) {
        reasons.push(`source_record:publication_sequence:previous_not_approved:${previousRouteId}`);
      }
    }
  }

  if (record.sourceRecordIds.length === 0) {
    reasons.push("source_record:source:required");
  }

  if (routeRequiresClaimEvidence(route) && record.claimRecordIds.length === 0) {
    reasons.push("source_record:claim:required");
  }

  const metadataById = getRecordsById(context.metadataRecords, (metadata) => metadata.seoId);
  const schemaById = getRecordsById(context.schemaRecords, (schema) => schema.schemaId);
  const sourceById = getRecordsById(context.sourceRecords, (source) => source.sourceId);
  const proofById = getRecordsById(context.proofRecords, (proof) => proof.proofId);
  const claimById = getRecordsById(context.claimRecords, (claim) => claim.claimId);
  const assetById = getRecordsById(context.assetRecords, (asset) => asset.assetId);
  const provenanceByAssetId = getRecordsById(
    context.assetProvenanceRecords,
    (provenance) => provenance.assetId,
  );

  if (record.metadataRecordId) {
    const metadata = metadataById.get(record.metadataRecordId);
    if (!metadata) {
      reasons.push(`source_record:metadata_record:missing:${record.metadataRecordId}`);
    } else {
      if (metadata.routeId !== route.id) {
        reasons.push(`source_record:metadata_record:route_mismatch:${metadata.seoId}`);
      }

      if (metadata.approvalStatus !== "approved") {
        reasons.push(`source_record:metadata_record:approval:${metadata.approvalStatus}`);
      }

      if (metadata.robotsDirective !== "index_follow") {
        reasons.push(`source_record:metadata_record:robots:${metadata.robotsDirective}`);
      }

      if (metadata.canonicalUrl !== buildRouteCanonicalUrl(route)) {
        reasons.push(`source_record:metadata_record:canonical_mismatch:${metadata.seoId}`);
      }
    }
  }

  pushMissingRecordReasons(reasons, "schema_record", record.schemaRecordIds, schemaById);
  for (const schemaId of record.schemaRecordIds) {
    const schema = schemaById.get(schemaId);
    if (!schema) {
      continue;
    }

    if (schema.routeId !== route.id) {
      reasons.push(`source_record:schema_record:route_mismatch:${schema.schemaId}`);
    }

    if (schema.approvalStatus !== "approved") {
      reasons.push(`source_record:schema_record:approval:${schema.approvalStatus}`);
    }

    if (schema.validationStatus !== "approved") {
      reasons.push(`source_record:schema_record:validation:${schema.validationStatus}`);
    }

    if (!schema.visibleContentMatch) {
      reasons.push(`source_record:schema_record:visible_content_missing:${schema.schemaId}`);
    }
  }

  pushMissingRecordReasons(reasons, "source", record.sourceRecordIds, sourceById);
  for (const sourceId of record.sourceRecordIds) {
    const source = sourceById.get(sourceId);
    if (source && !isSourceAllowedForPublicSeo(source)) {
      reasons.push(`source_record:source:not_public_production:${source.sourceId}`);
    }
  }

  pushMissingRecordReasons(reasons, "proof", record.proofRecordIds, proofById);
  for (const proofId of record.proofRecordIds) {
    const proof = proofById.get(proofId);
    if (proof && !isProofApprovedForPublicClaim(proof)) {
      reasons.push(`source_record:proof:not_approved:${proof.proofId}`);
    }
  }

  pushMissingRecordReasons(
    reasons,
    "compliance_record",
    record.complianceRecordIds ?? [],
    proofById,
  );
  for (const complianceRecordId of record.complianceRecordIds ?? []) {
    const complianceProof = proofById.get(complianceRecordId);
    if (complianceProof && !isProofApprovedForPublicClaim(complianceProof)) {
      reasons.push(`source_record:compliance_record:not_approved:${complianceProof.proofId}`);
    }
  }

  pushMissingRecordReasons(reasons, "claim", record.claimRecordIds, claimById);
  for (const claimId of record.claimRecordIds) {
    const claim = claimById.get(claimId);
    if (claim && !isClaimApprovedForPublicSeo(claim)) {
      reasons.push(`source_record:claim:not_approved:${claim.claimId}`);
    }
  }

  pushMissingRecordReasons(reasons, "asset", record.assetRecordIds, assetById);
  for (const assetId of record.assetRecordIds) {
    const asset = assetById.get(assetId);
    const provenance = provenanceByAssetId.get(assetId);

    if (!asset) {
      continue;
    }

    if (!provenance) {
      reasons.push(`source_record:asset_provenance:missing:${assetId}`);
      continue;
    }

    if (!isAssetApprovedForPublicSeo(asset, provenance)) {
      reasons.push(`source_record:asset:not_approved:${asset.assetId}`);
    }
  }

  for (const blocker of record.launchBlockers) {
    reasons.push(`source_record:block:${blocker}`);
  }

  return reasons;
}

export function isRoutePublicationApprovedForSeo(
  route: SeoRouteRecord,
  records: readonly RoutePublicationRecord[] = APPROVED_ROUTE_PUBLICATIONS,
  context: RoutePublicationGateContext = APPROVED_ROUTE_PUBLICATION_CONTEXT,
): boolean {
  return getRoutePublicationGateBlockReasons(route, records, context).length === 0;
}

export function evaluateRoutePublicationGate(
  route: SeoRouteRecord,
  records: readonly RoutePublicationRecord[] = APPROVED_ROUTE_PUBLICATIONS,
  context: RoutePublicationGateContext = APPROVED_ROUTE_PUBLICATION_CONTEXT,
): SourceRecordGateResult {
  const blockReasons = getRoutePublicationGateBlockReasons(route, records, context);

  return {
    allowed: blockReasons.length === 0,
    blockReasons,
  };
}

export function isSourceAllowedForPublicSeo(source: SourceRecord): boolean {
  return (
    source.allowedUsage === "production" &&
    source.confidentialityStatus === "public"
  );
}

export function isProofApprovedForPublicClaim(proof: ProofRecord): boolean {
  return (
    proof.approvalStatus === "approved" &&
    (proof.proofLevel === "official_primary" ||
      proof.proofLevel === "client_confirmed")
  );
}

export function isClaimApprovedForPublicSeo(claim: ClaimRecord): boolean {
  return (
    claim.approvalStatus === "approved" &&
    (!claim.proofRequired || claim.proofStatus === "verified") &&
    !claim.clientConfirmationNeeded &&
    !claim.legalReviewRequired
  );
}

export function isAssetApprovedForPublicSeo(
  asset: AssetRecord,
  provenance: AssetProvenanceRecord,
): boolean {
  return (
    asset.approvalStatus === "approved" &&
    asset.rightsStatus === "approved" &&
    Boolean(asset.altText?.trim()) &&
    provenance.assetId === asset.assetId &&
    provenance.blacklistCheckStatus === "passed" &&
    provenance.verificationStatus === "approved"
  );
}
