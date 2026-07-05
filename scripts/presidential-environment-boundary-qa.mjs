import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const docsResultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "235-step10d-environment-boundary-qa-results.csv",
);
const workRoot = path.join(root, "sources", "spud", "work", "step10d-environment-boundary-qa");
const statusJsonPath = path.join(workRoot, "step10d-environment-boundary-status.json");
const statusMdPath = path.join(workRoot, "step10d-environment-boundary-status.md");

const sourceRoots = [
  "src/app",
  "src/components",
  "src/content",
  "src/lib/seo",
];
const configFiles = ["next.config.ts", ".gitignore", "package.json"];
const builtPublicRoots = [".next/server/app"];
const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".mjs",
  ".rsc",
  ".txt",
  ".ts",
  ".tsx",
  ".xml",
]);

const previewHostPatterns = [
  /\.vercel\.app/i,
  /\bVERCEL_URL\b/,
  /\bVERCEL_BRANCH_URL\b/,
  /\bVERCEL_PROJECT_PRODUCTION_URL\b/,
  /\bNEXT_PUBLIC_VERCEL_URL\b/,
  /\bNEXT_PUBLIC_VERCEL_BRANCH_URL\b/,
  /\bNEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL\b/,
];

const secretPublicPatterns = [
  /\bNEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|CREDENTIAL|PRIVATE|BYPASS)[A-Z0-9_]*\b/,
  /\bNEXT_PUBLIC_[A-Z0-9_]*(?:DATABASE|DB_|PGHOST|PGUSER|PGPASSWORD|NEON)[A-Z0-9_]*\b/,
  /\bNEXT_PUBLIC_[A-Z0-9_]*(?:API_KEY|ACCESS_KEY|AUTH_KEY)[A-Z0-9_]*\b/,
];

const deploymentBypassPatterns = [
  /\bVERCEL_AUTOMATION_BYPASS_SECRET\b/,
  /\bx-vercel-protection-bypass\b/i,
  /\b__prerender_bypass\b/,
];

function csvEscape(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function toPosix(filePath) {
  return filePath.replace(/\\/g, "/");
}

function rel(filePath) {
  return toPosix(path.relative(webRoot, filePath));
}

function readIfExists(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function walkTextFiles(rootPath) {
  const files = [];

  function walk(currentPath) {
    if (!existsSync(currentPath)) return;

    const stat = statSync(currentPath);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(currentPath)) {
        if (
          entry === "node_modules" ||
          entry === ".git" ||
          entry === ".lighthouseci" ||
          entry === "cache"
        ) {
          continue;
        }
        walk(path.join(currentPath, entry));
      }
      return;
    }

    if (textExtensions.has(path.extname(currentPath))) {
      files.push(currentPath);
    }
  }

  walk(rootPath);
  return files;
}

function collectFiles(paths) {
  const files = [];
  for (const sourcePath of paths) {
    const absolutePath = path.join(webRoot, sourcePath);
    if (!existsSync(absolutePath)) continue;
    const stat = statSync(absolutePath);
    if (stat.isDirectory()) {
      files.push(...walkTextFiles(absolutePath));
    } else if (textExtensions.has(path.extname(absolutePath)) || path.basename(absolutePath) === ".gitignore") {
      files.push(absolutePath);
    }
  }
  return files;
}

function findMatches(files, patterns) {
  const matches = [];
  for (const file of files) {
    const text = readIfExists(file);
    const lines = text.split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          matches.push(`${rel(file)}:${index + 1}:${line.trim()}`);
        }
      }
    }
  }
  return matches;
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
  const configScanFiles = collectFiles(configFiles);
  const sourceScanFiles = collectFiles(sourceRoots);
  const builtOutputFiles = collectFiles(builtPublicRoots);
  const nextConfigText = readIfExists(path.join(webRoot, "next.config.ts"));
  const gitignoreText = readIfExists(path.join(webRoot, ".gitignore"));
  const schemaConstantsText = readIfExists(path.join(webRoot, "src", "lib", "seo", "schema", "constants.ts"));
  const metadataText = readIfExists(path.join(webRoot, "src", "lib", "seo", "metadata.ts"));

  const sourcePreviewMatches = findMatches([...configScanFiles, ...sourceScanFiles], previewHostPatterns);
  const publicSecretMatches = findMatches([...configScanFiles, ...sourceScanFiles], secretPublicPatterns);
  const bypassMatches = findMatches([...configScanFiles, ...sourceScanFiles], deploymentBypassPatterns);
  const builtPreviewMatches = findMatches(builtOutputFiles, previewHostPatterns);
  const builtBypassMatches = findMatches(builtOutputFiles, deploymentBypassPatterns);

  const checks = [
    addCheck(rows, "nextConfig.exists", existsSync(path.join(webRoot, "next.config.ts")), "next.config.ts exists"),
    addCheck(rows, "gitignore.exists", existsSync(path.join(webRoot, ".gitignore")), ".gitignore exists"),
    addCheck(rows, "builtAppOutput.exists", builtOutputFiles.length > 0, `${builtOutputFiles.length} built app text file(s)`),
    addCheck(
      rows,
      "nextConfig.noLegacyEnvExport",
      !/\benv\s*:/.test(nextConfigText),
      "next.config.ts does not inline environment variables through the legacy env config",
    ),
    addCheck(
      rows,
      "gitignore.envFilesIgnored",
      /(^|\n)\.env\*\s*(\n|$)/.test(gitignoreText),
      ".env* files remain ignored",
    ),
    addCheck(
      rows,
      "gitignore.vercelIgnored",
      /(^|\n)\.vercel\s*(\n|$)/.test(gitignoreText),
      ".vercel project state remains ignored",
    ),
    addCheck(
      rows,
      "canonical.productionOriginLiteral",
      schemaConstantsText.includes('PRODUCTION_ORIGIN = "https://presidentialmoonrocks.com"'),
      "schema constants lock canonical production origin",
    ),
    addCheck(
      rows,
      "metadata.metadataBaseProductionOrigin",
      metadataText.includes("metadataBase: METADATA_BASE") && metadataText.includes("new URL(PRODUCTION_ORIGIN)"),
      "metadataBase derives from PRODUCTION_ORIGIN, not preview environment variables",
    ),
    addCheck(
      rows,
      "source.noPreviewHostOrVercelUrlEnv",
      sourcePreviewMatches.length === 0,
      sourcePreviewMatches.length ? sourcePreviewMatches.slice(0, 10).join(" | ") : "no preview/generated Vercel URL env usage in public source/config surfaces",
    ),
    addCheck(
      rows,
      "source.noPublicSecretLikeEnvNames",
      publicSecretMatches.length === 0,
      publicSecretMatches.length ? publicSecretMatches.slice(0, 10).join(" | ") : "no secret-like NEXT_PUBLIC_* names in public source/config surfaces",
    ),
    addCheck(
      rows,
      "source.noDeploymentBypassSecrets",
      bypassMatches.length === 0,
      bypassMatches.length ? bypassMatches.slice(0, 10).join(" | ") : "no deployment-protection bypass secret names in public source/config surfaces",
    ),
    addCheck(
      rows,
      "builtOutput.noPreviewHostOrVercelUrlEnv",
      builtPreviewMatches.length === 0,
      builtPreviewMatches.length ? builtPreviewMatches.slice(0, 10).join(" | ") : "no preview/generated Vercel URL env leakage in built public route output",
    ),
    addCheck(
      rows,
      "builtOutput.noDeploymentBypassSecrets",
      builtBypassMatches.length === 0,
      builtBypassMatches.length ? builtBypassMatches.slice(0, 10).join(" | ") : "no deployment-protection bypass secret leakage in built public route output",
    ),
    addCheck(
      rows,
      "noPublicUnlockSignals",
      !/index,\s*follow approved|route publication approved|sitemap inclusion approved|public seo unlocked/i.test(
        [...configScanFiles, ...sourceScanFiles].map(readIfExists).join("\n"),
      ),
      "environment boundary verifier does not approve publication or indexing",
    ),
  ];

  const verdict = checks.every(Boolean)
    ? "PASS_ENVIRONMENT_BOUNDARY_QA_NO_PUBLIC_UNLOCK"
    : "FAIL_ENVIRONMENT_BOUNDARY_QA_REVIEW_REQUIRED";

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

  const payload = {
    verdict,
    sourceScanFiles: sourceScanFiles.map(rel),
    configScanFiles: configScanFiles.map(rel),
    builtOutputFileCount: builtOutputFiles.length,
    checks: Object.fromEntries(rows.map((row) => [row.check, row.status === "pass"])),
    sourcePreviewMatches,
    publicSecretMatches,
    bypassMatches,
    builtPreviewMatches,
    builtBypassMatches,
    publicSeoUnlocked: false,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    metadataUnlocked: false,
    schemaUnlocked: false,
    guardrail:
      "Step 10D verifies environment, preview-host, and public-secret boundaries only. It does not deploy, connect a provider, import data, publish routes, or unlock public SEO.",
  };

  mkdirSync(workRoot, { recursive: true });
  writeFileSync(statusJsonPath, JSON.stringify(payload, null, 2));
  writeFileSync(
    statusMdPath,
    [
      "# Step 10D Environment Boundary Status",
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
      "Final signal: `STEP_10D_ENVIRONMENT_BOUNDARY_QA_COMPLETE_NO_PUBLIC_UNLOCK`",
    ].join("\n") + "\n",
  );

  console.log(JSON.stringify(payload, null, 2));
  process.exitCode = verdict.startsWith("PASS_") ? 0 : 1;
}

main();
