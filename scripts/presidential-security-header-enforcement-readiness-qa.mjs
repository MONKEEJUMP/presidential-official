import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "..");
const webRoot = process.cwd();
const nextConfigPath = path.join(webRoot, "next.config.ts");
const packageJsonPath = path.join(webRoot, "package.json");
const vercelJsonPath = path.join(webRoot, "vercel.json");
const routesManifestPath = path.join(webRoot, ".next", "routes-manifest.json");
const docsResultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "251-step10h-security-header-enforcement-readiness-results.csv",
);
const workRoot = path.join(
  root,
  "sources",
  "spud",
  "work",
  "step10h-security-header-enforcement-readiness",
);
const statusJsonPath = path.join(workRoot, "step10h-security-header-enforcement-readiness-status.json");
const statusMdPath = path.join(workRoot, "step10h-security-header-enforcement-readiness-status.md");

const requiredReportOnlyFragments = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
];

const deferredEnforcementSignals = [
  "Content-Security-Policy",
  "Strict-Transport-Security",
  "Reporting-Endpoints",
  "Report-To",
];

const deprecatedHeaders = ["X-XSS-Protection", "Public-Key-Pins", "Expect-CT"];

const publicUnlockPattern =
  /index,\s*follow approved|route publication approved|sitemap inclusion approved|public seo unlocked|deployment approved|production approved/i;

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

function readText(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function readManifest() {
  if (!existsSync(routesManifestPath)) {
    return {};
  }

  return JSON.parse(readFileSync(routesManifestPath, "utf8"));
}

function headerValuesFromRoutesManifest(manifest) {
  const values = new Map();
  for (const route of manifest.headers ?? []) {
    for (const header of route.headers ?? []) {
      const existing = values.get(header.key) ?? [];
      existing.push(header.value);
      values.set(header.key, existing);
    }
  }
  return values;
}

function hasHeader(headerValues, key) {
  return headerValues.has(key);
}

function getHeaderValue(headerValues, key) {
  return (headerValues.get(key) ?? []).join("\n");
}

function main() {
  const rows = [];
  const nextConfigText = readText(nextConfigPath);
  const packageJsonText = readText(packageJsonPath);
  const vercelJsonText = readText(vercelJsonPath);
  const manifest = readManifest();
  const headerValues = headerValuesFromRoutesManifest(manifest);
  const reportOnlyValue = getHeaderValue(headerValues, "Content-Security-Policy-Report-Only");
  const combinedConfigText = [nextConfigText, vercelJsonText].join("\n");

  const checks = [
    addCheck(rows, "nextConfig.exists", existsSync(nextConfigPath), nextConfigPath),
    addCheck(rows, "routesManifest.exists", existsSync(routesManifestPath), routesManifestPath),
    addCheck(
      rows,
      "routesManifest.headersRegistered",
      Array.isArray(manifest.headers) && manifest.headers.length > 0,
      `${manifest.headers?.length ?? 0} header route(s)`,
    ),
    addCheck(
      rows,
      "csp.reportOnlyPresent",
      hasHeader(headerValues, "Content-Security-Policy-Report-Only"),
      reportOnlyValue || "missing",
    ),
    addCheck(
      rows,
      "csp.reportOnlyCoreDirectives",
      requiredReportOnlyFragments.every((fragment) => reportOnlyValue.includes(fragment)),
      reportOnlyValue || "missing",
    ),
    addCheck(
      rows,
      "csp.enforcementDeferred",
      !hasHeader(headerValues, "Content-Security-Policy") && !/\bContent-Security-Policy\b/.test(vercelJsonText),
      "Enforcing CSP remains deferred until final assets, scripts, connect domains, and review are approved",
    ),
    addCheck(
      rows,
      "csp.noUnsafeEvalOrInline",
      !/unsafe-eval|unsafe-inline/i.test(reportOnlyValue),
      "Report-only CSP does not add unsafe-eval or unsafe-inline",
    ),
    addCheck(
      rows,
      "csp.reportingEndpointDeferred",
      !hasHeader(headerValues, "Reporting-Endpoints") &&
        !hasHeader(headerValues, "Report-To") &&
        !/report-to\s+|report-uri\s+|Reporting-Endpoints|Report-To/i.test(combinedConfigText),
      "No CSP reporting endpoint is configured until an approved endpoint exists",
    ),
    addCheck(
      rows,
      "hsts.deferred",
      !hasHeader(headerValues, "Strict-Transport-Security") &&
        !/Strict-Transport-Security/i.test(combinedConfigText),
      "HSTS remains deferred until final HTTPS custom-domain posture and redirect behavior are verified",
    ),
    addCheck(
      rows,
      "hsts.noPreload",
      !/preload/i.test(getHeaderValue(headerValues, "Strict-Transport-Security")) &&
        !/hstspreload|hsts preload/i.test(combinedConfigText),
      "No HSTS preload posture exists before final domain approval",
    ),
    addCheck(
      rows,
      "deprecatedHeaders.absent",
      deprecatedHeaders.every((header) => !hasHeader(headerValues, header) && !combinedConfigText.includes(header)),
      "Deprecated security headers remain absent",
    ),
    addCheck(
      rows,
      "vercelConfig.noConflictingHeaders",
      !existsSync(vercelJsonPath) || !/"headers"\s*:/.test(vercelJsonText),
      existsSync(vercelJsonPath)
        ? "vercel.json does not define competing response headers"
        : "no vercel.json present",
    ),
    addCheck(
      rows,
      "packageScript.wired",
      /security:headers:readiness/.test(packageJsonText),
      "package.json contains security:headers:readiness",
    ),
    addCheck(
      rows,
      "noPublicUnlockSignals",
      !publicUnlockPattern.test([combinedConfigText, packageJsonText].join("\n")),
      "Header readiness does not approve deployment, route publication, sitemap inclusion, indexability, or public SEO",
    ),
  ];

  const verdict = checks.every(Boolean)
    ? "PASS_SECURITY_HEADER_ENFORCEMENT_READINESS_NO_PUBLIC_UNLOCK"
    : "FAIL_SECURITY_HEADER_ENFORCEMENT_READINESS_REVIEW_REQUIRED";

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
    officialSourcePosture: {
      nextHeaders: "Next.js headers() in next.config can set response headers for matching paths.",
      cspReportOnly:
        "CSP report-only is the correct pre-enforcement posture while assets, scripts, connect sources, and reporting endpoint are still being finalized.",
      hsts:
        "HSTS is a browser-persistent HTTPS commitment and remains deferred until final HTTPS/custom-domain and redirect posture are verified.",
    },
    manifestHeaderKeys: [...headerValues.keys()],
    reportOnlyCspFragments: requiredReportOnlyFragments,
    deferredEnforcementSignals,
    checks: Object.fromEntries(rows.map((row) => [row.check, row.status === "pass"])),
    publicSeoUnlocked: false,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    metadataUnlocked: false,
    schemaUnlocked: false,
    deploymentApproved: false,
    hstsDeferredUntilFinalDomain: true,
    enforcingCspDeferredUntilFinalAssetPolicy: true,
    cspReportingEndpointDeferredUntilApprovedEndpoint: true,
    guardrail:
      "Step 10H is security-header enforcement readiness only. It keeps enforcing CSP, CSP reporting endpoints, and HSTS blocked until final assets, services, domains, redirects, and launch approvals exist.",
  };

  mkdirSync(workRoot, { recursive: true });
  writeFileSync(statusJsonPath, JSON.stringify(payload, null, 2));
  writeFileSync(
    statusMdPath,
    [
      "# Step 10H Security Header Enforcement Readiness Status",
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
      "Final signal: `STEP_10H_SECURITY_HEADER_ENFORCEMENT_READINESS_COMPLETE_NO_PUBLIC_UNLOCK`",
    ].join("\n") + "\n",
  );

  console.log(JSON.stringify(payload, null, 2));
  process.exitCode = verdict.startsWith("PASS_") ? 0 : 1;
}

main();
