import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { stripApprovedVisibleClaimsFromHtml } from "./lib/approved-visible-claims-qa.mjs";
import { extname, join, relative } from "node:path";

const projectRoot = process.cwd();
const sourceRoots = [
  "src/app",
  "src/components",
  "src/content",
  "src/lib/seo",
];
const publicCopyRoots = ["src/app", "src/components", "src/content"];
const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".mdx",
  ".mjs",
  ".ts",
  ".tsx",
]);

const results = [];

function addResult(status, rule, message, details = [], remediation = "") {
  results.push({ status, rule, message, details, remediation });
}

function toPosix(path) {
  return path.replace(/\\/g, "/");
}

function projectPath(path) {
  return join(projectRoot, path);
}

function relativePath(path) {
  return toPosix(relative(projectRoot, path));
}

const APPROVED_VISIBLE_CLAIM_SOURCE_ROUTES = new Map([
  ["src/components/presidential/modules/homepage-foundation-shell.tsx", "/"],
  ["src/components/presidential/modules/moon-rocks-platform-shell.tsx", "/moon-rocks"],
]);

function stripApprovedVisibleClaimsFromSource(path, text) {
  const route = APPROVED_VISIBLE_CLAIM_SOURCE_ROUTES.get(toPosix(path));
  return route ? stripApprovedVisibleClaimsFromHtml(text, route) : text;
}

function isInternalDraftAppFile(file) {
  return relativePath(file).startsWith("src/app/drafts/");
}

function readProjectFile(path) {
  return readFileSync(projectPath(path), "utf8");
}

function projectFileExists(path) {
  return existsSync(projectPath(path));
}

function getRouteDefinitionText(routesText, routePath) {
  const marker = `path: "${routePath}",`;
  const start = routesText.indexOf(marker);
  if (start === -1) return "";

  const nextRecordStart = routesText.indexOf("\n  {", start + marker.length);
  return routesText.slice(start, nextRecordStart === -1 ? undefined : nextRecordStart);
}

function getRouteRecordTexts(routesText) {
  const registryStart = routesText.indexOf("export const ROUTE_REGISTRY = [");
  if (registryStart === -1) return [];

  const registryEnd = routesText.indexOf("] as const", registryStart);
  const registryText = routesText.slice(
    registryStart,
    registryEnd === -1 ? undefined : registryEnd,
  );
  const records = [];
  let cursor = registryText.indexOf("\n  {");

  while (cursor !== -1) {
    const next = registryText.indexOf("\n  {", cursor + 1);
    records.push(registryText.slice(cursor, next === -1 ? undefined : next));
    cursor = next;
  }

  return records;
}

function collectTextFiles(paths) {
  const files = [];

  function walk(path) {
    if (!existsSync(path)) return;

    const stat = statSync(path);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(path)) {
        if (
          entry === "node_modules" ||
          entry === ".next" ||
          entry === ".git" ||
          entry === ".lighthouseci"
        ) {
          continue;
        }

        walk(join(path, entry));
      }
      return;
    }

    if (textExtensions.has(extname(path))) {
      files.push(path);
    }
  }

  for (const path of paths) {
    walk(projectPath(path));
  }

  return files;
}

function findLineMatches(file, patterns) {
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  const matches = [];

  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      if (pattern.regex.test(line)) {
        matches.push({
          file: relativePath(file),
          line: index + 1,
          label: pattern.label,
          value: line.trim().slice(0, 180),
        });
      }
    }
  });

  return matches;
}

function checkCanonicalHost() {
  const constantsPath = "src/lib/seo/schema/constants.ts";
  if (!existsSync(projectPath(constantsPath))) {
    addResult("FAIL", "canonical.host", "Missing schema constants file.");
    return;
  }

  const text = readProjectFile(constantsPath);
  const hasProductionOrigin =
    text.includes('PRODUCTION_ORIGIN = "https://presidentialmoonrocks.com"') ||
    text.includes("PRODUCTION_ORIGIN = 'https://presidentialmoonrocks.com'");
  const rejectsNonCanonical =
    text.includes("parsed.origin !== PRODUCTION_ORIGIN") &&
    text.includes("Non-canonical URL is not allowed");

  if (hasProductionOrigin && rejectsNonCanonical) {
    addResult(
      "PASS",
      "canonical.host",
      "Canonical production host is represented and non-canonical schema URLs are rejected.",
    );
    return;
  }

  addResult(
    "FAIL",
    "canonical.host",
    "Canonical host doctrine is not fully represented in schema constants.",
    [
      `production origin present: ${hasProductionOrigin}`,
      `non-canonical rejection present: ${rejectsNonCanonical}`,
    ],
  );
}

function checkForbiddenUrls(sourceFiles) {
  const blockedDomains = [
    "presidentialthc.com",
    "presidentialmoonrocks.site",
    "presidentialpreroll.com",
    "presidentialblunts.com",
    "presidentialca.com",
    "presidential.vip",
    "presidential.rocks",
    "presidential.online",
    "presidential.us",
  ];
  const nonProductionPatterns = [
    { label: "localhost URL", regex: /https?:\/\/localhost(?::\d+)?/i },
    { label: "loopback URL", regex: /https?:\/\/127\.0\.0\.1(?::\d+)?/i },
    { label: "Vercel preview URL", regex: /https?:\/\/[^"'\s)]+\.vercel\.app\b/i },
    {
      label: "staging/preview/draft URL",
      regex: /https?:\/\/[^"'\s)]*(?:staging|preview|draft)[^"'\s)]*/i,
    },
  ];

  const domainPatterns = blockedDomains.map((domain) => ({
    label: `blocked domain: ${domain}`,
    regex: new RegExp(`\\b${domain.replaceAll(".", "\\.")}\\b`, "i"),
  }));

  const matches = sourceFiles.flatMap((file) =>
    findLineMatches(file, [...domainPatterns, ...nonProductionPatterns]),
  );

  if (matches.length === 0) {
    addResult(
      "PASS",
      "firewall.urls",
      "No blocked threat, alternate, localhost, Vercel preview, staging, preview, or draft URLs found in scanned public SEO source surfaces.",
    );
    return;
  }

  addResult(
    "FAIL",
    "firewall.urls",
    "Blocked or non-production URLs were found in public SEO source surfaces.",
    matches.map((match) => `${match.file}:${match.line} ${match.label}`),
    "Remove the URL from public SEO source surfaces or move the reference to internal-only documentation.",
  );
}

const PUBLIC_ACCUSATION_PATTERNS = [
  { label: "fake", regex: /\bfake\b/i },
  { label: "imposter", regex: /\bimpost(?:e|o)r\b/i },
  { label: "stolen", regex: /\bstolen\b/i },
  { label: "hijacked", regex: /\bhijack(?:ed|ing)?\b/i },
  { label: "scam", regex: /\bscam\b/i },
  { label: "counterfeit", regex: /\bcounterfeit\b/i },
  { label: "knockoff", regex: /\bknockoff\b/i },
  { label: "fraud", regex: /\bfraud\b/i },
];

const BLOCKED_CLAIM_PATTERNS = [
  { label: "medical cure/treatment", regex: /\b(cure|cures|treat|treats|treatment|therapeutic)\b/i },
  { label: "medical condition", regex: /\b(pain|anxiety|sleep|cancer|depression|ptsd|inflammation)\b/i },
  { label: "shipping/direct commerce", regex: /\b(ship|ships|shipping|delivery|deliver|buy online|order online|checkout|cart)\b/i },
  { label: "pricing/inventory", regex: /\b(price|pricing|inventory|in stock|available now)\b/i },
  { label: "youth-coded/giveaway", regex: /\b(candy|cartoon|kids?|minor|teen|giveaway|free product)\b/i },
  { label: "over-intoxication", regex: /\b(get high|highest high|over[- ]?intoxication)\b/i },
  { label: "potency superlative", regex: /\b(strongest|most potent|world[''`]?s strongest)\b/i },
  { label: "superlative: best", regex: /\bbest\b/i },
  { label: "rank claim (#1/number one/top ranked)", regex: /#1\b|\bnumber[- ]one\b|\btop[- ]?ranked\b/i },
  { label: "effect-adjacent language", regex: /\b(euphoric|euphoria|relax(?:ing|ed|ation)?|cerebral|uplifting|sedating)\b/i },
  { label: "founder claim (proof-gated)", regex: /\b(founding father|founders?)\b/i },
];

const SAFE_NEUTRAL_LANGUAGE = [
  "official",
  "source-backed",
  "licensed retailers",
  "adults 21+ where legal",
  "availability varies by licensed retailer",
];

function checkPublicLanguage(publicCopyFiles) {
  const matches = publicCopyFiles.flatMap((file) =>
    findLineMatches(file, PUBLIC_ACCUSATION_PATTERNS),
  );

  if (matches.length === 0) {
    addResult(
      "PASS",
      "language.accusations",
      "No public accusation language found in app/content source.",
    );
    return;
  }

  addResult(
    "FAIL",
    "language.accusations",
    "Public accusation language requires legal review and must not ship by default.",
    matches.map((match) => `${match.file}:${match.line} ${match.label}`),
    "Use official-source language instead of accusation language, or route the copy through legal review.",
  );
}

function findStrippedLineMatches(file, patterns) {
  const path = relativePath(file);
  const text = stripApprovedVisibleClaimsFromSource(path, readFileSync(file, "utf8"));
  const lines = text.split(/\r?\n/);
  const matches = [];

  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      if (pattern.regex.test(line)) {
        matches.push({
          file: relativePath(file),
          line: index + 1,
          label: pattern.label,
          value: line.trim().slice(0, 180),
        });
      }
    }
  });

  return matches;
}

function checkCannabisClaims(publicCopyFiles) {
  const matches = publicCopyFiles.flatMap((file) =>
    findStrippedLineMatches(file, BLOCKED_CLAIM_PATTERNS),
  );

  if (matches.length === 0) {
    addResult(
      "PASS",
      "language.claims",
      "No blocked medical, commerce, pricing, inventory, youth-coded, over-intoxication, superlative, rank, effect-adjacent, or founder claims found in app/content source.",
    );
    return;
  }

  addResult(
    "FAIL",
    "language.claims",
    "Blocked cannabis claim language was found in public app/content source.",
    matches.map((match) => `${match.file}:${match.line} ${match.label}`),
    "Remove the claim or attach explicit client/legal approval in a future approval system.",
  );
}

function checkSafeNeutralLanguage() {
  const blockedPatterns = [...PUBLIC_ACCUSATION_PATTERNS, ...BLOCKED_CLAIM_PATTERNS];
  const collisions = [];

  for (const phrase of SAFE_NEUTRAL_LANGUAGE) {
    for (const pattern of blockedPatterns) {
      if (pattern.regex.test(phrase)) {
        collisions.push(`"${phrase}" is blocked by pattern: ${pattern.label}`);
      }
    }
  }

  if (collisions.length === 0) {
    addResult(
      "PASS",
      "language.safeNeutral",
      "Approved neutral language (official, source-backed, licensed retailers, adults 21+ where legal, availability disclaimers) still passes every blocked-language pattern.",
    );
    return;
  }

  addResult(
    "FAIL",
    "language.safeNeutral",
    "A blocked-language pattern over-blocks approved neutral language.",
    collisions,
    "Narrow the blocked-language regex so approved neutral phrasing remains usable.",
  );
}

function checkRuntimeLanguageGuard() {
  const helpersPath = "src/lib/seo/metadata-helpers.ts";
  if (!projectFileExists(helpersPath)) {
    addResult("FAIL", "language.runtimeGuard", "Missing metadata text safety helper file.");
    return;
  }

  const text = readProjectFile(helpersPath);
  const requiredFragments = [
    { label: "therapeutic", fragment: "therapeutic" },
    { label: "strongest", fragment: "strongest" },
    { label: "most potent", fragment: "most potent" },
    { label: "best", fragment: "\\bbest\\b" },
    { label: "#1", fragment: "#1" },
    { label: "number one", fragment: "number[- ]one" },
    { label: "top ranked", fragment: "top[- ]?ranked" },
    { label: "euphoric", fragment: "euphoric" },
    { label: "relaxing", fragment: "relax" },
    { label: "cerebral", fragment: "cerebral" },
    { label: "founding father", fragment: "founding father" },
    { label: "founder", fragment: "founders?" },
    { label: "counterfeit", fragment: "counterfeit" },
    { label: "knockoff", fragment: "knockoff" },
    { label: "fraud", fragment: "fraud" },
  ];
  const missing = requiredFragments
    .filter(({ fragment }) => !text.includes(fragment))
    .map(({ label }) => label);

  if (missing.length === 0) {
    addResult(
      "PASS",
      "language.runtimeGuard",
      "Runtime metadata text safety patterns cover superlative, rank, effect-adjacent, and founder-claim language.",
    );
    return;
  }

  addResult(
    "FAIL",
    "language.runtimeGuard",
    "Runtime metadata text safety patterns are missing expanded blocked-language coverage.",
    missing,
    "Keep UNSAFE_METADATA_TEXT_PATTERNS aligned with the blocked claim/language doctrine.",
  );
}

function checkProductSchema() {
  const productPath = "src/lib/seo/schema/product.ts";
  if (!existsSync(projectPath(productPath))) {
    addResult("FAIL", "schema.product", "Missing informational Product schema helper.");
    return;
  }

  const text = readProjectFile(productPath);
  const blockedFields = [
    "aggregateRating",
    "availability",
    "offers",
    "price",
    "review",
    "reviews",
    "shippingDetails",
  ];
  const neverFieldsPresent = blockedFields.every((field) =>
    text.includes(`${field}?: never`),
  );
  const hasInformationalBuilder =
    text.includes("buildInformationalProductSchema") &&
    text.includes('"@type": "Product"');
  const returnBlock = text.match(/return\s+\{[\s\S]*?\n\s+\};/);
  const returnBlockText = returnBlock?.[0] ?? "";
  const blockedReturnFields = blockedFields.filter((field) =>
    new RegExp(`\\b${field}\\b`).test(returnBlockText),
  );

  if (
    hasInformationalBuilder &&
    neverFieldsPresent &&
    blockedReturnFields.length === 0
  ) {
    addResult(
      "PASS",
      "schema.product",
      "Product schema remains informational only and blocks commerce/review fields at the helper boundary.",
    );
    return;
  }

  addResult(
    "FAIL",
    "schema.product",
    "Product schema restraint is incomplete.",
    [
      `informational builder present: ${hasInformationalBuilder}`,
      `blocked fields typed as never: ${neverFieldsPresent}`,
      `blocked fields returned: ${blockedReturnFields.join(", ") || "none"}`,
    ],
    "Keep Product schema informational unless a future approved legal/compliance mechanism permits richer fields.",
  );
}

function checkSameAsWhitelist(sourceFiles) {
  const constantsPath = "src/lib/seo/schema/constants.ts";
  const organizationPath = "src/lib/seo/schema/organization.ts";

  if (!existsSync(projectPath(constantsPath)) || !existsSync(projectPath(organizationPath))) {
    addResult("FAIL", "schema.sameAs", "Missing Organization schema or constants file.");
    return;
  }

  const constantsText = readProjectFile(constantsPath);
  const organizationText = readProjectFile(organizationPath);
  const approvedListIsCentral =
    constantsText.includes("APPROVED_SAME_AS") &&
    constantsText.includes("satisfies readonly string[]");
  const organizationUsesOnlyWhitelist =
    organizationText.includes("APPROVED_SAME_AS.length > 0") &&
    organizationText.includes("sameAs: [...APPROVED_SAME_AS]");
  const sameAsMatches = sourceFiles.flatMap((file) =>
    findLineMatches(file, [{ label: "sameAs usage", regex: /\bsameAs\b/ }]),
  );
  const unexpectedSameAs = sameAsMatches.filter(
    (match) =>
      match.file !== "src/lib/seo/schema/constants.ts" &&
      match.file !== "src/lib/seo/schema/organization.ts",
  );

  if (
    approvedListIsCentral &&
    organizationUsesOnlyWhitelist &&
    unexpectedSameAs.length === 0
  ) {
    addResult(
      "PASS",
      "schema.sameAs",
      "sameAs remains whitelist-only through APPROVED_SAME_AS.",
    );
    return;
  }

  addResult(
    "FAIL",
    "schema.sameAs",
    "sameAs whitelist doctrine is incomplete.",
    [
      `central whitelist present: ${approvedListIsCentral}`,
      `organization uses whitelist only: ${organizationUsesOnlyWhitelist}`,
      ...unexpectedSameAs.map((match) => `${match.file}:${match.line}`),
    ],
    "Route all official profile URLs through APPROVED_SAME_AS after client confirmation.",
  );
}

function checkJsonLdSafety() {
  const jsonLdPath = "src/lib/seo/schema/jsonLd.tsx";
  if (!existsSync(projectPath(jsonLdPath))) {
    addResult("FAIL", "schema.jsonld", "Missing JSON-LD renderer.");
    return;
  }

  const text = readProjectFile(jsonLdPath);
  if (
    text.includes('type="application/ld+json"') &&
    text.includes('replace(/</g, "\\\\u003c")')
  ) {
    addResult(
      "PASS",
      "schema.jsonld",
      "JSON-LD renderer escapes '<' and uses the application/ld+json script type.",
    );
    return;
  }

  addResult(
    "FAIL",
    "schema.jsonld",
    "JSON-LD renderer is missing expected script type or '<' escaping.",
    [],
    "Use application/ld+json and escape '<' in serialized JSON-LD.",
  );
}

function checkRouteRegistryFoundation() {
  const requiredFiles = [
    "src/lib/seo/route-types.ts",
    "src/lib/seo/routes.ts",
    "src/lib/seo/indexability.ts",
    "src/lib/seo/route-helpers.ts",
  ];
  const missingFiles = requiredFiles.filter((file) => !projectFileExists(file));

  if (missingFiles.length === 0) {
    addResult(
      "PASS",
      "routes.registry.files",
      "Route registry foundation files exist.",
    );
  } else {
    addResult(
      "FAIL",
      "routes.registry.files",
      "Route registry foundation files are missing.",
      missingFiles,
      "Create the Step 8A route registry files before route/page work continues.",
    );
    return;
  }

  const routesText = readProjectFile("src/lib/seo/routes.ts");
  const indexabilityText = readProjectFile("src/lib/seo/indexability.ts");
  const helpersText = readProjectFile("src/lib/seo/route-helpers.ts");
  const mandatoryPaths = [
    "/",
    "/moon-rocks",
    "/moon-pods",
    "/orbit",
    "/our-story",
    "/learn",
    "/learn/[guide]",
    "/find-us",
    "/contact",
  ];
  const missingMandatoryPaths = mandatoryPaths.filter(
    (routePath) => !routesText.includes(`"${routePath}"`),
  );

  if (missingMandatoryPaths.length === 0) {
    addResult(
      "PASS",
      "routes.registry.mandatory",
      "Mandatory Presidential route set is represented in the route registry.",
    );
  } else {
    addResult(
      "FAIL",
      "routes.registry.mandatory",
      "Mandatory Presidential routes are missing from the route registry.",
      missingMandatoryPaths,
      "Represent every doctrine-required route before building public pages.",
    );
  }

  const canonicalAlignment =
    helpersText.includes("PRODUCTION_ORIGIN") &&
    helpersText.includes("canonicalUrl(route.canonicalPath)") &&
    helpersText.includes("buildRouteCanonicalUrl");

  if (canonicalAlignment) {
    addResult(
      "PASS",
      "routes.canonical",
      "Route canonical helper delegates to the production-host canonical URL boundary.",
    );
  } else {
    addResult(
      "FAIL",
      "routes.canonical",
      "Route canonical helper is missing production host alignment.",
      [
        `PRODUCTION_ORIGIN referenced: ${helpersText.includes("PRODUCTION_ORIGIN")}`,
        `canonicalUrl(route.canonicalPath) referenced: ${helpersText.includes("canonicalUrl(route.canonicalPath)")}`,
      ],
      "Route canonical URLs must flow through the central canonical URL helper.",
    );
  }

  const templateCanonicalGuard =
    helpersText.includes("isRouteTemplate") &&
    helpersText.includes("Cannot build a concrete canonical URL for route template");

  if (templateCanonicalGuard) {
    addResult(
      "PASS",
      "routes.canonicalTemplates",
      "Route canonical helper refuses unresolved dynamic template routes.",
    );
  } else {
    addResult(
      "FAIL",
      "routes.canonicalTemplates",
      "Dynamic template routes can be converted into concrete canonical URLs.",
      [],
      "Block bracket-template canonicals until approved source records resolve real paths.",
    );
  }

  const sitemapEligibilityLogic =
    indexabilityText.includes("isSitemapEligible") &&
    indexabilityText.includes('route.status === "approved"') &&
    indexabilityText.includes('route.indexability === "index_follow"') &&
    indexabilityText.includes('route.sitemap === "include"') &&
    indexabilityText.includes("route.blocks.length === 0");

  if (sitemapEligibilityLogic) {
    addResult(
      "PASS",
      "routes.sitemapEligibility",
      "Sitemap eligibility logic requires approved status, index_follow, include policy, and zero blockers.",
    );
  } else {
    addResult(
      "FAIL",
      "routes.sitemapEligibility",
      "Sitemap eligibility logic is incomplete.",
      [],
      "Keep sitemap eligibility strict before creating app/sitemap.ts.",
    );
  }

  const privateFutureBlocks = [
    getRouteDefinitionText(routesText, "/loyalty"),
    getRouteDefinitionText(routesText, "/admin"),
    getRouteDefinitionText(routesText, "/api"),
    getRouteDefinitionText(routesText, "/preview"),
    getRouteDefinitionText(routesText, "/drafts"),
    getRouteDefinitionText(routesText, "/internal-threat-research"),
  ];
  const privateFutureSafe = privateFutureBlocks.every(
    (routeText) =>
      routeText &&
      routeText.includes('sitemap: "exclude"') &&
      (routeText.includes('indexability: "noindex"') ||
        routeText.includes('indexability: "not_published"')),
  );

  if (privateFutureSafe) {
    addResult(
      "PASS",
      "routes.privateFuture",
      "Private, blocked, and future route placeholders are not sitemap eligible.",
    );
  } else {
    addResult(
      "FAIL",
      "routes.privateFuture",
      "Private, blocked, or future route placeholders may be sitemap eligible.",
      [],
      "Keep private/future/internal route records excluded and noindex/not_published.",
    );
  }

  const moonPodsText = getRouteDefinitionText(routesText, "/moon-pods");
  const orbitText = getRouteDefinitionText(routesText, "/orbit");
  const pillarGates = ["product_catalog", "product_assets", "product_claims", "compliance_review"];
  const pillarsStayGated =
    moonPodsText.includes('status: "conditional"') &&
    orbitText.includes('status: "conditional"') &&
    pillarGates.every(
      (gate) => moonPodsText.includes(`"${gate}"`) && orbitText.includes(`"${gate}"`),
    );

  if (pillarsStayGated) {
    addResult(
      "PASS",
      "routes.publicPillars.gates",
      "Moon Pods and Orbit are represented as public pillars but remain gated until product proof and compliance fields pass.",
    );
  } else {
    addResult(
      "FAIL",
      "routes.publicPillars.gates",
      "Moon Pods or Orbit route records lost required proof/compliance gates.",
      [],
      "Keep Moon Pods and Orbit conditional until product facts, assets, claims, compliance, and schema gates pass.",
    );
  }

  const locatorRouteTexts = [
    getRouteDefinitionText(routesText, "/find-us"),
    getRouteDefinitionText(routesText, "/find-us/[state]"),
    getRouteDefinitionText(routesText, "/find-us/[state]/[city]"),
    getRouteDefinitionText(routesText, "/find-us/[state]/[city]/[retailer]"),
  ];
  const locatorRoutesStayGated = locatorRouteTexts.every(
    (routeText) =>
      routeText &&
      routeText.includes('"verified_store_data"') &&
      routeText.includes('sitemap: "conditional"'),
  );

  if (locatorRoutesStayGated) {
    addResult(
      "PASS",
      "routes.locator.gates",
      "Find Us and locator routes remain gated until verified store data exists.",
    );
  } else {
    addResult(
      "FAIL",
      "routes.locator.gates",
      "Locator route records are missing verified store data gates.",
      [],
      "Keep locator routes conditional until verified store data and legal/compliance gates pass.",
    );
  }
}

function checkSourceRecordContractFoundation() {
  const requiredFiles = [
    "src/lib/seo/source-records/types.ts",
    "src/lib/seo/source-records/route-publication.ts",
    "src/lib/seo/source-records/index.ts",
  ];
  const missingFiles = requiredFiles.filter((file) => !projectFileExists(file));

  if (missingFiles.length === 0) {
    addResult(
      "PASS",
      "sourceRecords.foundation.files",
      "Step 8H source-record contract files exist.",
    );
  } else {
    addResult(
      "FAIL",
      "sourceRecords.foundation.files",
      "Step 8H source-record contract files are missing.",
      missingFiles,
      "Create a TypeScript-only source-record contract layer before route promotion work continues.",
    );
    return;
  }

  const typesText = readProjectFile("src/lib/seo/source-records/types.ts");
  const publicationText = readProjectFile(
    "src/lib/seo/source-records/route-publication.ts",
  );
  const indexabilityText = readProjectFile("src/lib/seo/indexability.ts");
  const sitemapText = readProjectFile("src/lib/seo/sitemap.ts");

  const requiredStateUnions = [
    "PublicationStatus",
    "ApprovalStatus",
    "ProofStatus",
    "ComplianceStatus",
    "AssetStatus",
    "SchemaStatus",
    "RoutePublicationIndexability",
    "RoutePublicationSitemapPolicy",
    "ConfidentialityStatus",
    "AllowedUsage",
    "ProofLevel",
  ];
  const missingUnions = requiredStateUnions.filter(
    (name) => !typesText.includes(`export type ${name} =`),
  );
  const looseUnionEscapes = requiredStateUnions.filter((name) => {
    const unionMatch = typesText.match(
      new RegExp(`export type ${name} =[\\s\\S]*?;`),
    );
    return Boolean(unionMatch?.[0].includes("| string"));
  });

  if (missingUnions.length === 0 && looseUnionEscapes.length === 0) {
    addResult(
      "PASS",
      "sourceRecords.stateUnions",
      "Source-record approval states are explicit unions without loose string escape hatches.",
    );
  } else {
    addResult(
      "FAIL",
      "sourceRecords.stateUnions",
      "Source-record state unions are incomplete or too loose.",
      [
        `missing unions: ${missingUnions.join(", ") || "none"}`,
        `loose string unions: ${looseUnionEscapes.join(", ") || "none"}`,
      ],
      "Keep approval states as explicit TypeScript unions so future publication gates cannot silently widen.",
    );
  }

  const requiredRecordTypes = [
    "SourceRecord",
    "ProofRecord",
    "ClaimRecord",
    "AssetRecord",
    "AssetProvenanceRecord",
    "SeoMetadataRecord",
    "SchemaRecord",
    "RoutePublicationRecord",
  ];
  const missingRecordTypes = requiredRecordTypes.filter(
    (name) => !typesText.includes(`export type ${name} =`),
  );

  if (missingRecordTypes.length === 0) {
    addResult(
      "PASS",
      "sourceRecords.recordFamilies",
      "Source, proof, claim, asset, metadata, schema, and route-publication contracts exist.",
    );
  } else {
    addResult(
      "FAIL",
      "sourceRecords.recordFamilies",
      "Required Step 8G record families are missing from the TypeScript contract layer.",
      missingRecordTypes,
      "Translate Step 8G record families into narrow contracts before approval enforcement continues.",
    );
  }

  const routePublicationBridge =
    publicationText.includes("APPROVED_ROUTE_PUBLICATIONS = []") &&
    publicationText.includes("satisfies readonly RoutePublicationRecord[]") &&
    publicationText.includes("getRoutePublicationRecord") &&
    publicationText.includes("getRoutePublicationGateBlockReasons") &&
    publicationText.includes("source_record:route_publication_missing") &&
    publicationText.includes('record.publicationStatus !== "published"') &&
    publicationText.includes('record.approvalStatus !== "approved"') &&
    publicationText.includes('record.confidentialityStatus !== "public"') &&
    publicationText.includes('record.indexability !== "index_follow"') &&
    publicationText.includes('record.sitemapPolicy !== "include"') &&
    publicationText.includes('record.canonicalStatus !== "production"') &&
    publicationText.includes("record.launchBlockers");

  if (routePublicationBridge) {
    addResult(
      "PASS",
      "sourceRecords.routePublicationBridge",
      "Route publication approval is represented as a separate empty source-record gate, not fake client data.",
    );
  } else {
    addResult(
      "FAIL",
      "sourceRecords.routePublicationBridge",
      "Route publication approval gate is missing or incomplete.",
      [],
      "Keep an empty approved-publication list and require publication, approval, public confidentiality, index_follow, sitemap include, production canonical, and zero launch blockers.",
    );
  }

  const indexabilityUsesSourceRecords =
    indexabilityText.includes("getRoutePublicationGateBlockReasons") &&
    indexabilityText.includes("reasons.push(") &&
    indexabilityText.includes("...getRoutePublicationGateBlockReasons(") &&
    indexabilityText.includes("gateInput.routePublicationRecords") &&
    indexabilityText.includes("gateInput.routePublicationContext") &&
    indexabilityText.includes(").length === 0");

  if (indexabilityUsesSourceRecords) {
    addResult(
      "PASS",
      "sourceRecords.indexabilityGate",
      "Sitemap eligibility now requires both route registry posture and source-record publication approval.",
    );
  } else {
    addResult(
      "FAIL",
      "sourceRecords.indexabilityGate",
      "Indexability/sitemap helpers can still bypass the source-record approval gate.",
      [],
      "Call getRoutePublicationGateBlockReasons(route, records, context) inside sitemap eligibility and block reasons.",
    );
  }

  const sitemapStillDelegates =
    sitemapText.includes("isSitemapEligible(route)") &&
    sitemapText.includes("!isRouteTemplate(route)") &&
    !/https?:\/\//i.test(sitemapText);

  if (sitemapStillDelegates) {
    addResult(
      "PASS",
      "sourceRecords.sitemapDelegation",
      "Sitemap output still delegates to strict eligibility and does not contain independent URLs.",
    );
  } else {
    addResult(
      "FAIL",
      "sourceRecords.sitemapDelegation",
      "Sitemap helper may bypass eligibility or contain independent URLs.",
      [],
      "Keep sitemap generation sourced from route eligibility plus source-record publication approval.",
    );
  }

  const publicSeoHelpers =
    publicationText.includes("isSourceAllowedForPublicSeo") &&
    publicationText.includes('source.allowedUsage === "production"') &&
    publicationText.includes('source.confidentialityStatus === "public"') &&
    publicationText.includes("isProofApprovedForPublicClaim") &&
    publicationText.includes("official_primary") &&
    publicationText.includes("client_confirmed") &&
    publicationText.includes("isClaimApprovedForPublicSeo") &&
    publicationText.includes("isAssetApprovedForPublicSeo") &&
    publicationText.includes("blacklistCheckStatus");

  if (publicSeoHelpers) {
    addResult(
      "PASS",
      "sourceRecords.publicSeoHelpers",
      "Public SEO helpers enforce production-only public sources, approved proof, approved claims, and asset provenance.",
    );
  } else {
    addResult(
      "FAIL",
      "sourceRecords.publicSeoHelpers",
      "Public SEO source/proof/claim/asset helper boundaries are incomplete.",
      [],
      "Add pure helpers for production public sources, approved proof, approved claims, and approved asset provenance.",
    );
  }

  const sourceRecordBlock =
    typesText.match(/export type SourceRecord = \{[\s\S]*?\};/)?.[0] ?? "";
  const sourceRecordHasConfidentiality = sourceRecordBlock.includes(
    "confidentialityStatus: ConfidentialityStatus;",
  );
  const sourceGateBlock =
    publicationText.match(
      /export function isSourceAllowedForPublicSeo[\s\S]*?\n\}/,
    )?.[0] ?? "";
  const sourceGateChecksBoth =
    sourceGateBlock.includes('source.allowedUsage === "production"') &&
    sourceGateBlock.includes('source.confidentialityStatus === "public"');

  if (sourceRecordHasConfidentiality && sourceGateChecksBoth) {
    addResult(
      "PASS",
      "sourceRecords.confidentialityFirewall",
      "SourceRecord carries confidentialityStatus and public SEO source eligibility requires production usage plus public confidentiality.",
    );
  } else {
    addResult(
      "FAIL",
      "sourceRecords.confidentialityFirewall",
      "Confidential source firewall is incomplete on the SourceRecord contract or gate helper.",
      [
        `SourceRecord.confidentialityStatus present: ${sourceRecordHasConfidentiality}`,
        `isSourceAllowedForPublicSeo checks allowedUsage and confidentialityStatus: ${sourceGateChecksBoth}`,
      ],
      "Require confidentialityStatus on SourceRecord and gate public SEO eligibility on production usage plus public confidentiality.",
    );
  }
}

function checkMetadataFoundation() {
  const requiredFiles = [
    "src/lib/seo/metadata-types.ts",
    "src/lib/seo/metadata-helpers.ts",
    "src/lib/seo/metadata.ts",
  ];
  const missingFiles = requiredFiles.filter((file) => !projectFileExists(file));

  if (missingFiles.length === 0) {
    addResult(
      "PASS",
      "metadata.foundation.files",
      "Metadata source-of-truth helper files exist.",
    );
  } else {
    addResult(
      "FAIL",
      "metadata.foundation.files",
      "Metadata helper foundation files are missing.",
      missingFiles,
      "Create the Step 8B metadata helper files before route metadata integration continues.",
    );
    return;
  }

  const metadataText = readProjectFile("src/lib/seo/metadata.ts");
  const helpersText = readProjectFile("src/lib/seo/metadata-helpers.ts");

  const nextMetadataType =
    metadataText.includes('import type { Metadata } from "next"') &&
    metadataText.includes("buildRouteMetadata(input: BuildRouteMetadataInput): Metadata");

  if (nextMetadataType) {
    addResult(
      "PASS",
      "metadata.nextType",
      "Metadata helper uses the installed Next.js Metadata type boundary.",
    );
  } else {
    addResult(
      "FAIL",
      "metadata.nextType",
      "Metadata helper is missing the Next.js Metadata type boundary.",
      [],
      "Return typed Next.js Metadata from the route metadata helper.",
    );
  }

  const canonicalUsesRouteHelpers =
    metadataText.includes("buildRouteMetadataUrlFields") &&
    helpersText.includes("buildRouteCanonicalUrl") &&
    helpersText.includes("assertProductionMetadataUrl") &&
    helpersText.includes("PRODUCTION_ORIGIN");

  if (canonicalUsesRouteHelpers) {
    addResult(
      "PASS",
      "metadata.canonical",
      "Metadata canonicals use route helpers and the production host boundary.",
    );
  } else {
    addResult(
      "FAIL",
      "metadata.canonical",
      "Metadata canonical construction does not use the production route helper boundary.",
      [],
      "Route metadata canonicals must flow through route helpers and production-host URL validation.",
    );
  }

  const templateGuard =
    helpersText.includes("Cannot build metadata for unresolved route template") &&
    helpersText.includes("isRouteTemplate(input.route)") &&
    helpersText.includes("assertConcreteMetadataPath");

  if (templateGuard) {
    addResult(
      "PASS",
      "metadata.templateCanonicals",
      "Metadata helpers refuse unresolved dynamic template canonicals.",
    );
  } else {
    addResult(
      "FAIL",
      "metadata.templateCanonicals",
      "Metadata helpers may emit canonical URLs for unresolved dynamic template routes.",
      [],
      "Block bracket-template route metadata until a concrete approved source record resolves the path.",
    );
  }

  const robotsDerivedFromIndexability =
    metadataText.includes("buildRouteRobots") &&
    metadataText.includes("isIndexFollow(route)") &&
    metadataText.includes('route.status === "approved"') &&
    metadataText.includes("route.blocks.length === 0") &&
    metadataText.includes("getRoutePublicationGateBlockReasons(") &&
    metadataText.includes("gateInput.routePublicationRecords") &&
    metadataText.includes("gateInput.routePublicationContext") &&
    metadataText.includes(").length === 0") &&
    metadataText.includes("route.indexability === \"conditional_index\"");

  if (robotsDerivedFromIndexability) {
    addResult(
      "PASS",
      "metadata.robots",
      "Robots metadata is dual-gated by route approval, indexability, blockers, and source-record route publication approval.",
    );
  } else {
    addResult(
      "FAIL",
      "metadata.robots",
      "Robots metadata is not clearly dual-gated by route indexability and source-record publication approval.",
      [],
      "Derive robots metadata from route status, indexability, blocker state, and getRoutePublicationGateBlockReasons(route, records, context).",
    );
  }

  const robotsPublicationGateImport =
    metadataText.includes('from "./source-records"') &&
    metadataText.includes("getRoutePublicationGateBlockReasons");

  if (robotsPublicationGateImport) {
    addResult(
      "PASS",
      "metadata.robotsPublicationGate",
      "Metadata robots imports and uses the source-record route-publication gate.",
    );
  } else {
    addResult(
      "FAIL",
      "metadata.robotsPublicationGate",
      "Metadata robots does not import the source-record route-publication gate.",
      [],
      "Import getRoutePublicationGateBlockReasons and require it to pass before robots index:true can emit.",
    );
  }

  const socialUrlsUseCanonical =
    metadataText.includes("openGraph") &&
    metadataText.includes("url: openGraphUrl") &&
    metadataText.includes("twitter") &&
    helpersText.includes("openGraphUrl: canonical");

  if (socialUrlsUseCanonical) {
    addResult(
      "PASS",
      "metadata.socialUrls",
      "Open Graph URL metadata uses the canonical production URL and Twitter metadata does not introduce a separate URL.",
    );
  } else {
    addResult(
      "FAIL",
      "metadata.socialUrls",
      "Open Graph/Twitter metadata may introduce URLs outside the canonical production URL helper.",
      [],
      "Use the canonical production URL for Open Graph and avoid separate social URL construction.",
    );
  }

  const conservativeTwitterCard =
    metadataText.includes('TWITTER_CARD_TYPE = "summary"') &&
    metadataText.includes("card: TWITTER_CARD_TYPE") &&
    !metadataText.includes("images:");

  if (conservativeTwitterCard) {
    addResult(
      "PASS",
      "metadata.twitterCard",
      "Twitter metadata uses a conservative summary card and does not attach unapproved image fields.",
    );
  } else {
    addResult(
      "FAIL",
      "metadata.twitterCard",
      "Twitter metadata may imply approved large-card image assets before provenance exists.",
      [],
      "Use a summary Twitter card until approved social image assets exist.",
    );
  }

  const textSafety =
    helpersText.includes("assertMetadataTextSafe") &&
    metadataText.includes("assertMetadataTextSafe(input.title ?? route.title") &&
    metadataText.includes("assertMetadataTextSafe(");

  if (textSafety) {
    addResult(
      "PASS",
      "metadata.textSafety",
      "Metadata title and description pass through a text safety helper before emission.",
    );
  } else {
    addResult(
      "FAIL",
      "metadata.textSafety",
      "Metadata title/description safety checks are missing.",
      [],
      "Run title and description through the metadata text safety helper.",
    );
  }
}

function checkSitemapRobotsFoundation() {
  const requiredFiles = [
    "src/app/sitemap.ts",
    "src/app/robots.ts",
    "src/lib/seo/sitemap.ts",
    "src/lib/seo/robots.ts",
  ];
  const missingFiles = requiredFiles.filter((file) => !projectFileExists(file));

  if (missingFiles.length === 0) {
    addResult(
      "PASS",
      "sitemapRobots.foundation.files",
      "Native sitemap/robots files and SEO helper files exist.",
    );
  } else {
    addResult(
      "FAIL",
      "sitemapRobots.foundation.files",
      "Step 8C sitemap/robots foundation files are missing.",
      missingFiles,
      "Create native Next.js app/sitemap.ts and app/robots.ts plus narrow SEO helpers.",
    );
    return;
  }

  const appSitemapText = readProjectFile("src/app/sitemap.ts");
  const appRobotsText = readProjectFile("src/app/robots.ts");
  const sitemapText = readProjectFile("src/lib/seo/sitemap.ts");
  const robotsText = readProjectFile("src/lib/seo/robots.ts");

  const nativeSitemap =
    appSitemapText.includes('import type { MetadataRoute } from "next"') &&
    appSitemapText.includes('from "@/lib/seo/sitemap"') &&
    appSitemapText.includes("buildPresidentialSitemap()") &&
    appSitemapText.includes("MetadataRoute.Sitemap");

  if (nativeSitemap) {
    addResult(
      "PASS",
      "sitemap.native",
      "Next.js native app/sitemap.ts delegates to the Presidential sitemap helper.",
    );
  } else {
    addResult(
      "FAIL",
      "sitemap.native",
      "Native sitemap file is not wired to the Presidential sitemap source of truth.",
      [],
      "Keep app/sitemap.ts as a small MetadataRoute.Sitemap wrapper around buildPresidentialSitemap.",
    );
  }

  const sitemapUsesRouteRegistry =
    sitemapText.includes("ROUTE_REGISTRY") &&
    sitemapText.includes("isSitemapEligible(route)") &&
    sitemapText.includes("!isRouteTemplate(route)") &&
    sitemapText.includes("buildRouteCanonicalUrl(route)");

  if (sitemapUsesRouteRegistry) {
    addResult(
      "PASS",
      "sitemap.registry",
      "Sitemap helper consumes the route registry, sitemap eligibility, template guard, and canonical URL helper.",
    );
  } else {
    addResult(
      "FAIL",
      "sitemap.registry",
      "Sitemap helper is not fully tied to route registry eligibility and canonical doctrine.",
      [],
      "Build sitemap entries only from eligible concrete route records through buildRouteCanonicalUrl.",
    );
  }

  const sitemapRestraint =
    !sitemapText.includes("images:") &&
    !sitemapText.includes("videos:") &&
    !sitemapText.includes("alternates:");

  if (sitemapRestraint) {
    addResult(
      "PASS",
      "sitemap.assetRestraint",
      "Sitemap foundation does not attach unapproved image, video, or alternate-locale fields.",
    );
  } else {
    addResult(
      "FAIL",
      "sitemap.assetRestraint",
      "Sitemap helper may attach unapproved image, video, or alternate-locale fields.",
      [],
      "Keep rich sitemap extensions out until approved media, locale, and asset provenance records exist.",
    );
  }

  const hardcodedSitemapRoutePaths = [
    "/moon-rocks",
    "/moon-pods",
    "/orbit",
    "/learn",
    "/find-us",
    "/contact",
    "/admin",
    "/api",
    "/preview",
    "/drafts",
    "/internal-threat-research",
  ].filter(
    (routePath) =>
      appSitemapText.includes(`"${routePath}"`) ||
      appSitemapText.includes(`'${routePath}'`) ||
      sitemapText.includes(`"${routePath}"`) ||
      sitemapText.includes(`'${routePath}'`),
  );
  const sitemapHasNoIndependentUrls =
    !/https?:\/\//i.test(appSitemapText) &&
    !/https?:\/\//i.test(sitemapText) &&
    hardcodedSitemapRoutePaths.length === 0;

  if (sitemapHasNoIndependentUrls) {
    addResult(
      "PASS",
      "sitemap.noIndependentUrls",
      "Sitemap foundation does not contain independent hard-coded URLs or route lists.",
    );
  } else {
    addResult(
      "FAIL",
      "sitemap.noIndependentUrls",
      "Sitemap foundation may be acting as a second route registry.",
      hardcodedSitemapRoutePaths,
      "Keep sitemap URLs sourced from ROUTE_REGISTRY eligibility and canonical helpers only.",
    );
  }

  const sitemapTemplateGuard =
    sitemapText.includes("!isRouteTemplate(route)") &&
    sitemapText.includes("Route is not eligible for sitemap output");

  if (sitemapTemplateGuard) {
    addResult(
      "PASS",
      "sitemap.noTemplates",
      "Sitemap helper blocks unresolved dynamic template routes from output.",
    );
  } else {
    addResult(
      "FAIL",
      "sitemap.noTemplates",
      "Sitemap helper may allow unresolved dynamic templates into sitemap output.",
      [],
      "Require a concrete approved path before emitting dynamic route family URLs.",
    );
  }

  const nativeRobots =
    appRobotsText.includes('import type { MetadataRoute } from "next"') &&
    appRobotsText.includes('from "@/lib/seo/robots"') &&
    appRobotsText.includes("buildPresidentialRobots()") &&
    appRobotsText.includes("MetadataRoute.Robots");

  if (nativeRobots) {
    addResult(
      "PASS",
      "robots.native",
      "Next.js native app/robots.ts delegates to the Presidential robots helper.",
    );
  } else {
    addResult(
      "FAIL",
      "robots.native",
      "Native robots file is not wired to the Presidential robots source of truth.",
      [],
      "Keep app/robots.ts as a small MetadataRoute.Robots wrapper around buildPresidentialRobots.",
    );
  }

  const robotsProductionSitemap =
    robotsText.includes('canonicalUrl("/sitemap.xml")') &&
    robotsText.includes("sitemap: ROBOTS_SITEMAP_URL");

  if (robotsProductionSitemap) {
    addResult(
      "PASS",
      "robots.productionSitemap",
      "Robots helper points crawlers to the canonical production sitemap URL without adding nonessential host directives.",
    );
  } else {
    addResult(
      "FAIL",
      "robots.productionSitemap",
      "Robots helper does not clearly point to the canonical production sitemap.",
      [],
      "Build the robots sitemap field from canonicalUrl('/sitemap.xml') only.",
    );
  }

  const robotsPrivateDisallow =
    robotsText.includes("ROUTE_REGISTRY") &&
    robotsText.includes("isPrivateOrFutureRoute(route)") &&
    robotsText.includes('route.kind === "private_system"') &&
    robotsText.includes("normalizeDisallowPath(route.path)");

  if (robotsPrivateDisallow) {
    addResult(
      "PASS",
      "robots.privateFuture",
      "Robots disallow paths are derived from private, blocked, and future route records.",
    );
  } else {
    addResult(
      "FAIL",
      "robots.privateFuture",
      "Robots disallow logic is not clearly derived from private/future route records.",
      [],
      "Derive disallow paths from private, blocked, future, and private_system route records.",
    );
  }

  const robotsDoesNotBlockPublicPillars =
    !robotsText.includes('"/moon-rocks"') &&
    !robotsText.includes('"/moon-pods"') &&
    !robotsText.includes('"/orbit"') &&
    !robotsText.includes('"/find-us"') &&
    robotsText.includes('ROBOTS_ALLOW_PATHS = ["/"]');

  if (robotsDoesNotBlockPublicPillars) {
    addResult(
      "PASS",
      "robots.publicAllowed",
      "Robots foundation allows the public site root and does not hard-block future public pillar or locator routes.",
    );
  } else {
    addResult(
      "FAIL",
      "robots.publicAllowed",
      "Robots foundation may block future public pillar or locator routes.",
      [],
      "Do not disallow /moon-rocks, /moon-pods, /orbit, /find-us, or /learn at the robots layer.",
    );
  }

  const robotsNotGlobalBlock =
    robotsText.includes('ROBOTS_ALLOW_PATHS = ["/"]') &&
    !robotsText.includes('disallow: "/"') &&
    !robotsText.includes('disallow: ["/"]');

  if (robotsNotGlobalBlock) {
    addResult(
      "PASS",
      "robots.notGlobalBlock",
      "Robots foundation does not disallow the entire site for all crawlers.",
    );
  } else {
    addResult(
      "FAIL",
      "robots.notGlobalBlock",
      "Robots foundation may block the whole site.",
      [],
      "Allow the public root and do not set Disallow: / for the global crawler rule.",
    );
  }

  const robotsNoindexDistinction =
    !robotsText.includes("isNoindex") &&
    !robotsText.includes("conditional_index") &&
    !robotsText.includes("index_follow") &&
    !robotsText.includes("noindex");

  if (robotsNoindexDistinction) {
    addResult(
      "PASS",
      "robots.noindexDistinction",
      "Robots helper is not being used as a substitute for page-level noindex metadata.",
    );
  } else {
    addResult(
      "FAIL",
      "robots.noindexDistinction",
      "Robots helper may be mixing crawl blocking with page-level noindex policy.",
      [],
      "Use metadata robots for noindex/follow posture and robots.txt only for crawl boundaries.",
    );
  }
}

function checkRouteShellFoundation() {
  const routeShellPages = [
    { routePath: "/", filePath: "src/app/page.tsx" },
    { routePath: "/moon-rocks", filePath: "src/app/moon-rocks/page.tsx" },
    { routePath: "/moon-pods", filePath: "src/app/moon-pods/page.tsx" },
    { routePath: "/orbit", filePath: "src/app/orbit/page.tsx" },
    { routePath: "/our-story", filePath: "src/app/our-story/page.tsx" },
    { routePath: "/learn", filePath: "src/app/learn/page.tsx" },
    { routePath: "/find-us", filePath: "src/app/find-us/page.tsx" },
    { routePath: "/contact", filePath: "src/app/contact/page.tsx" },
  ];
  const missingPages = routeShellPages
    .filter(({ filePath }) => !projectFileExists(filePath))
    .map(({ filePath }) => filePath);

  if (missingPages.length === 0) {
    addResult(
      "PASS",
      "routeShells.static.exists",
      "Mandatory static Presidential route shell files exist.",
    );
  } else {
    addResult(
      "FAIL",
      "routeShells.static.exists",
      "Mandatory static route shell files are missing.",
      missingPages,
      "Create only the approved Step 8D static route shells.",
    );
    return;
  }

  const shellHelperExists =
    projectFileExists("src/lib/seo/route-page.ts") &&
    projectFileExists("src/components/seo/presidential-route-shell.tsx");

  if (shellHelperExists) {
    addResult(
      "PASS",
      "routeShells.helpers",
      "Route shell helper and shared Presidential shell component exist.",
    );
  } else {
    addResult(
      "FAIL",
      "routeShells.helpers",
      "Route shell helper or shared component is missing.",
      [],
      "Keep route shells shared and source-of-truth driven instead of duplicating page logic.",
    );
  }

  const helperText = readProjectFile("src/lib/seo/route-page.ts");
  const componentText = readProjectFile(
    "src/components/seo/presidential-route-shell.tsx",
  );
  const staticShellText = projectFileExists(
    "src/components/presidential/modules/static-route-foundation-shell.tsx",
  )
    ? readProjectFile("src/components/presidential/modules/static-route-foundation-shell.tsx")
    : "";

  const helperUsesRouteRegistry =
    helperText.includes("getRouteByPath(path)") &&
    helperText.includes("buildRouteMetadata({ route: getStaticRouteRecord(path) })") &&
    helperText.includes("isRouteTemplate(route)") &&
    helperText.includes("STATIC_ROUTE_SHELL_PATHS");

  if (helperUsesRouteRegistry) {
    addResult(
      "PASS",
      "routeShells.registry",
      "Route shell helper consumes route registry records and metadata helpers.",
    );
  } else {
    addResult(
      "FAIL",
      "routeShells.registry",
      "Route shell helper may bypass the route registry or metadata helper boundary.",
      [],
      "Use getRouteByPath plus buildRouteMetadata for static shell metadata.",
    );
  }

  const componentUsesRouteRecord =
    componentText.includes("StaticRouteFoundationShell") &&
    componentText.includes("breadcrumbs={breadcrumbs}") &&
    componentText.includes("links={links}") &&
    componentText.includes("route={route}") &&
    staticShellText.includes("route.h1") &&
    staticShellText.includes("route.description") &&
    componentText.includes("getStaticRouteShellLinks(route)") &&
    staticShellText.includes("For adults 21+ where legal");

  if (componentUsesRouteRecord) {
    addResult(
      "PASS",
      "routeShells.component",
      "Shared route shell component renders safe route-record copy and filtered internal links.",
    );
  } else {
    addResult(
      "FAIL",
      "routeShells.component",
      "Shared route shell component may not be using safe route-record copy.",
      [],
      "Render only route-record title/description and filtered concrete route links at this stage.",
    );
  }

  const pageMetadataIssues = [];
  const pageRegistryIssues = [];
  const pageShellIssues = [];

  for (const { routePath, filePath } of routeShellPages) {
    const text = readProjectFile(filePath);

    if (
      !text.includes(`ROUTE_PATH = "${routePath}"`) ||
      !text.includes("buildStaticRouteMetadata(ROUTE_PATH)") ||
      !text.includes("generateMetadata(): Metadata")
    ) {
      pageMetadataIssues.push(filePath);
    }

    if (!text.includes("getStaticRouteRecord(ROUTE_PATH)")) {
      pageRegistryIssues.push(filePath);
    }

    const expectedShell =
      routePath === "/"
        ? "<HomeRouteShell route={route} />"
        : "<PresidentialRouteShell route={route} />";

    if (!text.includes(expectedShell)) {
      pageShellIssues.push(filePath);
    }
  }

  if (pageMetadataIssues.length === 0) {
    addResult(
      "PASS",
      "routeShells.metadata",
      "Static route shells generate metadata through the approved route metadata helper.",
    );
  } else {
    addResult(
      "FAIL",
      "routeShells.metadata",
      "Some route shells do not generate metadata through the approved helper.",
      pageMetadataIssues,
      "Use buildStaticRouteMetadata so page metadata flows through buildRouteMetadata.",
    );
  }

  if (pageRegistryIssues.length === 0) {
    addResult(
      "PASS",
      "routeShells.records",
      "Static route shells fetch their route records from the registry helper.",
    );
  } else {
    addResult(
      "FAIL",
      "routeShells.records",
      "Some route shells may be bypassing route registry records.",
      pageRegistryIssues,
      "Use getStaticRouteRecord for each route shell.",
    );
  }

  if (pageShellIssues.length === 0) {
    addResult(
      "PASS",
      "routeShells.sharedShell",
      "Static route shells render through the approved shared route shell components.",
    );
  } else {
    addResult(
      "FAIL",
      "routeShells.sharedShell",
      "Some route shells may be duplicating shell markup or bypassing approved shell components.",
      pageShellIssues,
      "Use approved shared route shell components and keep custom visual composition behind guarded shells.",
    );
  }

  const learnGuidePath = "src/app/learn/[guide]/page.tsx";
  const learnGuideText = projectFileExists(learnGuidePath)
    ? readProjectFile(learnGuidePath)
    : "";
  const learnGuideCmsText = projectFileExists("src/lib/cms/learn-guide.ts")
    ? readProjectFile("src/lib/cms/learn-guide.ts")
    : "";
  const learnGuideSafe =
    learnGuideText.includes("dynamicParams = false") &&
    learnGuideText.includes("generateStaticParams") &&
    learnGuideText.includes("readPublicRenderableLearnGuideSlugs") &&
    !/generateStaticParams[\s\S]{0,500}learnGuideFallbacks\.map/.test(learnGuideText) &&
    learnGuideText.includes("notFound()") &&
    learnGuideText.includes("robots:") &&
    learnGuideText.includes("index: false") &&
    learnGuideCmsText.includes("PUBLIC_LEARN_GUIDE_SLUGS_QUERY") &&
    learnGuideCmsText.includes('routePhase == "approved_public"') &&
    learnGuideCmsText.includes('approvalGate.contentApprovalStatus == "approved_public"') &&
    learnGuideCmsText.includes('approvalGate.sourceProofStatus == "approved_public"') &&
    learnGuideCmsText.includes('approvalGate.legalReviewStatus == "approved_public"') &&
    !learnGuideText.includes("buildRouteMetadata") &&
    !learnGuideText.includes("buildStaticRouteMetadata") &&
    !learnGuideText.includes("buildRouteCanonicalUrl") &&
    !learnGuideText.includes("canonicalPath");

  if (learnGuideSafe) {
    addResult(
      "PASS",
      "routeShells.learnGuide",
      "Learn guide dynamic route renders only approved-CMS static params, stays noindex, and avoids unresolved canonicals.",
    );
  } else {
    addResult(
      "FAIL",
      "routeShells.learnGuide",
      "Learn guide route may emit fixture pages, indexable fake pages, or unresolved template metadata.",
      [],
      "Keep dynamicParams false, generate static params from approved CMS slugs only, unknown slugs notFound, generated guide shells noindex, and canonicals delegated away from unresolved templates.",
    );
  }

  const routesText = readProjectFile("src/lib/seo/routes.ts");
  const noApprovedSitemapRoutes =
    !/status:\s*"approved"[\s\S]{0,500}?sitemap:\s*"include"/.test(routesText);

  if (noApprovedSitemapRoutes) {
    addResult(
      "PASS",
      "routeShells.sitemapEmpty",
      "Route shells did not make any route indexable or sitemap-eligible.",
    );
  } else {
    addResult(
      "FAIL",
      "routeShells.sitemapEmpty",
      "A route may have been promoted to approved sitemap eligibility during Step 8D.",
      [],
      "Do not make routes indexable or sitemap-eligible until all approval gates pass.",
    );
  }
}

function checkStep9HHomeRouteComposition() {
  const homePagePath = "src/app/page.tsx";
  const homeShellPath = "src/components/seo/home-route-shell.tsx";

  if (!projectFileExists(homePagePath) || !projectFileExists(homeShellPath)) {
    addResult(
      "FAIL",
      "step9h.homeRouteCompositionFiles",
      "Step 9H home route composition files are missing.",
      [homePagePath, homeShellPath].filter((file) => !projectFileExists(file)),
      "Create the guarded home route shell and wire it through the home page only.",
    );
    return;
  }

  const homePageText = readProjectFile(homePagePath);
  const homeShellText = readProjectFile(homeShellPath);

  const pageStillUsesMetadataAndRegistry =
    homePageText.includes('ROUTE_PATH = "/"') &&
    homePageText.includes("buildStaticRouteMetadata(ROUTE_PATH)") &&
    homePageText.includes("getStaticRouteRecord(ROUTE_PATH)") &&
    homePageText.includes("<HomeRouteShell route={route} />") &&
    !homePageText.includes("<PresidentialRouteShell route={route} />");

  const shellKeepsSeoAuthorityBoundary =
    homeShellText.includes("buildRouteShellJsonLd(route)") &&
    homeShellText.includes("<HomepageFoundationShell route={route} />") &&
    homeShellText.includes('route.id !== "home"') &&
    homeShellText.includes('route.path !== "/"') &&
    !homeShellText.includes("buildRouteMetadata") &&
    !homeShellText.includes("buildPresidentialSitemap") &&
    !homeShellText.includes("buildPresidentialRobots");

  const unsafePatterns = [
    { label: "public unlock true", regex: /publicUnlock:\s*true|data-presidential-public-unlock="true"/i },
    { label: "public SEO approval", regex: /public\s+seo\s+(unlocked|approved|enabled|live)/i },
    { label: "indexability promotion", regex: /\b(index_follow|index\/follow|indexable|sitemap eligible)\b/i },
    { label: "route publication approval", regex: /route[-\s]publication\s+(approved|unlocked|enabled|live)/i },
    { label: "sitemap unlock", regex: /sitemap\s+(unlocked|enabled|live|inclusion approved)/i },
    { label: "commerce language", regex: /\b(price|pricing|inventory|shipping|delivery|deliver|buy online|order online|direct order|checkout|cart|reviews?|ratings?)\b/i },
    { label: "medical or effect language", regex: /\b(euphoric|euphoria|relax(?:ing|ed|ation)?|therapeutic|cerebral|uplifting|sedating|pain|anxiety|sleep|cure|treats?)\b/i },
    { label: "unsupported superlative", regex: /\b(world'?s strongest|highest form|strongest flavor|most potent|#1\b|number[- ]one|top[- ]?ranked|best)\b/i },
    { label: "threat-domain/public accusation language", regex: /\b(imposter|scam|hijack(?:ed|ing)?|stolen|counterfeit|knockoff|fraud)\b/i },
  ];
  const unsafeMatches = [
    { path: homePagePath, text: homePageText },
    { path: homeShellPath, text: homeShellText },
  ].flatMap((file) => {
    const lines = stripApprovedVisibleClaimsFromSource(file.path, file.text).split(/\r?\n/);
    return lines.flatMap((line, index) =>
      unsafePatterns
        .filter((pattern) => pattern.regex.test(line))
        .map((pattern) => `${file.path}:${index + 1} ${pattern.label}`),
    );
  });

  const visibleCopyPaths = [
    "src/components/presidential/media/media-slot.tsx",
    "src/components/presidential/modules/homepage-foundation-shell.tsx",
    "src/components/presidential/modules/moon-rocks-platform-shell.tsx",
    "src/components/presidential/modules/pillar-platform-shell.tsx",
    "src/components/presidential/modules/find-us-cta-shell.tsx",
  ];
  const visibleLeakPatterns = [
    {
      label: "visible build-state language",
      regex:
        /\b(shell|foundation|preview|pending approval|blocked until|locator workflow|workflow|staged|placeholder|internal)\b/i,
    },
    {
      label: "visible SEO workflow language",
      regex:
        /\b(metadata|schema|sitemap|route[-\s]publication|public[-\s]unlock|approval[-\s]gated)\b/i,
    },
  ];
  const visibleLinePatterns = [
    /^\s*(title|purpose|description|mediaLabel|label|note):\s*["`]/,
    /\b(description|title|label|note|kicker)\s*=\s*["{`]/,
    /^\s*note\s*=\s*["`]/,
    /<span[^>]*>/,
    /<p[^>]*>/,
    /^\s*[A-Z0-9][^<>{};]+$/,
  ];
  const machineOnlyLinePattern =
    /\b(data-presidential-|ariaLabelledBy|id=|throw new Error|export |import |type |function |readonly |status:|const classNames|const headingId|getPlaceholderPolicy|PlaceholderKind|PublicSurface)\b/;
  const visibleCopyLeaks = visibleCopyPaths.flatMap((path) => {
    if (!projectFileExists(path)) return [`${path}: missing visible-copy source file`];

    return stripApprovedVisibleClaimsFromSource(path, readProjectFile(path))
      .split(/\r?\n/)
      .flatMap((line, index) => {
        if (machineOnlyLinePattern.test(line)) return [];
        if (!visibleLinePatterns.some((pattern) => pattern.test(line))) return [];

        return visibleLeakPatterns
          .filter((pattern) => pattern.regex.test(line))
          .map((pattern) => `${path}:${index + 1} ${pattern.label}: ${line.trim()}`);
      });
  });

  if (visibleCopyLeaks.length === 0) {
    addResult(
      "PASS",
      "step9h.visibleHomeCopy",
      "Step 9H guarded home composition avoids visible build-state, workflow, and public-SEO process language.",
    );
  } else {
    addResult(
      "FAIL",
      "step9h.visibleHomeCopy",
      "Step 9H guarded home composition exposes visible build-state or workflow language.",
      visibleCopyLeaks,
      "Keep machine-readable guardrails in policy/source files, but use public-safe visible copy and public-safe attributes.",
    );
  }

  if (
    pageStillUsesMetadataAndRegistry &&
    shellKeepsSeoAuthorityBoundary &&
    unsafeMatches.length === 0 &&
    visibleCopyLeaks.length === 0
  ) {
    addResult(
      "PASS",
      "step9h.homeRouteComposition",
      "Step 9H home route composition uses the guarded home shell while preserving metadata, registry, JSON-LD, and no-public-unlock boundaries.",
    );
    return;
  }

  addResult(
    "FAIL",
    "step9h.homeRouteComposition",
    "Step 9H home route composition is incomplete or may bypass approved guarded boundaries.",
    [
      `page metadata/registry/shell boundary: ${pageStillUsesMetadataAndRegistry}`,
      `home shell SEO boundary: ${shellKeepsSeoAuthorityBoundary}`,
      ...unsafeMatches,
    ],
    "Keep app/page.tsx routed through buildStaticRouteMetadata, getStaticRouteRecord, and HomeRouteShell; keep HomeRouteShell limited to JSON-LD plus HomepageFoundationShell.",
  );
}

function checkRouteShellSchemaFoundation() {
  const helperPath = "src/lib/seo/schema/routeShell.ts";
  const schemaIndexPath = "src/lib/seo/schema/index.ts";
  const componentPath = "src/components/seo/presidential-route-shell.tsx";

  const requiredFiles = [helperPath, schemaIndexPath, componentPath];
  const missingFiles = requiredFiles.filter((file) => !projectFileExists(file));

  if (missingFiles.length === 0) {
    addResult(
      "PASS",
      "schema.routeShell.files",
      "Route-shell JSON-LD helper, schema export, and shared shell component exist.",
    );
  } else {
    addResult(
      "FAIL",
      "schema.routeShell.files",
      "Route-shell JSON-LD foundation files are missing.",
      missingFiles,
      "Create the Step 8F route-shell schema helper and wire it through the shared route shell.",
    );
    return;
  }

  const helperText = readProjectFile(helperPath);
  const schemaIndexText = readProjectFile(schemaIndexPath);
  const componentText = readProjectFile(componentPath);
  const staticShellText = projectFileExists(
    "src/components/presidential/modules/static-route-foundation-shell.tsx",
  )
    ? readProjectFile("src/components/presidential/modules/static-route-foundation-shell.tsx")
    : "";

  const exported =
    schemaIndexText.includes('export * from "./routeShell"') ||
    schemaIndexText.includes("export * from './routeShell'");

  if (exported) {
    addResult(
      "PASS",
      "schema.routeShell.export",
      "Route-shell schema helper is exported through the schema module boundary.",
    );
  } else {
    addResult(
      "FAIL",
      "schema.routeShell.export",
      "Route-shell schema helper is not exported through the schema module boundary.",
      [],
      "Export routeShell from src/lib/seo/schema/index.ts.",
    );
  }

  const usesApprovedBuilders =
    helperText.includes("buildOrganizationSchema") &&
    helperText.includes("buildWebsiteSchema") &&
    helperText.includes("buildWebPageSchema") &&
    helperText.includes("buildBreadcrumbSchema") &&
    helperText.includes("buildRouteCanonicalUrl(route)") &&
    helperText.includes("assertMetadataTextSafe");

  if (usesApprovedBuilders) {
    addResult(
      "PASS",
      "schema.routeShell.builders",
      "Route-shell JSON-LD uses approved schema, canonical, and text-safety helpers.",
    );
  } else {
    addResult(
      "FAIL",
      "schema.routeShell.builders",
      "Route-shell JSON-LD may bypass approved schema/canonical/text-safety helpers.",
      [],
      "Build shell JSON-LD from existing Organization, WebSite, WebPage, BreadcrumbList, canonical, and text-safety helpers.",
    );
  }

  const templateGuard =
    helperText.includes("isRouteTemplate(route)") &&
    helperText.includes("Cannot build route shell schema for unresolved template route");

  if (templateGuard) {
    addResult(
      "PASS",
      "schema.routeShell.templates",
      "Route-shell schema refuses unresolved dynamic template routes.",
    );
  } else {
    addResult(
      "FAIL",
      "schema.routeShell.templates",
      "Route-shell schema may emit JSON-LD for unresolved dynamic templates.",
      [],
      "Block JSON-LD generation when route.path or route.canonicalPath contains template tokens.",
    );
  }

  const homeOnlyEntitySchema =
    helperText.includes('if (route.path === "/")') &&
    helperText.includes('id: "organization"') &&
    helperText.includes('id: "website"');

  if (homeOnlyEntitySchema) {
    addResult(
      "PASS",
      "schema.routeShell.entityScope",
      "Organization and WebSite schema are scoped to the home route shell.",
    );
  } else {
    addResult(
      "FAIL",
      "schema.routeShell.entityScope",
      "Organization/WebSite schema scoping is unclear for route shells.",
      [],
      "Keep Organization and WebSite route-shell emission on the home route until a broader schema graph policy is approved.",
    );
  }

  const componentWiring =
    componentText.includes("buildRouteShellJsonLd(route)") &&
    componentText.includes("jsonLdEntries.map") &&
    componentText.includes("<JsonLd") &&
    componentText.includes("data={entry.data}");

  if (componentWiring) {
    addResult(
      "PASS",
      "schema.routeShell.wiring",
      "Shared route shell renders JSON-LD through the approved JsonLd component.",
    );
  } else {
    addResult(
      "FAIL",
      "schema.routeShell.wiring",
      "Shared route shell may not render JSON-LD through the approved renderer.",
      [],
      "Render buildRouteShellJsonLd(route) entries with the existing JsonLd component.",
    );
  }

  const visibleBreadcrumbs =
    componentText.includes("buildRouteShellBreadcrumbItems(route)") &&
    componentText.includes("breadcrumbs={breadcrumbs}") &&
    staticShellText.includes('aria-label="Breadcrumb"') &&
    staticShellText.includes('aria-current="page"');

  if (visibleBreadcrumbs) {
    addResult(
      "PASS",
      "schema.routeShell.visibleBreadcrumbs",
      "BreadcrumbList schema is paired with visible breadcrumb navigation in the route shell.",
    );
  } else {
    addResult(
      "FAIL",
      "schema.routeShell.visibleBreadcrumbs",
      "BreadcrumbList schema may not match visible route shell content.",
      [],
      "Render visible breadcrumb navigation when emitting BreadcrumbList schema.",
    );
  }

  const suppressedTypes = [
    "AboutPage",
    "Article",
    "ContactPage",
    "ItemList",
    "LocalBusiness",
    "Product",
  ];
  const suppressedTypeConstantsPresent = suppressedTypes.every((type) =>
    helperText.includes(`"${type}"`),
  );
  const noUnsupportedBuilderCalls =
    !helperText.includes("buildArticleSchema") &&
    !helperText.includes("buildItemListSchema") &&
    !helperText.includes("buildInformationalProductSchema") &&
    !helperText.includes("buildAboutPageSchema") &&
    !helperText.includes("buildContactPageSchema") &&
    !helperText.includes("buildLocalBusinessSchema") &&
    !helperText.includes('"@type": "AboutPage"') &&
    !helperText.includes("'@type': 'AboutPage'") &&
    !helperText.includes('"@type": "ContactPage"') &&
    !helperText.includes("'@type': 'ContactPage'") &&
    !helperText.includes('"@type": "LocalBusiness"') &&
    !helperText.includes("'@type': 'LocalBusiness'");
  const noCommerceFields =
    !/\b(Offer|offers|price|availability|shippingDetails|aggregateRating|review|reviews)\b/.test(
      helperText,
    );

  if (suppressedTypeConstantsPresent && noUnsupportedBuilderCalls && noCommerceFields) {
    addResult(
      "PASS",
      "schema.routeShell.restraint",
      "Route-shell schema suppresses deferred and record-backed schema types and avoids commerce/review fields.",
    );
  } else {
    addResult(
      "FAIL",
      "schema.routeShell.restraint",
      "Route-shell schema may emit unsupported schema types or commerce/review fields.",
      [
        `suppressed type constants present: ${suppressedTypeConstantsPresent}`,
        `unsupported builder calls absent: ${noUnsupportedBuilderCalls}`,
        `commerce/review fields absent: ${noCommerceFields}`,
      ],
      "Only emit Organization, WebSite, WebPage, and visible BreadcrumbList from route shells until approved records exist.",
    );
  }
}

function checkAgeGateFoundation() {
  const ageGatePath = "src/components/age-gate.tsx";
  const ageGateActionPath = "src/app/age-gate-actions.ts";
  const layoutPath = "src/app/layout.tsx";

  if (!projectFileExists(ageGatePath)) {
    addResult(
      "FAIL",
      "agegate.overlay.exists",
      "Age gate overlay component is missing.",
      [ageGatePath],
      "Create a minimal overlay component without redirecting page routes.",
    );
    return;
  }

  const ageGateText = readProjectFile(ageGatePath);
  const ageGateActionText = projectFileExists(ageGateActionPath)
    ? readProjectFile(ageGateActionPath)
    : "";
  const layoutText = readProjectFile(layoutPath);

  const clientComponent =
    ageGateText.trimStart().startsWith('"use client";') ||
    ageGateText.trimStart().startsWith("'use client';");

  if (clientComponent) {
    addResult(
      "PASS",
      "agegate.clientComponent",
      "Age gate is explicitly implemented as a client component for browser-only confirmation state.",
    );
  } else {
    addResult(
      "FAIL",
      "agegate.clientComponent",
      "Age gate component is missing the client component boundary.",
      [],
      "Keep browser storage and event handling inside a client component.",
    );
  }

  const overlayContract =
    ageGateText.includes('role="presentation"') &&
    ageGateText.includes('role="dialog"') &&
    ageGateText.includes('aria-modal="true"') &&
    ageGateText.includes("fixed inset-0") &&
    ageGateText.includes("Adults 21+ where legal");

  if (overlayContract) {
    addResult(
      "PASS",
      "agegate.overlay.contract",
      "Age gate foundation is an accessible overlay component with conservative adult-access copy.",
    );
  } else {
    addResult(
      "FAIL",
      "agegate.overlay.contract",
      "Age gate component is missing the expected overlay/accessibility contract.",
      [
        `presentation overlay role present: ${ageGateText.includes('role="presentation"')}`,
        `dialog role present: ${ageGateText.includes('role="dialog"')}`,
        `aria-modal present: ${ageGateText.includes('aria-modal="true"')}`,
        `fixed overlay class present: ${ageGateText.includes("fixed inset-0")}`,
        `21+ copy present: ${ageGateText.includes("Adults 21+ where legal")}`,
      ],
      "Keep the foundation as an accessible overlay with safe adult-access language.",
    );
  }

  const layoutMountsGateController =
    layoutText.includes('import { AgeGate } from "@/components/age-gate"') &&
    layoutText.includes("<AgeGate initialConfirmed={adultConfirmed} />");
  const childrenRenderedBehindOverlay =
    layoutText.includes('id="presidential-age-gated-content"') &&
    layoutText.includes("{children}") &&
    !ageGateText.includes("return <>{children}</>;");
  const backgroundDisabledWhileActive =
    ageGateText.includes('getElementById(AGE_GATED_CONTENT_ID)') &&
    ageGateText.includes('setAttribute("aria-hidden", "true")') &&
    ageGateText.includes('setAttribute("inert", "")') &&
    ageGateText.includes('removeAttribute("aria-hidden")') &&
    ageGateText.includes('removeAttribute("inert")');
  const scrollLockWhileActive =
    ageGateText.includes("document.documentElement.style.overflow = \"hidden\"") &&
    ageGateText.includes("document.body.style.overflow = \"hidden\"");

  if (
    layoutMountsGateController &&
    childrenRenderedBehindOverlay &&
    backgroundDisabledWhileActive &&
    scrollLockWhileActive
  ) {
    addResult(
      "PASS",
      "agegate.mounting",
      "Age gate wraps route content, keeps page-specific HTML present, and disables the background while active.",
    );
  } else {
    addResult(
      "FAIL",
      "agegate.mounting",
      "Age gate may hide page-specific HTML from the initial route or fail to disable the background while active.",
      [
        `layout imports/renders AgeGate controller: ${layoutMountsGateController}`,
        `children rendered behind overlay: ${childrenRenderedBehindOverlay}`,
        `background disabled while active: ${backgroundDisabledWhileActive}`,
        `scroll lock while active: ${scrollLockWhileActive}`,
      ],
      "Wrap route children in the age gate, keep route HTML behind the overlay, mark it inert/aria-hidden while active, and lock background scroll.",
    );
  }

  const ageGateRoutePaths = [
    "src/app/age-gate",
    "src/app/age",
    "src/app/verify-age",
    "src/app/21-plus",
  ];
  const ageGateRoutes = ageGateRoutePaths.filter((path) => projectFileExists(path));

  if (ageGateRoutes.length === 0) {
    addResult(
      "PASS",
      "agegate.noRedirectRoute",
      "No dedicated age-gate redirect wall route exists.",
    );
  } else {
    addResult(
      "FAIL",
      "agegate.noRedirectRoute",
      "Dedicated age-gate route folders were found.",
      ageGateRoutes,
      "Use an overlay on route content, not a shared redirect wall route.",
    );
  }

  const redirectPatterns = [
    { label: "Next redirect", regex: /\bredirect\s*\(/ },
    { label: "Next permanent redirect", regex: /\bpermanentRedirect\s*\(/ },
    { label: "NextResponse redirect", regex: /\bNextResponse\.redirect\b/ },
    { label: "router push", regex: /\brouter\.push\s*\(/ },
    { label: "window location", regex: /\bwindow\.location\b|\blocation\.href\b/ },
  ];
  const redirectMatches = collectTextFiles(["src/app", "src/components"]).flatMap(
    (file) => findLineMatches(file, redirectPatterns),
  );

  if (redirectMatches.length === 0) {
    addResult(
      "PASS",
      "agegate.noRedirects",
      "No age-gate redirect wall or client navigation redirect code was found in app/components source.",
    );
  } else {
    addResult(
      "FAIL",
      "agegate.noRedirects",
      "Redirect-like code was found in app/components source.",
      redirectMatches.map((match) => `${match.file}:${match.line} ${match.label}`),
      "Do not route users or crawlers away from page-specific content for age gate handling.",
    );
  }

  const sensitiveCollectionPatterns = [
    { label: "form element", regex: /<form\b/i },
    { label: "input element", regex: /<input\b/i },
    { label: "select element", regex: /<select\b/i },
    { label: "birth/DOB collection", regex: /\b(dateOfBirth|birthdate|birth date|dob)\b/i },
  ];
  const sensitiveMatches = findLineMatches(
    projectPath(ageGatePath),
    sensitiveCollectionPatterns,
  );

  if (sensitiveMatches.length === 0) {
    addResult(
      "PASS",
      "agegate.noSensitiveCollection",
      "Age gate foundation does not collect DOB, birthdate, form, input, or select data.",
    );
  } else {
    addResult(
      "FAIL",
      "agegate.noSensitiveCollection",
      "Age gate foundation appears to collect sensitive age-verification data.",
      sensitiveMatches.map((match) => `${match.file}:${match.line} ${match.label}`),
      "Use adult confirmation only unless legal explicitly requires sensitive data collection.",
    );
  }

  const confirmationOnly =
    !ageGateText.includes("localStorage") &&
    !ageGateText.includes("sessionStorage") &&
    !ageGateText.includes("document.cookie") &&
    ageGateActionText.includes("cookies()") &&
    ageGateActionText.includes("ADULT_CONFIRMATION_COOKIE") &&
    ageGateActionText.includes("httpOnly: true") &&
    ageGateActionText.includes('sameSite: "lax"') &&
    !/\b(dateOfBirth|birthdate|birth date|dob)\b/i.test(ageGateActionText);

  if (confirmationOnly) {
    addResult(
      "PASS",
      "agegate.confirmationOnly",
      "Age gate stores only a non-sensitive adult-confirmation flag in a scoped HTTP-only server cookie.",
    );
  } else {
    addResult(
      "FAIL",
      "agegate.confirmationOnly",
      "Age gate persistence is not limited to the approved adult-confirmation flag.",
      [
        `localStorage absent: ${!ageGateText.includes("localStorage")}`,
        `sessionStorage absent: ${!ageGateText.includes("sessionStorage")}`,
        `document.cookie absent: ${!ageGateText.includes("document.cookie")}`,
        `server cookie action present: ${ageGateActionText.includes("cookies()")}`,
        `server cookie is httpOnly: ${ageGateActionText.includes("httpOnly: true")}`,
        `server cookie sameSite lax: ${ageGateActionText.includes('sameSite: "lax"')}`,
      ],
      "Keep age-gate persistence to a non-sensitive adult-confirmation flag only.",
    );
  }

  const storageToleratesFailure =
    !ageGateText.includes("localStorage") &&
    !ageGateText.includes("sessionStorage") &&
    !ageGateText.includes("document.cookie") &&
    ageGateText.includes("await confirmAdultAccess()") &&
    ageGateText.includes("try {") &&
    ageGateText.includes("catch {") &&
    ageGateText.includes('setStatus("pending")');

  if (storageToleratesFailure) {
    addResult(
      "PASS",
      "agegate.storageTolerance",
      "Age gate has no browser-storage dependency and safely retains the overlay when the server cookie action fails.",
    );
  } else {
    addResult(
      "FAIL",
      "agegate.storageTolerance",
      "Age gate browser-storage or server-action failure handling is unsafe.",
      [],
      "Keep browser storage absent and retain the overlay when the server cookie action fails.",
    );
  }

  const keyboardSupport =
    ageGateText.includes("primaryActionRef") &&
    ageGateText.includes(".focus()") &&
    ageGateText.includes("handleDialogKeyDown") &&
    ageGateText.includes('event.key !== "Tab"') &&
    ageGateText.includes("event.preventDefault()");

  if (keyboardSupport) {
    addResult(
      "PASS",
      "agegate.keyboardFocus",
      "Age gate foundation includes minimal focus entry and Tab containment for keyboard users.",
    );
  } else {
    addResult(
      "FAIL",
      "agegate.keyboardFocus",
      "Age gate foundation is missing minimal keyboard/focus handling.",
      [],
      "Move focus into the dialog and keep Tab navigation within the available age-gate controls.",
    );
  }
}

function checkStep8HScopeBoundary() {
  // 9083-CODE (owner directive, 2026-07-10) P2/P3 authorizes building the
  // Moon Rocks series routes and the product detail route, so those paths are
  // no longer out of scope. They stay conditional/noindex under the route
  // registry and the publication gate until per-route owner sign-off.
  const outOfScopePaths = [
    "src/app/age-gate",
    "src/app/age",
    "src/app/verify-age",
    "src/app/21-plus",
    "src/lib/db",
    "src/lib/data",
    "src/content/products",
    "src/content/stores",
  ];
  const present = outOfScopePaths.filter((path) => projectFileExists(path));

  if (present.length === 0) {
    addResult(
      "PASS",
      "scope.step8h",
      "Step 8H stayed scoped to source-record contracts and did not create redirect-wall, product/detail, locator data, database, or disallowed CMS files.",
    );
  } else {
    addResult(
      "FAIL",
      "scope.step8h",
      "Step 8H out-of-scope files or folders exist.",
      present,
      "Keep Step 8H limited to source-record contracts, route publication gates, and QA enforcement.",
    );
  }

  const locatorShellFiles = [
    "src/app/find-us/locator-template-shell.tsx",
    "src/app/find-us/[state]/page.tsx",
    "src/app/find-us/[state]/[city]/page.tsx",
    "src/app/find-us/[state]/[city]/[retailer]/page.tsx",
  ];
  const missingLocatorShellFiles = locatorShellFiles.filter(
    (path) => !projectFileExists(path),
  );

  if (missingLocatorShellFiles.length === 0) {
    const locatorShellSource = locatorShellFiles
      .map((path) => readProjectFile(path))
      .join("\n");
    const dynamicLocatorSources = locatorShellFiles.slice(1).map((path) => readProjectFile(path));
    // 9083-CODE P4 (owner 8-state ruling, 2026-07-11): /find-us/[state]
    // serves the eight config-driven themed brand pages (PRESIDENTIAL_STATES
    // is the only params source; no retailer data anywhere). City and
    // retailer templates still generate zero params and 404.
    const dynamicLocatorMarkerSets = [
      ["dynamicParams = false", "generateStaticParams", "PRESIDENTIAL_STATES.map", "notFound()"],
      ["dynamicParams = false", "generateStaticParams", "return [];", "notFound()"],
      ["dynamicParams = false", "generateStaticParams", "return [];", "notFound()"],
    ];
    const missingLocatorShellMarkers = dynamicLocatorSources.flatMap((source, index) =>
      dynamicLocatorMarkerSets[index]
        .filter((marker) => !source.includes(marker))
        .map((marker) => `${locatorShellFiles[index + 1]}:${marker}`),
    );
    const blockedLocatorShellPatterns = [
      /\bLocalBusiness\b/,
      /\breadPublishedSanity\b/,
      /\breadDraft\b/,
      /\bfetch\s*\(/,
      /\bcreateOrReplace\b/,
      /\.mutate\s*\(/,
      /\.patch\s*\(/,
      /\.delete\s*\(/,
      /\.commit\s*\(/,
      /\bAPPROVED_ROUTE_PUBLICATIONS\b/,
      /\bindex_follow\b/,
      /sitemap:\s*["']include["']/,
    ];
    const blockedLocatorShellHits = blockedLocatorShellPatterns
      .filter((pattern) => pattern.test(locatorShellSource))
      .map((pattern) => pattern.source);

    if (
      missingLocatorShellMarkers.length === 0 &&
      blockedLocatorShellHits.length === 0
    ) {
      addResult(
        "PASS",
        "routeShells.locatorDynamicShells",
        "S8.2 locator URL templates generate no params and always fail closed without retailer data reads, schema, publication records, or public unlock signals.",
      );
    } else {
      addResult(
        "FAIL",
        "routeShells.locatorDynamicShells",
        "S8.2 locator shell routes are present but no longer prove fail-closed behavior.",
        [
          `missingMarkers=${missingLocatorShellMarkers.join("|") || "none"}`,
          `blockedHits=${blockedLocatorShellHits.join("|") || "none"}`,
        ],
        "Keep locator dynamic routes as noindex shells until verified retailer records are approved.",
      );
    }
  } else {
    addResult(
      "FAIL",
      "routeShells.locatorDynamicShells",
      "S8.2 locator URL shell files are missing.",
      missingLocatorShellFiles,
      "Create only fail-closed locator route shells for state/city/retailer paths.",
    );
  }

  if (projectFileExists("src/lib/cms")) {
    const allowedCmsFiles = new Set([
      // 9083-CODE P2.1 (owner directive, 2026-07-10): catalog read lane —
      // public reader + token-scoped draft reader, same split as siblings.
      "src/lib/cms/catalog-drafts.ts",
      "src/lib/cms/catalog.ts",
      "src/lib/cms/homepage-drafts.ts",
      "src/lib/cms/homepage.ts",
      "src/lib/cms/index.ts",
      "src/lib/cms/learn-guide-drafts.ts",
      "src/lib/cms/learn-guide.ts",
      "src/lib/cms/draft-route-access.ts",
      "src/lib/cms/public-content.ts",
      "src/lib/cms/sanity-read-client.ts",
      "src/lib/cms/site-page-drafts.ts",
      "src/lib/cms/site-page.ts",
    ]);
    const cmsFiles = collectTextFiles(["src/lib/cms"]).map(relativePath).sort();
    const unexpectedCmsFiles = cmsFiles.filter((path) => !allowedCmsFiles.has(path));
    const cmsSource = cmsFiles.map((path) => readProjectFile(path)).join("\n");
    const cmsReadOnlyBoundary =
      unexpectedCmsFiles.length === 0 &&
      cmsSource.includes("server-only") &&
      cmsSource.includes("4bl3xvem") &&
      cmsSource.includes("production") &&
      cmsSource.includes("published") &&
      cmsSource.includes("perspective\", \"raw\"") &&
      cmsSource.includes("publicRouteRenderingEnabled: false") &&
      !/\b(createIfNotExists|createOrReplace|mutate|mutation|patch|delete|publish|transaction|commit|listen)\b/i.test(
        cmsSource,
      );

    if (cmsReadOnlyBoundary) {
      addResult(
        "PASS",
        "scope.cmsReadBoundary",
        "A controlled server-only, read-only Sanity CMS boundary exists without public route rendering or mutation surfaces.",
      );
    } else {
      addResult(
        "FAIL",
        "scope.cmsReadBoundary",
        "CMS files exist outside the controlled server-only read boundary.",
        unexpectedCmsFiles,
        "Keep web CMS files server-only, read-only, allowlisted, and free of mutation/publish/listen surfaces.",
      );
    }
  }
}

function checkReferenceDataQuarantine() {
  const workspaceRoot = join(projectRoot, "..");
  const seedDir = join(workspaceRoot, "data", "seed");
  const candidatesDir = join(workspaceRoot, "data", "reference-candidates");
  const ingestionMarker = "NOT FOR INGESTION";
  const sourceClientDir = join(workspaceRoot, "sources", "client");

  function collectAbsoluteTextFiles(paths) {
    const files = [];

    function walk(path) {
      if (!existsSync(path)) return;
      const stat = statSync(path);

      if (stat.isDirectory()) {
        for (const entry of readdirSync(path)) {
          if (
            entry === "node_modules" ||
            entry === ".next" ||
            entry === ".git" ||
            entry === ".lighthouseci"
          ) {
            continue;
          }

          walk(join(path, entry));
        }
        return;
      }

      if (textExtensions.has(extname(path))) {
        files.push(path);
      }
    }

    for (const path of paths) {
      walk(path);
    }

    return files;
  }

  const srcFiles = collectTextFiles(["src"]);
  const referencePatterns = [
    { label: "data/seed reference", regex: /data[\\/]+seed/i },
    { label: "reference-candidates reference", regex: /reference-candidates/i },
    { label: "sources/client reference", regex: /sources[\\/]+client/i },
    { label: "google-drive-drop reference", regex: /google-drive-drop/i },
    { label: "owner-response-drop reference", regex: /owner-response-drop/i },
  ];
  const srcMatches = srcFiles.flatMap((file) =>
    findLineMatches(file, referencePatterns),
  );

  if (srcMatches.length === 0) {
    addResult(
      "PASS",
      "quarantine.noSrcReferences",
      "web/src does not import or reference data/seed, data/reference-candidates, sources/client, google-drive-drop, or owner-response-drop.",
    );
  } else {
    addResult(
      "FAIL",
      "quarantine.noSrcReferences",
      "web/src references quarantined reference-candidate data.",
      srcMatches.map((match) => `${match.file}:${match.line} ${match.label}`),
      "Reference-candidate data cannot be imported by web/src. Route facts through the approved source-record intake lane instead.",
    );
  }

  if (!existsSync(seedDir)) {
    addResult(
      "PASS",
      "quarantine.seedDirectory",
      "data/seed no longer exists; candidate data lives in the quarantined reference-candidates path.",
    );
  } else {
    const seedReadmePath = join(seedDir, "README.md");
    const seedReadmeOk =
      existsSync(seedReadmePath) &&
      readFileSync(seedReadmePath, "utf8").includes(ingestionMarker);

    if (seedReadmeOk) {
      addResult(
        "PASS",
        "quarantine.seedDirectory",
        "data/seed remains for compatibility but its README marks it NOT FOR INGESTION.",
      );
    } else {
      addResult(
        "FAIL",
        "quarantine.seedDirectory",
        "data/seed exists without a README marking it NOT FOR INGESTION.",
        [relativePath(seedDir)],
        "Move candidate data to data/reference-candidates or add a README explaining why data/seed remains and marking it NOT FOR INGESTION.",
      );
    }
  }

  if (!existsSync(candidatesDir)) {
    addResult(
      "PENDING",
      "quarantine.referenceCandidates",
      "data/reference-candidates does not exist yet; quarantine checks for candidate data remain pending.",
    );
    return;
  }

  const sourceClientReferences = collectAbsoluteTextFiles([sourceClientDir]).flatMap((file) =>
    findLineMatches(file, [
      { label: "approval-shaped source/client public use", regex: /"?(allowed_usage|public_use_status|approval_status|publication_status)"?\s*[:=]\s*"?(production|approved|published|public_use_approved)"?/i },
      { label: "source/client public unlock phrase", regex: /\b(public seo unlocked|route publication approved|sitemap inclusion approved|safe to publish)\b/i },
    ]),
  );

  if (sourceClientReferences.length === 0) {
    addResult(
      "PASS",
      "quarantine.sourceClientCandidateOnly",
      "sources/client carries no approval-shaped public unlock values in scanned text files.",
    );
  } else {
    addResult(
      "FAIL",
      "quarantine.sourceClientCandidateOnly",
      "sources/client contains approval-shaped public unlock values.",
      sourceClientReferences.map((match) => `${match.file}:${match.line} ${match.label}`),
      "Keep client drops as raw/candidate inputs only. Promotion requires explicit source/proof/approval records.",
    );
  }

  const candidatesReadmePath = join(candidatesDir, "README.md");
  const candidatesReadmeOk =
    existsSync(candidatesReadmePath) &&
    readFileSync(candidatesReadmePath, "utf8").includes(ingestionMarker);

  if (candidatesReadmeOk) {
    addResult(
      "PASS",
      "quarantine.referenceCandidates",
      "data/reference-candidates README marks the folder NOT FOR INGESTION.",
    );
  } else {
    addResult(
      "FAIL",
      "quarantine.referenceCandidates",
      "data/reference-candidates is missing a README that marks it NOT FOR INGESTION.",
      [relativePath(candidatesDir)],
      "Add a README declaring the folder candidate/reference-only, unverified, and unable to unlock public SEO.",
    );
  }

  const approvalShapedPatterns = [
    {
      label: "production usage approval shape",
      regex: /"allowed_usage"\s*:\s*"production"/i,
    },
    {
      label: "approved/published approval shape",
      regex: /"(approved_status|approval_status|publication_status)"\s*:\s*"(approved|published|production)"/i,
    },
  ];
  const candidateFiles = collectAbsoluteTextFiles([candidatesDir]);
  const approvalMatches = candidateFiles.flatMap((file) =>
    findLineMatches(file, approvalShapedPatterns),
  );

  if (approvalMatches.length === 0) {
    addResult(
      "PASS",
      "quarantine.noApprovalShapes",
      "Reference-candidate files carry no production/approved/published approval-shaped values.",
    );
  } else {
    addResult(
      "FAIL",
      "quarantine.noApprovalShapes",
      "Reference-candidate files contain approval-shaped values that could unlock gates on naive import.",
      approvalMatches.map((match) => `${match.file}:${match.line} ${match.label}`),
      "Neutralize approval-shaped fields; candidate data can never look approved without client proof.",
    );
  }
}

function checkBrandDefenseRoutePlanning() {
  const routesPath = "src/lib/seo/routes.ts";
  if (!projectFileExists(routesPath)) {
    addResult("FAIL", "routes.brandDefense", "Route registry file is missing.");
    return;
  }

  const routesText = readProjectFile(routesPath);
  const brandDefensePaths = ["/official-presidential", "/pre-rolls", "/blunts"];
  const issues = [];

  for (const routePath of brandDefensePaths) {
    const definition = getRouteDefinitionText(routesText, routePath);

    if (!definition) {
      issues.push(`${routePath}: missing from route registry`);
      continue;
    }

    if (
      !definition.includes('status: "planned"') &&
      !definition.includes('status: "conditional"')
    ) {
      issues.push(`${routePath}: status must stay planned or conditional`);
    }

    if (!definition.includes('indexability: "conditional_index"')) {
      issues.push(`${routePath}: indexability must stay conditional_index`);
    }

    if (!definition.includes('sitemap: "conditional"')) {
      issues.push(`${routePath}: sitemap policy must stay conditional`);
    }

    if (definition.includes("blocks: []") || !definition.includes("blocks: [")) {
      issues.push(`${routePath}: blocks must stay non-empty`);
    }
  }

  if (issues.length === 0) {
    addResult(
      "PASS",
      "routes.brandDefense",
      "Artifact 17 brand-defense routes are registered as planning-only records with conditional indexability, conditional sitemap, and non-empty blocks.",
    );
    return;
  }

  addResult(
    "FAIL",
    "routes.brandDefense",
    "Brand-defense route planning records are missing or lost their gated posture.",
    issues,
    "Keep /official-presidential, /pre-rolls, and /blunts as gated planning-only registry records per artifact 17.",
  );
}

function checkRouteRegistryPublicationGateLock() {
  const routesPath = "src/lib/seo/routes.ts";
  const publicationPath = "src/lib/seo/source-records/route-publication.ts";

  if (!projectFileExists(routesPath) || !projectFileExists(publicationPath)) {
    addResult(
      "FAIL",
      "routes.publicationGateLock",
      "Route registry or publication-gate source file is missing.",
      [routesPath, publicationPath].filter((file) => !projectFileExists(file)),
      "Keep route registry and route-publication records present before checking indexability unlocks.",
    );
    return;
  }

  const routesText = readProjectFile(routesPath);
  const publicationText = readProjectFile(publicationPath);
  const approvedPublicationsEmpty =
    /APPROVED_ROUTE_PUBLICATIONS\s*=\s*\[\]\s+as\s+const/.test(publicationText);

  if (!approvedPublicationsEmpty) {
    addResult(
      "HUMAN",
      "routes.publicationGateLock",
      "Approved route-publication records are no longer empty; route publication now requires human/legal verification.",
      [],
      "Before accepting any publication records, verify source proof, confidentiality, metadata, schema, content, asset, proof, and compliance fields.",
    );
    return;
  }

  const routeRecords = getRouteRecordTexts(routesText);
  const unlockShapedRecords = routeRecords.flatMap((record) => {
    const path = record.match(/path:\s*"([^"]+)"/)?.[1] ?? "unknown";
    const hits = [
      { label: "status approved", regex: /status:\s*"approved"/ },
      { label: "index_follow", regex: /indexability:\s*"index_follow"/ },
      { label: "sitemap include", regex: /sitemap:\s*"include"/ },
      { label: "empty blocks", regex: /blocks:\s*\[\s*\]/ },
    ]
      .filter((check) => check.regex.test(record))
      .map((check) => `${path}: ${check.label}`);

    return hits;
  });

  if (unlockShapedRecords.length === 0) {
    addResult(
      "PASS",
      "routes.publicationGateLock",
      "No real route record is approved, index_follow, sitemap include, or block-empty while APPROVED_ROUTE_PUBLICATIONS is empty.",
    );
    return;
  }

  addResult(
    "FAIL",
    "routes.publicationGateLock",
    "Route registry contains publication-shaped unlock values without approved route-publication records.",
    unlockShapedRecords,
    "Keep route records gated until approved route-publication source records exist and pass every gate.",
  );
}

function checkScaffoldSignals(publicCopyFiles) {
  const scaffoldPatterns = [
    { label: "Create Next App title/copy", regex: /Create Next App|create next app/i },
    { label: "Next starter asset", regex: /next\.svg/i },
    { label: "Vercel starter link/asset", regex: /vercel\.com\/|vercel\.svg/i },
    { label: "Next docs starter link", regex: /nextjs\.org\/(docs|learn)/i },
  ];
  const matches = publicCopyFiles.flatMap((file) =>
    findLineMatches(file, scaffoldPatterns),
  );

  if (matches.length === 0) {
    addResult("PASS", "scaffold.placeholders", "No default starter scaffold copy detected.");
    return;
  }

  addResult(
    "FAIL",
    "scaffold.placeholders",
    "Starter scaffold copy/assets still exist after Step 8D route shell creation.",
    matches.map((match) => `${match.file}:${match.line} ${match.label}`),
    "Remove starter scaffold copy/assets before Step 8D can remain accepted.",
  );
}

function checkStep9FDesignSystemFoundation() {
  const requiredFiles = [
    "src/lib/design-system/source-status.ts",
    "src/lib/design-system/tokens.ts",
    "src/lib/design-system/placeholder-policy.ts",
    "src/lib/design-system/index.ts",
    "src/components/presidential/layout/page-frame.tsx",
    "src/components/presidential/layout/scene.tsx",
    "src/components/presidential/layout/scene-stack.tsx",
    "src/components/presidential/primitives/section-heading.tsx",
    "src/components/presidential/primitives/cta-link.tsx",
    "src/components/presidential/media/media-slot.tsx",
    "src/components/presidential/index.ts",
  ];
  const missingFiles = requiredFiles.filter((file) => !projectFileExists(file));

  if (missingFiles.length > 0) {
    addResult(
      "FAIL",
      "step9f.designSystemFiles",
      "Step 9F foundation design-system files are missing.",
      missingFiles,
      "Restore the Step 9F foundation-only design-system files before continuing visual implementation.",
    );
    return;
  }

  const step9fFiles = requiredFiles.map((file) => ({
    path: file,
    text: readProjectFile(file),
  }));
  const combinedText = step9fFiles.map((file) => file.text).join("\n");
  const unsafePatterns = [
    { label: "public unlock true", regex: /publicUnlock:\s*true|data-presidential-public-unlock="true"/i },
    { label: "route publication approval", regex: /route publication approved|route-publication approved/i },
    { label: "sitemap unlock", regex: /sitemap unlocked|sitemap inclusion approved/i },
    { label: "schema image unlock", regex: /schema image approved|schema image unlock/i },
    { label: "Open Graph image unlock", regex: /open graph image approved|og image approved/i },
    { label: "fake product or retailer", regex: /fake (product|retailer|store|strain|flavor)/i },
    { label: "commerce language", regex: /\b(price|pricing|inventory|shipping|order online|direct order|checkout|reviews?|ratings?)\b/i },
    { label: "unsupported superlative", regex: /\b(world'?s strongest|highest form|strongest flavor|#1\b|number[- ]one|top[- ]?ranked|best)\b/i },
  ];
  const unsafeMatches = step9fFiles.flatMap((file) => {
    const lines = stripApprovedVisibleClaimsFromSource(file.path, file.text).split(/\r?\n/);
    return lines.flatMap((line, index) =>
      unsafePatterns
        .filter((pattern) => pattern.regex.test(line))
        .map((pattern) => `${file.path}:${index + 1} ${pattern.label}`),
    );
  });

  if (unsafeMatches.length > 0) {
    addResult(
      "FAIL",
      "step9f.designSystemSafety",
      "Step 9F design-system foundation contains unsafe public-unlock, fake-data, commerce, or claim language.",
      unsafeMatches,
      "Keep Step 9F foundation-only and remove unsafe defaults before any design implementation.",
    );
    return;
  }

  const requiredSignals = [
    "sourceStatus",
    "publicUseStatus",
    "publicUnlock: false",
    "forbiddenPublicSurfaces",
    "canPlaceholderFeedPublicSurface",
    "metadata, Open Graph, schema, sitemap, product, retailer, locator",
  ];
  const missingSignals = requiredSignals.filter(
    (signal) => !combinedText.includes(signal),
  );

  const forbiddenAuthorityImports = step9fFiles.flatMap((file) => {
    const importMatches = file.text.matchAll(/from\s+["']([^"']+)["']/g);
    return Array.from(importMatches)
      .map((match) => match[1])
      .filter((importPath) =>
        /@\/lib\/seo\/(metadata|robots|sitemap|schema|source-records|indexability|routes)/.test(
          importPath,
        ),
      )
      .map((importPath) => `${file.path}: forbidden SEO authority import ${importPath}`);
  });

  if (missingSignals.length === 0 && forbiddenAuthorityImports.length === 0) {
    addResult(
      "PASS",
      "step9f.designSystemFoundation",
      "Step 9F design-system foundation exists, is source-aware, keeps placeholders internal, and does not import SEO publication authority.",
    );
    return;
  }

  addResult(
    "FAIL",
    "step9f.designSystemFoundation",
    "Step 9F design-system foundation is incomplete or imports protected SEO authority.",
    [
      ...missingSignals.map((signal) => `missing signal: ${signal}`),
      ...forbiddenAuthorityImports,
    ],
    "Keep the design system source-aware, internal-only, and separate from route publication, sitemap, robots, schema, and source-record authority.",
  );
}

function checkStep9GRouteShellVisualFoundation() {
  const requiredFiles = [
    "src/components/presidential/modules/find-us-cta-shell.tsx",
    "src/components/presidential/modules/homepage-foundation-shell.tsx",
    "src/components/presidential/modules/moon-rocks-platform-shell.tsx",
    "src/components/presidential/modules/pillar-platform-shell.tsx",
    "src/components/presidential/modules/index.ts",
  ];
  const missingFiles = requiredFiles.filter((file) => !projectFileExists(file));

  if (missingFiles.length > 0) {
    addResult(
      "FAIL",
      "step9g.routeShellVisualFiles",
      "Step 9G guarded route-shell visual foundation files are missing.",
      missingFiles,
      "Restore the Step 9G foundation modules before continuing homepage composition work.",
    );
    return;
  }

  const step9gFiles = requiredFiles.map((file) => ({
    path: file,
    text: readProjectFile(file),
  }));
  const combinedText = step9gFiles.map((file) => file.text).join("\n");
  const unsafePatterns = [
    { label: "public unlock true", regex: /publicUnlock:\s*true|data-presidential-public-unlock="true"/i },
    { label: "public SEO approval", regex: /public\s+seo\s+(unlocked|approved|enabled|live)/i },
    { label: "indexability promotion", regex: /\b(index_follow|index\/follow|indexable|sitemap eligible)\b/i },
    { label: "route publication approval", regex: /route[-\s]publication\s+(approved|unlocked|enabled|live)/i },
    { label: "sitemap unlock", regex: /sitemap\s+(unlocked|enabled|live|inclusion approved)/i },
    { label: "schema unlock", regex: /schema\s+(approved|unlocked|enabled|live)/i },
    { label: "schema image unlock", regex: /schema image\s+(approved|unlocked|enabled|live)/i },
    { label: "image approval unlock", regex: /image\s+(approved|unlocked|enabled|live)/i },
    { label: "Open Graph image unlock", regex: /open graph image\s+(approved|unlocked|enabled|live)|og image\s+(approved|unlocked|enabled|live)/i },
    { label: "fake product or retailer", regex: /fake\s+(product|retailer|store|strain|flavor|location|catalog)/i },
    { label: "commerce language", regex: /\b(price|pricing|inventory|shipping|delivery|deliver|buy online|order online|direct order|checkout|cart|reviews?|ratings?)\b/i },
    { label: "medical or effect language", regex: /\b(euphoric|euphoria|relax(?:ing|ed|ation)?|therapeutic|cerebral|uplifting|sedating|pain|anxiety|sleep|cure|treats?)\b/i },
    { label: "unsupported superlative", regex: /\b(world'?s strongest|highest form|strongest flavor|most potent|#1\b|number[- ]one|top[- ]?ranked|best)\b/i },
    { label: "threat-domain/public accusation language", regex: /\b(imposter|scam|hijack(?:ed|ing)?|stolen|counterfeit|knockoff|fraud)\b/i },
  ];
  const unsafeMatches = step9gFiles.flatMap((file) => {
    const lines = stripApprovedVisibleClaimsFromSource(file.path, file.text).split(/\r?\n/);
    return lines.flatMap((line, index) =>
      unsafePatterns
        .filter((pattern) => pattern.regex.test(line))
        .map((pattern) => `${file.path}:${index + 1} ${pattern.label}`),
    );
  });

  if (unsafeMatches.length > 0) {
    addResult(
      "FAIL",
      "step9g.routeShellVisualSafety",
      "Step 9G route-shell visual foundation contains unsafe public-unlock, commerce, claim, effect, or accusation language.",
      unsafeMatches,
      "Keep Step 9G visitor-facing, source-aware, and separate from public-unlock authority.",
    );
    return;
  }

  const requiredSignals = [
    "Platform architecture",
    "banner-palms-teal.webp",
    "CtaLink",
    "MoonRocksPlatformShell",
    "PillarPlatformShell",
    "FindUsCtaShell",
    "A clearer official source for the brand",
    "Find Presidential products.",
    "Enter Moon Rocks",
  ];
  const missingSignals = requiredSignals.filter(
    (signal) => !combinedText.includes(signal),
  );

  const protectedSeoAuthorityImport =
    /(^|\/|@\/)lib\/seo\/(metadata|robots|sitemap|schema|source-records|indexability|routes)(\/|$)/;
  const forbiddenAuthorityImports = step9gFiles.flatMap((file) => {
    const importMatches = file.text.matchAll(
      /(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']/g,
    );
    return Array.from(importMatches)
      .map((match) => match[1].replaceAll("\\", "/"))
      .filter((importPath) => protectedSeoAuthorityImport.test(importPath))
      .map((importPath) => `${file.path}: forbidden SEO authority import ${importPath}`);
  });

  if (missingSignals.length === 0 && forbiddenAuthorityImports.length === 0) {
    addResult(
      "PASS",
      "step9g.routeShellVisualFoundation",
      "Step 9G route-shell visual layer exists, uses visitor-facing Presidential copy, and does not import SEO publication authority.",
    );
    return;
  }

  addResult(
    "FAIL",
    "step9g.routeShellVisualFoundation",
    "Step 9G route-shell visual foundation is incomplete or imports protected SEO authority.",
    [
      ...missingSignals.map((signal) => `missing signal: ${signal}`),
      ...forbiddenAuthorityImports,
    ],
    "Keep Step 9G visual work visitor-facing and separate from route publication, sitemap, robots, schema, source-record, and indexability authority.",
  );
}

function checkStep9LStaticRouteVisualFoundation() {
  const requiredFiles = [
    "src/components/presidential/modules/static-route-foundation-shell.tsx",
    "src/components/presidential/modules/index.ts",
    "src/components/seo/presidential-route-shell.tsx",
    "src/components/presidential/media/media-slot.tsx",
    "src/components/presidential/modules/homepage-foundation-shell.tsx",
    "src/components/presidential/modules/moon-rocks-platform-shell.tsx",
    "src/components/presidential/modules/pillar-platform-shell.tsx",
    "src/components/presidential/modules/find-us-cta-shell.tsx",
  ];
  const missingFiles = requiredFiles.filter((file) => !projectFileExists(file));

  if (missingFiles.length > 0) {
    addResult(
      "FAIL",
      "step9l.staticRouteVisualFiles",
      "Step 9L guarded static-route visual files are missing.",
      missingFiles,
      "Create the reusable non-home route visual foundation and keep it wired through the SEO shell.",
    );
    return;
  }

  const moduleIndexText = readProjectFile("src/components/presidential/modules/index.ts");
  const routeShellText = readProjectFile("src/components/seo/presidential-route-shell.tsx");
  const staticShellText = readProjectFile(
    "src/components/presidential/modules/static-route-foundation-shell.tsx",
  );
  const publicComponentFiles = requiredFiles.map((file) => ({
    path: file,
    text: readProjectFile(file),
  }));

  const wiredThroughSeoShell =
    moduleIndexText.includes('export * from "./static-route-foundation-shell"') &&
    routeShellText.includes("StaticRouteFoundationShell") &&
    routeShellText.includes("buildRouteShellJsonLd(route)") &&
    routeShellText.includes("buildRouteShellBreadcrumbItems(route)") &&
    routeShellText.includes("getStaticRouteShellLinks(route)") &&
    routeShellText.includes("breadcrumbs={breadcrumbs}") &&
    routeShellText.includes("links={links}") &&
    routeShellText.includes("route={route}");

  const visualShellStaysOutOfSeoAuthority =
    !staticShellText.includes("@/lib/seo/metadata") &&
    !staticShellText.includes("@/lib/seo/robots") &&
    !staticShellText.includes("@/lib/seo/sitemap") &&
    !staticShellText.includes("@/lib/seo/schema") &&
    !staticShellText.includes("@/lib/seo/source-records") &&
    !staticShellText.includes("@/lib/seo/indexability") &&
    !staticShellText.includes("@/lib/seo/routes");

  const publicDomLeakPatterns = [
    { label: "data-presidential attribute", regex: /data-presidential-[a-z0-9-]+/i },
    { label: "source status attribute", regex: /source-status/i },
    { label: "route status attribute", regex: /route-status/i },
    { label: "locator status attribute", regex: /locator-status/i },
    { label: "platform status attribute", regex: /platform-status/i },
    { label: "placeholder status attribute", regex: /placeholder-status/i },
    { label: "public unlock attribute", regex: /public-unlock|public_unlock/i },
  ];
  const publicDomLeakMatches = publicComponentFiles.flatMap((file) => {
    const lines = file.text.split(/\r?\n/);
    return lines.flatMap((line, index) =>
      publicDomLeakPatterns
        .filter((pattern) => pattern.regex.test(line))
        .map((pattern) => `${file.path}:${index + 1} ${pattern.label}`),
    );
  });

  const visibleCopyPaths = [
    "src/components/presidential/media/media-slot.tsx",
    "src/components/presidential/modules/static-route-foundation-shell.tsx",
    "src/components/presidential/modules/homepage-foundation-shell.tsx",
    "src/components/presidential/modules/moon-rocks-platform-shell.tsx",
    "src/components/presidential/modules/pillar-platform-shell.tsx",
    "src/components/presidential/modules/find-us-cta-shell.tsx",
  ];
  const visibleLeakPatterns = [
    {
      label: "visible build-state language",
      regex:
        /\b(shell|foundation|preview|pending approval|blocked until|locator workflow|workflow|staged|placeholder|internal)\b/i,
    },
    {
      label: "visible SEO workflow language",
      regex:
        /\b(metadata|schema|sitemap|route[-\s]publication|public[-\s]unlock|approval[-\s]gated|approval gates?)\b/i,
    },
    {
      label: "unsafe cannabis/commercial language",
      regex:
        /\b(price|pricing|inventory|shipping|delivery|deliver|buy online|order online|direct order|checkout|cart|reviews?|ratings?|euphoric|relax(?:ing|ed|ation)?|therapeutic|cerebral|uplifting|sedating|pain|anxiety|sleep|cure|treats?|best|#1\b|number[- ]one|top[- ]?ranked|strongest|most potent|imposter|scam|hijack(?:ed|ing)?|stolen|counterfeit|knockoff|fraud)\b/i,
    },
  ];
  const visibleLinePatterns = [
    /^\s*(title|purpose|description|mediaLabel|label|note|body):\s*["`]/,
    /\b(description|title|label|note|kicker|body)\s*=\s*["{`]/,
    /^\s*note\s*=\s*["`]/,
    /<span[^>]*>/,
    /<p[^>]*>/,
    /^\s*[A-Z0-9][^<>{};]+$/,
  ];
  const machineOnlyLinePattern =
    /\b(ariaLabelledBy|id=|throw new Error|export |import |type |function |readonly |status:|const classNames|const headingId|getPlaceholderPolicy|PlaceholderKind|PublicSurface|className=|kind=|href=|key=)\b/;
  const visibleCopyLeaks = visibleCopyPaths.flatMap((path) => {
    if (!projectFileExists(path)) return [`${path}: missing visible-copy source file`];

    return stripApprovedVisibleClaimsFromSource(path, readProjectFile(path))
      .split(/\r?\n/)
      .flatMap((line, index) => {
        if (machineOnlyLinePattern.test(line)) return [];
        if (!visibleLinePatterns.some((pattern) => pattern.test(line))) return [];

        return visibleLeakPatterns
          .filter((pattern) => pattern.regex.test(line))
          .map((pattern) => `${path}:${index + 1} ${pattern.label}: ${line.trim()}`);
      });
  });

  const safePublicSignals =
    staticShellText.includes("Inside this section") &&
    staticShellText.includes("Explore Presidential") &&
    staticShellText.includes("For adults 21+ where legal.") &&
    staticShellText.includes("A focused official section inside the Presidential digital") &&
    staticShellText.includes("Find authentic Presidential products through a first-party retail path");

  if (
    wiredThroughSeoShell &&
    visualShellStaysOutOfSeoAuthority &&
    publicDomLeakMatches.length === 0 &&
    visibleCopyLeaks.length === 0 &&
    safePublicSignals
  ) {
    addResult(
      "PASS",
      "step9l.staticRouteVisualFoundation",
      "Step 9L guarded static-route visual foundation is wired through the SEO shell, public-DOM clean, source-safe, and no-public-unlock.",
    );
    return;
  }

  addResult(
    "FAIL",
    "step9l.staticRouteVisualFoundation",
    "Step 9L guarded static-route visual foundation is incomplete, leaks public-DOM status, imports protected SEO authority, or exposes unsafe copy.",
    [
      `wired through SEO shell: ${wiredThroughSeoShell}`,
      `visual shell avoids protected SEO authority imports: ${visualShellStaysOutOfSeoAuthority}`,
      `safe public signal copy present: ${safePublicSignals}`,
      ...publicDomLeakMatches,
      ...visibleCopyLeaks,
    ],
    "Keep Step 9L visual-only, route-record-driven, public-DOM clean, and separate from SEO publication authority.",
  );
}

function checkPendingSystems() {
  const pendingChecks = [
    {
      rule: "routes.registry",
      exists: existsSync(projectPath("src/lib/seo/routes.ts")),
      message: "Route registry does not exist yet; route completeness checks are pending.",
    },
    {
      rule: "agegate.overlay",
      exists:
        existsSync(projectPath("src/components/age-gate.tsx")) ||
        existsSync(projectPath("src/components/AgeGate.tsx")),
      message: "Age gate component does not exist yet; overlay/crawlability checks are pending.",
    },
    {
      rule: "locator.verifiedData",
      exists:
        existsSync(projectPath("src/lib/data/verified-stores.ts")) ||
        existsSync(projectPath("src/content/stores")),
      message:
        "Verified store data does not exist yet; locator thin-page checks remain pending.",
    },
  ];

  for (const check of pendingChecks) {
    if (check.exists) {
      addResult("PASS", check.rule, "Foundation file or route exists for this future check.");
    } else {
      addResult("PENDING", check.rule, check.message);
    }
  }
}

function checkLighthouseStatus() {
  const packageJson = JSON.parse(readProjectFile("package.json"));
  const hasHealthScript = packageJson.scripts?.["lhci:health"] === "lhci healthcheck --fatal";
  const hasFullScript = typeof packageJson.scripts?.["ci:lighthouse"] === "string";
  const hasConfig = existsSync(projectPath("lighthouserc.cjs"));

  if (hasHealthScript && hasFullScript && hasConfig) {
    addResult(
      "PASS",
      "lighthouse.health",
      "LHCI health script and config exist; Step 8H respects Step 6B by not treating Windows full autorun as fixed.",
    );
    addResult(
      "PENDING",
      "lighthouse.fullAutorun",
      "Full Lighthouse autorun remains pending Linux/cloud CI because local Windows cleanup is blocked.",
    );
    return;
  }

  addResult(
    "FAIL",
    "lighthouse.health",
    "LHCI health foundation is missing or package scripts drifted.",
    [
      `lhci:health script present: ${hasHealthScript}`,
      `ci:lighthouse script present: ${hasFullScript}`,
      `lighthouserc.cjs present: ${hasConfig}`,
    ],
  );
}

function checkHumanLegalGates() {
  const gates = [
    {
      rule: "human.canonicalFinal",
      message:
        "Final apex-versus-www canonical host lock remains a human/executive decision.",
    },
    {
      rule: "human.presidentialThc",
      message:
        "Public use and exact framing of Presidential THC remains a client/legal review gate.",
    },
    {
      rule: "human.sameAsProfiles",
      message:
        "Official sameAs profile ownership/authorization remains a client confirmation gate.",
    },
    {
      rule: "human.claims",
      message:
        "Founder/company facts, market-position claims, product facts, and medical/effect-adjacent language remain client/legal gates.",
    },
    {
      rule: "human.ageGate",
      message:
        "Age-gate legal policy and any DOB/sensitive-data collection decision remain legal gates.",
    },
  ];

  for (const gate of gates) {
    addResult("HUMAN", gate.rule, gate.message);
  }
}

function checkSourceCoverage(sourceFiles) {
  if (sourceFiles.length > 0) {
    addResult(
      "PASS",
      "harness.coverage",
      `Scanned ${sourceFiles.length} public SEO source file(s).`,
    );
    return;
  }

  addResult("FAIL", "harness.coverage", "No public SEO source files were found to scan.");
}

function printResults() {
  const statusOrder = ["FAIL", "WARN", "PENDING", "HUMAN", "PASS"];

  console.log("Presidential SEO QA Harness");
  console.log("Step 8H source-record contract foundation checks\n");

  for (const status of statusOrder) {
    const group = results.filter((result) => result.status === status);
    if (group.length === 0) continue;

    console.log(`${status} (${group.length})`);
    for (const result of group) {
      console.log(`- [${result.rule}] ${result.message}`);
      for (const detail of result.details) {
        console.log(`  ${detail}`);
      }
      if (result.remediation) {
        console.log(`  Remediation: ${result.remediation}`);
      }
    }
    console.log("");
  }

  const counts = Object.fromEntries(
    statusOrder.map((status) => [
      status,
      results.filter((result) => result.status === status).length,
    ]),
  );

  console.log(
    `Summary: ${counts.FAIL} fail, ${counts.WARN} warn, ${counts.PENDING} pending, ${counts.HUMAN} human/legal, ${counts.PASS} pass.`,
  );
}

const sourceFiles = collectTextFiles(sourceRoots);
const publicCopyFiles = collectTextFiles(publicCopyRoots).filter((file) => !isInternalDraftAppFile(file));

checkSourceCoverage(sourceFiles);
checkCanonicalHost();
checkForbiddenUrls(sourceFiles);
checkPublicLanguage(publicCopyFiles);
checkCannabisClaims(publicCopyFiles);
checkSafeNeutralLanguage();
checkRuntimeLanguageGuard();
checkProductSchema();
checkSameAsWhitelist(sourceFiles);
checkJsonLdSafety();
checkRouteRegistryFoundation();
checkSourceRecordContractFoundation();
checkMetadataFoundation();
checkSitemapRobotsFoundation();
checkRouteShellFoundation();
checkRouteShellSchemaFoundation();
checkAgeGateFoundation();
checkStep8HScopeBoundary();
checkReferenceDataQuarantine();
checkBrandDefenseRoutePlanning();
checkRouteRegistryPublicationGateLock();
checkScaffoldSignals(publicCopyFiles);
checkStep9FDesignSystemFoundation();
checkStep9GRouteShellVisualFoundation();
checkStep9HHomeRouteComposition();
checkStep9LStaticRouteVisualFoundation();
checkPendingSystems();
checkLighthouseStatus();
checkHumanLegalGates();

printResults();

if (results.some((result) => result.status === "FAIL")) {
  process.exit(1);
}
