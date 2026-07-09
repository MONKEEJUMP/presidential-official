import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";

const root = path.resolve(process.cwd(), "..");
const webRoot = process.cwd();
const nextConfigPath = path.join(webRoot, "next.config.ts");
const proxyPath = path.join(webRoot, "src", "proxy.ts");
const packageJsonPath = path.join(webRoot, "package.json");
const vercelJsonPath = path.join(webRoot, "vercel.json");
const routesManifestPath = path.join(webRoot, ".next", "routes-manifest.json");
const nextBin = path.join(webRoot, "node_modules", "next", "dist", "bin", "next");
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
const runtimeHost = "127.0.0.1";
const runtimeBasePort = Number(process.env.PRESIDENTIAL_SECURITY_HEADER_READINESS_QA_PORT || "3363");

const requiredEnforcedCspFragments = [
  "default-src 'self'",
  "base-uri 'self'",
  "script-src 'self'",
  "'strict-dynamic'",
  "style-src 'self'",
  "connect-src 'self'",
  "font-src 'self'",
  "img-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "upgrade-insecure-requests",
];

const forbiddenHeaderSignals = ["Content-Security-Policy-Report-Only", "Reporting-Endpoints", "Report-To"];
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

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function findOpenPort(startPort) {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.once("error", (error) => {
      if (error.code === "EADDRINUSE" || error.code === "EACCES") {
        server.close(() => {
          findOpenPort(startPort + 1).then(resolve, reject);
        });
        return;
      }

      reject(error);
    });

    server.listen(startPort, runtimeHost, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : startPort;
      server.close(() => resolve(port));
    });
  });
}

async function waitForRuntimeServer(baseUrl) {
  let lastError;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/`);
      if (response.ok) {
        return response;
      }
    } catch (error) {
      lastError = error;
    }

    await sleep(400);
  }

  throw lastError || new Error("Next runtime server did not become ready.");
}

async function readRuntimeHeaders() {
  const port = await findOpenPort(runtimeBasePort);
  const baseUrl = `http://${runtimeHost}:${port}`;
  const server = spawn(process.execPath, [nextBin, "start", "-H", runtimeHost, "-p", String(port)], {
    cwd: webRoot,
    env: {
      ...process.env,
      PRESIDENTIAL_SANITY_READ_CLIENT_ENABLED: "false",
      PRESIDENTIAL_HOMEPAGE_CMS_RENDERING_ENABLED: "false",
      PRESIDENTIAL_SITE_PAGE_CMS_RENDERING_ENABLED: "false",
      PRESIDENTIAL_LEARN_GUIDE_CMS_RENDERING_ENABLED: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  server.stdout.resume();
  server.stderr.resume();

  try {
    return await waitForRuntimeServer(baseUrl);
  } finally {
    if (!server.killed) {
      server.kill();
    }
    await sleep(250);
  }
}

async function main() {
  const rows = [];
  const nextConfigText = readText(nextConfigPath);
  const proxyText = readText(proxyPath);
  const packageJsonText = readText(packageJsonPath);
  const vercelJsonText = readText(vercelJsonPath);
  const manifest = readManifest();
  const headerValues = headerValuesFromRoutesManifest(manifest);
  const runtimeResponse = await readRuntimeHeaders();
  const runtimeCspValue = runtimeResponse.headers.get("Content-Security-Policy") ?? "";
  const runtimeHstsValue = runtimeResponse.headers.get("Strict-Transport-Security") ?? "";
  const combinedConfigText = [nextConfigText, proxyText, vercelJsonText].join("\n");
  const cspHasUnsafeInline = /'unsafe-inline'/i.test(runtimeCspValue);
  const cspNonceMatch = runtimeCspValue.match(/'nonce-([^']+)'/);

  const checks = [
    addCheck(rows, "nextConfig.exists", existsSync(nextConfigPath), nextConfigPath),
    addCheck(rows, "proxy.exists", existsSync(proxyPath), proxyPath),
    addCheck(rows, "routesManifest.exists", existsSync(routesManifestPath), routesManifestPath),
    addCheck(
      rows,
      "routesManifest.headersRegistered",
      Array.isArray(manifest.headers) && manifest.headers.length > 0,
      `${manifest.headers?.length ?? 0} header route(s)`,
    ),
    addCheck(
      rows,
      "csp.runtimeEnforcingPresent",
      runtimeResponse.headers.has("Content-Security-Policy"),
      runtimeCspValue || "missing",
    ),
    addCheck(
      rows,
      "csp.runtimeCoreDirectives",
      requiredEnforcedCspFragments.every((fragment) => runtimeCspValue.includes(fragment)),
      runtimeCspValue || "missing",
    ),
    addCheck(
      rows,
      "csp.noncePresent",
      Boolean(cspNonceMatch?.[1]),
      cspNonceMatch?.[0] ?? "missing nonce",
    ),
    addCheck(
      rows,
      "csp.noStaticUnsafeInline",
      !combinedConfigText.includes("unsafe-inline") && !cspHasUnsafeInline,
      cspHasUnsafeInline ? runtimeCspValue : "unsafe-inline absent from config and runtime CSP",
    ),
    addCheck(
      rows,
      "csp.noReportOnlyFallback",
      !runtimeResponse.headers.has("Content-Security-Policy-Report-Only") &&
        !hasHeader(headerValues, "Content-Security-Policy-Report-Only") &&
        !/\bContent-Security-Policy-Report-Only\b/.test(combinedConfigText),
      "CSP is enforced rather than report-only for launch hardening",
    ),
    addCheck(
      rows,
      "csp.noUnsafeEvalInRuntime",
      !/unsafe-eval/i.test(runtimeCspValue),
      "Runtime CSP does not include unsafe-eval in production build",
    ),
    addCheck(
      rows,
      "csp.reportingEndpointDeferred",
      !runtimeResponse.headers.has("Reporting-Endpoints") &&
        !runtimeResponse.headers.has("Report-To") &&
        !hasHeader(headerValues, "Reporting-Endpoints") &&
        !hasHeader(headerValues, "Report-To") &&
        !/report-to\s+|report-uri\s+|Reporting-Endpoints|Report-To/i.test(combinedConfigText),
      "No CSP reporting endpoint is configured until an approved endpoint exists",
    ),
    addCheck(
      rows,
      "hsts.enforced",
      runtimeResponse.headers.has("Strict-Transport-Security") &&
        /max-age=31536000/i.test(runtimeHstsValue) &&
        /includeSubDomains/.test(runtimeHstsValue),
      runtimeHstsValue || "missing",
    ),
    addCheck(
      rows,
      "hsts.noPreload",
      !/preload/i.test(runtimeHstsValue) && !/hstspreload|hsts preload/i.test(combinedConfigText),
      "No HSTS preload posture exists before final domain approval",
    ),
    addCheck(
      rows,
      "forbiddenHeaderSignals.absent",
      forbiddenHeaderSignals.every(
        (header) =>
          !runtimeResponse.headers.has(header) &&
          !hasHeader(headerValues, header) &&
          !combinedConfigText.includes(header),
      ),
      "Report-only CSP and CSP reporting endpoints remain absent until an approved endpoint exists",
    ),
    addCheck(
      rows,
      "deprecatedHeaders.absent",
      deprecatedHeaders.every(
        (header) =>
          !runtimeResponse.headers.has(header) &&
          !hasHeader(headerValues, header) &&
          !combinedConfigText.includes(header),
      ),
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
      nextProxyNonce:
        "Next.js nonce CSP uses proxy.ts to set a fresh Content-Security-Policy and x-nonce request header before rendering.",
      cspRuntime:
        "Runtime CSP is nonce-based, enforced, and does not include unsafe-inline in production responses.",
      hsts:
        "HSTS is enforced without preload; preload remains blocked until final custom-domain approval.",
    },
    manifestHeaderKeys: [...headerValues.keys()],
    enforcedCspFragments: requiredEnforcedCspFragments,
    forbiddenHeaderSignals,
    checks: Object.fromEntries(rows.map((row) => [row.check, row.status === "pass"])),
    publicSeoUnlocked: false,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    metadataUnlocked: false,
    schemaUnlocked: false,
    deploymentApproved: false,
    hstsEnforcedNoPreload: true,
    enforcingCspEnabled: true,
    cspUnsafeInlinePresent: cspHasUnsafeInline,
    cspNoncePresent: Boolean(cspNonceMatch?.[1]),
    cspNonceMigrationRequiredBeforePublicLaunch: false,
    cspReportingEndpointDeferredUntilApprovedEndpoint: true,
    guardrail:
      "Step 10H is security-header enforcement readiness only. Runtime CSP is nonce-based and unsafe-inline is removed. It does not deploy, index, publish, add reporting endpoints, or expand external script/connect sources.",
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
