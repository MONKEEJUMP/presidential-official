import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const nextConfigPath = path.join(webRoot, "next.config.ts");
const proxyPath = path.join(webRoot, "src", "proxy.ts");
const packageJsonPath = path.join(webRoot, "package.json");
const routesManifestPath = path.join(webRoot, ".next", "routes-manifest.json");
const builtAppRoot = path.join(webRoot, ".next", "server", "app");
const nextBin = path.join(webRoot, "node_modules", "next", "dist", "bin", "next");
const runtimeHost = "127.0.0.1";
const runtimeBasePort = Number(process.env.PRESIDENTIAL_THIRD_PARTY_QA_PORT || "3364");
const docsResultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "259-step10j-third-party-script-connect-readiness-results.csv",
);
const workRoot = path.join(root, "sources", "spud", "work", "step10j-third-party-script-connect-readiness");
const statusJsonPath = path.join(workRoot, "step10j-third-party-script-connect-readiness-status.json");
const statusMdPath = path.join(workRoot, "step10j-third-party-script-connect-readiness-status.md");

const sourceRoots = [
  path.join(webRoot, "src", "app"),
  path.join(webRoot, "src", "components"),
  path.join(webRoot, "src", "lib", "design-system"),
  path.join(webRoot, "src", "lib", "seo"),
  proxyPath,
  nextConfigPath,
  packageJsonPath,
];

const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".mjs",
  ".rsc",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
]);

const approvedRawScriptFiles = new Set(["web/src/lib/seo/schema/jsonLd.tsx"]);
const analyticsVendorPattern =
  /\b(?:GTM-[A-Z0-9]+|gtag|dataLayer|GoogleAnalytics|GoogleTagManager|googletagmanager|google-analytics|googleanalytics|fbq|facebook pixel|meta pixel|tiktok pixel|hotjar|posthog|mixpanel|fullstory|Microsoft Clarity|clarity\.ms|clarity\.js|clarity_project_id|NEXT_PUBLIC_CLARITY|@segment\/analytics|segment\.com|NEXT_PUBLIC_SEGMENT)\b/i;
const nextScriptPattern = /from\s+["']next\/script["']|require\(["']next\/script["']\)|<Script\b/;
const nextThirdPartiesPattern =
  /@next\/third-parties|GoogleAnalytics|GoogleTagManager|sendGAEvent|sendGTMEvent|GoogleMapsEmbed|YouTubeEmbed/;
const rawScriptPattern = /<script\b/i;
const externalScriptSrcPattern = /<script\b[^>]*\bsrc=(["'])(https?:\/\/[^"']+)\1/gi;
const externalConnectPattern =
  /\b(?:fetch|axios(?:\.(?:get|post|put|patch|delete|request))?)\s*\(\s*(["'`])https?:\/\/[^"'`]+|new\s+WebSocket\s*\(\s*(["'`])wss?:\/\/[^"'`]+|new\s+EventSource\s*\(\s*(["'`])https?:\/\/[^"'`]+|sendBeacon\s*\(\s*(["'`])https?:\/\/[^"'`]+/gi;
const connectApiPattern = /\b(?:XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/i;
const externalFormActionPattern = /\baction\s*=\s*(["'`{])\s*https?:\/\//i;
const embedElementPattern = /<(?:iframe|embed|object)\b/i;
const externalFrameSrcPattern = /<(?:iframe|embed|object)\b[^>]*\b(?:src|data)=(["'])(https?:\/\/[^"']+)\1/gi;
const resourceHintPattern = /<link\b[^>]*\brel=(["'])(?:preconnect|dns-prefetch)\1[^>]*\bhref=(["'])(https?:\/\/[^"']+)\2/gi;
const publicAnalyticsEnvPattern =
  /\bNEXT_PUBLIC_[A-Z0-9_]*(?:GA|GTM|GOOGLE_ANALYTICS|TAG_MANAGER|PIXEL|TRACK|ANALYTICS|HOTJAR|POSTHOG|SEGMENT|MIXPANEL|AMPLITUDE|SENTRY|CLARITY)[A-Z0-9_]*\b/i;
const forbiddenCspSourcePattern =
  /(?:https?:\/\/|wss?:\/\/|\*\.|(?:^|[\s;])\*(?=$|[\s;])|data:|blob:|'unsafe-eval')/i;
const cspReportingEndpointPattern = /\b(?:report-uri|report-to|Reporting-Endpoints|Report-To)\b/i;
const publicUnlockPattern =
  /analytics approved|tracking approved|pixel approved|third-party approved|external script approved|connect source approved|tag manager approved|public seo unlocked|route publication approved|sitemap inclusion approved|index,\s*follow approved|deployment approved/i;

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

function walkTextFiles(targetPath) {
  if (!existsSync(targetPath)) {
    return [];
  }

  const stats = statSync(targetPath);
  if (stats.isFile()) {
    return textExtensions.has(path.extname(targetPath).toLowerCase()) ? [targetPath] : [];
  }

  const files = [];
  for (const entry of readdirSync(targetPath, { withFileTypes: true })) {
    const fullPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git", ".lighthouseci", "cache"].includes(entry.name)) {
        continue;
      }
      files.push(...walkTextFiles(fullPath));
    } else if (textExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

function collectMatches(files, pattern, options = {}) {
  const matches = [];
  for (const file of files) {
    const relativePath = rel(file);
    if (options.skipApprovedRawScriptFile && approvedRawScriptFiles.has(relativePath)) {
      continue;
    }

    const text = readIfExists(file);
    const lines = text.split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        matches.push(`${relativePath}:${index + 1}:${line.trim()}`);
      }
    }
  }
  return matches;
}

function collectGlobalMatches(files, pattern) {
  const matches = [];
  for (const file of files) {
    const text = readIfExists(file);
    pattern.lastIndex = 0;
    const found = text.match(pattern) ?? [];
    for (const value of found) {
      matches.push(`${rel(file)}:${value}`);
    }
  }
  return matches;
}

function readRoutesManifest() {
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

function addCheck(rows, check, passed, details) {
  rows.push({
    check,
    status: passed ? "pass" : "fail",
    details,
    public_unlock: "no",
  });
  return passed;
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
  const sourceFiles = sourceRoots.flatMap(walkTextFiles);
  const builtFiles = walkTextFiles(builtAppRoot);
  const packageJsonText = readIfExists(packageJsonPath);
  const nextConfigText = readIfExists(nextConfigPath);
  const proxyText = readIfExists(proxyPath);
  const manifest = readRoutesManifest();
  const headerValues = headerValuesFromRoutesManifest(manifest);
  const runtimeResponse = await readRuntimeHeaders();
  const reportOnlyCsp = (headerValues.get("Content-Security-Policy-Report-Only") ?? []).join("\n");
  const enforcingCsp = (headerValues.get("Content-Security-Policy") ?? []).join("\n");
  const runtimeCsp = runtimeResponse.headers.get("Content-Security-Policy") ?? "";
  const effectiveCsp = runtimeCsp || enforcingCsp || reportOnlyCsp;
  const sourceText = sourceFiles.map(readIfExists).join("\n");
  const builtText = builtFiles.map(readIfExists).join("\n");
  const combinedPublicText = [sourceText, builtText, packageJsonText, nextConfigText, proxyText, reportOnlyCsp, enforcingCsp, runtimeCsp].join("\n");

  const nextScriptMatches = collectMatches(sourceFiles, nextScriptPattern);
  const nextThirdPartyMatches = collectMatches(sourceFiles, nextThirdPartiesPattern);
  const rawScriptMatches = collectMatches(sourceFiles, rawScriptPattern, { skipApprovedRawScriptFile: true });
  const sourceAnalyticsMatches = collectMatches(sourceFiles, analyticsVendorPattern);
  const builtAnalyticsMatches = collectMatches(builtFiles, analyticsVendorPattern);
  const sourceExternalScripts = collectGlobalMatches(sourceFiles, externalScriptSrcPattern);
  const builtExternalScripts = collectGlobalMatches(builtFiles, externalScriptSrcPattern);
  const sourceExternalConnects = collectGlobalMatches(sourceFiles, externalConnectPattern);
  const builtExternalConnects = collectGlobalMatches(builtFiles, externalConnectPattern);
  const sourceConnectApis = collectMatches(sourceFiles, connectApiPattern);
  const sourceExternalFormActions = collectMatches(sourceFiles, externalFormActionPattern);
  const builtExternalFormActions = collectMatches(builtFiles, externalFormActionPattern);
  const sourceEmbedElements = collectMatches(sourceFiles, embedElementPattern);
  const builtExternalFrameSources = collectGlobalMatches(builtFiles, externalFrameSrcPattern);
  const sourceResourceHints = collectGlobalMatches(sourceFiles, resourceHintPattern);
  const builtResourceHints = collectGlobalMatches(builtFiles, resourceHintPattern);
  const sourcePublicAnalyticsEnvNames = collectMatches(sourceFiles, publicAnalyticsEnvPattern);

  const cspHasNoThirdPartySource =
    !forbiddenCspSourcePattern.test(reportOnlyCsp) &&
    !forbiddenCspSourcePattern.test(enforcingCsp) &&
    !forbiddenCspSourcePattern.test(runtimeCsp);
  const cspHasSafeFormAction = effectiveCsp.includes("form-action 'self'");
  const cspHasSafeObjectSrc = effectiveCsp.includes("object-src 'none'");
  const cspHasSafeFrameAncestors = effectiveCsp.includes("frame-ancestors 'none'");
  const packageHasThirdPartyDependency = /"@next\/third-parties"|google-analytics|gtag|posthog|@vercel\/analytics|@vercel\/speed-insights/i.test(packageJsonText);

  const checks = [
    addCheck(rows, "builtOutput.exists", builtFiles.length > 0, `${builtFiles.length} built text file(s) scanned`),
    addCheck(rows, "source.noNextScript", nextScriptMatches.length === 0, nextScriptMatches.length ? nextScriptMatches.slice(0, 10).join(" | ") : "next/script is absent"),
    addCheck(rows, "source.noNextThirdParties", nextThirdPartyMatches.length === 0, nextThirdPartyMatches.length ? nextThirdPartyMatches.slice(0, 10).join(" | ") : "@next/third-parties helpers are absent"),
    addCheck(rows, "package.noThirdPartyAnalyticsDeps", !packageHasThirdPartyDependency, "No analytics/pixel/third-party helper dependency is installed"),
    addCheck(rows, "source.noUnapprovedRawScript", rawScriptMatches.length === 0, rawScriptMatches.length ? rawScriptMatches.slice(0, 10).join(" | ") : "No raw source script tags outside approved JSON-LD helper"),
    addCheck(rows, "source.noExternalScriptSrc", sourceExternalScripts.length === 0, sourceExternalScripts.length ? sourceExternalScripts.slice(0, 10).join(" | ") : "No external script src appears in public source"),
    addCheck(rows, "built.noExternalScriptSrc", builtExternalScripts.length === 0, builtExternalScripts.length ? builtExternalScripts.slice(0, 10).join(" | ") : "Built output has no external script src; only local Next/runtime scripts are present"),
    addCheck(rows, "source.noAnalyticsVendorSignals", sourceAnalyticsMatches.length === 0, sourceAnalyticsMatches.length ? sourceAnalyticsMatches.slice(0, 10).join(" | ") : "No analytics or pixel vendor signals in public source"),
    addCheck(rows, "built.noAnalyticsVendorSignals", builtAnalyticsMatches.length === 0, builtAnalyticsMatches.length ? builtAnalyticsMatches.slice(0, 10).join(" | ") : "No analytics or pixel vendor signals in built output"),
    addCheck(rows, "source.noExternalConnectCalls", sourceExternalConnects.length === 0, sourceExternalConnects.length ? sourceExternalConnects.slice(0, 10).join(" | ") : "No external fetch/axios/WebSocket/EventSource/sendBeacon calls in public source"),
    addCheck(rows, "built.noExternalConnectCalls", builtExternalConnects.length === 0, builtExternalConnects.length ? builtExternalConnects.slice(0, 10).join(" | ") : "No external connect calls serialized in built output"),
    addCheck(rows, "source.noClientConnectApis", sourceConnectApis.length === 0, sourceConnectApis.length ? sourceConnectApis.slice(0, 10).join(" | ") : "No XMLHttpRequest/WebSocket/EventSource/sendBeacon API usage in public source"),
    addCheck(rows, "source.noExternalFormActions", sourceExternalFormActions.length === 0, sourceExternalFormActions.length ? sourceExternalFormActions.slice(0, 10).join(" | ") : "No external form actions in public source"),
    addCheck(rows, "built.noExternalFormActions", builtExternalFormActions.length === 0, builtExternalFormActions.length ? builtExternalFormActions.slice(0, 10).join(" | ") : "No external form actions in built output"),
    addCheck(rows, "source.noEmbedSurfaces", sourceEmbedElements.length === 0, sourceEmbedElements.length ? sourceEmbedElements.slice(0, 10).join(" | ") : "No iframe/embed/object surfaces in public source"),
    addCheck(rows, "built.noExternalFrameSources", builtExternalFrameSources.length === 0, builtExternalFrameSources.length ? builtExternalFrameSources.slice(0, 10).join(" | ") : "No external frame/embed/object sources in built output"),
    addCheck(rows, "source.noThirdPartyResourceHints", sourceResourceHints.length === 0, sourceResourceHints.length ? sourceResourceHints.slice(0, 10).join(" | ") : "No third-party preconnect or dns-prefetch hints in public source"),
    addCheck(rows, "built.noThirdPartyResourceHints", builtResourceHints.length === 0, builtResourceHints.length ? builtResourceHints.slice(0, 10).join(" | ") : "No third-party preconnect or dns-prefetch hints in built output"),
    addCheck(rows, "source.noPublicAnalyticsEnvNames", sourcePublicAnalyticsEnvNames.length === 0, sourcePublicAnalyticsEnvNames.length ? sourcePublicAnalyticsEnvNames.slice(0, 10).join(" | ") : "No public analytics/tracking environment variable names in scanned public source"),
    addCheck(rows, "csp.enforced", Boolean(effectiveCsp), effectiveCsp || "missing enforced CSP"),
    addCheck(rows, "csp.noThirdPartySources", cspHasNoThirdPartySource, effectiveCsp || "missing CSP"),
    addCheck(rows, "csp.noReportingEndpoint", !cspReportingEndpointPattern.test(reportOnlyCsp + "\n" + enforcingCsp + "\n" + runtimeCsp + "\n" + nextConfigText + "\n" + proxyText), "No CSP reporting endpoint is configured before an approved endpoint exists"),
    addCheck(rows, "csp.formActionSelf", cspHasSafeFormAction, effectiveCsp || "missing CSP"),
    addCheck(rows, "csp.objectSrcNone", cspHasSafeObjectSrc, effectiveCsp || "missing CSP"),
    addCheck(rows, "csp.frameAncestorsNone", cspHasSafeFrameAncestors, effectiveCsp || "missing CSP"),
    addCheck(rows, "noPublicUnlockSignals", !publicUnlockPattern.test(combinedPublicText), "Third-party readiness does not approve tracking, analytics, scripts, connects, route publication, deployment, sitemap inclusion, indexability, or public SEO"),
  ];

  const verdict = checks.every(Boolean)
    ? "PASS_THIRD_PARTY_SCRIPT_CONNECT_READINESS_NO_PUBLIC_UNLOCK"
    : "FAIL_THIRD_PARTY_SCRIPT_CONNECT_READINESS_REVIEW_REQUIRED";

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
      nextScripts:
        "Next.js supports loading third-party scripts with next/script, but recommends including them only in specific pages or layouts to minimize performance impact.",
      nextThirdParties:
        "Next.js @next/third-parties provides helpers for Google Tag Manager, Google Analytics, Maps, and YouTube, and should be deliberate when approved.",
      cspScriptSrc:
        "MDN defines script-src as the CSP directive controlling valid JavaScript sources, including script elements and inline script handlers.",
      cspConnectSrc:
        "MDN defines connect-src as the CSP directive controlling fetch, XMLHttpRequest, WebSocket, EventSource, sendBeacon, and related script interfaces.",
      cspFrameAndForm:
        "MDN frame-src restricts nested browsing contexts and form-action restricts form submission targets.",
    },
    sourceTextFileCount: sourceFiles.length,
    builtTextFileCount: builtFiles.length,
    approvedRawScriptFiles: [...approvedRawScriptFiles],
    nextScriptMatches,
    nextThirdPartyMatches,
    rawScriptMatches,
    sourceAnalyticsMatches,
    builtAnalyticsMatches,
    sourceExternalScripts,
    builtExternalScripts,
    sourceExternalConnects,
    builtExternalConnects,
    sourceConnectApis,
    sourceExternalFormActions,
    builtExternalFormActions,
    sourceEmbedElements,
    builtExternalFrameSources,
    sourceResourceHints,
    builtResourceHints,
    sourcePublicAnalyticsEnvNames,
    reportOnlyCsp,
    runtimeCsp,
    checks: Object.fromEntries(rows.map((row) => [row.check, row.status === "pass"])),
    analyticsApproved: false,
    trackingApproved: false,
    thirdPartyScriptsApproved: false,
    thirdPartyConnectSourcesApproved: false,
    iframeEmbedsApproved: false,
    externalFormActionsApproved: false,
    cspReportingEndpointApproved: false,
    cspScriptConnectAllowlistApproved: false,
    consentModeApproved: false,
    publicSeoUnlocked: false,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    deploymentApproved: false,
    guardrail:
      "Step 10J is third-party script/connect/analytics readiness only. It permits existing framework-local runtime scripts and approved JSON-LD, while keeping analytics, pixels, external scripts, external connect calls, embeds, external forms, CSP source expansion, route publication, deployment, sitemap inclusion, indexability, and public SEO blocked until approval records exist.",
  };

  mkdirSync(workRoot, { recursive: true });
  writeFileSync(statusJsonPath, JSON.stringify(payload, null, 2));
  writeFileSync(
    statusMdPath,
    [
      "# Step 10J Third-Party Script / Connect Readiness Status",
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
      "Final signal: `STEP_10J_THIRD_PARTY_SCRIPT_CONNECT_READINESS_COMPLETE_NO_PUBLIC_UNLOCK`",
    ].join("\n") + "\n",
  );

  console.log(JSON.stringify(payload, null, 2));
  process.exitCode = verdict.startsWith("PASS_") ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
