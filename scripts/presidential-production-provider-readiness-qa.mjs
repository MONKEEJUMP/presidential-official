import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { expectedProductionEnvNames } from "./presidential-production-env-contract.mjs";

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
const vercelTokenEnv = "VERCEL_TOKEN";
const vercelProjectIdEnv = "VERCEL_PROJECT_ID";
const vercelProjectNameEnv = "VERCEL_PROJECT_NAME";
const vercelTeamIdEnv = "VERCEL_TEAM_ID";
const liveReadEnv = "PRESIDENTIAL_VERCEL_PROVIDER_READINESS_LIVE_READ";
let providerReadOperationCount = 0;

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

function hasVercelToken() {
  return (process.env[vercelTokenEnv]?.trim() ?? "").length > 0;
}

function runVercelCommand(args) {
  providerReadOperationCount += 1;
  const command = process.platform === "win32" ? "cmd.exe" : "vercel";
  const commandArgs = process.platform === "win32"
    ? ["/d", "/s", "/c", ["vercel", ...args].join(" ")]
    : args;
  const result = spawnSync(command, commandArgs, {
    cwd: webRoot,
    encoding: "utf8",
    shell: false,
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
    return { checked: false, authenticated: false, tokenAvailable: false, method: "none" };
  }

  const tokenAvailable = hasVercelToken();
  const result = runVercelCommand(["whoami"]);
  return {
    checked: true,
    authenticated: result.status === 0,
    tokenAvailable,
    method: result.status === 0 ? (tokenAvailable ? "token" : "local") : "none",
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

function getRestProjectIdentifier(projectJson) {
  if (projectJson && !projectJson.parseError && isProjectId(projectJson.projectId)) {
    return { source: "project_json", value: projectJson.projectId };
  }

  const projectId = process.env[vercelProjectIdEnv]?.trim();
  if (projectId && isProjectId(projectId)) {
    return { source: vercelProjectIdEnv, value: projectId };
  }

  const projectName = process.env[vercelProjectNameEnv]?.trim();
  if (projectName && /^[a-z0-9][a-z0-9-]{0,99}$/i.test(projectName)) {
    return { source: vercelProjectNameEnv, value: projectName };
  }

  return { source: "none", value: "" };
}

function getRestTeamIdentifier(projectJson) {
  const envTeamId = process.env[vercelTeamIdEnv]?.trim();
  if (envTeamId && isOrgId(envTeamId)) {
    return { source: vercelTeamIdEnv, value: envTeamId };
  }

  if (projectJson && !projectJson.parseError && isOrgId(projectJson.orgId)) {
    return { source: "project_json", value: projectJson.orgId };
  }

  return { source: "none", value: "" };
}

function summarizeEnvNamePresence(output) {
  return expectedProductionEnvNames.reduce((summary, name) => {
    summary[name] = output.includes(name);
    return summary;
  }, {});
}

function envRecordTargetsProduction(record) {
  if (!record || typeof record !== "object") return false;
  const target = record.target;
  if (Array.isArray(target)) return target.includes("production");
  if (typeof target === "string") return target === "production";
  if (record.environment === "production") return true;
  return false;
}

async function fetchVercelProductionEnvNamePresence(projectIdentifier, teamIdentifier) {
  const vercelBearer = process.env[vercelTokenEnv]?.trim();
  if (!vercelBearer) {
    return { status: 0, ok: false, presence: null };
  }

  const url = new URL(
    `https://api.vercel.com/v10/projects/${encodeURIComponent(projectIdentifier)}/env`,
  );
  url.searchParams.set("decrypt", "false");
  if (teamIdentifier) {
    url.searchParams.set("teamId", teamIdentifier);
  }

  providerReadOperationCount += 1;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${vercelBearer}`,
      "Content-Type": "application/json",
    },
  });
  const body = await response.json().catch(() => ({}));
  const records = Array.isArray(body.envs) ? body.envs : [];
  const productionNames = new Set(
    records
      .filter(envRecordTargetsProduction)
      .map((record) => record.key)
      .filter((key) => typeof key === "string"),
  );

  return {
    status: response.status,
    ok: response.ok,
    presence: expectedProductionEnvNames.reduce((summary, name) => {
      summary[name] = productionNames.has(name);
      return summary;
    }, {}),
  };
}

async function main() {
  const rows = [];
  const liveProviderCheck = process.env[liveReadEnv] === "true";
  const noArtifactMode = process.env.PRESIDENTIAL_QA_NO_ARTIFACTS === "true";
  const gitignoreText = readIfExists(gitignorePath);
  const packageJsonText = readIfExists(packageJsonPath);
  const projectJson = parseProjectJson();
  const restProjectIdentifier = getRestProjectIdentifier(projectJson);
  const restTeamIdentifier = getRestTeamIdentifier(projectJson);
  const vercelCliAvailable = commandExists("vercel");
  const vercelAuthentication = liveProviderCheck
    ? checkVercelAuthentication(vercelCliAvailable)
    : {
        checked: false,
        authenticated: false,
        tokenAvailable: hasVercelToken(),
        method: "not_checked",
      };
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
      ? `Vercel CLI authentication succeeded via ${vercelAuthentication.method}; account details were not stored`
      : liveProviderCheck
        ? "Vercel CLI authentication was requested but did not succeed"
        : `Vercel authentication was not attempted; set ${liveReadEnv}=true for an explicit read-only provider check`,
  );
  addCheck(
    rows,
    "provider.vercelCli.tokenAvailable",
    vercelAuthentication.tokenAvailable ? "pass" : "pending",
    vercelAuthentication.tokenAvailable
      ? "VERCEL_TOKEN is present in process env; value was not stored or printed"
      : "VERCEL_TOKEN is not present in process env; local login is still acceptable",
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
    "provider.rest.projectIdentifierAvailable",
    restProjectIdentifier.value ? "pass" : "pending",
    restProjectIdentifier.value
      ? `Vercel REST project identifier available from ${restProjectIdentifier.source}; value was not stored`
      : "provide VERCEL_PROJECT_ID or VERCEL_PROJECT_NAME outside the repo, or link .vercel/project.json",
  );
  addCheck(
    rows,
    "provider.rest.teamIdentifierAvailable",
    restTeamIdentifier.value ? "pass" : "pending",
    restTeamIdentifier.value
      ? `Vercel REST team identifier available from ${restTeamIdentifier.source}; value was not stored`
      : "team identifier is optional for personal projects; use VERCEL_TEAM_ID for team-owned projects",
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
    expectedProductionEnvNames.length === 14 &&
      new Set(expectedProductionEnvNames).size === expectedProductionEnvNames.length
      ? "pass"
      : "fail",
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
    } else if (vercelAuthentication.tokenAvailable && restProjectIdentifier.value) {
      const envResult = await fetchVercelProductionEnvNamePresence(
        restProjectIdentifier.value,
        restTeamIdentifier.value,
      );
      liveCheckStatus = envResult.ok ? "completed" : "failed";
      liveEnvNamePresence = envResult.ok ? envResult.presence : null;
      addCheck(
        rows,
        "provider.live.productionEnvNameList",
        envResult.ok ? "pass" : "fail",
        envResult.ok
          ? "Vercel REST env list completed; only expected production name presence booleans were stored"
          : `Vercel REST env list failed with status ${envResult.status}; no secret values stored`,
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
      `set ${liveReadEnv}=true to run sanitized live env-name presence checks`,
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

  if (!noArtifactMode) {
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
  }

  const payload = {
    verdict,
    officialVercelPosture: {
      envLs: "Vercel CLI can list project environment variable names without exposing secret values.",
      restEnvLs: "Vercel REST API can retrieve project environment variable metadata by project id or name with bearer-token authentication.",
      projectLink: "Local .vercel/project.json, when present, links a directory to a Vercel project and organization.",
      deployBoundary: "This verifier never runs deploy, promote, alias, env pull, or env add commands.",
    },
    liveProviderCheck,
    liveCheckStatus,
    liveReadEnv,
    providerReadOperationCount,
    zeroProviderCallsByDefault:
      liveProviderCheck || providerReadOperationCount === 0,
    artifactWritesExecuted: !noArtifactMode,
    vercelCliAuthenticated: vercelAuthentication.authenticated,
    vercelCliAuthMethod: vercelAuthentication.method,
    vercelTokenAvailable: vercelAuthentication.tokenAvailable,
    restProjectIdentifierSource: restProjectIdentifier.source,
    restProjectIdentifierAvailable: Boolean(restProjectIdentifier.value),
    restTeamIdentifierSource: restTeamIdentifier.source,
    restTeamIdentifierAvailable: Boolean(restTeamIdentifier.value),
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

  if (!noArtifactMode) {
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
  }

  if (failCount > 0) {
    console.error(verdict);
    console.error(`Pass: ${passCount}; pending: ${pendingCount}; fail: ${failCount}`);
    process.exit(1);
  }

  console.log(verdict);
  console.log(`Pass: ${passCount}; pending: ${pendingCount}; fail: ${failCount}`);
  console.log(
    `Provider read operations: ${providerReadOperationCount}; artifact writes: ${noArtifactMode ? 0 : 1}`,
  );
}

main().catch((error) => {
  console.error("FAIL_PRODUCTION_PROVIDER_READINESS_EXCEPTION");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
