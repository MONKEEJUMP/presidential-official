import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const docsResultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "401-step11-production-canonical-host-results.csv",
);
const workRoot = path.join(root, "sources", "spud", "work", "step11-production-canonical-host");
const statusJsonPath = path.join(workRoot, "step11-production-canonical-host-status.json");
const statusMdPath = path.join(workRoot, "step11-production-canonical-host-status.md");

const proxyPath = path.join(webRoot, "src", "proxy.ts");
const schemaConstantsPath = path.join(webRoot, "src", "lib", "seo", "schema", "constants.ts");
const deploymentProtectionPath = path.join(webRoot, "scripts", "presidential-deployment-protection-qa.mjs");
const packageJsonPath = path.join(webRoot, "package.json");

function readIfExists(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
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
}

function main() {
  const rows = [];
  const proxyText = readIfExists(proxyPath);
  const schemaConstantsText = readIfExists(schemaConstantsPath);
  const deploymentProtectionText = readIfExists(deploymentProtectionPath);
  const packageJsonText = readIfExists(packageJsonPath);

  addCheck(
    rows,
    "canonical.schemaOrigin.apexHttps",
    schemaConstantsText.includes('PRODUCTION_ORIGIN = "https://presidentialmoonrocks.com"'),
    "schema constants lock the canonical public origin to the HTTPS apex host",
  );
  addCheck(
    rows,
    "canonical.proxyApexConstant.present",
    proxyText.includes('canonicalHostname = "presidentialmoonrocks.com"'),
    "proxy uses the same apex host as the runtime canonical redirect target",
  );
  addCheck(
    rows,
    "canonical.proxyWwwRedirect.present",
    proxyText.includes('"www.presidentialmoonrocks.com"') &&
      proxyText.includes("NextResponse.redirect") &&
      proxyText.includes("308"),
    "proxy redirects the www host to the canonical apex with a permanent redirect",
  );
  addCheck(
    rows,
    "canonical.proxyHttpApexRedirect.present",
    proxyText.includes('forwardedProto === "http"') &&
      proxyText.includes('url.protocol = "https:"'),
    "proxy defensively redirects HTTP apex traffic to HTTPS apex",
  );
  addCheck(
    rows,
    "canonical.proxyNoLocalhostRedirect",
    !/localhost|127\.0\.0\.1/.test(proxyText),
    "canonical redirect logic does not force local development hosts to production",
  );
  addCheck(
    rows,
    "canonical.deploymentVerifierAllowsProxyRedirect",
    deploymentProtectionText.includes("vercelConfig.absentOrNoRoutingOverrides"),
    "deployment verifier still blocks provider-level route overrides while allowing app-level canonical host defense",
  );
  addCheck(
    rows,
    "canonical.packageScript.wired",
    packageJsonText.includes("production:canonical-host:verify"),
    "package scripts wire this canonical-host verifier into the production readiness lane",
  );
  addCheck(
    rows,
    "canonical.noPublicUnlockSignals",
    !/APPROVED_ROUTE_PUBLICATIONS\s*=\s*\[[\s\S]*routePublicationStatus:\s*"approved_public"/.test(
      readIfExists(path.join(webRoot, "src", "lib", "seo", "source-records", "route-publication.ts")),
    ),
    "canonical-host redirect work does not add approved route publications",
  );

  const passCount = rows.filter((row) => row.status === "pass").length;
  const failCount = rows.length - passCount;
  const verdict =
    failCount === 0
      ? "PASS_PRODUCTION_CANONICAL_HOST_NO_DEPLOY_NO_PUBLIC_UNLOCK"
      : "FAIL_PRODUCTION_CANONICAL_HOST_REVIEW_REQUIRED";

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
    canonicalHost: "https://presidentialmoonrocks.com",
    redirectedHosts: ["https://www.presidentialmoonrocks.com", "http://presidentialmoonrocks.com"],
    passCount,
    failCount,
    deploymentExecuted: false,
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
      "# Step 11 Production Canonical Host Status",
      "",
      `Verdict: ${verdict}`,
      `Checks: ${passCount}/${rows.length}`,
      "",
      "This verifier proves canonical host redirect readiness only. It does not deploy, publish routes, submit a sitemap, or unlock public SEO.",
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
