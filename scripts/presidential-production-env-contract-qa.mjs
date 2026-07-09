import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const docsResultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "399-step11-production-env-contract-results.csv",
);
const workRoot = path.join(root, "sources", "spud", "work", "step11-production-env-contract");
const statusJsonPath = path.join(workRoot, "step11-production-env-contract-status.json");
const statusMdPath = path.join(workRoot, "step11-production-env-contract-status.md");

const publicCmsFlags = [
  "PRESIDENTIAL_SANITY_READ_CLIENT_ENABLED",
  "PRESIDENTIAL_HOMEPAGE_CMS_RENDERING_ENABLED",
  "PRESIDENTIAL_SITE_PAGE_CMS_RENDERING_ENABLED",
  "PRESIDENTIAL_LEARN_GUIDE_CMS_RENDERING_ENABLED",
];

const privatePreviewFlags = [
  "PRESIDENTIAL_PRIVATE_DRAFTS_ROUTE_ENABLED",
  "PRESIDENTIAL_SANITY_DRAFT_READ_ENABLED",
];

const analyticsFlags = [
  "PRESIDENTIAL_ANALYTICS_ENABLED",
  "NEXT_PUBLIC_PRESIDENTIAL_GA_MEASUREMENT_ID",
  "PRESIDENTIAL_GOOGLE_SITE_VERIFICATION_ENABLED",
  "PRESIDENTIAL_GOOGLE_SITE_VERIFICATION",
];

const trackedDraftOnlyFlags = [
  "PRESIDENTIAL_LEARN_GUIDE_DRAFT_RENDERING_ENABLED",
];

const serverOnlySecretNames = ["SANITY_AUTH_TOKEN"];
const expectedProductionEnvNames = [
  ...publicCmsFlags,
  ...privatePreviewFlags,
  ...analyticsFlags,
  ...serverOnlySecretNames,
];

const textExtensions = new Set([".css", ".js", ".json", ".mjs", ".ts", ".tsx"]);
const sourceRoots = [
  path.join(webRoot, "src", "app"),
  path.join(webRoot, "src", "components", "analytics"),
  path.join(webRoot, "src", "lib", "analytics"),
  path.join(webRoot, "src", "lib", "cms"),
  path.join(webRoot, "src", "proxy.ts"),
  path.join(webRoot, "scripts"),
];

const allowedSecretFiles = new Set([
  "src/app/drafts/page.tsx",
  "src/lib/cms/homepage-drafts.ts",
  "src/lib/cms/site-page-drafts.ts",
  "src/lib/cms/learn-guide-drafts.ts",
  "scripts/presidential-cms-live-draft-smoke-qa.mjs",
  "scripts/presidential-cms-web-read-boundary-qa.mjs",
  "scripts/presidential-production-env-contract-qa.mjs",
  "scripts/presidential-production-provider-readiness-qa.mjs",
]);

const deploymentCommandPatterns = [
  /\bvercel\s+--prod\b/i,
  /\bvercel\b[^\n\r]*\s--prod\b/i,
  /\bvercel\s+deploy\b/i,
  /\bvercel\s+promote\b/i,
  /\bvercel\s+alias\b/i,
];

function toPosix(filePath) {
  return filePath.replace(/\\/g, "/");
}

function rel(filePath) {
  return toPosix(path.relative(webRoot, filePath));
}

function readIfExists(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function walkTextFiles(targetPath) {
  const files = [];

  function walk(currentPath) {
    if (!existsSync(currentPath)) return;
    const stats = statSync(currentPath);

    if (stats.isDirectory()) {
      for (const entry of readdirSync(currentPath)) {
        if (entry === "node_modules" || entry === ".next" || entry === ".git") {
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

  walk(targetPath);
  return files;
}

function csvEscape(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
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

function filesContaining(files, needle) {
  return files
    .filter((file) => readIfExists(file).includes(needle))
    .map(rel);
}

function lineMatches(files, patterns) {
  const matches = [];
  for (const file of files) {
    const lines = readIfExists(file).split(/\r?\n/);
    for (const [lineIndex, line] of lines.entries()) {
      if (patterns.some((pattern) => pattern.test(line))) {
        matches.push(`${rel(file)}:${lineIndex + 1}:${line.trim()}`);
      }
    }
  }
  return matches;
}

function hasEnvIgnore(gitignoreText) {
  return /(^|\n)\.env\*\s*(\n|$)/.test(gitignoreText);
}

function hasVercelIgnore(gitignoreText) {
  return /(^|\n)\.vercel\s*(\n|$)/.test(gitignoreText);
}

function main() {
  const rows = [];
  const sourceFiles = sourceRoots.flatMap(walkTextFiles);
  const packageJsonPath = path.join(webRoot, "package.json");
  const gitignorePath = path.join(webRoot, ".gitignore");
  const packageJsonText = readIfExists(packageJsonPath);
  const packageJson = JSON.parse(packageJsonText);
  const scriptText = Object.entries(packageJson.scripts ?? {})
    .map(([name, command]) => `${name}: ${command}`)
    .join("\n");
  const gitignoreText = readIfExists(gitignorePath);
  const publicSecretPattern = /\bNEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|CREDENTIAL|PRIVATE|AUTH|KEY)[A-Z0-9_]*\b/;
  const allSourceText = sourceFiles.map(readIfExists).join("\n");
  const secretMatches = filesContaining(sourceFiles, "SANITY_AUTH_TOKEN");
  const unexpectedSecretMatches = secretMatches.filter((file) => !allowedSecretFiles.has(file));
  const deployScanFiles = [
    packageJsonPath,
    ...sourceFiles.filter((file) => !path.basename(file).startsWith("presidential-")),
  ];
  const deployMatches = lineMatches(deployScanFiles, deploymentCommandPatterns);

  addCheck(
    rows,
    "productionEnv.publicCmsFlags.present",
    publicCmsFlags.every((flag) => filesContaining(sourceFiles, flag).length > 0),
    publicCmsFlags.map((flag) => `${flag}:${filesContaining(sourceFiles, flag).join("|") || "missing"}`).join(" ; "),
  );
  addCheck(
    rows,
    "productionEnv.privatePreviewFlags.present",
    privatePreviewFlags.every((flag) => filesContaining(sourceFiles, flag).length > 0),
    privatePreviewFlags.map((flag) => `${flag}:${filesContaining(sourceFiles, flag).join("|") || "missing"}`).join(" ; "),
  );
  addCheck(
    rows,
    "productionEnv.expectedNames.tracked",
    expectedProductionEnvNames.length === 11,
    expectedProductionEnvNames.join(", "),
  );
  addCheck(
    rows,
    "productionEnv.analyticsFlags.present",
    analyticsFlags.every((flag) => filesContaining(sourceFiles, flag).length > 0),
    analyticsFlags.map((flag) => `${flag}:${filesContaining(sourceFiles, flag).join("|") || "missing"}`).join(" ; "),
  );
  addCheck(
    rows,
    "productionEnv.draftGuideFlag.trackedNotPublicLaunchRequired",
    trackedDraftOnlyFlags.every((flag) => filesContaining(sourceFiles, flag).length > 0),
    trackedDraftOnlyFlags.map((flag) => `${flag}:${filesContaining(sourceFiles, flag).join("|") || "missing"}`).join(" ; "),
  );
  addCheck(
    rows,
    "secrets.sanityAuthToken.serverOnly",
    secretMatches.length > 0 && unexpectedSecretMatches.length === 0,
    unexpectedSecretMatches.length
      ? unexpectedSecretMatches.join(" | ")
      : `allowed references: ${secretMatches.join(" | ")}`,
  );
  addCheck(
    rows,
    "secrets.noNextPublicSecretNames",
    !publicSecretPattern.test(allSourceText + "\n" + packageJsonText),
    "no NEXT_PUBLIC secret/token/key/auth environment variable names in source or scripts",
  );
  addCheck(
    rows,
    "draftRoutes.envGatedNotFound",
    readIfExists(path.join(webRoot, "src", "app", "drafts", "page.tsx")).includes("PRESIDENTIAL_PRIVATE_DRAFTS_ROUTE_ENABLED") &&
      readIfExists(path.join(webRoot, "src", "app", "drafts", "page.tsx")).includes("notFound()") &&
      readIfExists(path.join(webRoot, "src", "app", "drafts", "[slug]", "page.tsx")).includes("PRESIDENTIAL_PRIVATE_DRAFTS_ROUTE_ENABLED") &&
      readIfExists(path.join(webRoot, "src", "app", "drafts", "[slug]", "page.tsx")).includes("notFound()"),
    "private draft routes remain env-gated and return notFound when disabled",
  );
  addCheck(
    rows,
    "publishedCmsReads.usePublishedPerspective",
    readIfExists(path.join(webRoot, "src", "lib", "cms", "sanity-read-client.ts")).includes('defaultPerspective: "published"') &&
      readIfExists(path.join(webRoot, "src", "lib", "cms", "sanity-read-client.ts")).includes("draft documents"),
    "published CMS read client uses published perspective and rejects draft queries",
  );
  addCheck(
    rows,
    "gitignore.envAndVercelIgnored",
    hasEnvIgnore(gitignoreText) && hasVercelIgnore(gitignoreText),
    ".env* and .vercel remain ignored",
  );
  addCheck(
    rows,
    "package.noProductionDeployCommands",
    deployMatches.length === 0,
    deployMatches.length ? deployMatches.join(" | ") : "no production deploy/promote/alias command in package/scripts",
  );
  addCheck(
    rows,
    "package.scriptWired",
    scriptText.includes("production:env-contract:verify"),
    "package script is wired for this production env contract verifier",
  );

  const passCount = rows.filter((row) => row.status === "pass").length;
  const failCount = rows.length - passCount;
  const verdict = failCount === 0
    ? "PASS_PRODUCTION_ENV_CONTRACT_NO_DEPLOY_NO_PUBLIC_UNLOCK"
    : "FAIL_PRODUCTION_ENV_CONTRACT_REVIEW_REQUIRED";

  mkdirSync(path.dirname(docsResultsPath), { recursive: true });
  mkdirSync(workRoot, { recursive: true });

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
    officialVercelPosture: {
      productionEnvironment:
        "Vercel production environment variables apply to the next Production deployment, not previous deployments.",
      sensitiveEnvironmentVariables:
        "Vercel supports sensitive environment variables; sensitive values are available to builds/runtime but cannot be viewed later from the dashboard or env listing.",
      envRun:
        "Vercel CLI supports running commands with project environment variables without writing them to a local env file.",
    },
    expectedProductionEnvNames,
    publicCmsFlags,
    privatePreviewFlags,
    trackedDraftOnlyFlags,
    serverOnlySecretNames,
    passCount,
    failCount,
    checks: Object.fromEntries(rows.map((row) => [row.check, row.status === "pass"])),
    publicSeoUnlocked: false,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    deploymentApproved: false,
    vercelProjectMutated: false,
    secretsPrinted: false,
    rows,
  };

  writeFileSync(statusJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(
    statusMdPath,
    [
      "# Step 11 Production Environment Contract Status",
      "",
      `Verdict: ${verdict}`,
      `Checks: ${passCount}/${rows.length}`,
      "",
      "This verifier proves the production env/deploy contract only. It does not create Vercel variables, print secrets, deploy, publish routes, or unlock public SEO.",
      "",
    ].join("\n"),
  );

  if (failCount > 0) {
    console.error(verdict);
    console.error(`Checks passed: ${passCount}/${rows.length}`);
    process.exit(1);
  }

  console.log(verdict);
  console.log(`Checks passed: ${passCount}/${rows.length}`);
}

main();
