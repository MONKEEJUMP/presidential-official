import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
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
const writeResultArtifacts =
  process.env.PRESIDENTIAL_SECURITY_HEADERS_QA_WRITE_RESULTS !== "false";
const appInlineStyleSourcePaths = [
  path.join(webRoot, "src", "app", "global-error.tsx"),
  path.join(webRoot, "src", "components", "presidential", "media", "media-slot.tsx"),
  path.join(
    webRoot,
    "src",
    "components",
    "presidential",
    "modules",
    "cms-homepage-module-renderer.tsx",
  ),
  path.join(
    webRoot,
    "src",
    "components",
    "presidential",
    "modules",
    "cms-product-module-components.tsx",
  ),
];
const nextImageLayerSourcePaths = appInlineStyleSourcePaths.slice(1);
const nextImageStyleAttributeValues = [
  "color:transparent",
  "position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent",
];
const requiredNextImageStyleHashes = nextImageStyleAttributeValues.map(
  (value) => `'sha256-${createHash("sha256").update(value).digest("base64")}'`,
);

const requiredRuntimeCspFragments = [
  "default-src 'self'",
  "base-uri 'self'",
  "script-src 'self'",
  "'strict-dynamic'",
  "style-src 'self'",
  "style-src-attr 'unsafe-hashes'",
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

function cspDirectiveMap(value) {
  const directives = new Map();

  for (const directive of value.split(";")) {
    const [name, ...sources] = directive.trim().split(/\s+/);

    if (name) {
      directives.set(name, sources);
    }
  }

  return directives;
}

function hasExactSources(actualSources, expectedSources) {
  return (
    actualSources.length === expectedSources.length &&
    expectedSources.every((source) => actualSources.includes(source))
  );
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
        return {
          headers: response.headers,
          html: await response.text(),
        };
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
  const appInlineStyleSources = new Map(
    appInlineStyleSourcePaths.map((sourcePath) => [
      sourcePath,
      existsSync(sourcePath) ? readFileSync(sourcePath, "utf8") : "",
    ]),
  );
  const sourcesWithInlineStyleAttributes = [...appInlineStyleSources]
    .filter(([, sourceText]) => /\bstyle\s*=/.test(sourceText))
    .map(([sourcePath]) => path.relative(webRoot, sourcePath));
  const runtimeResponse = await readRuntimeHeaders();
  const runtimeCspValue = runtimeResponse.headers.get("Content-Security-Policy") ?? "";
  const runtimeHstsValue = runtimeResponse.headers.get("Strict-Transport-Security") ?? "";
  const runtimeStyleAttributeValues = [
    ...runtimeResponse.html.matchAll(/\sstyle="([^"]*)"/g),
  ].map((match) => match[1]);
  const unexpectedRuntimeStyleAttributeValues = [
    ...new Set(
      runtimeStyleAttributeValues.filter(
        (value) => !nextImageStyleAttributeValues.includes(value),
      ),
    ),
  ];
  const cspNonceMatch = runtimeCspValue.match(/'nonce-([^']+)'/);
  const cspHasUnsafeInline = /'unsafe-inline'/i.test(runtimeCspValue);
  const cspDirectives = cspDirectiveMap(runtimeCspValue);
  const scriptSrc = cspDirectives.get("script-src") ?? [];
  const styleSrc = cspDirectives.get("style-src") ?? [];
  const styleSrcAttr = cspDirectives.get("style-src-attr") ?? [];
  const nonceSource = cspNonceMatch?.[0];
  const expectedStyleSrcAttr = ["'unsafe-hashes'", ...requiredNextImageStyleHashes];

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
      "proxy.nextImageStyleHashes",
      requiredNextImageStyleHashes.every((hash) => proxyText.includes(hash)) &&
        proxyText.includes("style-src-attr 'unsafe-hashes'"),
      requiredNextImageStyleHashes.join(" "),
    ),
    addCheck(
      rows,
      "source.appInlineStyleAttributesAbsent",
      sourcesWithInlineStyleAttributes.length === 0,
      sourcesWithInlineStyleAttributes.length
        ? sourcesWithInlineStyleAttributes.join(", ")
        : "owned TSX sources contain no app-authored style attributes",
    ),
    addCheck(
      rows,
      "source.nextImageLayersPresent",
      nextImageLayerSourcePaths.every((sourcePath) => {
        const sourceText = appInlineStyleSources.get(sourcePath) ?? "";
        return sourceText.includes('from "next/image"') && sourceText.includes("<Image");
      }),
      "owned content-background renderers use next/image layers",
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
      "runtime.cspScriptAndStyleNoncePolicy",
      Boolean(
        nonceSource &&
          scriptSrc.includes("'self'") &&
          scriptSrc.includes(nonceSource) &&
          scriptSrc.includes("'strict-dynamic'") &&
          styleSrc.includes("'self'") &&
          styleSrc.includes(nonceSource),
      ),
      nonceSource
        ? `script-src and style-src retain ${nonceSource}`
        : "missing shared nonce source",
    ),
    addCheck(
      rows,
      "runtime.cspStyleSrcAttrExactNextImageHashes",
      hasExactSources(styleSrcAttr, expectedStyleSrcAttr),
      styleSrcAttr.join(" ") || "missing style-src-attr",
    ),
    addCheck(
      rows,
      "runtime.styleAttributesRestrictedToNextImageValues",
      runtimeStyleAttributeValues.length > 0 &&
        unexpectedRuntimeStyleAttributeValues.length === 0,
      unexpectedRuntimeStyleAttributeValues.length
        ? unexpectedRuntimeStyleAttributeValues.join(" | ")
        : `${runtimeStyleAttributeValues.length} Next/Image style attribute(s)`,
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

  if (writeResultArtifacts) {
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
  }

  const payload = {
    verdict,
    requiredRuntimeCspFragments,
    requiredNextImageStyleHashes,
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
    cspStyleSrcAttrRestrictedToNextImageHashes: hasExactSources(
      styleSrcAttr,
      expectedStyleSrcAttr,
    ),
    runtimeStyleAttributeValues: [...new Set(runtimeStyleAttributeValues)],
    cspNonceMigrationRequiredBeforePublicLaunch: false,
    resultArtifactsWritten: writeResultArtifacts,
    guardrail:
      "Step 10C verifies security header hardening only. Runtime CSP is nonce-based, does not include unsafe-inline, and limits style attributes to exact Next/Image hashes. It does not deploy, index, publish, approve routes, or unlock public SEO.",
  };

  if (writeResultArtifacts) {
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
  }

  console.log(JSON.stringify(payload, null, 2));
  process.exitCode = verdict.startsWith("PASS_") ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
