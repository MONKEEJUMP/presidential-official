import type { SeoRouteRecord } from "../route-types";
import type {
  AssetProvenanceRecord,
  AssetRecord,
  ClaimRecord,
  ProofRecord,
  RoutePublicationRecord,
  SourceRecord,
  SourceRecordGateResult,
} from "./types";

export const APPROVED_ROUTE_PUBLICATIONS = [] as const satisfies readonly RoutePublicationRecord[];

export function getRoutePublicationRecord(
  route: SeoRouteRecord,
  records: readonly RoutePublicationRecord[] = APPROVED_ROUTE_PUBLICATIONS,
): RoutePublicationRecord | undefined {
  return records.find(
    (record) => record.routeId === route.id && record.path === route.path,
  );
}

export function getRoutePublicationGateBlockReasons(
  route: SeoRouteRecord,
  records: readonly RoutePublicationRecord[] = APPROVED_ROUTE_PUBLICATIONS,
): readonly string[] {
  const record = getRoutePublicationRecord(route, records);

  if (!record) {
    return ["source_record:route_publication_missing"];
  }

  const reasons: string[] = [];

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

  if (record.metadataApprovalStatus !== "approved") {
    reasons.push(`source_record:metadata:${record.metadataApprovalStatus}`);
  }

  if (record.schemaApprovalStatus !== "approved") {
    reasons.push(`source_record:schema:${record.schemaApprovalStatus}`);
  }

  if (record.contentApprovalStatus !== "approved") {
    reasons.push(`source_record:content:${record.contentApprovalStatus}`);
  }

  if (record.assetApprovalStatus !== "approved") {
    reasons.push(`source_record:asset:${record.assetApprovalStatus}`);
  }

  if (
    record.proofStatus !== "verified" &&
    record.proofStatus !== "not_required"
  ) {
    reasons.push(`source_record:proof:${record.proofStatus}`);
  }

  if (
    record.complianceStatus !== "approved" &&
    record.complianceStatus !== "not_required"
  ) {
    reasons.push(`source_record:compliance:${record.complianceStatus}`);
  }

  for (const blocker of record.launchBlockers) {
    reasons.push(`source_record:block:${blocker}`);
  }

  return reasons;
}

export function isRoutePublicationApprovedForSeo(
  route: SeoRouteRecord,
  records: readonly RoutePublicationRecord[] = APPROVED_ROUTE_PUBLICATIONS,
): boolean {
  return getRoutePublicationGateBlockReasons(route, records).length === 0;
}

export function evaluateRoutePublicationGate(
  route: SeoRouteRecord,
  records: readonly RoutePublicationRecord[] = APPROVED_ROUTE_PUBLICATIONS,
): SourceRecordGateResult {
  const blockReasons = getRoutePublicationGateBlockReasons(route, records);

  return {
    allowed: blockReasons.length === 0,
    blockReasons,
  };
}

export function isSourceAllowedForPublicSeo(source: SourceRecord): boolean {
  return source.allowedUsage === "production";
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

