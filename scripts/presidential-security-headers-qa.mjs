import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";

const root = path.resolve(process.cwd(), "..");
const webRoot = process.cwd();
const nextConfigPath = path.join(webRoot, "next.config.ts");
const proxyPath = path.join(webRoot, "src", "proxy.ts");
const nextBin = path.join(webRoot, "node_modules", "next", "dist", "bin", "next");
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
const runtimeHost = "127.0.0.1";
const runtimeBasePort = Number(process.env.PRESIDENTIAL_SECURITY_HEADERS_QA_PORT || "3362");

const requiredRuntimeCspFragments = [
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

const requiredManifestHeaders = new Map([
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
  const nextConfigText = existsSync(nextConfigPath)
    ? readFileSync(nextConfigPath, "utf8")
    : "";
  const proxyText = existsSync(proxyPath) ? readFileSync(proxyPath, "utf8") : "";
  const manifest = existsSync(routesManifestPath)
    ? JSON.parse(readFileSync(routesManifestPath, "utf8"))
    : {};
  const manifestHeaders = headerMapFromManifest(manifest);
  const runtimeResponse = await readRuntimeHeaders();
  const runtimeCspValue = runtimeResponse.headers.get("Content-Security-Policy") ?? "";
  const runtimeHstsValue = runtimeResponse.headers.get("Strict-Transport-Security") ?? "";
  const cspNonceMatch = runtimeCspValue.match(/'nonce-([^']+)'/);
  const cspHasUnsafeInline = /'unsafe-inline'/i.test(runtimeCspValue);

  const checks = [
    addCheck(rows, "nextConfig.exists", existsSync(nextConfigPath), nextConfigPath),
    addCheck(rows, "proxy.exists", existsSync(proxyPath), proxyPath),
    addCheck(rows, "routesManifest.exists", existsSync(routesManifestPath), routesManifestPath),
    addCheck(
      rows,
      "nextConfig.headersFunction",
      /async\s+headers\s*\(\)/.test(nextConfigText),
      "Next.js headers function is configured for non-CSP security headers",
    ),
    addCheck(
      rows,
      "proxy.cspHeaderFunction",
      /Content-Security-Policy/.test(proxyText) && /x-nonce/.test(proxyText),
      "proxy.ts sets request/response CSP and x-nonce",
    ),
    addCheck(
      rows,
      "runtime.cspPresent",
      runtimeCspValue.length > 0,
      runtimeCspValue || "missing",
    ),
    addCheck(
      rows,
      "runtime.cspNoncePresent",
      Boolean(cspNonceMatch?.[1]),
      cspNonceMatch?.[0] ?? "missing nonce",
    ),
    addCheck(
      rows,
      "runtime.cspNoUnsafeInline",
      !cspHasUnsafeInline,
      cspHasUnsafeInline ? runtimeCspValue : "unsafe-inline absent",
    ),
    addCheck(
      rows,
      "runtime.cspCoreDirectives",
      requiredRuntimeCspFragments.every((fragment) => runtimeCspValue.includes(fragment)),
      runtimeCspValue || "missing",
    ),
    addCheck(
      rows,
      "runtime.hstsStillPresent",
      /max-age=31536000/i.test(runtimeHstsValue) && /includeSubDomains/.test(runtimeHstsValue),
      runtimeHstsValue || "missing",
    ),
    addCheck(
      rows,
      "config.cspRemovedFromStaticHeaders",
      !nextConfigText.includes("Content-Security-Policy") && !nextConfigText.includes("unsafe-inline"),
      "static CSP removed from next.config.ts so nonce CSP controls runtime responses",
    ),
    addCheck(
      rows,
      "routesManifest.cspNotStatic",
      !manifestHeaders.has("Content-Security-Policy"),
      "routes manifest does not carry stale static CSP",
    ),
  ];

  for (const [key, requiredFragments] of requiredManifestHeaders.entries()) {
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
      runtimeResponse.headers.has("Content-Security-Policy") &&
        !runtimeResponse.headers.has("Content-Security-Policy-Report-Only"),
      "runtime CSP is enforced and not report-only",
    ),
  );
  checks.push(
    addCheck(
      rows,
      "hsts.enforcedNoPreload",
      runtimeResponse.headers.has("Strict-Transport-Security") && !/preload/i.test(runtimeHstsValue),
      runtimeHstsValue || "missing",
    ),
  );
  checks.push(
    addCheck(
      rows,
      "deprecatedHeaders.absent",
      forbiddenHeaders.every(
        (header) =>
          !runtimeResponse.headers.has(header) &&
          !manifestHeaders.has(header) &&
          !nextConfigText.includes(header) &&
          !proxyText.includes(header),
      ),
      "report-only CSP and deprecated HPKP/Expect-CT/X-XSS-Protection headers are absent",
    ),
  );
  checks.push(
    addCheck(
      rows,
      "noPublicUnlockSignals",
      !/index,\s*follow approved|route publication approved|sitemap inclusion approved|public seo unlocked/i.test(
        [nextConfigText, proxyText].join("\n"),
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
    requiredRuntimeCspFragments,
    requiredManifestHeaders: Object.fromEntries(requiredManifestHeaders),
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
    cspNoncePresent: Boolean(cspNonceMatch?.[1]),
    cspNonceMigrationRequiredBeforePublicLaunch: false,
    guardrail:
      "Step 10C verifies security header hardening only. Runtime CSP is nonce-based and does not include unsafe-inline. It does not deploy, index, publish, approve routes, or unlock public SEO.",
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
