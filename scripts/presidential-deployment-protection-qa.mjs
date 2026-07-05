import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const docsResultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "239-step10e-deployment-protection-qa-results.csv",
);
const workRoot = path.join(root, "sources", "spud", "work", "step10e-deployment-protection-qa");
const statusJsonPath = path.join(workRoot, "step10e-deployment-protection-status.json");
const statusMdPath = path.join(workRoot, "step10e-deployment-protection-status.md");

const textExtensions = new Set([".cmd", ".cjs", ".js", ".json", ".mjs", ".ps1", ".sh", ".ts", ".tsx", ".yaml", ".yml"]);
const qaScriptNames = new Set([
  "presidential-deployment-protection-qa.mjs",
  "presidential-environment-boundary-qa.mjs",
]);

const vercelConfigCandidates = [
  path.join(root, "vercel.json"),
  path.join(root, "vercel.ts"),
  path.join(root, "vercel.js"),
  path.join(root, "vercel.mjs"),
  path.join(root, "vercel.cjs"),
  path.join(root, "vercel.mts"),
  path.join(webRoot, "vercel.json"),
  path.join(webRoot, "vercel.ts"),
  path.join(webRoot, "vercel.js"),
  path.join(webRoot, "vercel.mjs"),
  path.join(webRoot, "vercel.cjs"),
  path.join(webRoot, "vercel.mts"),
];

const configAndAutomationRoots = [
  path.join(root, ".github"),
  path.join(webRoot, ".github"),
  path.join(root, ".circleci"),
  path.join(webRoot, ".circleci"),
  path.join(root, "scripts"),
  path.join(webRoot, "scripts"),
];

const deploymentCommandPatterns = [
  /\bvercel\s+--prod\b/i,
  /\bvercel\s+deploy\b/i,
  /\bvercel\s+promote\b/i,
  /\bvercel\s+alias\b/i,
  /\bvercel\b[^\n\r]*\s--prod\b/i,
];

const deploymentHookPatterns = [
  /https:\/\/api\.vercel\.com\/v1\/integrations\/deploy\//i,
  /https:\/\/vercel\.com\/api\/webhooks\/deploy\//i,
  /\bdeploy[_-]?hook[_-]?url\b/i,
];

const deploymentBypassPatterns = [
  /\bVERCEL_AUTOMATION_BYPASS_SECRET\b/,
  /\bx-vercel-protection-bypass\b/i,
  /\b__prerender_bypass\b/,
  /\bprotection[_-]?bypass[_-]?secret\b/i,
];

const generatedUrlPatterns = [
  /\.vercel\.app/i,
  /\bVERCEL_URL\b/,
  /\bVERCEL_BRANCH_URL\b/,
  /\bVERCEL_PROJECT_PRODUCTION_URL\b/,
  /\bNEXT_PUBLIC_VERCEL_URL\b/,
  /\bNEXT_PUBLIC_VERCEL_BRANCH_URL\b/,
  /\bNEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL\b/,
];

const vercelRoutingOverridePatterns = [
  /"routes"\s*:/i,
  /"rewrites"\s*:/i,
  /"redirects"\s*:/i,
  /\broutes\s*:/i,
  /\brewrites\s*:/i,
  /\bredirects\s*:/i,
];

function csvEscape(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function toPosix(filePath) {
  return filePath.replace(/\\/g, "/");
}

function rel(filePath) {
  return toPosix(path.relative(root, filePath));
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
        if (entry === "node_modules" || entry === ".git" || entry === ".next" || entry === ".lighthouseci") {
          continue;
        }
        walk(path.join(currentPath, entry));
      }
      return;
    }

    if (qaScriptNames.has(path.basename(currentPath))) return;
    if (textExtensions.has(path.extname(currentPath))) {
      files.push(currentPath);
    }
  }

  walk(rootPath);
  return files;
}

function collectScanFiles() {
  const files = [
    path.join(webRoot, "package.json"),
    path.join(webRoot, "next.config.ts"),
    path.join(webRoot, ".gitignore"),
    path.join(root, "package.json"),
  ].filter(existsSync);

  for (const candidate of vercelConfigCandidates) {
    if (existsSync(candidate)) files.push(candidate);
  }

  for (const rootPath of configAndAutomationRoots) {
    files.push(...walkTextFiles(rootPath));
  }

  return [...new Set(files)];
}

function collectBuiltPublicFiles() {
  const builtRoot = path.join(webRoot, ".next", "server", "app");
  return existsSync(builtRoot) ? walkTextFiles(builtRoot) : [];
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

function parsePackageScripts() {
  const packagePath = path.join(webRoot, "package.json");
  const packageJson = JSON.parse(readIfExists(packagePath));
  return packageJson.scripts ?? {};
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
  const scanFiles = collectScanFiles();
  const builtPublicFiles = collectBuiltPublicFiles();
  const packageScripts = parsePackageScripts();
  const packageScriptEntries = Object.entries(packageScripts).map(([name, value]) => `${name}: ${value}`);
  const packageScriptText = packageScriptEntries.join("\n");
  const vercelConfigFiles = vercelConfigCandidates.filter(existsSync);
  const approvalSignalScanFiles = scanFiles.filter((file) => {
    const name = path.basename(file);
    return !name.startsWith("presidential-") && name !== "seo-gate-tests.mjs";
  });
  const sitemapBodyPath = path.join(webRoot, ".next", "server", "app", "sitemap.xml.body");
  const robotsBodyPath = path.join(webRoot, ".next", "server", "app", "robots.txt.body");
  const sitemapBody = readIfExists(sitemapBodyPath);
  const robotsBody = readIfExists(robotsBodyPath);

  const commandMatches = [
    ...deploymentCommandPatterns.flatMap((pattern) =>
      packageScriptEntries.filter((entry) => pattern.test(entry)).map((entry) => `package.json:scripts:${entry}`),
    ),
    ...findMatches(scanFiles, deploymentCommandPatterns),
  ];
  const deployHookMatches = findMatches(scanFiles, deploymentHookPatterns);
  const bypassMatches = findMatches(scanFiles, deploymentBypassPatterns);
  const generatedUrlMatches = findMatches(scanFiles, generatedUrlPatterns);
  const builtGeneratedUrlMatches = findMatches(builtPublicFiles, generatedUrlPatterns);
  const builtBypassMatches = findMatches(builtPublicFiles, deploymentBypassPatterns);
  const vercelRoutingMatches = findMatches(vercelConfigFiles, vercelRoutingOverridePatterns);

  const checks = [
    addCheck(rows, "packageScripts.noDeployCommands", !deploymentCommandPatterns.some((pattern) => pattern.test(packageScriptText)), commandMatches.length ? commandMatches.slice(0, 10).join(" | ") : "no Vercel deploy/promote/alias production commands in package scripts"),
    addCheck(rows, "automation.noDeployCommands", commandMatches.length === 0, commandMatches.length ? commandMatches.slice(0, 10).join(" | ") : "no deploy commands in scanned automation/config scripts"),
    addCheck(rows, "automation.noDeployHookUrls", deployHookMatches.length === 0, deployHookMatches.length ? deployHookMatches.slice(0, 10).join(" | ") : "no deploy hook URLs or deploy hook env names in scanned automation/config scripts"),
    addCheck(rows, "automation.noProtectionBypassSecrets", bypassMatches.length === 0, bypassMatches.length ? bypassMatches.slice(0, 10).join(" | ") : "no deployment-protection bypass secret names in scanned automation/config scripts"),
    addCheck(rows, "automation.noGeneratedVercelUrls", generatedUrlMatches.length === 0, generatedUrlMatches.length ? generatedUrlMatches.slice(0, 10).join(" | ") : "no generated Vercel URL variables or .vercel.app hosts in deployment/config automation"),
    addCheck(rows, "vercelConfig.absentOrNoRoutingOverrides", vercelRoutingMatches.length === 0, vercelRoutingMatches.length ? vercelRoutingMatches.slice(0, 10).join(" | ") : `${vercelConfigFiles.length} Vercel config file(s), no routing override keys detected`),
    addCheck(rows, "builtOutput.noGeneratedVercelUrls", builtGeneratedUrlMatches.length === 0, builtGeneratedUrlMatches.length ? builtGeneratedUrlMatches.slice(0, 10).join(" | ") : "no generated Vercel URL variables or .vercel.app hosts in built route output"),
    addCheck(rows, "builtOutput.noProtectionBypassSecrets", builtBypassMatches.length === 0, builtBypassMatches.length ? builtBypassMatches.slice(0, 10).join(" | ") : "no deployment-protection bypass secret names in built route output"),
    addCheck(rows, "sitemap.emptyNoUrlEntries", existsSync(sitemapBodyPath) && !/<url>\s*<loc>/i.test(sitemapBody), "built sitemap remains empty of URL entries"),
    addCheck(rows, "robots.sitemapCanonicalHost", robotsBody.includes("Sitemap: https://presidentialmoonrocks.com/sitemap.xml"), "robots sitemap pointer stays on canonical host"),
    addCheck(rows, "noPublicUnlockSignals", !/route publication approved|sitemap inclusion approved|public seo unlocked|deployment approved|production deploy approved/i.test(approvalSignalScanFiles.map(readIfExists).join("\n")), "deployment/config surfaces do not approve deployment, publication, sitemap inclusion, or public SEO"),
  ];

  const verdict = checks.every(Boolean)
    ? "PASS_DEPLOYMENT_PROTECTION_QA_NO_PUBLIC_UNLOCK"
    : "FAIL_DEPLOYMENT_PROTECTION_QA_REVIEW_REQUIRED";

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
    scannedFiles: scanFiles.map(rel),
    approvalSignalScanFiles: approvalSignalScanFiles.map(rel),
    builtPublicFileCount: builtPublicFiles.length,
    vercelConfigFiles: vercelConfigFiles.map(rel),
    checks: Object.fromEntries(rows.map((row) => [row.check, row.status === "pass"])),
    commandMatches,
    deployHookMatches,
    bypassMatches,
    generatedUrlMatches,
    builtGeneratedUrlMatches,
    builtBypassMatches,
    vercelRoutingMatches,
    publicSeoUnlocked: false,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    deploymentApproved: false,
    providerConnected: false,
    guardrail:
      "Step 10E verifies deployment protection and production-readiness boundaries only. It does not deploy, connect a provider, import data, publish routes, or unlock public SEO.",
  };

  mkdirSync(workRoot, { recursive: true });
  writeFileSync(statusJsonPath, JSON.stringify(payload, null, 2));
  writeFileSync(
    statusMdPath,
    [
      "# Step 10E Deployment Protection Status",
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
      "Final signal: `STEP_10E_DEPLOYMENT_PROTECTION_QA_COMPLETE_NO_PUBLIC_UNLOCK`",
    ].join("\n") + "\n",
  );

  console.log(JSON.stringify(payload, null, 2));
  process.exitCode = verdict.startsWith("PASS_") ? 0 : 1;
}

main();
