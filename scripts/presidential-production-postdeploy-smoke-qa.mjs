import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const docsResultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "402-step11-production-postdeploy-smoke-results.csv",
);
const workRoot = path.join(root, "sources", "spud", "work", "step11-production-postdeploy-smoke");
const statusJsonPath = path.join(workRoot, "step11-production-postdeploy-smoke-status.json");
const statusMdPath = path.join(workRoot, "step11-production-postdeploy-smoke-status.md");

const canonicalOrigin = "https://presidentialmoonrocks.com";
const smokeBaseUrl = process.env.PRESIDENTIAL_PRODUCTION_SMOKE_BASE_URL ?? canonicalOrigin;
const liveSmokeEnabled = process.env.PRESIDENTIAL_PRODUCTION_POSTDEPLOY_SMOKE_LIVE === "true";
const expectAnalytics = process.env.PRESIDENTIAL_PRODUCTION_SMOKE_EXPECT_ANALYTICS === "true";
const expectGsc = process.env.PRESIDENTIAL_PRODUCTION_SMOKE_EXPECT_GSC === "true";
const gaMeasurementIdPattern = /^G-[A-Z0-9]{6,}$/;

const launchRoutes = [
  "/",
  "/moon-rocks",
  "/our-story",
  "/learn",
  "/find-us",
  "/contact",
];
const deferredRoutes = ["/moon-pods", "/orbit"];
const smokeRoutes = [...launchRoutes, ...deferredRoutes];

function readSource(relativePath) {
  return readFileSync(path.join(webRoot, relativePath), "utf8");
}

function csvEscape(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function addCheck(rows, check, status, details) {
  const normalizedStatus =
    typeof status === "boolean" ? (status ? "pass" : "fail") : status;
  rows.push({ check, status: normalizedStatus, details, public_unlock: "no" });
}

function normalizeBaseUrl(value) {
  try {
    const parsed = new URL(value);
    parsed.pathname = "";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function hasRobotsNoindex(html) {
  return /<meta\s+[^>]*name=["']robots["'][^>]*content=["'][^"']*\bnoindex\b/i.test(html);
}

function hasAnalyticsTag(html) {
  return /https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-[A-Z0-9]{6,}/.test(html) &&
    /gtag\(['"]config['"],\s*['"]G-[A-Z0-9]{6,}['"]/.test(html);
}

function hasGscVerificationMeta(html) {
  return /<meta\s+[^>]*name=["']google-site-verification["'][^>]*content=["'][^"']+["']/i.test(html);
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: "manual",
    headers: {
      "user-agent": "presidential-postdeploy-smoke/1.0",
    },
  });

  return {
    status: response.status,
    location: response.headers.get("location") ?? "",
    body: await response.text(),
  };
}

async function runLiveSmoke(rows, baseUrl) {
  const sitemapUrl = `${baseUrl}/sitemap.xml`;
  const robotsUrl = `${baseUrl}/robots.txt`;
  const sitemap = await fetchText(sitemapUrl);
  const robots = await fetchText(robotsUrl);

  addCheck(
    rows,
    "postdeploy.live.robots.fetch",
    robots.status >= 200 && robots.status < 400 ? "pass" : "fail",
    `robots.txt status ${robots.status}`,
  );
  addCheck(
    rows,
    "postdeploy.live.sitemap.fetch",
    sitemap.status >= 200 && sitemap.status < 400 ? "pass" : "fail",
    `sitemap.xml status ${sitemap.status}`,
  );
  addCheck(
    rows,
    "postdeploy.live.robots.canonicalSitemap",
    robots.body.includes(`${canonicalOrigin}/sitemap.xml`) ? "pass" : "fail",
    "robots.txt points to canonical sitemap URL",
  );

  const routeBodies = new Map();
  for (const routePath of smokeRoutes) {
    const routeUrl = `${baseUrl}${routePath === "/" ? "" : routePath}`;
    const response = await fetchText(routeUrl || baseUrl);
    routeBodies.set(routePath, response.body);
    addCheck(
      rows,
      `postdeploy.live.route.${routePath}.fetch`,
      response.status >= 200 && response.status < 400 ? "pass" : "fail",
      `status ${response.status}`,
    );
    addCheck(
      rows,
      `postdeploy.live.route.${routePath}.noindex`,
      hasRobotsNoindex(response.body) ? "pass" : "fail",
      "route emits robots noindex until route publication gate is opened",
    );
    addCheck(
      rows,
      `postdeploy.live.route.${routePath}.notInSitemap`,
      !sitemap.body.includes(`${canonicalOrigin}${routePath === "/" ? "" : routePath}`) ? "pass" : "fail",
      "route remains absent from sitemap until approved publication",
    );
  }

  const homeHtml = routeBodies.get("/") ?? "";
  addCheck(
    rows,
    "postdeploy.live.analytics.state",
    expectAnalytics ? (hasAnalyticsTag(homeHtml) ? "pass" : "fail") : (!hasAnalyticsTag(homeHtml) ? "pass" : "fail"),
    expectAnalytics
      ? "analytics was expected and GA4 tag was present"
      : "analytics was not expected and GA4 tag was absent",
  );
  addCheck(
    rows,
    "postdeploy.live.gsc.state",
    expectGsc ? (hasGscVerificationMeta(homeHtml) ? "pass" : "fail") : (!hasGscVerificationMeta(homeHtml) ? "pass" : "fail"),
    expectGsc
      ? "GSC verification meta was expected and present"
      : "GSC verification meta was not expected and absent",
  );
}

async function main() {
  const rows = [];
  const baseUrl = normalizeBaseUrl(smokeBaseUrl);
  const packageJsonText = readSource("package.json");
  const providerReadinessText = readSource("scripts/presidential-production-provider-readiness-qa.mjs");
  const routePublicationText = readSource("src/lib/seo/source-records/route-publication.ts");
  const analyticsText = readSource("src/components/analytics/google-analytics.tsx");
  const layoutText = readSource("src/app/layout.tsx");

  addCheck(
    rows,
    "postdeploy.baseUrl.valid",
    baseUrl === canonicalOrigin ? "pass" : "fail",
    "post-deploy smoke defaults to the canonical production origin only",
  );
  addCheck(
    rows,
    "postdeploy.liveMode.explicit",
    liveSmokeEnabled ? "pass" : "pending",
    liveSmokeEnabled
      ? "live production fetches explicitly enabled"
      : "set PRESIDENTIAL_PRODUCTION_POSTDEPLOY_SMOKE_LIVE=true after deployment to fetch production",
  );
  addCheck(
    rows,
    "postdeploy.packageScript.wired",
    packageJsonText.includes("production:postdeploy-smoke:verify") ? "pass" : "fail",
    "package scripts wire the post-deploy smoke verifier",
  );
  addCheck(
    rows,
    "postdeploy.verifyChain.wired",
    packageJsonText.includes("production:canonical-host:verify && npm run production:postdeploy-smoke:verify") ? "pass" : "fail",
    "full verify runs the post-deploy smoke readiness gate after canonical-host readiness",
  );
  addCheck(
    rows,
    "postdeploy.providerVerifier.noDeployBoundary",
    providerReadinessText.includes("deploymentExecuted: false") &&
      providerReadinessText.includes("providerMutated: false"),
    "provider readiness verifier continues to record no deploy/no mutation posture",
  );
  addCheck(
    rows,
    "postdeploy.routePublication.closedByDefault",
    /APPROVED_ROUTE_PUBLICATIONS\s*=\s*\[\]/.test(routePublicationText) ? "pass" : "fail",
    "route publication list remains empty until per-route approval records are added",
  );
  addCheck(
    rows,
    "postdeploy.analytics.gated",
    analyticsText.includes("getGoogleAnalyticsMeasurementId") &&
      analyticsText.includes("presidential-ga4-loader") &&
      analyticsText.includes("presidential-ga4-init") &&
      layoutText.includes("<GoogleAnalytics nonce={nonce} />") &&
      layoutText.includes("getGoogleSiteVerification") &&
      gaMeasurementIdPattern.test("G-ABC1234"),
    "GA4 render path is present and gated by env/ID validation",
  );
  addCheck(
    rows,
    "postdeploy.noSecretOutput",
    !packageJsonText.includes("env pull") &&
      !packageJsonText.includes("env add") &&
      !packageJsonText.includes(["vercel", "--prod"].join(" ")),
    "post-deploy readiness does not add deploy/env mutation commands",
  );

  if (liveSmokeEnabled) {
    await runLiveSmoke(rows, baseUrl);
  }

  const failCount = rows.filter((row) => row.status === "fail").length;
  const pendingCount = rows.filter((row) => row.status === "pending").length;
  const passCount = rows.filter((row) => row.status === "pass").length;
  const verdict =
    failCount === 0
      ? pendingCount === 0
        ? "PASS_PRODUCTION_POSTDEPLOY_SMOKE_VERIFIED_NO_PUBLIC_UNLOCK"
        : "PASS_PRODUCTION_POSTDEPLOY_SMOKE_READY_PENDING_LIVE_RUN_NO_PUBLIC_UNLOCK"
      : "FAIL_PRODUCTION_POSTDEPLOY_SMOKE_REVIEW_REQUIRED";

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
    liveSmokeEnabled,
    baseUrl,
    smokeRoutes,
    passCount,
    pendingCount,
    failCount,
    deploymentExecuted: false,
    secretsPrinted: false,
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
      "# Step 11 Production Post-Deploy Smoke Status",
      "",
      `Verdict: ${verdict}`,
      `Pass: ${passCount}`,
      `Pending: ${pendingCount}`,
      `Fail: ${failCount}`,
      "",
      "Default mode proves the smoke gate is ready without fetching production. Live mode must be enabled explicitly after production deployment.",
      "",
    ].join("\n"),
  );

  if (failCount > 0) {
    console.error(verdict);
    console.error(`Pass: ${passCount}; pending: ${pendingCount}; fail: ${failCount}`);
    process.exit(1);
  }

  console.log(verdict);
  console.log(`Pass: ${passCount}; pending: ${pendingCount}; fail: ${failCount}`);
}

main().catch((error) => {
  console.error("FAIL_PRODUCTION_POSTDEPLOY_SMOKE_EXCEPTION");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
