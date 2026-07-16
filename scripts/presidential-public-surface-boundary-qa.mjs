import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const docsResultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "247-step10g-public-surface-boundary-qa-results.csv",
);
const workRoot = path.join(root, "sources", "spud", "work", "step10g-public-surface-boundary-qa");
const statusJsonPath = path.join(workRoot, "step10g-public-surface-boundary-status.json");
const statusMdPath = path.join(workRoot, "step10g-public-surface-boundary-status.md");
const writeArtifacts = process.env.PRESIDENTIAL_QA_WRITE_ARTIFACTS !== "false";

const productionOrigin = "https://presidentialmoonrocks.com";
const allowedUrlOrigins = new Set([productionOrigin, "https://schema.org"]);
const approvedGatedAnalyticsUrlFiles = new Set([
  "src/components/analytics/google-analytics.tsx",
]);
const approvedGatedAnalyticsUrlOrigins = new Set([
  "https://www.googletagmanager.com",
]);
const approvedPublicAssetFiles = new Set([
  "apple-touch-icon.png",
  "brand/banner-about-us-contact-header.webp",
  "brand/banner-palms-teal.webp",
  "brand/og-social-share-image.avif",
  "brand/og-social-share-image.png",
  "brand/og-social-share-image.webp",
  "brand/presidential-logo.webp",
  "favicon.ico",
  "favicon.png",
  "media/backdrops/crest-spinning.mp4",
  "media/backdrops/crest-spinning.webm",
  "media/backdrops/gold-backdrop.mp4",
  "media/backdrops/gold-backdrop.webm",
  "media/backdrops/rosegold-backdrop.mp4",
  "media/backdrops/rosegold-backdrop.webm",
  "media/backdrops/silver-backdrop.mp4",
  "media/backdrops/silver-backdrop.webm",
  "media/brand/presidential-banner.png",
  "media/flavor-blunts.mp4",
  "media/flavor-blunts.webm",
  "media/gems/presidential-p.png",
  "media/moon-rocks-film.mp4",
  "media/moon-rocks-film.webm",
  "media/nationwide-map.mp4",
  "media/nationwide-map.webm",
  "media/posters/crest-spinning.jpg",
  "media/posters/flavor-blunts.jpg",
  "media/posters/gold-backdrop.jpg",
  "media/posters/moon-rocks-film.jpg",
  "media/posters/nationwide-map.jpg",
  "media/posters/rosegold-backdrop.jpg",
  "media/posters/silver-backdrop.jpg",
  "media/posters/strains-horizontal.jpg",
  "media/posters/strains-vertical.jpg",
  "media/states/az-hero.webp",
  "media/states/ca-hero.webp",
  "media/states/fl-hero.webp",
  "media/states/mi-hero.webp",
  "media/states/nv-hero.webp",
  "media/states/ny-hero.webp",
  "media/states/ok-hero.webp",
  "media/states/wa-hero.webp",
  "media/strains-horizontal.mp4",
  "media/strains-horizontal.webm",
  "media/strains-vertical.mp4",
  "media/strains-vertical.webm",
]);
const forbiddenStarterAssets = new Set([
  "file.svg",
  "globe.svg",
  "next.svg",
  "vercel.svg",
  "window.svg",
]);
const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".mjs",
  ".rsc",
  ".svg",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
]);

const publicSourceRoots = [
  path.join(webRoot, "src", "app"),
  path.join(webRoot, "src", "components"),
  path.join(webRoot, "src", "lib", "seo"),
];
const builtPublicRoots = [path.join(webRoot, ".next", "server", "app")];
const publicAssetRoot = path.join(webRoot, "public");

const blockedDomainPatterns = [
  { label: "Wix site host", regex: /\b(?:wixsite|wixstatic)\.com\b/i },
  { label: "Vercel generated host", regex: /\bvercel\.app\b/i },
  { label: "Vercel marketing asset", regex: /\bvercel\.com\b/i },
  { label: "localhost", regex: /\blocalhost\b/i },
  { label: "loopback", regex: /\b127\.0\.0\.1\b/i },
  { label: "owned alternate domain", regex: /\bpresidential(?:ca\.com|\.vip|\.rocks|\.online|\.us)\b/i },
  { label: "public threat wording", regex: /\b(imposter|hijack(?:ed|ing)?|scam|counterfeit|knockoff|fraud)\b/i },
];
const publicUnlockPattern =
  /\b(?:publicSeoUnlocked|public_seo_unlocked|routePublicationApproved|route_publication_approved|sitemapUnlocked|sitemap_unlocked|indexabilityUnlocked|indexability_unlocked|metadataUnlocked|metadata_unlocked|schemaUnlocked|schema_unlocked|deploymentApproved|deployment_approved)\s*:\s*true\b|public_unlock\s*[:=]\s*["']yes["']|SAFE_TO_PUBLISH/i;

const publicAssetFilenamePatterns = [
  { label: "draft filename", regex: /\bdraft\b/i },
  { label: "placeholder filename", regex: /\bplaceholder\b/i },
  { label: "fake filename", regex: /\bfake\b/i },
  { label: "sample filename", regex: /\bsample\b/i },
  { label: "wix filename", regex: /\bwix/i },
  { label: "vercel filename", regex: /\bvercel\b/i },
];

function csvEscape(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function toPosix(filePath) {
  return filePath.replace(/\\/g, "/");
}

function relativeToAppRoot(appRoot, filePath, pathApi = path) {
  return toPosix(pathApi.relative(appRoot, filePath));
}

function rel(filePath) {
  return toPosix(path.relative(root, filePath));
}

function webRel(filePath) {
  return relativeToAppRoot(webRoot, filePath);
}

function isApprovedGatedAnalyticsUrl(relativeWebPath, origin) {
  return (
    approvedGatedAnalyticsUrlFiles.has(relativeWebPath) &&
    approvedGatedAnalyticsUrlOrigins.has(origin)
  );
}

function analyticsPathFixturesPass() {
  const fixtures = [
    [path.win32, "C:\\workspace\\web"],
    [path.win32, "C:\\actions\\presidential-official"],
    [path.posix, "/workspace/web"],
    [path.posix, "/home/runner/work/presidential-official/presidential-official"],
  ];

  const approvedPath = "src/components/analytics/google-analytics.tsx";
  const approvedOrigin = "https://www.googletagmanager.com";
  const approvedFixturesPass = fixtures.every(([pathApi, appRoot]) => {
    const filePath = pathApi.join(appRoot, ...approvedPath.split("/"));
    return isApprovedGatedAnalyticsUrl(
      relativeToAppRoot(appRoot, filePath, pathApi),
      approvedOrigin,
    );
  });

  return (
    approvedFixturesPass &&
    !isApprovedGatedAnalyticsUrl("src/app/page.tsx", approvedOrigin) &&
    !isApprovedGatedAnalyticsUrl(approvedPath, "https://example.com")
  );
}

function readIfExists(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function walkFiles(rootPath, { includeBinary = true } = {}) {
  const files = [];

  function walk(currentPath) {
    if (!existsSync(currentPath)) return;
    const stat = statSync(currentPath);

    if (stat.isDirectory()) {
      for (const entry of readdirSync(currentPath)) {
        if (entry === "node_modules" || entry === ".git" || entry === ".lighthouseci" || entry === "cache") {
          continue;
        }
        walk(path.join(currentPath, entry));
      }
      return;
    }

    if (includeBinary || textExtensions.has(path.extname(currentPath))) {
      files.push(currentPath);
    }
  }

  walk(rootPath);
  return files;
}

function collectTextFiles(roots) {
  return roots.flatMap((scanRoot) => walkFiles(scanRoot, { includeBinary: false }));
}

function extractHttpUrls(text) {
  return Array.from(text.matchAll(/https?:\/\/[A-Za-z0-9][^\s"'<>\\)]*/gi)).map((match) =>
    match[0].replace(/[.,;:]+$/g, ""),
  );
}

function findLineMatches(files, patterns) {
  const matches = [];
  for (const file of files) {
    const text = readIfExists(file);
    const lines = text.split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      for (const pattern of patterns) {
        if (pattern.regex.test(line)) {
          matches.push(`${rel(file)}:${index + 1}:${pattern.label}:${line.trim()}`);
        }
      }
    }
  }
  return matches;
}

function findUrlOriginViolations(files, { allowW3cSvg = false } = {}) {
  const violations = [];
  for (const file of files) {
    const relativePath = rel(file);
    const relativeWebPath = webRel(file);
    const text = readIfExists(file);
    for (const url of extractHttpUrls(text)) {
      try {
        const parsed = new URL(url);
        if (allowedUrlOrigins.has(parsed.origin)) continue;
        if (isApprovedGatedAnalyticsUrl(relativeWebPath, parsed.origin)) {
          continue;
        }
        if (allowW3cSvg && parsed.origin === "http://www.w3.org") continue;
        violations.push(`${relativePath}:${url}`);
      } catch {
        violations.push(`${relativePath}:${url}`);
      }
    }
  }
  return violations;
}

function addCheck(rows, check, passed, details) {
  rows.push({
    check,
    status: passed ? "pass" : "fail",
    details,
    public_unlock: "no",
  });
  return passed;
}

function main() {
  const rows = [];
  const sourceTextFiles = collectTextFiles(publicSourceRoots);
  const builtTextFiles = collectTextFiles(builtPublicRoots);
  const publicAssetFiles = walkFiles(publicAssetRoot, { includeBinary: true });
  const publicAssetTextFiles = publicAssetFiles.filter((file) => textExtensions.has(path.extname(file)));
  const sitemapBodyPath = path.join(webRoot, ".next", "server", "app", "sitemap.xml.body");
  const robotsBodyPath = path.join(webRoot, ".next", "server", "app", "robots.txt.body");
  const sitemapBody = readIfExists(sitemapBodyPath);
  const robotsBody = readIfExists(robotsBodyPath);

  const publicAssetRelPaths = publicAssetFiles.map((file) => toPosix(path.relative(publicAssetRoot, file)));
  const unapprovedPublicAssets = publicAssetRelPaths.filter((file) => !approvedPublicAssetFiles.has(file));
  const missingApprovedPublicAssets = Array.from(approvedPublicAssetFiles).filter(
    (file) => !publicAssetRelPaths.includes(file),
  );
  const starterAssetMatches = publicAssetRelPaths.filter((file) => forbiddenStarterAssets.has(path.basename(file)));
  const suspiciousPublicAssetNames = publicAssetRelPaths.flatMap((file) =>
    publicAssetFilenamePatterns
      .filter((pattern) => pattern.regex.test(file))
      .map((pattern) => `${file}:${pattern.label}`),
  );

  const sourceBlockedDomainMatches = findLineMatches(sourceTextFiles, blockedDomainPatterns);
  const builtBlockedDomainMatches = findLineMatches(builtTextFiles, blockedDomainPatterns);
  const publicAssetBlockedDomainMatches = findLineMatches(publicAssetTextFiles, blockedDomainPatterns);
  const sourceUrlViolations = findUrlOriginViolations(sourceTextFiles);
  const builtUrlViolations = findUrlOriginViolations(builtTextFiles);
  const publicAssetUrlViolations = findUrlOriginViolations(publicAssetTextFiles, { allowW3cSvg: true });
  const publicUnlockSignalText = [
    ...sourceTextFiles,
    ...builtTextFiles,
    ...publicAssetTextFiles,
  ].map((file) => readIfExists(file)).join("\n");
  const hasPublicUnlockSignal = publicUnlockPattern.test(publicUnlockSignalText);
  const analyticsAllowlistPathFixturesPass = analyticsPathFixturesPass();

  const checks = [
    addCheck(rows, "publicDirectory.exists", existsSync(publicAssetRoot), "public directory exists for future approved assets"),
    addCheck(rows, "publicAssets.noUnapprovedFiles", unapprovedPublicAssets.length === 0, unapprovedPublicAssets.length ? unapprovedPublicAssets.join(" | ") : "public directory contains no unapproved asset files"),
    addCheck(rows, "publicAssets.approvedInventoryPresent", missingApprovedPublicAssets.length === 0, missingApprovedPublicAssets.length ? missingApprovedPublicAssets.join(" | ") : `${approvedPublicAssetFiles.size}/${approvedPublicAssetFiles.size} approved public assets present`),
    addCheck(rows, "publicAssets.noStarterFrameworkAssets", starterAssetMatches.length === 0, starterAssetMatches.length ? starterAssetMatches.join(" | ") : "no default Next/Vercel starter assets remain public"),
    addCheck(rows, "publicAssets.noSuspiciousFilenames", suspiciousPublicAssetNames.length === 0, suspiciousPublicAssetNames.length ? suspiciousPublicAssetNames.join(" | ") : "no draft/placeholder/fake/sample/Wix/Vercel public filenames"),
    addCheck(rows, "publicAssets.noBlockedDomainText", publicAssetBlockedDomainMatches.length === 0, publicAssetBlockedDomainMatches.length ? publicAssetBlockedDomainMatches.slice(0, 10).join(" | ") : "public asset text contains no blocked hosts or threat wording"),
    addCheck(rows, "publicAssets.onlyApprovedUrlOrigins", publicAssetUrlViolations.length === 0, publicAssetUrlViolations.length ? publicAssetUrlViolations.slice(0, 10).join(" | ") : "public asset text contains no external URL origin violations"),
    addCheck(rows, "source.noBlockedDomainText", sourceBlockedDomainMatches.length === 0, sourceBlockedDomainMatches.length ? sourceBlockedDomainMatches.slice(0, 10).join(" | ") : "public source surfaces contain no blocked hosts or threat wording"),
    addCheck(rows, "source.analyticsAllowlistPathPortable", analyticsAllowlistPathFixturesPass, analyticsAllowlistPathFixturesPass ? "analytics URL allowlist is web-root-relative across Windows and POSIX checkout names" : "analytics URL allowlist path portability fixtures failed"),
    addCheck(rows, "source.onlyApprovedUrlOrigins", sourceUrlViolations.length === 0, sourceUrlViolations.length ? sourceUrlViolations.slice(0, 10).join(" | ") : "public source URL origins are production or schema.org only"),
    addCheck(rows, "builtOutput.exists", builtTextFiles.length > 0, `${builtTextFiles.length} built public text file(s) scanned`),
    addCheck(rows, "builtOutput.noBlockedDomainText", builtBlockedDomainMatches.length === 0, builtBlockedDomainMatches.length ? builtBlockedDomainMatches.slice(0, 10).join(" | ") : "built output contains no blocked hosts or threat wording"),
    addCheck(rows, "builtOutput.onlyApprovedUrlOrigins", builtUrlViolations.length === 0, builtUrlViolations.length ? builtUrlViolations.slice(0, 10).join(" | ") : "built output URL origins are production or schema.org only"),
    addCheck(rows, "sitemap.emptyNoUrlEntries", existsSync(sitemapBodyPath) && !/<url>\s*<loc>/i.test(sitemapBody), "built sitemap remains empty of URL entries"),
    addCheck(rows, "robots.sitemapCanonicalHost", robotsBody.includes("Sitemap: https://presidentialmoonrocks.com/sitemap.xml"), "robots sitemap pointer stays on canonical host"),
    addCheck(rows, "noPublicUnlockSignals", !hasPublicUnlockSignal, hasPublicUnlockSignal ? "public unlock-shaped signal found in scanned public surfaces" : "public surface boundary QA found no deployment, publication, sitemap inclusion, route publication, or public SEO unlock signals"),
  ];

  const verdict = checks.every(Boolean)
    ? "PASS_PUBLIC_SURFACE_BOUNDARY_QA_NO_PUBLIC_UNLOCK"
    : "FAIL_PUBLIC_SURFACE_BOUNDARY_QA_REVIEW_REQUIRED";

  if (writeArtifacts) {
    mkdirSync(path.dirname(docsResultsPath), { recursive: true });
    writeFileSync(
      docsResultsPath,
      [
        "check,status,details,public_unlock",
        ...rows.map((row) =>
          [row.check, row.status, row.details, row.public_unlock].map(csvEscape).join(","),
        ),
      ].join("\n") + "\n",
    );
  }

  const payload = {
    verdict,
    publicAssetFiles: publicAssetRelPaths,
    sourceTextFileCount: sourceTextFiles.length,
    builtTextFileCount: builtTextFiles.length,
    checks: Object.fromEntries(rows.map((row) => [row.check, row.status === "pass"])),
    unapprovedPublicAssets,
    missingApprovedPublicAssets,
    starterAssetMatches,
    suspiciousPublicAssetNames,
    sourceBlockedDomainMatches,
    builtBlockedDomainMatches,
    publicAssetBlockedDomainMatches,
    sourceUrlViolations,
    builtUrlViolations,
    publicAssetUrlViolations,
    publicSeoUnlocked: false,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    metadataUnlocked: false,
    schemaUnlocked: false,
    deploymentApproved: false,
    packagesChanged: false,
    guardrail:
      "Step 10G verifies public asset and public URL host boundaries only. It does not approve assets, deploy, publish routes, modify metadata/schema, import data, or unlock public SEO.",
  };

  if (writeArtifacts) {
    mkdirSync(workRoot, { recursive: true });
    writeFileSync(statusJsonPath, JSON.stringify(payload, null, 2));
    writeFileSync(
      statusMdPath,
      [
        "# Step 10G Public Surface Boundary Status",
        "",
        `Verdict: \`${verdict}\``,
        "",
        "## Checks",
        "",
        ...rows.map((row) => `- \`${row.check}\`: ${row.status.toUpperCase()} - ${row.details}`),
        "",
        "## Guardrail",
        "",
        payload.guardrail,
        "",
        "Final signal: `STEP_10G_PUBLIC_SURFACE_BOUNDARY_QA_COMPLETE_NO_PUBLIC_UNLOCK`",
      ].join("\n") + "\n",
    );
  }

  console.log(JSON.stringify(payload, null, 2));
  process.exitCode = verdict.startsWith("PASS_") ? 0 : 1;
}

main();
