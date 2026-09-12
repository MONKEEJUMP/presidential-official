import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "src", "lib", "seo");
const outDir = path.join(os.tmpdir(), "presidential-seo-gate-tests");

function collectTypeScriptFiles(directory) {
  const files = [];

  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(".ts")) {
        files.push(fullPath);
      }
    }
  }

  walk(directory);
  return files;
}

function compileSeoLibrary() {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const program = ts.createProgram(collectTypeScriptFiles(sourceRoot), {
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    noEmitOnError: true,
    outDir,
    rootDir: path.join(projectRoot, "src"),
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2022,
  });

  const emitResult = program.emit();
  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics)
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);

  if (diagnostics.length) {
    const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => projectRoot,
      getNewLine: () => "\n",
    });
    throw new Error(`SEO gate test compile failed:\n${formatted}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

compileSeoLibrary();

const require = createRequire(import.meta.url);
const distRoot = path.join(outDir, "lib", "seo");
const metadataPath = path.join(distRoot, "metadata.js");
const metadataHelpersPath = path.join(distRoot, "metadata-helpers.js");
const indexabilityPath = path.join(distRoot, "indexability.js");
const routesPath = path.join(distRoot, "routes.js");
const schemaConstantsPath = path.join(distRoot, "schema", "constants.js");
const routeShellSchemaPath = path.join(distRoot, "schema", "routeShell.js");
const routeSchemaContractPath = path.join(distRoot, "schema", "route-contract.js");
const publicationPath = path.join(distRoot, "source-records", "route-publication.js");

for (const requiredPath of [
  metadataPath,
  metadataHelpersPath,
  indexabilityPath,
  routesPath,
  schemaConstantsPath,
  routeShellSchemaPath,
  routeSchemaContractPath,
  publicationPath,
]) {
  assert(existsSync(requiredPath), `Compiled SEO gate test module missing: ${requiredPath}`);
}

const { buildRouteMetadata, buildRouteRobots, isRouteMetadataIndexable } =
  require(metadataPath);
const { assertMetadataTextSafe } = require(metadataHelpersPath);
const { getSitemapBlockReasons, isSitemapEligible } = require(indexabilityPath);
const { ROUTE_REGISTRY } = require(routesPath);
const { PRODUCTION_ORIGIN, canonicalUrl } = require(schemaConstantsPath);
const { buildRouteShellJsonLd } = require(routeShellSchemaPath);
const { getExpectedRouteShellSchemaSourceFieldMap } = require(
  routeSchemaContractPath,
);
const {
  APPROVED_ROUTE_PUBLICATIONS,
  ROUTE_PUBLICATION_APPROVAL_SEQUENCE,
  getRoutePublicationGateBlockReasons,
  isRoutePublicationApprovedForSeo,
  isSourceAllowedForPublicSeo,
} = require(publicationPath);

assertEqual(
  APPROVED_ROUTE_PUBLICATIONS.length,
  0,
  "The current foundation must not contain approved route-publication records.",
);

for (const route of ROUTE_REGISTRY) {
  const robots = buildRouteRobots(route);
  assertEqual(
    robots.index,
    false,
    `Route ${route.path} emitted robots.index=true without an approved publication record.`,
  );
  assertEqual(
    robots.googleBot.index,
    false,
    `Route ${route.path} emitted googleBot.index=true without an approved publication record.`,
  );
}

const homeRoute = ROUTE_REGISTRY.find((route) => route.path === "/");
assert(homeRoute, "Home route missing from ROUTE_REGISTRY.");

const blockedCanonicalInputs = [
  "//evil.example/path",
  "///evil.example/path",
  "\\\\evil.example\\path",
  "/\\evil.example/path",
  "https://evil.example/path",
  "http://presidentialmoonrocks.com/path",
];

for (const candidate of blockedCanonicalInputs) {
  let blocked = false;
  try {
    canonicalUrl(candidate);
  } catch {
    blocked = true;
  }

  assertEqual(blocked, true, `canonicalUrl failed to block unsafe input: ${candidate}`);
}

assertEqual(canonicalUrl("/"), PRODUCTION_ORIGIN, "Home canonical URL changed.");
assertEqual(
  canonicalUrl("/moon-rocks"),
  `${PRODUCTION_ORIGIN}/moon-rocks`,
  "Route canonical URL changed.",
);

const syntheticRegistryPromotion = {
  ...homeRoute,
  status: "approved",
  indexability: "index_follow",
  sitemap: "include",
  blocks: [],
};

assertEqual(
  isRouteMetadataIndexable(syntheticRegistryPromotion),
  false,
  "A registry-only approved route became metadata-indexable without a route-publication record.",
);

const syntheticRobots = buildRouteRobots(syntheticRegistryPromotion);
assertEqual(
  syntheticRobots.index,
  false,
  "A registry-only approved route emitted robots.index=true without a route-publication record.",
);
assertEqual(
  syntheticRobots.googleBot.index,
  false,
  "A registry-only approved route emitted googleBot.index=true without a route-publication record.",
);

assertEqual(
  buildRouteShellJsonLd(homeRoute).length,
  0,
  "Route shell JSON-LD emitted while the route publication gate is closed.",
);

const gatedMetadata = buildRouteMetadata({ route: homeRoute });
assertEqual(
  "openGraph" in gatedMetadata,
  false,
  "Open Graph metadata emitted while the route publication gate is closed.",
);
assertEqual(
  "twitter" in gatedMetadata,
  false,
  "Twitter metadata emitted while the route publication gate is closed.",
);

function buildSyntheticSource(allowedUsage, confidentialityStatus) {
  return {
    sourceId: "gate-test-synthetic-source",
    sourceName: "Gate test synthetic source",
    sourceType: "client_provided",
    sourceLocator: "gate-test://synthetic",
    allowedUsage,
    confidentialityStatus,
    publisherOrProvider: "gate-test",
    confidenceScore: 0,
  };
}

const blockedSourceCombos = [
  ["production", "confidential"],
  ["production", "internal"],
  ["production", "private"],
  ["reference_only", "public"],
  ["internal_evidence", "public"],
  ["never_use", "public"],
];

for (const [allowedUsage, confidentialityStatus] of blockedSourceCombos) {
  assertEqual(
    isSourceAllowedForPublicSeo(
      buildSyntheticSource(allowedUsage, confidentialityStatus),
    ),
    false,
    `Source with allowedUsage=${allowedUsage} and confidentialityStatus=${confidentialityStatus} must be blocked from public SEO.`,
  );
}

assertEqual(
  isSourceAllowedForPublicSeo(buildSyntheticSource("production", "public")),
  true,
  "A production + public source must be allowed for public SEO.",
);

function buildSyntheticRoutePublication(overrides = {}) {
  return {
    routePublicationId: "gate-test-route-publication",
    routeId: syntheticRegistryPromotion.id,
    path: syntheticRegistryPromotion.path,
    primaryEntityRecordId: "gate-test-entity",
    contentRecordIds: ["gate-test-content"],
    metadataRecordId: "gate-test-metadata",
    schemaRecordIds: [
      "gate-test-schema-organization",
      "gate-test-schema-website",
      "gate-test-schema-webpage",
    ],
    assetRecordIds: ["gate-test-asset"],
    claimRecordIds: ["gate-test-claim"],
    sourceRecordIds: ["gate-test-source"],
    proofRecordIds: ["gate-test-proof"],
    complianceRecordIds: ["gate-test-proof"],
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
    launchBlockers: [],
    ...overrides,
  };
}

const approvedPublication = buildSyntheticRoutePublication();
const approvedContext = {
  entityRecords: [
    {
      entityId: "gate-test-entity",
      routeId: syntheticRegistryPromotion.id,
      approvalStatus: "approved",
    },
  ],
  contentRecords: [
    {
      contentId: "gate-test-content",
      routeId: syntheticRegistryPromotion.id,
      approvalStatus: "approved",
    },
  ],
  metadataRecords: [
    {
      seoId: "gate-test-metadata",
      routeId: syntheticRegistryPromotion.id,
      h1: syntheticRegistryPromotion.h1,
      metaTitle: syntheticRegistryPromotion.title,
      metaDescription: syntheticRegistryPromotion.description,
      canonicalUrl: canonicalUrl(syntheticRegistryPromotion.canonicalPath),
      robotsDirective: "index_follow",
      ogTitle: syntheticRegistryPromotion.title,
      ogDescription: syntheticRegistryPromotion.description,
      primaryKeyword: "Presidential",
      secondaryKeywords: [],
      approvalStatus: "approved",
    },
  ],
  schemaRecords: [
    ["gate-test-schema-organization", "Organization"],
    ["gate-test-schema-website", "WebSite"],
    ["gate-test-schema-webpage", "WebPage"],
  ].map(([schemaId, schemaType]) => ({
      routeId: syntheticRegistryPromotion.id,
      schemaId,
      schemaType,
      sourceFieldMap: getExpectedRouteShellSchemaSourceFieldMap(
        syntheticRegistryPromotion,
        schemaType,
      ),
      claimsUsed: [],
      visibleContentMatch: true,
      validationStatus: "approved",
      approvalStatus: "approved",
    })),
  sourceRecords: [
    {
      sourceId: "gate-test-source",
      sourceName: "Gate test source",
      sourceType: "client_provided",
      sourceLocator: "gate-test://source",
      allowedUsage: "production",
      confidentialityStatus: "public",
      publisherOrProvider: "gate-test",
      confidenceScore: 1,
    },
  ],
  proofRecords: [
    {
      proofId: "gate-test-proof",
      sourceId: "gate-test-source",
      relatedRecordType: "route_publication",
      relatedRecordId: approvedPublication.routePublicationId,
      evidenceType: "client_confirmation",
      evidenceLocator: "gate-test://proof",
      proofSummary: "Synthetic approved proof for gate testing.",
      proofLevel: "client_confirmed",
      confidenceScore: 1,
      approvalStatus: "approved",
    },
  ],
  claimRecords: [
    {
      claimId: "gate-test-claim",
      claimText: "Synthetic safe claim.",
      normalizedClaim: "synthetic safe claim",
      claimType: "brand_positioning",
      relatedEntityType: "route_publication",
      relatedEntityId: approvedPublication.routePublicationId,
      proofRequired: false,
      proofStatus: "verified",
      allowedUses: ["seo"],
      disallowedUses: [],
      complianceRiskScore: 0,
      clientConfirmationNeeded: false,
      legalReviewRequired: false,
      approvalStatus: "approved",
    },
  ],
  assetRecords: [
    {
      assetId: "gate-test-asset",
      filename: "gate-test.jpg",
      storageUrl: "gate-test://asset",
      assetType: "image",
      altText: "Presidential package photograph.",
      usageTier: "public",
      relatedEntityIds: [approvedPublication.routePublicationId],
      rightsStatus: "approved",
      approvalStatus: "approved",
    },
  ],
  assetProvenanceRecords: [
    {
      provenanceId: "gate-test-provenance",
      assetId: "gate-test-asset",
      sourceId: "gate-test-source",
      intakeMethod: "client_drop",
      originalLocator: "gate-test://asset",
      capturedAt: "2026-07-05T00:00:00.000Z",
      blacklistCheckStatus: "passed",
      verificationStatus: "approved",
    },
  ],
};

const requiredEvidenceCases = [
  {
    label: "entity record",
    overrides: {
      routePublicationId: "gate-test-empty-entity",
      primaryEntityRecordId: undefined,
    },
    reason: "source_record:entity_record:required",
  },
  {
    label: "content record",
    overrides: { routePublicationId: "gate-test-empty-content", contentRecordIds: [] },
    reason: "source_record:content_record:required",
  },
  {
    label: "metadata record",
    overrides: { routePublicationId: "gate-test-empty-metadata", metadataRecordId: undefined },
    reason: "source_record:metadata_record:required",
  },
  {
    label: "source record",
    overrides: { routePublicationId: "gate-test-empty-source", sourceRecordIds: [] },
    reason: "source_record:source:required",
  },
  {
    label: "proof record",
    overrides: { routePublicationId: "gate-test-empty-proof", proofRecordIds: [] },
    reason: "source_record:proof:required",
  },
  {
    label: "asset record",
    overrides: { routePublicationId: "gate-test-empty-asset", assetRecordIds: [] },
    reason: "source_record:asset:required",
  },
  {
    label: "claim record",
    overrides: { routePublicationId: "gate-test-empty-claim", claimRecordIds: [] },
    reason: "source_record:claim:required",
  },
  {
    label: "compliance record",
    overrides: { routePublicationId: "gate-test-empty-compliance", complianceRecordIds: [] },
    reason: "source_record:compliance_record:required",
  },
];

for (const { label, overrides, reason } of requiredEvidenceCases) {
  const publication = buildSyntheticRoutePublication(overrides);
  assertEqual(
    isRoutePublicationApprovedForSeo(
      syntheticRegistryPromotion,
      [publication],
      approvedContext,
    ),
    false,
    `A route publication with empty required ${label} evidence became approved.`,
  );
  assert(
    getRoutePublicationGateBlockReasons(
      syntheticRegistryPromotion,
      [publication],
      approvedContext,
    ).includes(reason),
    `Empty required ${label} evidence did not produce ${reason}.`,
  );
}

const zeroEvidencePublication = buildSyntheticRoutePublication({
  routePublicationId: "gate-test-zero-evidence",
  primaryEntityRecordId: undefined,
  contentRecordIds: [],
  metadataRecordId: undefined,
  schemaRecordIds: [],
  assetRecordIds: [],
  claimRecordIds: [],
  sourceRecordIds: [],
  proofRecordIds: [],
  complianceRecordIds: [],
});

assertEqual(
  isRoutePublicationApprovedForSeo(
    syntheticRegistryPromotion,
    [zeroEvidencePublication],
    approvedContext,
  ),
  false,
  "A self-asserted route publication with zero evidence became approved.",
);

assert(
  getRoutePublicationGateBlockReasons(
    syntheticRegistryPromotion,
    [zeroEvidencePublication],
    approvedContext,
  ).includes("source_record:evidence:required"),
  "A zero-evidence route publication did not produce source_record:evidence:required.",
);

assertEqual(
  isRoutePublicationApprovedForSeo(syntheticRegistryPromotion, [
    approvedPublication,
  ]),
  false,
  "A route publication with missing referenced records became approved.",
);

assertEqual(
  isRoutePublicationApprovedForSeo(
    syntheticRegistryPromotion,
    [approvedPublication],
    approvedContext,
  ),
  true,
  "A fully approved route publication context failed the gate.",
);

const approvedPublicationGateInput = {
  routePublicationRecords: [approvedPublication],
  routePublicationContext: approvedContext,
};

const expectedStateFixtures = [
  {
    label: "closed",
    records: [],
    context: approvedContext,
    expectedApproved: false,
  },
  {
    label: "mixed",
    records: [approvedPublication],
    context: {
      ...approvedContext,
      contentRecords: [
        { ...approvedContext.contentRecords[0], approvalStatus: "in_review" },
      ],
    },
    expectedApproved: false,
  },
  {
    label: "approved",
    records: [approvedPublication],
    context: approvedContext,
    expectedApproved: true,
  },
];

for (const fixture of expectedStateFixtures) {
  const gateInput = {
    routePublicationRecords: fixture.records,
    routePublicationContext: fixture.context,
  };
  assertEqual(
    isRoutePublicationApprovedForSeo(
      syntheticRegistryPromotion,
      fixture.records,
      fixture.context,
    ),
    fixture.expectedApproved,
    `${fixture.label} expected-state fixture returned the wrong publication result.`,
  );
  assertEqual(
    isRouteMetadataIndexable(syntheticRegistryPromotion, gateInput),
    fixture.expectedApproved,
    `${fixture.label} expected-state fixture returned the wrong metadata result.`,
  );
  assertEqual(
    isSitemapEligible(syntheticRegistryPromotion, gateInput),
    fixture.expectedApproved,
    `${fixture.label} expected-state fixture returned the wrong sitemap result.`,
  );
  assertEqual(
    buildRouteShellJsonLd(syntheticRegistryPromotion, gateInput).length > 0,
    fixture.expectedApproved,
    `${fixture.label} expected-state fixture returned the wrong schema result.`,
  );
}

assertEqual(
  isRouteMetadataIndexable(
    syntheticRegistryPromotion,
    approvedPublicationGateInput,
  ),
  true,
  "A fully approved route publication did not make the synthetic route metadata-indexable.",
);

const approvedRobots = buildRouteRobots(
  syntheticRegistryPromotion,
  approvedPublicationGateInput,
);
assertEqual(
  approvedRobots.index,
  true,
  "A fully approved route publication did not emit robots.index=true for the synthetic route.",
);
assertEqual(
  approvedRobots.googleBot.index,
  true,
  "A fully approved route publication did not emit googleBot.index=true for the synthetic route.",
);

const approvedMetadata = buildRouteMetadata({
  route: syntheticRegistryPromotion,
  ...approvedPublicationGateInput,
});
assertEqual(
  approvedMetadata.title,
  approvedContext.metadataRecords[0].metaTitle,
  "Approved metadata title did not match the bound record.",
);
assertEqual(
  approvedMetadata.description,
  approvedContext.metadataRecords[0].metaDescription,
  "Approved metadata description did not match the bound record.",
);
assertEqual(
  approvedMetadata.alternates.canonical,
  approvedContext.metadataRecords[0].canonicalUrl,
  "Approved metadata canonical did not match the bound record.",
);
assertEqual(
  approvedMetadata.robots.index,
  true,
  "Approved metadata robots did not match index_follow.",
);
assertEqual(
  approvedMetadata.openGraph.title,
  approvedContext.metadataRecords[0].ogTitle,
  "Approved Open Graph title did not match the bound record.",
);
assertEqual(
  approvedMetadata.openGraph.description,
  approvedContext.metadataRecords[0].ogDescription,
  "Approved Open Graph description did not match the bound record.",
);

let mismatchedApprovedMetadataEmissionBlocked = false;
try {
  buildRouteMetadata({
    route: syntheticRegistryPromotion,
    title: "Different approved title",
    ...approvedPublicationGateInput,
  });
} catch {
  mismatchedApprovedMetadataEmissionBlocked = true;
}
assertEqual(
  mismatchedApprovedMetadataEmissionBlocked,
  true,
  "Approved metadata allowed an emitted title that differed from its bound record.",
);
assertEqual(
  "openGraph" in approvedMetadata,
  true,
  "A fully approved route publication did not emit Open Graph metadata for the synthetic route.",
);
assertEqual(
  "twitter" in approvedMetadata,
  true,
  "A fully approved route publication did not emit Twitter metadata for the synthetic route.",
);

assertEqual(
  isSitemapEligible(syntheticRegistryPromotion, approvedPublicationGateInput),
  true,
  "A fully approved route publication did not make the synthetic route sitemap-eligible.",
);
assertEqual(
  getSitemapBlockReasons(
    syntheticRegistryPromotion,
    approvedPublicationGateInput,
  ).length,
  0,
  "A fully approved route publication still had sitemap blockers.",
);

const approvedJsonLd = buildRouteShellJsonLd(
  syntheticRegistryPromotion,
  approvedPublicationGateInput,
);
assertEqual(
  approvedJsonLd.map((entry) => entry.data["@type"]).join("|"),
  "Organization|WebSite|WebPage",
  "Approved route emitted a missing or extra schema type.",
);
const approvedWebPageSchema = approvedJsonLd.find(
  (entry) => entry.data["@type"] === "WebPage",
)?.data;
assertEqual(
  approvedWebPageSchema.name,
  syntheticRegistryPromotion.h1,
  "Approved WebPage schema name did not match the emitted H1 contract.",
);
assertEqual(
  approvedWebPageSchema.description,
  syntheticRegistryPromotion.description,
  "Approved WebPage schema description did not match the bound metadata contract.",
);
assertEqual(
  approvedWebPageSchema.url,
  approvedContext.metadataRecords[0].canonicalUrl,
  "Approved WebPage schema URL did not match the emitted canonical.",
);

const breadcrumbRouteSource = ROUTE_REGISTRY.find(
  (route) => route.id === "moon-rocks",
);
assert(breadcrumbRouteSource, "Moon Rocks route missing for BreadcrumbList fixture.");
const syntheticBreadcrumbRoute = {
  ...breadcrumbRouteSource,
  id: "home",
  status: "approved",
  indexability: "index_follow",
  sitemap: "include",
  blocks: [],
};
const breadcrumbSchemaRecords = [
  ["gate-test-nonhome-webpage", "WebPage"],
  ["gate-test-nonhome-breadcrumb", "BreadcrumbList"],
].map(([schemaId, schemaType]) => ({
  schemaId,
  routeId: syntheticBreadcrumbRoute.id,
  schemaType,
  sourceFieldMap: getExpectedRouteShellSchemaSourceFieldMap(
    syntheticBreadcrumbRoute,
    schemaType,
  ),
  claimsUsed: [],
  visibleContentMatch: true,
  validationStatus: "approved",
  approvalStatus: "approved",
}));
const breadcrumbPublication = buildSyntheticRoutePublication({
  path: syntheticBreadcrumbRoute.path,
  schemaRecordIds: breadcrumbSchemaRecords.map((schema) => schema.schemaId),
});
const breadcrumbContext = {
  ...approvedContext,
  metadataRecords: [
    {
      ...approvedContext.metadataRecords[0],
      h1: syntheticBreadcrumbRoute.h1,
      metaTitle: syntheticBreadcrumbRoute.title,
      metaDescription: syntheticBreadcrumbRoute.description,
      canonicalUrl: canonicalUrl(syntheticBreadcrumbRoute.canonicalPath),
      ogTitle: syntheticBreadcrumbRoute.title,
      ogDescription: syntheticBreadcrumbRoute.description,
    },
  ],
  schemaRecords: breadcrumbSchemaRecords,
};
const breadcrumbGateInput = {
  routePublicationRecords: [breadcrumbPublication],
  routePublicationContext: breadcrumbContext,
};
assertEqual(
  isRoutePublicationApprovedForSeo(
    syntheticBreadcrumbRoute,
    [breadcrumbPublication],
    breadcrumbContext,
  ),
  true,
  "Approved non-home schema fixture failed its exact source-map contract.",
);
assertEqual(
  buildRouteShellJsonLd(syntheticBreadcrumbRoute, breadcrumbGateInput)
    .map((entry) => entry.data["@type"])
    .join("|"),
  "WebPage|BreadcrumbList",
  "Approved non-home route emitted a missing or extra schema type.",
);

assertEqual(
  ROUTE_PUBLICATION_APPROVAL_SEQUENCE.join(" > "),
  "home > moon-rocks > our-story > learn > find-us > contact",
  "Route-publication approval sequence drifted.",
);

const moonRocksRoute = ROUTE_REGISTRY.find((route) => route.id === "moon-rocks");
assert(moonRocksRoute, "Moon Rocks route missing from ROUTE_REGISTRY.");
assert(
  getRoutePublicationGateBlockReasons(
    moonRocksRoute,
    [
      buildSyntheticRoutePublication({
        routePublicationId: "gate-test-moon-rocks-without-home",
        routeId: moonRocksRoute.id,
        path: moonRocksRoute.path,
      }),
    ],
    approvedContext,
  ).includes("source_record:publication_sequence:previous_not_approved:home"),
  "Moon Rocks route publication did not require the Home route to publish first.",
);

const routePublicationStatusBlockers = [
  {
    label: "publicationStatus",
    overrides: { publicationStatus: "draft" },
    reason: "source_record:publication:draft",
  },
  {
    label: "approvalStatus",
    overrides: { approvalStatus: "in_review" },
    reason: "source_record:approval:in_review",
  },
  {
    label: "confidentialityStatus",
    overrides: { confidentialityStatus: "internal" },
    reason: "source_record:confidentiality:internal",
  },
  {
    label: "indexability",
    overrides: { indexability: "noindex_follow" },
    reason: "source_record:indexability:noindex_follow",
  },
  {
    label: "sitemapPolicy",
    overrides: { sitemapPolicy: "exclude" },
    reason: "source_record:sitemap:exclude",
  },
  {
    label: "canonicalStatus",
    overrides: { canonicalStatus: "unknown" },
    reason: "source_record:canonical:unknown",
  },
  {
    label: "metadataApprovalStatus",
    overrides: { metadataApprovalStatus: "draft" },
    reason: "source_record:metadata:draft",
  },
  {
    label: "schemaApprovalStatus",
    overrides: { schemaApprovalStatus: "needs_validation" },
    reason: "source_record:schema:needs_validation",
  },
  {
    label: "contentApprovalStatus",
    overrides: { contentApprovalStatus: "blocked" },
    reason: "source_record:content:blocked",
  },
  {
    label: "assetApprovalStatus",
    overrides: { assetApprovalStatus: "needs_alt_text" },
    reason: "source_record:asset:needs_alt_text",
  },
  {
    label: "proofStatus",
    overrides: { proofStatus: "missing" },
    reason: "source_record:proof:missing",
  },
  {
    label: "complianceStatus",
    overrides: { complianceStatus: "needs_review" },
    reason: "source_record:compliance:needs_review",
  },
  {
    label: "launchBlockers",
    overrides: { launchBlockers: ["final-review"] },
    reason: "source_record:block:final-review",
  },
];

for (const { label, overrides, reason } of routePublicationStatusBlockers) {
  const publication = buildSyntheticRoutePublication({
    routePublicationId: `gate-test-status-${label}`,
    ...overrides,
  });
  const reasons = getRoutePublicationGateBlockReasons(
    syntheticRegistryPromotion,
    [publication],
    approvedContext,
  );
  assertEqual(
    isRoutePublicationApprovedForSeo(
      syntheticRegistryPromotion,
      [publication],
      approvedContext,
    ),
    false,
    `Route publication blocker ${label} passed the gate.`,
  );
  assert(
    reasons.includes(reason),
    `Route publication blocker ${label} did not produce ${reason}.`,
  );
}

const referencedRecordBlockers = [
  {
    label: "metadata route mismatch",
    context: {
      ...approvedContext,
      metadataRecords: [
        { ...approvedContext.metadataRecords[0], routeId: "wrong-route" },
      ],
    },
    reason: "source_record:metadata_record:route_mismatch:gate-test-metadata",
  },
  {
    label: "metadata robots noindex",
    context: {
      ...approvedContext,
      metadataRecords: [
        { ...approvedContext.metadataRecords[0], robotsDirective: "noindex_follow" },
      ],
    },
    reason: "source_record:metadata_record:robots:noindex_follow",
  },
  {
    label: "schema route mismatch",
    context: {
      ...approvedContext,
      schemaRecords: [
        { ...approvedContext.schemaRecords[0], routeId: "wrong-route" },
      ],
    },
    reason: "source_record:schema_record:route_mismatch:gate-test-schema-organization",
  },
  {
    label: "schema validation failure",
    context: {
      ...approvedContext,
      schemaRecords: [
        { ...approvedContext.schemaRecords[0], validationStatus: "needs_validation" },
      ],
    },
    reason: "source_record:schema_record:validation:needs_validation",
  },
  {
    label: "schema visible content mismatch",
    context: {
      ...approvedContext,
      schemaRecords: [
        { ...approvedContext.schemaRecords[0], visibleContentMatch: false },
      ],
    },
    reason: "source_record:schema_record:visible_content_missing:gate-test-schema-organization",
  },
  {
    label: "proof unapproved",
    context: {
      ...approvedContext,
      proofRecords: [
        { ...approvedContext.proofRecords[0], approvalStatus: "blocked" },
      ],
    },
    reason: "source_record:proof:not_approved:gate-test-proof",
  },
  {
    label: "claim legal review",
    context: {
      ...approvedContext,
      claimRecords: [
        { ...approvedContext.claimRecords[0], legalReviewRequired: true },
      ],
    },
    reason: "source_record:claim:not_approved:gate-test-claim",
  },
  {
    label: "missing asset provenance",
    context: {
      ...approvedContext,
      assetProvenanceRecords: [],
    },
    reason: "source_record:asset_provenance:missing:gate-test-asset",
  },
  {
    label: "asset missing alt",
    context: {
      ...approvedContext,
      assetRecords: [
        { ...approvedContext.assetRecords[0], altText: "" },
      ],
    },
    reason: "source_record:asset:not_approved:gate-test-asset",
  },
  {
    label: "asset blacklist failed",
    context: {
      ...approvedContext,
      assetProvenanceRecords: [
        { ...approvedContext.assetProvenanceRecords[0], blacklistCheckStatus: "failed" },
      ],
    },
    reason: "source_record:asset:not_approved:gate-test-asset",
  },
];

for (const { label, context, reason } of referencedRecordBlockers) {
  const reasons = getRoutePublicationGateBlockReasons(
    syntheticRegistryPromotion,
    [approvedPublication],
    context,
  );
  assertEqual(
    isRoutePublicationApprovedForSeo(
      syntheticRegistryPromotion,
      [approvedPublication],
      context,
    ),
    false,
    `Referenced-record blocker ${label} passed the gate.`,
  );
  assert(
    reasons.includes(reason),
    `Referenced-record blocker ${label} did not produce ${reason}.`,
  );
}

const entityContentIntegrityBlockers = [
  {
    label: "dangling entity id",
    publication: buildSyntheticRoutePublication({
      primaryEntityRecordId: "missing-entity",
    }),
    context: approvedContext,
    reason: "source_record:entity_record:missing:missing-entity",
  },
  {
    label: "dangling content id",
    publication: buildSyntheticRoutePublication({
      contentRecordIds: ["missing-content"],
    }),
    context: approvedContext,
    reason: "source_record:content_record:missing:missing-content",
  },
  {
    label: "wrong-route entity id",
    publication: approvedPublication,
    context: {
      ...approvedContext,
      entityRecords: [
        { ...approvedContext.entityRecords[0], routeId: "wrong-route" },
      ],
    },
    reason: "source_record:entity_record:route_mismatch:gate-test-entity",
  },
  {
    label: "wrong-route content id",
    publication: approvedPublication,
    context: {
      ...approvedContext,
      contentRecords: [
        { ...approvedContext.contentRecords[0], routeId: "wrong-route" },
      ],
    },
    reason: "source_record:content_record:route_mismatch:gate-test-content",
  },
  {
    label: "duplicate entity id",
    publication: approvedPublication,
    context: {
      ...approvedContext,
      entityRecords: [
        approvedContext.entityRecords[0],
        { ...approvedContext.entityRecords[0] },
      ],
    },
    reason: "source_record:entity_record:duplicate_id:gate-test-entity",
  },
  {
    label: "duplicate content reference",
    publication: buildSyntheticRoutePublication({
      contentRecordIds: ["gate-test-content", "gate-test-content"],
    }),
    context: approvedContext,
    reason: "source_record:content_record:duplicate_reference:gate-test-content",
  },
  {
    label: "duplicate content id",
    publication: approvedPublication,
    context: {
      ...approvedContext,
      contentRecords: [
        approvedContext.contentRecords[0],
        { ...approvedContext.contentRecords[0] },
      ],
    },
    reason: "source_record:content_record:duplicate_id:gate-test-content",
  },
  {
    label: "unapproved entity id",
    publication: approvedPublication,
    context: {
      ...approvedContext,
      entityRecords: [
        { ...approvedContext.entityRecords[0], approvalStatus: "in_review" },
      ],
    },
    reason: "source_record:entity_record:approval:in_review",
  },
  {
    label: "unapproved content id",
    publication: approvedPublication,
    context: {
      ...approvedContext,
      contentRecords: [
        { ...approvedContext.contentRecords[0], approvalStatus: "blocked" },
      ],
    },
    reason: "source_record:content_record:approval:blocked",
  },
];

for (const { label, publication, context, reason } of entityContentIntegrityBlockers) {
  const reasons = getRoutePublicationGateBlockReasons(
    syntheticRegistryPromotion,
    [publication],
    context,
  );
  assertEqual(
    isRoutePublicationApprovedForSeo(
      syntheticRegistryPromotion,
      [publication],
      context,
    ),
    false,
    `Entity/content integrity fixture ${label} passed the gate.`,
  );
  assert(
    reasons.includes(reason),
    `Entity/content integrity fixture ${label} did not produce ${reason}.`,
  );
}

const metadataBindingBlockers = [
  ["metaTitle", "Different title", "title_mismatch"],
  ["metaDescription", "Different description", "description_mismatch"],
  ["h1", "Different heading", "h1_mismatch"],
  ["ogTitle", "Different Open Graph title", "og_title_mismatch"],
  ["ogDescription", "Different Open Graph description", "og_description_mismatch"],
];

for (const [field, value, reasonSuffix] of metadataBindingBlockers) {
  const context = {
    ...approvedContext,
    metadataRecords: [
      { ...approvedContext.metadataRecords[0], [field]: value },
    ],
  };
  const reasons = getRoutePublicationGateBlockReasons(
    syntheticRegistryPromotion,
    [approvedPublication],
    context,
  );
  assert(
    reasons.includes(
      `source_record:metadata_record:${reasonSuffix}:gate-test-metadata`,
    ),
    `Metadata binding mismatch ${field} did not fail closed.`,
  );
}

const schemaSourceMapMismatchContext = {
  ...approvedContext,
  schemaRecords: approvedContext.schemaRecords.map((schema, index) =>
    index === 0
      ? { ...schema, sourceFieldMap: { name: "wrong.source" } }
      : schema,
  ),
};
assert(
  getRoutePublicationGateBlockReasons(
    syntheticRegistryPromotion,
    [approvedPublication],
    schemaSourceMapMismatchContext,
  ).includes(
    "source_record:schema_record:source_map_mismatch:gate-test-schema-organization",
  ),
  "Schema source-map mismatch did not fail closed.",
);

const missingSchemaTypePublication = buildSyntheticRoutePublication({
  schemaRecordIds: [
    "gate-test-schema-organization",
    "gate-test-schema-webpage",
  ],
});
assert(
  getRoutePublicationGateBlockReasons(
    syntheticRegistryPromotion,
    [missingSchemaTypePublication],
    approvedContext,
  ).includes("source_record:schema_type:missing:WebSite"),
  "Missing emitted schema type did not fail closed.",
);

const extraSchemaRecord = {
  ...approvedContext.schemaRecords[2],
  schemaId: "gate-test-schema-product",
  schemaType: "Product",
  sourceFieldMap: {},
};
const extraSchemaTypePublication = buildSyntheticRoutePublication({
  schemaRecordIds: [
    ...approvedPublication.schemaRecordIds,
    extraSchemaRecord.schemaId,
  ],
});
assert(
  getRoutePublicationGateBlockReasons(
    syntheticRegistryPromotion,
    [extraSchemaTypePublication],
    {
      ...approvedContext,
      schemaRecords: [...approvedContext.schemaRecords, extraSchemaRecord],
    },
  ).includes(
    "source_record:schema_type:extra:Product:gate-test-schema-product",
  ),
  "Extra non-emitted schema type did not fail closed.",
);

const duplicateSchemaIdContext = {
  ...approvedContext,
  schemaRecords: [
    ...approvedContext.schemaRecords,
    { ...approvedContext.schemaRecords[0] },
  ],
};
assert(
  getRoutePublicationGateBlockReasons(
    syntheticRegistryPromotion,
    [approvedPublication],
    duplicateSchemaIdContext,
  ).includes(
    "source_record:schema_record:duplicate_id:gate-test-schema-organization",
  ),
  "Duplicate schema record id did not fail closed.",
);

const missingSchemaRecordPublication = buildSyntheticRoutePublication({
  routePublicationId: "gate-test-missing-schema-record",
  schemaRecordIds: [],
});

assertEqual(
  isRoutePublicationApprovedForSeo(
    syntheticRegistryPromotion,
    [missingSchemaRecordPublication],
    approvedContext,
  ),
  false,
  "A route publication without schema record evidence became approved.",
);

assert(
  getRoutePublicationGateBlockReasons(
    syntheticRegistryPromotion,
    [missingSchemaRecordPublication],
    approvedContext,
  ).includes("source_record:schema_record:required"),
  "Missing schema records did not produce the schema_record:required blocker.",
);

assertEqual(
  isRoutePublicationApprovedForSeo(
    syntheticRegistryPromotion,
    [approvedPublication],
    {
      ...approvedContext,
      schemaRecords: [
        {
          ...approvedContext.schemaRecords[0],
          visibleContentMatch: false,
        },
      ],
    },
  ),
  false,
  "A schema record without visible-content match became approved.",
);

assert(
  getRoutePublicationGateBlockReasons(
    syntheticRegistryPromotion,
    [approvedPublication, approvedPublication],
    approvedContext,
  ).includes("source_record:route_publication_duplicate"),
  "Duplicate route publication records were not blocked.",
);

assertEqual(
  isRoutePublicationApprovedForSeo(
    syntheticRegistryPromotion,
    [approvedPublication],
    {
      ...approvedContext,
      sourceRecords: [
        {
          ...approvedContext.sourceRecords[0],
          allowedUsage: "reference_only",
        },
      ],
    },
  ),
  false,
  "A non-production source record passed route publication.",
);

const blockedMetadataTexts = [
  "Counterfeit product warning",
  "Knockoff product warning",
  "Fraud claim warning",
  "The strongest cannabis available",
  "The most potent moon rocks",
  "World's strongest pre-rolls",
  "The best cannabis brand",
  "#1 infused blunt",
  "The number-one ranked blunt",
  "Top ranked pre-roll brand",
  "A euphoric experience",
  "A relaxing cerebral effect",
  "Therapeutic cannabis products",
  "A founding father of the infused market",
  "Our founders started in Los Angeles",
];

for (const text of blockedMetadataTexts) {
  let blocked = false;
  try {
    assertMetadataTextSafe(text, "description");
  } catch {
    blocked = true;
  }
  assertEqual(
    blocked,
    true,
    `Runtime metadata guard failed to block unsafe text: ${text}`,
  );
}

const safeMetadataTexts = [
  "The official home of Presidential cannabis products.",
  "Source-backed company facts for adults 21+ where legal.",
  "Availability varies by licensed retailer.",
  "Find authentic Presidential products at licensed retailers.",
];

for (const text of safeMetadataTexts) {
  assertEqual(
    assertMetadataTextSafe(text, "description"),
    text,
    `Runtime metadata guard over-blocked approved neutral text: ${text}`,
  );
}

const brandDefensePaths = ["/official-presidential", "/blunts"];
for (const routePath of brandDefensePaths) {
  const route = ROUTE_REGISTRY.find((record) => record.path === routePath);
  assert(route, `Brand-defense route missing from ROUTE_REGISTRY: ${routePath}`);
  assertEqual(
    buildRouteRobots(route).index,
    false,
    `Brand-defense route ${routePath} must stay noindex while planning-only.`,
  );
}

const preRollsRoute = ROUTE_REGISTRY.find((record) => record.path === "/pre-rolls");
assert(preRollsRoute, "Approved Pre-Rolls route missing from ROUTE_REGISTRY.");
assertEqual(preRollsRoute.status, "approved", "Pre-Rolls must retain owner-approved status.");
assertEqual(preRollsRoute.indexability, "index_follow", "Pre-Rolls must retain index-follow approval.");
assertEqual(preRollsRoute.sitemap, "include", "Pre-Rolls must retain sitemap approval.");
assertEqual(buildRouteRobots(preRollsRoute).index, true, "Pre-Rolls metadata must remain indexable after publication approval.");

// ---------------------------------------------------------------------------
// AUTH-2 (5521-FABL) approved-visible-claims registry regression tests.
// Default stays DENY: only exact registry strings pass, only in VISIBLE copy.

const {
  APPROVED_VISIBLE_CLAIMS,
  normalizeVisibleClaimNode,
  stripApprovedVisibleClaims,
  stripApprovedVisibleClaimsFromHtml,
} = await import("./lib/approved-visible-claims-qa.mjs");

// The typed TS registry and the JSON copy consumed by QA scripts must be
// byte-equivalent; drift here is a red build.
const registryModulePath = path.join(distRoot, "source-records", "approved-visible-claims.js");
const {APPROVED_VISIBLE_CLAIMS: APPROVED_VISIBLE_CLAIMS_TS} = require(registryModulePath);
assertEqual(
  JSON.stringify(APPROVED_VISIBLE_CLAIMS_TS),
  JSON.stringify(APPROVED_VISIBLE_CLAIMS),
  "approved-visible-claims.ts and approved-visible-claims.json are out of sync.",
);

const visibleSuperlativePattern =
  /\b(world'?s strongest|highest form|strongest flavor|most potent|#1\b|number[- ]one|top[- ]?ranked|best)\b/gi;

function claimPlacementHtml(placement, text) {
  const elementId = placement.elementId ? ` id="${placement.elementId}"` : "";
  const node = `<${placement.element}${elementId}>${text}</${placement.element}>`;
  return placement.ancestorId
    ? `<section id="${placement.ancestorId}">${node}</section>`
    : node;
}

// (a) Every registry-listed mark passes only as a complete node in a listed placement.
for (const entry of APPROVED_VISIBLE_CLAIMS.entries) {
  for (const placement of entry.placements) {
    const visibleSample = claimPlacementHtml(placement, entry.claim);
    const stripped = stripApprovedVisibleClaimsFromHtml(
      visibleSample,
      placement.route,
    );
    assertEqual(
      normalizeVisibleClaimNode(stripped.replace(/<[^>]+>/g, " ")).includes(
        normalizeVisibleClaimNode(entry.claim),
      ),
      false,
      `Registry-approved mark was not removed from its exact placement: ${entry.claim}`,
    );
    visibleSuperlativePattern.lastIndex = 0;
    assertEqual(
      visibleSuperlativePattern.test(stripped.replace(/<[^>]+>/g, " ")),
      false,
      `Registry-approved mark should pass its exact visible-copy placement: ${entry.claim}`,
    );

    for (const variant of [
      `Prefix ${entry.claim}`,
      `${entry.claim} suffix`,
      `${entry.claim} Weed On Earth`,
    ]) {
      const variantHtml = claimPlacementHtml(placement, variant);
      assertEqual(
        stripApprovedVisibleClaimsFromHtml(variantHtml, placement.route),
        variantHtml,
        `Claim prefix/suffix variant was incorrectly exempted: ${variant}`,
      );
    }

    assertEqual(
      stripApprovedVisibleClaimsFromHtml(visibleSample, "/wrong-route"),
      visibleSample,
      `Registry claim was incorrectly exempted on the wrong route: ${entry.claim}`,
    );

    const wrongElement = placement.element === "p" ? "h2" : "p";
    const wrongPlacementHtml = claimPlacementHtml(
      { ...placement, element: wrongElement },
      entry.claim,
    );
    assertEqual(
      stripApprovedVisibleClaimsFromHtml(
        wrongPlacementHtml,
        placement.route,
      ),
      wrongPlacementHtml,
      `Registry claim was incorrectly exempted in the wrong element: ${entry.claim}`,
    );
  }

  assertEqual(
    stripApprovedVisibleClaims(entry.claim),
    entry.claim,
    `Registry claim was exempted without placement context: ${entry.claim}`,
  );
}

// (b) The owner-ruled homepage statement is placement-scoped without changing
// the legal claim registry or weakening metadata checks.
const ownerProtectedStatement = "World's Strongest Cannabis!";
const ownerProtectedStatementHtml =
  '<p id="presidential-homepage-statement">World&#39;s Strongest<br />Cannabis!</p>';
assertEqual(
  normalizeVisibleClaimNode(
    stripApprovedVisibleClaimsFromHtml(ownerProtectedStatementHtml, "/").replace(
      /<[^>]+>/g,
      " ",
    ),
  ),
  "",
  "Owner-protected homepage statement was not removed from its exact placement.",
);
assertEqual(
  stripApprovedVisibleClaimsFromHtml(ownerProtectedStatementHtml, "/wrong-route"),
  ownerProtectedStatementHtml,
  "Owner-protected homepage statement was incorrectly exempted on another route.",
);
assertEqual(
  stripApprovedVisibleClaimsFromHtml(
    ownerProtectedStatementHtml.replace(
      "presidential-homepage-statement",
      "wrong-placement",
    ),
    "/",
  ),
  ownerProtectedStatementHtml.replace(
    "presidential-homepage-statement",
    "wrong-placement",
  ),
  "Owner-protected homepage statement was incorrectly exempted at another element id.",
);
assertEqual(
  APPROVED_VISIBLE_CLAIMS.entries.some(
    (entry) => normalizeVisibleClaimNode(entry.claim) === ownerProtectedStatement,
  ),
  false,
  "Owner-protected display copy must not mutate the legal claim registry.",
);

// (c) Non-registry superlatives still FAIL the visible-copy scan.
const nonRegistrySuperlatives = [
  "best in the world",
  "world's strongest pre-rolls",
  "World's Strongest™ Weed On Earth",
  "the most potent moon rocks ever",
  "the strongest flavor ever",
];
for (const text of nonRegistrySuperlatives) {
  const stripped = stripApprovedVisibleClaims(text);
  visibleSuperlativePattern.lastIndex = 0;
  assertEqual(
    visibleSuperlativePattern.test(stripped),
    true,
    `Non-registry superlative must still fail the visible-copy scan: ${text}`,
  );
}

// (d) Registry marks in METADATA still FAIL - UNSAFE_METADATA_TEXT_PATTERNS
// is untouched. ("The Highest Form Of Cannabis" is additionally covered in
// metadata surfaces by the untouched serp-snippet/rendered-head superlative
// regexes, which receive no registry exemption.)
for (const metadataMark of ["World's Strongest™ Moon Rocks", "The Strongest Flavor Experience"]) {
  let blockedInMetadata = false;
  try {
    assertMetadataTextSafe(metadataMark, "description");
  } catch {
    blockedInMetadata = true;
  }
  assertEqual(
    blockedInMetadata,
    true,
    `Registry mark must remain blocked in metadata: ${metadataMark}`,
  );
}

let ownerStatementBlockedInMetadata = false;
try {
  assertMetadataTextSafe(ownerProtectedStatement, "description");
} catch {
  ownerStatementBlockedInMetadata = true;
}
assertEqual(
  ownerStatementBlockedInMetadata,
  true,
  "Owner-protected homepage statement must remain blocked in metadata.",
);

console.log(
  "SEO gate tests passed: publication gate stays closed, source firewall blocks non-public/non-production sources, language guard blocks unsafe metadata text, brand-defense routes stay noindex, and the approved-visible-claims registry exempts exact marks in visible copy only while metadata and non-registry superlatives stay blocked.",
);
