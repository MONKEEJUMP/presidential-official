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
const routesPath = path.join(distRoot, "routes.js");
const schemaConstantsPath = path.join(distRoot, "schema", "constants.js");
const routeShellSchemaPath = path.join(distRoot, "schema", "routeShell.js");
const publicationPath = path.join(distRoot, "source-records", "route-publication.js");

for (const requiredPath of [
  metadataPath,
  metadataHelpersPath,
  routesPath,
  schemaConstantsPath,
  routeShellSchemaPath,
  publicationPath,
]) {
  assert(existsSync(requiredPath), `Compiled SEO gate test module missing: ${requiredPath}`);
}

const { buildRouteMetadata, buildRouteRobots, isRouteMetadataIndexable } =
  require(metadataPath);
const { assertMetadataTextSafe } = require(metadataHelpersPath);
const { ROUTE_REGISTRY } = require(routesPath);
const { PRODUCTION_ORIGIN, canonicalUrl } = require(schemaConstantsPath);
const { buildRouteShellJsonLd } = require(routeShellSchemaPath);
const {
  APPROVED_ROUTE_PUBLICATIONS,
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
    contentRecordIds: [],
    metadataRecordId: "gate-test-metadata",
    schemaRecordIds: ["gate-test-schema"],
    assetRecordIds: ["gate-test-asset"],
    claimRecordIds: ["gate-test-claim"],
    sourceRecordIds: ["gate-test-source"],
    proofRecordIds: ["gate-test-proof"],
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
    {
      schemaId: "gate-test-schema",
      routeId: syntheticRegistryPromotion.id,
      schemaType: "WebPage",
      sourceFieldMap: {},
      claimsUsed: ["gate-test-claim"],
      visibleContentMatch: true,
      validationStatus: "approved",
      approvalStatus: "approved",
    },
  ],
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

const brandDefensePaths = ["/official-presidential", "/pre-rolls", "/blunts"];
for (const routePath of brandDefensePaths) {
  const route = ROUTE_REGISTRY.find((record) => record.path === routePath);
  assert(route, `Brand-defense route missing from ROUTE_REGISTRY: ${routePath}`);
  assertEqual(
    buildRouteRobots(route).index,
    false,
    `Brand-defense route ${routePath} must stay noindex while planning-only.`,
  );
}

console.log(
  "SEO gate tests passed: publication gate stays closed, source firewall blocks non-public/non-production sources, language guard blocks unsafe metadata text, and brand-defense routes stay noindex.",
);
