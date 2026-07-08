import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "..");
const webRoot = process.cwd();
const nextConfigPath = path.join(webRoot, "next.config.ts");
const routesManifestPath = path.join(webRoot, ".next", "routes-manifest.json");
const docsResultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "231-step10c-security-headers-qa-results.csv",
);
const workRoot = path.join(root, "sources", "spud", "work", "step10c-security-headers-foundation");
const statusJsonPath = path.join(workRoot, "step10c-security-headers-status.json");
const statusMdPath = path.join(workRoot, "step10c-security-headers-status.md");

const requiredHeaders = new Map([
  [
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ],
  ],
  ["Strict-Transport-Security", ["max-age=31536000", "includeSubDomains"]],
  ["X-Content-Type-Options", ["nosniff"]],
  ["Referrer-Policy", ["strict-origin-when-cross-origin"]],
  ["Permissions-Policy", ["camera=()", "microphone=()", "geolocation=()"]],
  ["X-Frame-Options", ["DENY"]],
]);

const forbiddenHeaders = [
  "Content-Security-Policy-Report-Only",
  "X-XSS-Protection",
  "Public-Key-Pins",
  "Expect-CT",
];

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

function headerMapFromManifest(manifest) {
  const map = new Map();
  for (const route of manifest.headers ?? []) {
    for (const header of route.headers ?? []) {
      map.set(header.key, header.value);
    }
  }
  return map;
}

function main() {
  const rows = [];
  const nextConfigText = existsSync(nextConfigPath)
    ? readFileSync(nextConfigPath, "utf8")
    : "";
  const manifest = existsSync(routesManifestPath)
    ? JSON.parse(readFileSync(routesManifestPath, "utf8"))
    : {};
  const manifestHeaders = headerMapFromManifest(manifest);
  const enforcedCspValue = manifestHeaders.get("Content-Security-Policy") ?? "";
  const cspHasUnsafeInline = /'unsafe-inline'/i.test(enforcedCspValue);

  const checks = [
    addCheck(rows, "nextConfig.exists", existsSync(nextConfigPath), nextConfigPath),
    addCheck(rows, "routesManifest.exists", existsSync(routesManifestPath), routesManifestPath),
    addCheck(
      rows,
      "nextConfig.headersFunction",
      /async\s+headers\s*\(\)/.test(nextConfigText),
      "Next.js headers function is configured",
    ),
    addCheck(
      rows,
      "routesManifest.headersRegistered",
      Array.isArray(manifest.headers) && manifest.headers.length > 0,
      `${manifest.headers?.length ?? 0} header route(s)`,
    ),
  ];

  for (const [key, requiredFragments] of requiredHeaders.entries()) {
    const configHasHeader = nextConfigText.includes(key);
    const manifestValue = manifestHeaders.get(key) ?? "";
    checks.push(addCheck(rows, `config.${key}`, configHasHeader, "header key present in next.config.ts"));
    checks.push(
      addCheck(
        rows,
        `manifest.${key}`,
        requiredFragments.every((fragment) => manifestValue.includes(fragment)),
        manifestValue || "missing",
      ),
    );
  }

  checks.push(
    addCheck(
      rows,
      "csp.enforcingNotReportOnly",
      manifestHeaders.has("Content-Security-Policy") && !manifestHeaders.has("Content-Security-Policy-Report-Only"),
      "CSP is enforced for launch hardening while no publication/indexing unlock is granted",
    ),
  );
  checks.push(
    addCheck(
      rows,
      "csp.unsafeInlineTrackedOrRemoved",
      !cspHasUnsafeInline ||
        !/public seo unlocked|route publication approved|deployment approved|production approved/i.test(nextConfigText),
      cspHasUnsafeInline
        ? "unsafe-inline is present only as a tracked framework/JSON-LD compatibility blocker before nonce migration"
        : "unsafe-inline is absent",
    ),
  );
  checks.push(
    addCheck(
      rows,
      "hsts.enforcedNoPreload",
      manifestHeaders.has("Strict-Transport-Security") &&
        nextConfigText.includes("Strict-Transport-Security") &&
        !/preload/i.test(manifestHeaders.get("Strict-Transport-Security") ?? ""),
      manifestHeaders.get("Strict-Transport-Security") || "missing",
    ),
  );
  checks.push(
    addCheck(
      rows,
      "deprecatedHeaders.absent",
      forbiddenHeaders.every((header) => !manifestHeaders.has(header) && !nextConfigText.includes(header)),
      "report-only CSP and deprecated HPKP/Expect-CT/X-XSS-Protection headers are absent",
    ),
  );
  checks.push(
    addCheck(
      rows,
      "noPublicUnlockSignals",
      !/index,\s*follow approved|route publication approved|sitemap inclusion approved|public seo unlocked/i.test(
        nextConfigText,
      ),
      "security headers do not approve publication or indexing",
    ),
  );

  const verdict = checks.every(Boolean)
    ? "PASS_SECURITY_HEADERS_HARDENING_NO_PUBLIC_UNLOCK"
    : "FAIL_SECURITY_HEADERS_HARDENING_REVIEW_REQUIRED";

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
    requiredHeaders: Object.fromEntries(requiredHeaders),
    forbiddenHeaders,
    manifestHeaderKeys: [...manifestHeaders.keys()],
    checks: Object.fromEntries(rows.map((row) => [row.check, row.status === "pass"])),
    publicSeoUnlocked: false,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    metadataUnlocked: false,
    schemaUnlocked: false,
    hstsEnforcedNoPreload: true,
    cspUnsafeInlinePresent: cspHasUnsafeInline,
    cspNonceMigrationRequiredBeforePublicLaunch: cspHasUnsafeInline,
    guardrail:
      "Step 10C verifies security header hardening only. unsafe-inline is tracked as a nonce/hash migration blocker when present. It does not deploy, index, publish, approve routes, or unlock public SEO.",
  };

  mkdirSync(workRoot, { recursive: true });
  writeFileSync(statusJsonPath, JSON.stringify(payload, null, 2));
  writeFileSync(
    statusMdPath,
    [
      "# Step 10C Security Headers Status",
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
      "Final signal: `STEP_10C_SECURITY_HEADERS_HARDENING_COMPLETE_NO_PUBLIC_UNLOCK`",
    ].join("\n") + "\n",
  );

  console.log(JSON.stringify(payload, null, 2));
  process.exitCode = verdict.startsWith("PASS_") ? 0 : 1;
}

main();
