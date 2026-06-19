import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
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

function checkPublicLanguage(publicCopyFiles) {
  const accusationPatterns = [
    { label: "fake", regex: /\bfake\b/i },
    { label: "imposter", regex: /\bimpost(?:e|o)r\b/i },
    { label: "stolen", regex: /\bstolen\b/i },
    { label: "hijacked", regex: /\bhijack(?:ed|ing)?\b/i },
    { label: "scam", regex: /\bscam\b/i },
  ];
  const matches = publicCopyFiles.flatMap((file) =>
    findLineMatches(file, accusationPatterns),
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

function checkCannabisClaims(publicCopyFiles) {
  const claimPatterns = [
    { label: "medical cure/treatment", regex: /\b(cure|cures|treat|treats|treatment|therapeutic)\b/i },
    { label: "medical condition", regex: /\b(pain|anxiety|sleep|cancer|depression|ptsd|inflammation)\b/i },
    { label: "shipping/direct commerce", regex: /\b(ship|ships|shipping|delivery|deliver|buy online|order online|checkout|cart)\b/i },
    { label: "pricing/inventory", regex: /\b(price|pricing|inventory|in stock|available now)\b/i },
    { label: "youth-coded/giveaway", regex: /\b(candy|cartoon|kids?|minor|teen|giveaway|free product)\b/i },
    { label: "over-intoxication", regex: /\b(get high|highest high|over[- ]?intoxication)\b/i },
  ];
  const matches = publicCopyFiles.flatMap((file) =>
    findLineMatches(file, claimPatterns),
  );

  if (matches.length === 0) {
    addResult(
      "PASS",
      "language.claims",
      "No blocked medical, commerce, pricing, inventory, youth-coded, or over-intoxication claims found in app/content source.",
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
    metadataText.includes("route.indexability === \"conditional_index\"");

  if (robotsDerivedFromIndexability) {
    addResult(
      "PASS",
      "metadata.robots",
      "Robots metadata is derived from route approval, indexability, and blockers.",
    );
  } else {
    addResult(
      "FAIL",
      "metadata.robots",
      "Robots metadata is not clearly derived from route indexability and approval state.",
      [],
      "Derive robots metadata from route status, indexability, and blocker state.",
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
    componentText.includes("route.h1") &&
    componentText.includes("route.description") &&
    componentText.includes("getStaticRouteShellLinks(route)") &&
    componentText.includes("For adults 21+ where legal");

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

    if (!text.includes("<PresidentialRouteShell route={route} />")) {
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
      "Static route shells render through the shared Presidential route shell component.",
    );
  } else {
    addResult(
      "FAIL",
      "routeShells.sharedShell",
      "Some route shells may be duplicating shell markup.",
      pageShellIssues,
      "Use the shared route shell component until final design is approved.",
    );
  }

  const learnGuidePath = "src/app/learn/[guide]/page.tsx";
  const learnGuideText = projectFileExists(learnGuidePath)
    ? readProjectFile(learnGuidePath)
    : "";
  const learnGuideSafe =
    learnGuideText.includes("dynamicParams = false") &&
    learnGuideText.includes("generateStaticParams") &&
    learnGuideText.includes("return []") &&
    learnGuideText.includes("notFound()") &&
    !learnGuideText.includes("buildRouteMetadata") &&
    !learnGuideText.includes("buildStaticRouteMetadata") &&
    !learnGuideText.includes("buildRouteCanonicalUrl") &&
    !learnGuideText.includes("canonicalPath");

  if (learnGuideSafe) {
    addResult(
      "PASS",
      "routeShells.learnGuide",
      "Learn guide dynamic route is present but emits no fake article pages or unresolved canonicals.",
    );
  } else {
    addResult(
      "FAIL",
      "routeShells.learnGuide",
      "Learn guide route may emit fake pages or unresolved template metadata.",
      [],
      "Use empty static params, dynamicParams false, and notFound until approved article records exist.",
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
    componentText.includes('aria-label="Breadcrumb"') &&
    componentText.includes('aria-current="page"');

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
    ageGateText.includes('data-presidential-age-gate="overlay"') &&
    ageGateText.includes('role="dialog"') &&
    ageGateText.includes('aria-modal="true"') &&
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
        `overlay data attribute present: ${ageGateText.includes('data-presidential-age-gate="overlay"')}`,
        `dialog role present: ${ageGateText.includes('role="dialog"')}`,
        `aria-modal present: ${ageGateText.includes('aria-modal="true"')}`,
        `21+ copy present: ${ageGateText.includes("Adults 21+ where legal")}`,
      ],
      "Keep the foundation as an accessible overlay with safe adult-access language.",
    );
  }

  const layoutMountsGate =
    layoutText.includes('import { AgeGate } from "@/components/age-gate"') &&
    layoutText.includes("<AgeGate />");
  const contentBeforeGate =
    layoutText.indexOf("{children}") !== -1 &&
    layoutText.indexOf("<AgeGate />") !== -1 &&
    layoutText.indexOf("{children}") < layoutText.indexOf("<AgeGate />");

  if (layoutMountsGate && contentBeforeGate) {
    addResult(
      "PASS",
      "agegate.mounting",
      "Age gate is mounted after page content so route content remains server-rendered and crawlable.",
    );
  } else {
    addResult(
      "FAIL",
      "agegate.mounting",
      "Age gate may replace or wrap page content instead of overlaying it.",
      [
        `layout imports/renders AgeGate: ${layoutMountsGate}`,
        `children appear before AgeGate: ${contentBeforeGate}`,
      ],
      "Render route children first and mount the AgeGate overlay after them in the root layout.",
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
    ageGateText.includes("localStorage") &&
    ageGateText.includes("presidential_adult_confirmed") &&
    !ageGateText.includes("document.cookie");

  if (confirmationOnly) {
    addResult(
      "PASS",
      "agegate.confirmationOnly",
      "Age gate stores only an adult-confirmation flag and does not use cookies.",
    );
  } else {
    addResult(
      "FAIL",
      "agegate.confirmationOnly",
      "Age gate persistence is not limited to the approved adult-confirmation flag.",
      [
        `localStorage used: ${ageGateText.includes("localStorage")}`,
        `adult confirmation key present: ${ageGateText.includes("presidential_adult_confirmed")}`,
        `cookie used: ${ageGateText.includes("document.cookie")}`,
      ],
      "Keep Step 8E to a non-sensitive adult-confirmation flag.",
    );
  }

  const storageToleratesFailure =
    ageGateText.includes("function readAdultConfirmation") &&
    ageGateText.includes("function writeAdultConfirmation") &&
    ageGateText.includes("function clearAdultConfirmation") &&
    ageGateText.includes("try {") &&
    ageGateText.includes("catch {");

  if (storageToleratesFailure) {
    addResult(
      "PASS",
      "agegate.storageTolerance",
      "Age gate localStorage access is isolated behind helpers that tolerate restricted storage failures.",
    );
  } else {
    addResult(
      "FAIL",
      "agegate.storageTolerance",
      "Age gate storage access may crash in restricted/private browsing modes.",
      [],
      "Wrap localStorage reads/writes/removals so storage failures keep the overlay safe instead of crashing the app.",
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

function checkStep8FScopeBoundary() {
  const outOfScopePaths = [
    "src/app/moon-rocks/silver",
    "src/app/moon-rocks/gold",
    "src/app/moon-rocks/rose-gold",
    "src/app/moon-rocks/[product-or-strain]",
    "src/app/find-us/[state]",
    "src/app/age-gate",
    "src/app/age",
    "src/app/verify-age",
    "src/app/21-plus",
    "src/lib/db",
    "src/lib/cms",
    "src/lib/data",
    "src/content/products",
    "src/content/stores",
  ];
  const present = outOfScopePaths.filter((path) => projectFileExists(path));

  if (present.length === 0) {
    addResult(
      "PASS",
      "scope.step8f",
      "Step 8F stayed scoped to route-shell schema wiring and did not create redirect-wall, product/detail, locator data, database, or CMS files.",
    );
  } else {
    addResult(
      "FAIL",
      "scope.step8f",
      "Step 8F out-of-scope files or folders exist.",
      present,
      "Keep Step 8F limited to route-shell JSON-LD/schema wiring foundation.",
    );
  }
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
      "LHCI health script and config exist; Step 8F respects Step 6B by not treating Windows full autorun as fixed.",
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
  console.log("Step 8F route-shell schema wiring foundation checks\n");

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
const publicCopyFiles = collectTextFiles(publicCopyRoots);

checkSourceCoverage(sourceFiles);
checkCanonicalHost();
checkForbiddenUrls(sourceFiles);
checkPublicLanguage(publicCopyFiles);
checkCannabisClaims(publicCopyFiles);
checkProductSchema();
checkSameAsWhitelist(sourceFiles);
checkJsonLdSafety();
checkRouteRegistryFoundation();
checkMetadataFoundation();
checkSitemapRobotsFoundation();
checkRouteShellFoundation();
checkRouteShellSchemaFoundation();
checkAgeGateFoundation();
checkStep8FScopeBoundary();
checkScaffoldSignals(publicCopyFiles);
checkPendingSystems();
checkLighthouseStatus();
checkHumanLegalGates();

printResults();

if (results.some((result) => result.status === "FAIL")) {
  process.exit(1);
}
