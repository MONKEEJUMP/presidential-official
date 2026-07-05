import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const docsResultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "243-step10f-dependency-advisory-qa-results.csv",
);
const workRoot = path.join(root, "sources", "spud", "work", "step10f-dependency-advisory-qa");
const statusJsonPath = path.join(workRoot, "step10f-dependency-advisory-status.json");
const statusMdPath = path.join(workRoot, "step10f-dependency-advisory-status.md");
const auditJsonPath = path.join(workRoot, "npm-audit-omit-dev-step10f.json");

const acceptedAdvisoryKeys = new Set(["next", "postcss"]);
const acceptedGithubAdvisory = "GHSA-qx2v-qp2m-jg93";
const acceptedPostcssPatchedVersion = "8.5.10";
const forbiddenScriptPattern = /\bnpm\s+audit\s+fix\s+--force\b/i;
const publicUnlockPattern =
  /\b(?:publicSeoUnlocked|public_seo_unlocked|routePublicationApproved|route_publication_approved|sitemapUnlocked|sitemap_unlocked|indexabilityUnlocked|indexability_unlocked|deploymentApproved|deployment_approved)\s*:\s*true\b|public_unlock\s*[:=]\s*["']yes["']|SAFE_TO_PUBLISH/i;
const textExtensions = new Set([".cmd", ".cjs", ".js", ".json", ".mjs", ".ps1", ".sh", ".ts", ".tsx", ".yaml", ".yml"]);

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

function versionParts(version) {
  return String(version)
    .split(".")
    .slice(0, 3)
    .map((part) => Number.parseInt(part.replace(/[^\d].*$/, ""), 10) || 0);
}

function versionGte(version, minimum) {
  const current = versionParts(version);
  const floor = versionParts(minimum);
  for (let index = 0; index < 3; index += 1) {
    if (current[index] > floor[index]) return true;
    if (current[index] < floor[index]) return false;
  }
  return true;
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

    if (path.basename(currentPath) === "presidential-dependency-advisory-qa.mjs") return;
    if (textExtensions.has(path.extname(currentPath))) {
      files.push(currentPath);
    }
  }

  walk(rootPath);
  return files;
}

function findForbiddenAuditFixMatches() {
  const scanRoots = [
    path.join(webRoot, "package.json"),
    path.join(webRoot, "scripts"),
    path.join(root, ".github"),
    path.join(webRoot, ".github"),
  ];
  const files = [];

  for (const scanRoot of scanRoots) {
    if (!existsSync(scanRoot)) continue;
    const stat = statSync(scanRoot);
    if (stat.isDirectory()) {
      files.push(...walkTextFiles(scanRoot));
    } else {
      files.push(scanRoot);
    }
  }

  const matches = [];
  for (const file of files) {
    const lines = readIfExists(file).split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      if (forbiddenScriptPattern.test(line)) {
        matches.push(`${rel(file)}:${index + 1}:${line.trim()}`);
      }
    }
  }

  return matches;
}

function findPublicUnlockSignalMatches() {
  const scanRoots = [
    path.join(webRoot, "package.json"),
    path.join(webRoot, "scripts"),
    path.join(root, ".github"),
    path.join(webRoot, ".github"),
  ];
  const files = [];

  for (const scanRoot of scanRoots) {
    if (!existsSync(scanRoot)) continue;
    const stat = statSync(scanRoot);
    if (stat.isDirectory()) {
      files.push(...walkTextFiles(scanRoot));
    } else if (path.basename(scanRoot) !== "presidential-dependency-advisory-qa.mjs") {
      files.push(scanRoot);
    }
  }

  const matches = [];
  for (const file of files) {
    const lines = readIfExists(file).split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      if (
        /publicUnlockPattern|SAFE_TO_PUBLISH\|/.test(line) ||
        (line.includes("publicSeoUnlocked|public_seo_unlocked") && line.includes("SAFE_TO_PUBLISH"))
      ) {
        continue;
      }

      if (publicUnlockPattern.test(line)) {
        matches.push(`${rel(file)}:${index + 1}:${line.trim()}`);
      }
    }
  }

  return matches;
}

function runNpmAudit() {
  const auditCommand =
    process.platform === "win32"
      ? { command: "cmd.exe", args: ["/d", "/s", "/c", "npm audit --omit=dev --json"] }
      : { command: "npm", args: ["audit", "--omit=dev", "--json"] };

  const result = spawnSync(auditCommand.command, auditCommand.args, {
    cwd: webRoot,
    encoding: "utf8",
    shell: false,
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  mkdirSync(workRoot, { recursive: true });
  writeFileSync(auditJsonPath, output);

  let parsed = null;
  try {
    parsed = JSON.parse(output);
  } catch (error) {
    parsed = { parseError: error instanceof Error ? error.message : String(error), rawOutput: output };
  }

  return {
    status: result.status,
    error: result.error ? result.error.message : null,
    parsed,
  };
}

function loadPackageVersions() {
  function packageVersion(packagePath) {
    try {
      return JSON.parse(readFileSync(packagePath, "utf8")).version;
    } catch {
      return null;
    }
  }

  const packageJson = JSON.parse(readIfExists(path.join(webRoot, "package.json")));
  return {
    packageNext: packageJson.dependencies?.next ?? null,
    hasOverrides: Object.hasOwn(packageJson, "overrides"),
    installedNext: packageVersion(path.join(webRoot, "node_modules", "next", "package.json")),
    vendoredPostcss: packageVersion(path.join(webRoot, "node_modules", "next", "node_modules", "postcss", "package.json")),
    rootPostcss: packageVersion(path.join(webRoot, "node_modules", "postcss", "package.json")),
  };
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
  const audit = runNpmAudit();
  const versions = loadPackageVersions();
  const vulnerabilities = audit.parsed?.vulnerabilities ?? {};
  const vulnerabilityKeys = Object.keys(vulnerabilities);
  const vulnerabilityCounts = audit.parsed?.metadata?.vulnerabilities ?? {};
  const postcssVulnerability = vulnerabilities.postcss;
  const nextVulnerability = vulnerabilities.next;
  const postcssVia = Array.isArray(postcssVulnerability?.via) ? postcssVulnerability.via : [];
  const postcssAdvisory = postcssVia.find((entry) => typeof entry === "object" && entry?.url?.includes(acceptedGithubAdvisory));
  const destructiveFix = postcssVulnerability?.fixAvailable ?? nextVulnerability?.fixAvailable;
  const forbiddenAuditFixMatches = findForbiddenAuditFixMatches();
  const publicUnlockSignalMatches = findPublicUnlockSignalMatches();
  const cleanAudit = Number(vulnerabilityCounts.total ?? 0) === 0;
  const onlyAcceptedAdvisories =
    vulnerabilityKeys.length > 0 && vulnerabilityKeys.every((key) => acceptedAdvisoryKeys.has(key));
  const acceptedAdvisoryShape =
    cleanAudit ||
    (onlyAcceptedAdvisories &&
      Number(vulnerabilityCounts.total) === 2 &&
      Number(vulnerabilityCounts.moderate) === 2 &&
      Number(vulnerabilityCounts.high ?? 0) === 0 &&
      Number(vulnerabilityCounts.critical ?? 0) === 0 &&
      postcssAdvisory &&
      postcssVulnerability?.range === "<8.5.10" &&
      postcssVulnerability?.nodes?.includes("node_modules/next/node_modules/postcss") &&
      nextVulnerability?.via?.includes("postcss"));

  const checks = [
    addCheck(rows, "npmAudit.completed", audit.status === 0 || audit.status === 1, `npm audit exit ${audit.status}${audit.error ? `: ${audit.error}` : ""}`),
    addCheck(rows, "npmAudit.jsonParsed", !audit.parsed?.parseError, audit.parsed?.parseError ?? "audit JSON parsed"),
    addCheck(rows, "npmAudit.noHighCritical", Number(vulnerabilityCounts.high ?? 0) === 0 && Number(vulnerabilityCounts.critical ?? 0) === 0, JSON.stringify(vulnerabilityCounts)),
    addCheck(rows, "npmAudit.cleanOrOnlyAcceptedAdvisories", cleanAudit || onlyAcceptedAdvisories, cleanAudit ? "0 vulnerabilities" : `keys: ${vulnerabilityKeys.join(", ")}`),
    addCheck(rows, "acceptedPostcssAdvisory.matchesShape", acceptedAdvisoryShape, cleanAudit ? "no active accepted advisory" : "active advisory matches accepted Next/PostCSS chain"),
    addCheck(rows, "directPostcss.safe", versions.rootPostcss ? versionGte(versions.rootPostcss, acceptedPostcssPatchedVersion) : false, `root postcss ${versions.rootPostcss ?? "missing"}`),
    addCheck(rows, "vendoredPostcss.tracked", cleanAudit || (versions.vendoredPostcss && !versionGte(versions.vendoredPostcss, acceptedPostcssPatchedVersion)), `next vendored postcss ${versions.vendoredPostcss ?? "missing"}`),
    addCheck(rows, "next.versionTracked", versions.packageNext === versions.installedNext && Boolean(versions.installedNext), `package next ${versions.packageNext}; installed next ${versions.installedNext}`),
    addCheck(rows, "destructiveAuditFix.rejected", cleanAudit || (destructiveFix?.name === "next" && destructiveFix?.version === "9.3.3" && destructiveFix?.isSemVerMajor === true), cleanAudit ? "no audit fix needed" : JSON.stringify(destructiveFix)),
    addCheck(rows, "package.noUnreviewedOverrides", !versions.hasOverrides, "package.json has no overrides field"),
    addCheck(rows, "scripts.noAuditFixForce", forbiddenAuditFixMatches.length === 0, forbiddenAuditFixMatches.length ? forbiddenAuditFixMatches.join(" | ") : "no npm audit fix --force in package scripts or automation"),
    addCheck(rows, "noPublicUnlockSignals", publicUnlockSignalMatches.length === 0, publicUnlockSignalMatches.length ? publicUnlockSignalMatches.join(" | ") : "dependency advisory QA found no deployment, publication, sitemap inclusion, route publication, or public SEO unlock signals"),
  ];

  const verdict = checks.every(Boolean)
    ? cleanAudit
      ? "PASS_DEPENDENCY_ADVISORY_QA_CLEAN_NO_PUBLIC_UNLOCK"
      : "PASS_DEPENDENCY_ADVISORY_QA_ACCEPTED_WITH_TRACKING_NO_PUBLIC_UNLOCK"
    : "FAIL_DEPENDENCY_ADVISORY_QA_REVIEW_REQUIRED";

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
    auditStatus: audit.status,
    auditJsonPath,
    vulnerabilityCounts,
    vulnerabilityKeys,
    versions,
    acceptedAdvisory: {
      id: acceptedGithubAdvisory,
      package: "postcss",
      vulnerableRange: "<8.5.10",
      patchedVersion: acceptedPostcssPatchedVersion,
      currentPath: "node_modules/next/node_modules/postcss",
    },
    destructiveFix,
    forbiddenAuditFixMatches,
    publicUnlockSignalMatches,
    checks: Object.fromEntries(rows.map((row) => [row.check, row.status === "pass"])),
    publicSeoUnlocked: false,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    deploymentApproved: false,
    packagesChanged: false,
    guardrail:
      "Step 10F verifies dependency advisory posture only. It does not run npm audit fix, install packages, change dependencies, deploy, import data, publish routes, or unlock public SEO.",
  };

  mkdirSync(workRoot, { recursive: true });
  writeFileSync(statusJsonPath, JSON.stringify(payload, null, 2));
  writeFileSync(
    statusMdPath,
    [
      "# Step 10F Dependency Advisory Status",
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
      "Final signal: `STEP_10F_DEPENDENCY_ADVISORY_QA_COMPLETE_NO_PUBLIC_UNLOCK`",
    ].join("\n") + "\n",
  );

  console.log(JSON.stringify(payload, null, 2));
  process.exitCode = verdict.startsWith("PASS_") ? 0 : 1;
}

main();
