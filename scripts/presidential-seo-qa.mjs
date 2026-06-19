import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const projectRoot = process.cwd();
const sourceRoots = [
  "src/app",
  "src/components",
  "src/content",
  "src/lib/seo/schema",
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
    "WARN",
    "scaffold.placeholders",
    "Starter scaffold copy/assets still exist. Allowed in Step 7A only; must be replaced before production SEO routes launch.",
    matches.map((match) => `${match.file}:${match.line} ${match.label}`),
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
      rule: "sitemap.native",
      exists: existsSync(projectPath("src/app/sitemap.ts")),
      message: "Next.js sitemap does not exist yet; sitemap eligibility checks are pending.",
    },
    {
      rule: "robots.native",
      exists: existsSync(projectPath("src/app/robots.ts")),
      message: "Next.js robots file does not exist yet; robots checks are pending.",
    },
    {
      rule: "agegate.overlay",
      exists:
        existsSync(projectPath("src/components/age-gate.tsx")) ||
        existsSync(projectPath("src/components/AgeGate.tsx")),
      message: "Age gate component does not exist yet; overlay/crawlability checks are pending.",
    },
    {
      rule: "locator.data",
      exists: existsSync(projectPath("src/app/find-us")),
      message: "Find Us route/data does not exist yet; locator thin-page checks are pending.",
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
      "LHCI health script and config exist; Step 7A respects Step 6B by not treating Windows full autorun as fixed.",
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
  console.log("Step 7A foundation checks\n");

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
checkScaffoldSignals(publicCopyFiles);
checkPendingSystems();
checkLighthouseStatus();
checkHumanLegalGates();

printResults();

if (results.some((result) => result.status === "FAIL")) {
  process.exit(1);
}
