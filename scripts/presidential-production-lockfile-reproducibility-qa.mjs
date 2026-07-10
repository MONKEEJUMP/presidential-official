import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const packageJsonPath = path.join(webRoot, "package.json");
const packageLockPath = path.join(webRoot, "package-lock.json");
const workRoot = path.join(root, "sources", "spud", "work", "step11-production-lockfile-reproducibility");
const statusJsonPath = path.join(workRoot, "step11-production-lockfile-reproducibility-status.json");
const expectedNodeEngine = ">=24.13.0 <25";

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function addCheck(rows, check, passed, details) {
  rows.push({
    check,
    status: passed ? "pass" : "fail",
    details,
    public_unlock: "no",
  });
}

function runNpmCiDryRun() {
  const command = process.platform === "win32" ? "cmd.exe" : "npm";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", "npm ci --dry-run --ignore-scripts"]
    : ["ci", "--dry-run", "--ignore-scripts"];
  const result = spawnSync(command, args, {
    cwd: webRoot,
    encoding: "utf8",
    shell: false,
    windowsHide: true,
    timeout: 180000,
  });

  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error?.message ?? null,
  };
}

const rows = [];
const packageExists = existsSync(packageJsonPath);
const lockExists = existsSync(packageLockPath);
const packageJson = packageExists ? readJson(packageJsonPath) : {};
const packageLock = lockExists ? readJson(packageLockPath) : {};
const npmCiResult = lockExists && packageExists ? runNpmCiDryRun() : null;
const dryRunOutput = `${npmCiResult?.stdout ?? ""}\n${npmCiResult?.stderr ?? ""}`;
const deployOrProviderActionPattern =
  /\b(?:vercel\s+(?:deploy|promote|alias|env\s+(?:add|rm|remove|pull))|sanity\s+deploy|sitemaps\.submit|searchconsole|webmasters)\b/i;
const secretLikePattern = /\b(?:[A-Z0-9_]*(?:SECRET|PASSWORD|PRIVATE_KEY|AUTH_TOKEN|API_TOKEN)[A-Z0-9_]*)\s*=\s*[^\s]+/i;

addCheck(rows, "lockfile.packageJson.exists", packageExists, packageJsonPath);
addCheck(rows, "lockfile.packageLock.exists", lockExists, packageLockPath);
addCheck(
  rows,
  "lockfile.packageNames.match",
  packageExists && lockExists && packageJson.name === packageLock.name,
  `${packageJson.name ?? "missing"} / ${packageLock.name ?? "missing"}`,
);
addCheck(
  rows,
  "lockfile.packageVersions.match",
  packageExists && lockExists && packageJson.version === packageLock.version,
  `${packageJson.version ?? "missing"} / ${packageLock.version ?? "missing"}`,
);
addCheck(
  rows,
  "lockfile.lockfileVersion.supported",
  Number(packageLock.lockfileVersion) >= 3,
  `lockfileVersion ${packageLock.lockfileVersion ?? "missing"}`,
);
addCheck(
  rows,
  "lockfile.engines.nodePinned",
  packageJson.engines?.node === expectedNodeEngine &&
    packageLock.packages?.[""]?.engines?.node === expectedNodeEngine,
  `${packageJson.engines?.node ?? "missing"} / ${packageLock.packages?.[""]?.engines?.node ?? "missing"}`,
);
addCheck(
  rows,
  "lockfile.npmCiDryRun.exitZero",
  npmCiResult?.status === 0,
  npmCiResult?.error ?? `npm ci --dry-run --ignore-scripts exited ${npmCiResult?.status ?? "not-run"}`,
);
addCheck(
  rows,
  "lockfile.npmCiDryRun.noProviderAction",
  !deployOrProviderActionPattern.test(dryRunOutput),
  "npm ci dry-run output contains no deploy/provider/search submission action signal",
);
addCheck(
  rows,
  "lockfile.npmCiDryRun.noSecretOutput",
  !secretLikePattern.test(dryRunOutput),
  "npm ci dry-run output contains no secret-like key/value output",
);

const failCount = rows.filter((row) => row.status === "fail").length;
const payload = {
  verdict: failCount === 0
    ? "PASS_PRODUCTION_LOCKFILE_REPRODUCIBILITY_NO_DEPLOY_NO_PUBLIC_UNLOCK"
    : "FAIL_PRODUCTION_LOCKFILE_REPRODUCIBILITY_REVIEW_REQUIRED",
  passCount: rows.length - failCount,
  failCount,
  nodeVersion: process.version,
  npmCiDryRunExecuted: Boolean(npmCiResult),
  npmCiDryRunExitCode: npmCiResult?.status ?? null,
  packageLockChanged: false,
  dependencyVersionsChanged: false,
  providerActionExecuted: false,
  deploymentExecuted: false,
  routePublicationApproved: false,
  sitemapUnlocked: false,
  indexabilityUnlocked: false,
  secretsPrinted: false,
  checks: rows,
};

mkdirSync(workRoot, { recursive: true });
writeFileSync(statusJsonPath, `${JSON.stringify(payload, null, 2)}\n`);

console.log(JSON.stringify(payload, null, 2));

if (failCount > 0) {
  process.exit(1);
}
