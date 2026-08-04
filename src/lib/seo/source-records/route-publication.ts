import type { SeoRouteRecord } from "../route-types";
import { buildRouteCanonicalUrl } from "../route-helpers";
import { ROUTE_REGISTRY } from "../routes";
import {
  getEmittedRouteShellSchemaTypes,
  getExpectedRouteShellSchemaSourceFieldMap,
  type RouteShellSchemaType,
} from "../schema/route-contract";
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
  SourceRecordGateResult,
} from "./types";
import {
  APPROVED_PUBLICATION_ASSET_PROVENANCE_RECORDS,
  APPROVED_PUBLICATION_ASSET_RECORDS,
  APPROVED_PUBLICATION_CLAIM_RECORDS,
  APPROVED_PUBLICATION_CONTENT_RECORDS,
  APPROVED_PUBLICATION_ENTITY_RECORDS,
  APPROVED_PUBLICATION_METADATA_RECORDS,
  APPROVED_PUBLICATION_PROOF_RECORDS,
  APPROVED_PUBLICATION_ROUTE_RECORDS,
  APPROVED_PUBLICATION_SCHEMA_RECORDS,
  APPROVED_PUBLICATION_SOURCE_RECORDS,
} from "./approved-publication-records";

export const APPROVED_ROUTE_PUBLICATIONS = APPROVED_PUBLICATION_ROUTE_RECORDS;
export const ROUTE_PUBLICATION_APPROVAL_SEQUENCE = [
  "home",
  "moon-rocks",
  "our-story",
  "learn",
  "find-us",
  "contact",
] as const;
export const ROUTE_PUBLICATION_EVIDENCE_CATEGORIES = [
  "entity",
  "source",
  "proof",
  "claim",
  "asset",
  "metadata",
  "schema",
  "content",
  "compliance",
] as const;

export type NextRoutePublicationCandidate = {
  readonly route: SeoRouteRecord;
  readonly publicationBlockReasons: readonly string[];
  readonly sitemapBlockReasons: readonly string[];
};

export type RoutePublicationEvidenceCategory =
  (typeof ROUTE_PUBLICATION_EVIDENCE_CATEGORIES)[number];

export type RoutePublicationEvidenceRequirement = {
  readonly category: RoutePublicationEvidenceCategory;
  readonly required: boolean;
  readonly status: "blocked" | "not_required";
  readonly reasons: readonly string[];
};

export type RoutePublicationEvidenceScaffold = {
  readonly routeId: string;
  readonly path: SeoRouteRecord["path"];
  readonly requirements: readonly RoutePublicationEvidenceRequirement[];
  readonly publicationBlockReasons: readonly string[];
  readonly sitemapBlockReasons: readonly string[];
  readonly canUnlock: false;
};

export type RoutePublicationGateContext = {
  readonly entityRecords?: readonly RouteEntityRecord[];
  readonly contentRecords?: readonly RouteContentRecord[];
  readonly metadataRecords?: readonly SeoMetadataRecord[];
  readonly schemaRecords?: readonly SchemaRecord[];
  readonly sourceRecords?: readonly SourceRecord[];
  readonly proofRecords?: readonly ProofRecord[];
  readonly claimRecords?: readonly ClaimRecord[];
  readonly assetRecords?: readonly AssetRecord[];
  readonly assetProvenanceRecords?: readonly AssetProvenanceRecord[];
};

export type RouteMetadataEmission = {
  readonly title: string;
  readonly description: string;
  readonly canonicalUrl: string;
  readonly robotsDirective: SeoMetadataRecord["robotsDirective"];
  readonly h1: string;
  readonly ogTitle: string;
  readonly ogDescription: string;
};

export const APPROVED_ROUTE_ENTITY_RECORDS = APPROVED_PUBLICATION_ENTITY_RECORDS;
export const APPROVED_ROUTE_CONTENT_RECORDS = APPROVED_PUBLICATION_CONTENT_RECORDS;
export const APPROVED_SEO_METADATA_RECORDS = APPROVED_PUBLICATION_METADATA_RECORDS;
export const APPROVED_SCHEMA_RECORDS = APPROVED_PUBLICATION_SCHEMA_RECORDS;
export const APPROVED_SOURCE_RECORDS = APPROVED_PUBLICATION_SOURCE_RECORDS;
export const APPROVED_PROOF_RECORDS = APPROVED_PUBLICATION_PROOF_RECORDS;
export const APPROVED_CLAIM_RECORDS = APPROVED_PUBLICATION_CLAIM_RECORDS;
export const APPROVED_ASSET_RECORDS = APPROVED_PUBLICATION_ASSET_RECORDS;
export const APPROVED_ASSET_PROVENANCE_RECORDS =
  APPROVED_PUBLICATION_ASSET_PROVENANCE_RECORDS;
export const APPROVED_ROUTE_PUBLICATION_CONTEXT = {
  entityRecords: APPROVED_ROUTE_ENTITY_RECORDS,
  contentRecords: APPROVED_ROUTE_CONTENT_RECORDS,
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

function getDuplicateIds<T>(
  records: readonly T[] | undefined,
  getId: (record: T) => string,
): readonly string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const record of records ?? []) {
    const id = getId(record);
    if (seen.has(id)) {
      duplicates.add(id);
    }
    seen.add(id);
  }

  return [...duplicates];
}

function pushDuplicateRecordIdReasons<T>(
  reasons: string[],
  prefix: string,
  records: readonly T[] | undefined,
  getId: (record: T) => string,
): void {
  for (const id of getDuplicateIds(records, getId)) {
    reasons.push(`source_record:${prefix}:duplicate_id:${id}`);
  }
}

function pushDuplicateReferenceReasons(
  reasons: string[],
  prefix: string,
  ids: readonly string[],
): void {
  const seen = new Set<string>();

  for (const id of ids) {
    if (seen.has(id)) {
      reasons.push(`source_record:${prefix}:duplicate_reference:${id}`);
    }
    seen.add(id);
  }
}

function sourceFieldMapsMatch(
  actual: Readonly<Record<string, string>>,
  expected: Readonly<Record<string, string>>,
): boolean {
  const normalize = (value: Readonly<Record<string, string>>) =>
    JSON.stringify(
      Object.entries(value).sort(([left], [right]) => left.localeCompare(right)),
    );

  return normalize(actual) === normalize(expected);
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

function routeIsInPublicationSequence(route: SeoRouteRecord): boolean {
  return ROUTE_PUBLICATION_APPROVAL_SEQUENCE.some(
    (routeId) => routeId === route.id,
  );
}

function buildEvidenceRequirement(
  category: RoutePublicationEvidenceCategory,
  required: boolean,
  reasons: readonly string[],
): RoutePublicationEvidenceRequirement {
  return {
    category,
    required,
    status: required ? "blocked" : "not_required",
    reasons: required ? reasons : [],
  };
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

export function getRoutePublicationEvidenceScaffold(
  route: SeoRouteRecord,
  records: readonly RoutePublicationRecord[] = APPROVED_ROUTE_PUBLICATIONS,
  context: RoutePublicationGateContext = APPROVED_ROUTE_PUBLICATION_CONTEXT,
): RoutePublicationEvidenceScaffold {
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
  const defaultReasons =
    publicationBlockReasons.length > 0
      ? publicationBlockReasons
      : ["source_record:route_publication_missing"];

  return {
    routeId: route.id,
    path: route.path,
    requirements: ROUTE_PUBLICATION_EVIDENCE_CATEGORIES.map((category) =>
      buildEvidenceRequirement(
        category,
        routeIsInPublicationSequence(route),
        defaultReasons,
      ),
    ),
    publicationBlockReasons,
    sitemapBlockReasons,
    canUnlock: false,
  };
}

function getPublicationSequenceRoute(routeId: string): SeoRouteRecord {
  const route = ROUTE_REGISTRY.find(
    (candidate) => candidate.id === routeId,
  ) as SeoRouteRecord | undefined;

  if (!route) {
    throw new Error(`Route publication sequence route missing: ${routeId}`);
  }

  return route;
}

export function getRoutePublicationEvidenceScaffolds(
  records: readonly RoutePublicationRecord[] = APPROVED_ROUTE_PUBLICATIONS,
  context: RoutePublicationGateContext = APPROVED_ROUTE_PUBLICATION_CONTEXT,
): readonly RoutePublicationEvidenceScaffold[] {
  return ROUTE_PUBLICATION_APPROVAL_SEQUENCE.map((routeId) =>
    getRoutePublicationEvidenceScaffold(
      getPublicationSequenceRoute(routeId),
      records,
      context,
    ),
  );
}

const homeRoute = ROUTE_REGISTRY.find((route) => route.id === "home");

if (!homeRoute) {
  throw new Error("Home route is required for route-publication readiness.");
}

export const HOME_ROUTE_PUBLICATION_EVIDENCE_SCAFFOLD =
  getRoutePublicationEvidenceScaffold(homeRoute);
export const ROUTE_PUBLICATION_EVIDENCE_SCAFFOLDS =
  getRoutePublicationEvidenceScaffolds();

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
    getEmittedRouteShellSchemaTypes(route).length > 0 &&
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

  if (!record.primaryEntityRecordId) {
    reasons.push("source_record:entity_record:required");
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

  const entityById = getRecordsById(context.entityRecords, (entity) => entity.entityId);
  const contentById = getRecordsById(context.contentRecords, (content) => content.contentId);
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

  pushDuplicateRecordIdReasons(
    reasons,
    "entity_record",
    context.entityRecords,
    (entity) => entity.entityId,
  );
  pushDuplicateRecordIdReasons(
    reasons,
    "content_record",
    context.contentRecords,
    (content) => content.contentId,
  );
  pushDuplicateRecordIdReasons(
    reasons,
    "metadata_record",
    context.metadataRecords,
    (metadata) => metadata.seoId,
  );
  pushDuplicateRecordIdReasons(
    reasons,
    "schema_record",
    context.schemaRecords,
    (schema) => schema.schemaId,
  );

  pushDuplicateReferenceReasons(
    reasons,
    "content_record",
    record.contentRecordIds,
  );
  pushDuplicateReferenceReasons(
    reasons,
    "schema_record",
    record.schemaRecordIds,
  );

  if (record.primaryEntityRecordId) {
    const entity = entityById.get(record.primaryEntityRecordId);
    if (!entity) {
      reasons.push(
        `source_record:entity_record:missing:${record.primaryEntityRecordId}`,
      );
    } else {
      if (entity.routeId !== route.id) {
        reasons.push(
          `source_record:entity_record:route_mismatch:${entity.entityId}`,
        );
      }

      if (entity.approvalStatus !== "approved") {
        reasons.push(
          `source_record:entity_record:approval:${entity.approvalStatus}`,
        );
      }
    }
  }

  pushMissingRecordReasons(
    reasons,
    "content_record",
    record.contentRecordIds,
    contentById,
  );
  for (const contentId of record.contentRecordIds) {
    const content = contentById.get(contentId);
    if (!content) {
      continue;
    }

    if (content.routeId !== route.id) {
      reasons.push(
        `source_record:content_record:route_mismatch:${content.contentId}`,
      );
    }

    if (content.approvalStatus !== "approved") {
      reasons.push(
        `source_record:content_record:approval:${content.approvalStatus}`,
      );
    }
  }

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

      if (metadata.metaTitle !== route.title) {
        reasons.push(`source_record:metadata_record:title_mismatch:${metadata.seoId}`);
      }

      if (metadata.metaDescription !== route.description) {
        reasons.push(
          `source_record:metadata_record:description_mismatch:${metadata.seoId}`,
        );
      }

      if (metadata.h1 !== route.h1) {
        reasons.push(`source_record:metadata_record:h1_mismatch:${metadata.seoId}`);
      }

      if (metadata.ogTitle !== route.title) {
        reasons.push(
          `source_record:metadata_record:og_title_mismatch:${metadata.seoId}`,
        );
      }

      if (metadata.ogDescription !== route.description) {
        reasons.push(
          `source_record:metadata_record:og_description_mismatch:${metadata.seoId}`,
        );
      }

      if (metadata.ogImageId) {
        reasons.push(
          `source_record:metadata_record:og_image_unemitted:${metadata.seoId}`,
        );
      }
    }
  }

  pushMissingRecordReasons(reasons, "schema_record", record.schemaRecordIds, schemaById);
  const expectedSchemaTypes = getEmittedRouteShellSchemaTypes(route);
  const referencedSchemas = record.schemaRecordIds
    .map((schemaId) => schemaById.get(schemaId))
    .filter((schema): schema is SchemaRecord => Boolean(schema));

  for (const expectedType of expectedSchemaTypes) {
    const matchingSchemas = referencedSchemas.filter(
      (schema) => schema.schemaType === expectedType,
    );

    if (matchingSchemas.length === 0) {
      reasons.push(`source_record:schema_type:missing:${expectedType}`);
    } else if (matchingSchemas.length > 1) {
      reasons.push(`source_record:schema_type:duplicate:${expectedType}`);
    }
  }

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

    if (!expectedSchemaTypes.includes(schema.schemaType as RouteShellSchemaType)) {
      reasons.push(
        `source_record:schema_type:extra:${schema.schemaType}:${schema.schemaId}`,
      );
      continue;
    }

    const expectedSourceFieldMap = getExpectedRouteShellSchemaSourceFieldMap(
      route,
      schema.schemaType as RouteShellSchemaType,
    );
    if (!sourceFieldMapsMatch(schema.sourceFieldMap, expectedSourceFieldMap)) {
      reasons.push(
        `source_record:schema_record:source_map_mismatch:${schema.schemaId}`,
      );
    }

    for (const claimId of schema.claimsUsed) {
      if (!record.claimRecordIds.includes(claimId)) {
        reasons.push(
          `source_record:schema_record:claim_not_referenced:${schema.schemaId}:${claimId}`,
        );
      }
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

export function getApprovedRouteMetadataEmissionBlockReasons(
  route: SeoRouteRecord,
  emission: RouteMetadataEmission,
  records: readonly RoutePublicationRecord[] = APPROVED_ROUTE_PUBLICATIONS,
  context: RoutePublicationGateContext = APPROVED_ROUTE_PUBLICATION_CONTEXT,
): readonly string[] {
  if (getRoutePublicationGateBlockReasons(route, records, context).length > 0) {
    return [];
  }

  const publication = getRoutePublicationRecord(route, records);
  const metadata = context.metadataRecords?.filter(
    (candidate) => candidate.seoId === publication?.metadataRecordId,
  );

  if (!publication || !metadata || metadata.length !== 1) {
    return ["source_record:metadata_emission:approved_record_missing"];
  }

  const approved = metadata[0];
  const reasons: string[] = [];
  const expectedFields = [
    ["title", emission.title, approved.metaTitle],
    ["description", emission.description, approved.metaDescription],
    ["canonical", emission.canonicalUrl, approved.canonicalUrl],
    ["robots", emission.robotsDirective, approved.robotsDirective],
    ["h1", emission.h1, approved.h1],
    ["og_title", emission.ogTitle, approved.ogTitle],
    ["og_description", emission.ogDescription, approved.ogDescription],
  ] as const;

  for (const [field, actual, expected] of expectedFields) {
    if (actual !== expected) {
      reasons.push(`source_record:metadata_emission:${field}_mismatch`);
    }
  }

  return reasons;
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
