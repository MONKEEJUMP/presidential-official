import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const docsResultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "400-step11-production-provider-readiness-results.csv",
);
const workRoot = path.join(root, "sources", "spud", "work", "step11-production-provider-readiness");
const statusJsonPath = path.join(workRoot, "step11-production-provider-readiness-status.json");
const statusMdPath = path.join(workRoot, "step11-production-provider-readiness-status.md");

const projectJsonPath = path.join(webRoot, ".vercel", "project.json");
const gitignorePath = path.join(webRoot, ".gitignore");
const packageJsonPath = path.join(webRoot, "package.json");

const expectedProductionEnvNames = [
  "PRESIDENTIAL_SANITY_READ_CLIENT_ENABLED",
  "PRESIDENTIAL_HOMEPAGE_CMS_RENDERING_ENABLED",
  "PRESIDENTIAL_SITE_PAGE_CMS_RENDERING_ENABLED",
  "PRESIDENTIAL_LEARN_GUIDE_CMS_RENDERING_ENABLED",
  "PRESIDENTIAL_PRIVATE_DRAFTS_ROUTE_ENABLED",
  "PRESIDENTIAL_SANITY_DRAFT_READ_ENABLED",
  "PRESIDENTIAL_ANALYTICS_ENABLED",
  "NEXT_PUBLIC_PRESIDENTIAL_GA_MEASUREMENT_ID",
  "PRESIDENTIAL_GOOGLE_SITE_VERIFICATION_ENABLED",
  "PRESIDENTIAL_GOOGLE_SITE_VERIFICATION",
  "SANITY_AUTH_TOKEN",
];

const deployCommandPatterns = [
  /\bvercel\s+--prod\b/i,
  /\bvercel\b[^\n\r]*\s--prod\b/i,
  /\bvercel\s+deploy\b/i,
  /\bvercel\s+promote\b/i,
  /\bvercel\s+alias\b/i,
];

function readIfExists(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function csvEscape(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function addCheck(rows, check, status, details) {
  rows.push({ check, status, details, public_unlock: "no" });
}

function commandExists(command) {
  const result = spawnSync(
    process.platform === "win32" ? "powershell.exe" : "sh",
    process.platform === "win32"
      ? ["-NoProfile", "-Command", `Get-Command ${command} -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source`]
      : ["-lc", `command -v ${command}`],
    { encoding: "utf8", windowsHide: true, timeout: 10000 },
  );

  return result.status === 0 && result.stdout.trim().length > 0;
}

function runVercelCommand(args) {
  const result = spawnSync("vercel", args, {
    cwd: webRoot,
    encoding: "utf8",
    windowsHide: true,
    timeout: 20000,
  });

  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function checkVercelAuthentication(vercelCliAvailable) {
  if (!vercelCliAvailable) {
    return { checked: false, authenticated: false };
  }

  const result = runVercelCommand(["whoami"]);
  return {
    checked: true,
    authenticated: result.status === 0,
  };
}

function parseProjectJson() {
  if (!existsSync(projectJsonPath)) return null;

  try {
    return JSON.parse(readIfExists(projectJsonPath));
  } catch {
    return { parseError: true };
  }
}

function isProjectId(value) {
  return typeof value === "string" && /^prj_[A-Za-z0-9]+$/.test(value);
}

function isOrgId(value) {
  return typeof value === "string" && /^(team_[A-Za-z0-9]+|[A-Za-z0-9_-]+)$/.test(value);
}

function summarizeEnvNamePresence(output) {
  return expectedProductionEnvNames.reduce((summary, name) => {
    summary[name] = output.includes(name);
    return summary;
  }, {});
}

function main() {
  const rows = [];
  const liveProviderCheck = process.env.PRESIDENTIAL_VERCEL_PROVIDER_READINESS_LIVE === "true";
  const gitignoreText = readIfExists(gitignorePath);
  const packageJsonText = readIfExists(packageJsonPath);
  const projectJson = parseProjectJson();
  const vercelCliAvailable = commandExists("vercel");
  const vercelAuthentication = checkVercelAuthentication(vercelCliAvailable);
  const deployCommandFound = deployCommandPatterns.some((pattern) => pattern.test(packageJsonText));
  const projectLinked = projectJson !== null && !projectJson.parseError;
  const projectIdValid = projectLinked && isProjectId(projectJson.projectId);
  const orgIdValid = projectLinked && isOrgId(projectJson.orgId);

  addCheck(
    rows,
    "provider.vercelCli.available",
    vercelCliAvailable ? "pass" : "pending",
    vercelCliAvailable ? "Vercel CLI command is available locally" : "Vercel CLI command is not available locally",
  );
  addCheck(
    rows,
    "provider.vercelCli.authenticated",
    vercelAuthentication.authenticated ? "pass" : "pending",
    vercelAuthentication.authenticated
      ? "Vercel CLI has local credentials; username/account details were not stored"
      : "Vercel CLI has no local credentials; run vercel login or use a token outside the repo before live provider checks",
  );
  addCheck(
    rows,
    "provider.localProjectLink.present",
    projectLinked ? "pass" : "pending",
    projectLinked ? ".vercel/project.json exists with parseable JSON" : ".vercel/project.json is not present; provider identity remains unverified locally",
  );
  addCheck(
    rows,
    "provider.localProjectLink.projectIdShape",
    projectLinked ? (projectIdValid ? "pass" : "fail") : "pending",
    projectLinked ? "projectId shape checked without printing value" : "pending until Vercel project is linked",
  );
  addCheck(
    rows,
    "provider.localProjectLink.orgIdShape",
    projectLinked ? (orgIdValid ? "pass" : "fail") : "pending",
    projectLinked ? "orgId shape checked without printing value" : "pending until Vercel project is linked",
  );
  addCheck(
    rows,
    "provider.localProjectLink.gitignored",
    gitignoreText.includes(".vercel") ? "pass" : "fail",
    ".vercel remains ignored and must not be committed",
  );
  addCheck(
    rows,
    "provider.package.noDeployCommands",
    deployCommandFound ? "fail" : "pass",
    deployCommandFound ? "production deploy/promote/alias command found" : "no production deploy/promote/alias command in package scripts",
  );
  addCheck(
    rows,
    "provider.expectedProductionEnvNames.tracked",
    expectedProductionEnvNames.length === 11 ? "pass" : "fail",
    expectedProductionEnvNames.join(", "),
  );

  let liveEnvNamePresence = null;
  let liveCheckStatus = "skipped";

  if (liveProviderCheck) {
    if (!vercelCliAvailable) {
      addCheck(rows, "provider.live.cliReady", "fail", "live provider check requested but Vercel CLI is unavailable");
      liveCheckStatus = "failed";
    } else if (!vercelAuthentication.authenticated) {
      addCheck(rows, "provider.live.cliAuthenticated", "fail", "live provider check requested but Vercel CLI is not authenticated");
      liveCheckStatus = "failed";
    } else {
      const envResult = runVercelCommand(["env", "ls", "production"]);
      liveCheckStatus = envResult.status === 0 ? "completed" : "failed";
      liveEnvNamePresence = envResult.status === 0
        ? summarizeEnvNamePresence(`${envResult.stdout}\n${envResult.stderr}`)
        : null;
      addCheck(
        rows,
        "provider.live.productionEnvNameList",
        envResult.status === 0 ? "pass" : "fail",
        envResult.status === 0
          ? "vercel env ls production completed; only expected name presence booleans were stored"
          : "vercel env ls production failed; no secret values stored",
      );
      if (liveEnvNamePresence) {
        for (const [name, present] of Object.entries(liveEnvNamePresence)) {
          addCheck(
            rows,
            `provider.live.envName.${name}`,
            present ? "pass" : "fail",
            present ? "present" : "missing",
          );
        }
      }
    }
  } else {
    addCheck(
      rows,
      "provider.liveProductionCheck",
      "pending",
      "set PRESIDENTIAL_VERCEL_PROVIDER_READINESS_LIVE=true to run sanitized live env-name presence checks",
    );
  }

  const failCount = rows.filter((row) => row.status === "fail").length;
  const pendingCount = rows.filter((row) => row.status === "pending").length;
  const passCount = rows.filter((row) => row.status === "pass").length;
  const verdict = failCount === 0
    ? pendingCount === 0
      ? "PASS_PRODUCTION_PROVIDER_READINESS_VERIFIED_NO_DEPLOY_NO_PUBLIC_UNLOCK"
      : "PASS_PRODUCTION_PROVIDER_READINESS_LOCAL_PENDING_NO_DEPLOY_NO_PUBLIC_UNLOCK"
    : "FAIL_PRODUCTION_PROVIDER_READINESS_REVIEW_REQUIRED";

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
      envLs: "Vercel CLI can list project environment variable names without exposing secret values.",
      projectLink: "Local .vercel/project.json, when present, links a directory to a Vercel project and organization.",
      deployBoundary: "This verifier never runs deploy, promote, alias, env pull, or env add commands.",
    },
    liveProviderCheck,
    liveCheckStatus,
    vercelCliAuthenticated: vercelAuthentication.authenticated,
    projectLinked,
    projectIdShapeValid: Boolean(projectIdValid),
    orgIdShapeValid: Boolean(orgIdValid),
    expectedProductionEnvNames,
    liveEnvNamePresence,
    passCount,
    pendingCount,
    failCount,
    checks: Object.fromEntries(rows.map((row) => [row.check, row.status])),
    deploymentApproved: false,
    deploymentExecuted: false,
    providerMutated: false,
    secretsPrinted: false,
    publicSeoUnlocked: false,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    rows,
  };

  writeFileSync(statusJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(
    statusMdPath,
    [
      "# Step 11 Production Provider Readiness Status",
      "",
      `Verdict: ${verdict}`,
      `Pass: ${passCount}`,
      `Pending: ${pendingCount}`,
      `Fail: ${failCount}`,
      "",
      "This verifier checks provider readiness state only. It does not deploy, promote, alias, pull env files, create env values, print secrets, publish routes, or unlock public SEO.",
      "",
    ].join("\n"),
  );

  if (failCount > 0) {
    console.error(verdict);
    console.error(`Pass: ${passCount}; pending: ${pendingCount}; fail: ${failCount}`);
    process.exit(1);
  }

  console.log(verdict);
  console.log(`Pass: ${passCount}; pending: ${pendingCount}; fail: ${failCount}`);
}

main();
