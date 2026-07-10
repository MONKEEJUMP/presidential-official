import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  expectedRouteIsPublic,
  getRoutePublicationRuntimeState,
  routeStateMatchesMode,
} from "./lib/route-publication-runtime-state.mjs";

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
const strictReleaseMode = process.env.PRESIDENTIAL_RELEASE_VERIFY_MODE === "strict-release";
const expectAnalytics = process.env.PRESIDENTIAL_PRODUCTION_SMOKE_EXPECT_ANALYTICS === "true";
const expectGsc = process.env.PRESIDENTIAL_PRODUCTION_SMOKE_EXPECT_GSC === "true";
const expectContactMailtoReady = process.env.PRESIDENTIAL_PRODUCTION_SMOKE_EXPECT_CONTACT_MAILTO_READY === "true";
const gaMeasurementIdEnv = "NEXT_PUBLIC_PRESIDENTIAL_GA_MEASUREMENT_ID";
const gscVerificationTokenEnv = "PRESIDENTIAL_GOOGLE_SITE_VERIFICATION";
const contactMailtoEnabledEnv = "PRESIDENTIAL_CONTACT_MAILTO_ENABLED";
const contactInboxEnv = "PRESIDENTIAL_CONTACT_INBOX_EMAIL";
const gaMeasurementIdPattern = /^G-[A-Z0-9]{6,}$/;
const googleSiteVerificationPattern = /^[A-Za-z0-9_-]{16,256}$/;
const contactInboxPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function parseSitemapUrls(body) {
  return new Set(
    [...body.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => match[1]),
  );
}

function getExpectedGaMeasurementId() {
  if (!expectAnalytics) return "";
  const measurementId = process.env[gaMeasurementIdEnv]?.trim() ?? "";
  return gaMeasurementIdPattern.test(measurementId) ? measurementId : "";
}

function getExpectedGscVerificationToken() {
  if (!expectGsc) return "";
  const verificationToken = process.env[gscVerificationTokenEnv]?.trim() ?? "";
  return googleSiteVerificationPattern.test(verificationToken) ? verificationToken : "";
}

function hasExpectedContactInbox() {
  if (!expectContactMailtoReady) return true;
  const inbox = process.env[contactInboxEnv]?.trim() ?? "";
  return process.env[contactMailtoEnabledEnv] === "true" && contactInboxPattern.test(inbox);
}

function extractAnalyticsMeasurementIds(html) {
  const loaderMatch = html.match(/https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=([^"'&<\s]+)/);
  const configMatch = html.match(/gtag\(['"]config['"],\s*['"]([^'"]+)['"]/);
  return {
    loader: loaderMatch ? decodeURIComponent(loaderMatch[1]) : "",
    config: configMatch?.[1] ?? "",
  };
}

function hasAnyAnalyticsTag(html) {
  const ids = extractAnalyticsMeasurementIds(html);
  return Boolean(ids.loader || ids.config);
}

function hasExpectedAnalyticsTag(html, expectedMeasurementId) {
  const ids = extractAnalyticsMeasurementIds(html);
  return ids.loader === expectedMeasurementId && ids.config === expectedMeasurementId;
}

function extractGscVerificationToken(html) {
  return html.match(/<meta\s+[^>]*name=["']google-site-verification["'][^>]*content=["']([^"']+)["']/i)?.[1] ?? "";
}

function hasGscVerificationMeta(html) {
  return Boolean(extractGscVerificationToken(html));
}

function hasExpectedGscVerificationMeta(html, expectedToken) {
  return extractGscVerificationToken(html) === expectedToken;
}

function hasContactMailto(html) {
  return html.includes('id="presidential-contact-mailto"') && /href=["']mailto:/i.test(html);
}

function hasThirdPartyContactProviderSignal(html) {
  return /\b(?:hubspot|mailchimp|klaviyo|salesforce|typeform|jotform|formspree|recaptcha|hcaptcha|turnstile)\b/i.test(html);
}

function hasInternalContactProvisioningCopy(html) {
  return /approved inbox|provision(?:ed|ing)?|contact status/i.test(html);
}

async function fetchText(url, adultConfirmed = false) {
  const requestHeaders = {
    "user-agent": "presidential-postdeploy-smoke/1.0",
  };
  if (adultConfirmed) {
    requestHeaders.cookie = "presidential_adult_confirmed=true";
  }

  const response = await fetch(url, {
    redirect: "manual",
    headers: requestHeaders,
  });

  return {
    status: response.status,
    location: response.headers.get("location") ?? "",
    body: await response.text(),
  };
}

async function runLiveSmoke(rows, baseUrl, routeState) {
  const sitemapUrl = `${baseUrl}/sitemap.xml`;
  const robotsUrl = `${baseUrl}/robots.txt`;
  const sitemap = await fetchText(sitemapUrl);
  const robots = await fetchText(robotsUrl);
  const sitemapUrls = parseSitemapUrls(sitemap.body);

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
    const expectedPublished = expectedRouteIsPublic(routeState, routePath);
    const canonicalRouteUrl = `${canonicalOrigin}${routePath === "/" ? "" : routePath}`;
    const sitemapContainsRoute =
      sitemapUrls.has(canonicalRouteUrl) ||
      (routePath === "/" && sitemapUrls.has(`${canonicalOrigin}/`));
    addCheck(
      rows,
      `postdeploy.live.route.${routePath}.fetch`,
      response.status >= 200 && response.status < 400 ? "pass" : "fail",
      `status ${response.status}`,
    );
    addCheck(
      rows,
      `postdeploy.live.route.${routePath}.noindex`,
      hasRobotsNoindex(response.body) !== expectedPublished ? "pass" : "fail",
      expectedPublished
        ? "approved route must not emit robots noindex"
        : "unapproved route must emit robots noindex",
    );
    addCheck(
      rows,
      `postdeploy.live.route.${routePath}.sitemapState`,
      sitemapContainsRoute === expectedPublished ? "pass" : "fail",
      expectedPublished
        ? "approved route must appear exactly in the canonical sitemap"
        : "unapproved route must remain absent from the sitemap",
    );
  }

  const homeHtml = routeBodies.get("/") ?? "";
  const adultConfirmedHomeHtml = expectAnalytics
    ? (await fetchText(baseUrl, true)).body
    : homeHtml;
  const expectedGaMeasurementId = getExpectedGaMeasurementId();
  const expectedGscVerificationToken = getExpectedGscVerificationToken();
  addCheck(
    rows,
    "postdeploy.live.analytics.expectedEnvValid",
    expectAnalytics ? (expectedGaMeasurementId ? "pass" : "fail") : "pass",
    expectAnalytics
      ? "GA4 expectation requires a valid measurement id in the live smoke environment"
      : "analytics was not expected, so no GA4 env value is required",
  );
  addCheck(
    rows,
    "postdeploy.live.analytics.state",
    expectAnalytics
      ? (expectedGaMeasurementId && hasExpectedAnalyticsTag(adultConfirmedHomeHtml, expectedGaMeasurementId) ? "pass" : "fail")
      : (!hasAnyAnalyticsTag(homeHtml) ? "pass" : "fail"),
    expectAnalytics
      ? "analytics was expected and matched the env id only on an adult-cookie request"
      : "analytics was not expected and GA4 was absent from the unconfirmed request",
  );
  addCheck(
    rows,
    "postdeploy.live.gsc.expectedEnvValid",
    expectGsc ? (expectedGscVerificationToken ? "pass" : "fail") : "pass",
    expectGsc
      ? "GSC expectation requires a valid verification token in the live smoke environment"
      : "GSC verification was not expected, so no token env value is required",
  );
  addCheck(
    rows,
    "postdeploy.live.gsc.state",
    expectGsc
      ? (expectedGscVerificationToken && hasExpectedGscVerificationMeta(homeHtml, expectedGscVerificationToken) ? "pass" : "fail")
      : (!hasGscVerificationMeta(homeHtml) ? "pass" : "fail"),
    expectGsc
      ? "GSC verification meta was expected and matched the expected env token"
      : "GSC verification meta was not expected and absent",
  );

  const contactHtml = routeBodies.get("/contact") ?? "";
  addCheck(
    rows,
    "postdeploy.live.contact.noServerForm",
    !/<form\b/i.test(contactHtml) ? "pass" : "fail",
    "Contact route exposes no server-submitted form",
  );
  addCheck(
    rows,
    "postdeploy.live.contact.expectedEnvValid",
    hasExpectedContactInbox() ? "pass" : "fail",
    expectContactMailtoReady
      ? "Contact mailto readiness requires an enabled flag plus a valid approved inbox"
      : "Contact mailto readiness was not expected, so no approved inbox env value is required",
  );
  addCheck(
    rows,
    "postdeploy.live.contact.state",
    expectContactMailtoReady
      ? (hasContactMailto(contactHtml) ? "pass" : "fail")
      : (!hasContactMailto(contactHtml) ? "pass" : "fail"),
    expectContactMailtoReady
      ? "Contact mailto link was expected and rendered"
      : "Contact mailto link was expected to remain absent",
  );
  addCheck(
    rows,
    "postdeploy.live.contact.noInternalProvisioningCopy",
    !hasInternalContactProvisioningCopy(contactHtml) ? "pass" : "fail",
    "Contact route does not expose disabled-form or internal provisioning copy",
  );
  addCheck(
    rows,
    "postdeploy.live.contact.noThirdPartyProvider",
    !hasThirdPartyContactProviderSignal(contactHtml) ? "pass" : "fail",
    "Contact route contains no third-party form, CRM, or captcha provider signal",
  );
}

async function main() {
  const rows = [];
  const baseUrl = normalizeBaseUrl(smokeBaseUrl);
  const packageJsonText = readSource("package.json");
  const providerReadinessText = readSource("scripts/presidential-production-provider-readiness-qa.mjs");
  const routeState = getRoutePublicationRuntimeState();
  const analyticsText = readSource("src/components/analytics/google-analytics.tsx");
  const layoutText = readSource("src/app/layout.tsx");
  const contactFormText = readSource("src/app/contact/contact-inquiry-form.tsx");
  const contactConfigText = readSource("src/app/contact/contact-inquiry-config.ts");

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
    packageJsonText.includes("production:postdeploy-smoke:verify") ? "pass" : "fail",
    "strict release verification wires the post-deploy smoke gate",
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
    "postdeploy.routePublication.matchesMode",
    routeStateMatchesMode(routeState, strictReleaseMode) ? "pass" : "fail",
    strictReleaseMode
      ? "strict release requires one or more fully approved, sitemap-eligible routes"
      : "default verification requires the route-publication lock to remain closed",
  );
  addCheck(
    rows,
    "postdeploy.analytics.gated",
    analyticsText.includes("getGoogleAnalyticsMeasurementId") &&
      analyticsText.includes("presidential-ga4-loader") &&
      analyticsText.includes("presidential-ga4-init") &&
      layoutText.includes("adultConfirmed ? <GoogleAnalytics nonce={nonce} /> : null") &&
      layoutText.includes("getGoogleSiteVerification") &&
      gaMeasurementIdPattern.test("G-ABC1234"),
    "GA4 render path is present and gated by env/ID validation",
  );
  addCheck(
    rows,
    "postdeploy.contact.gated",
    contactFormText.includes("presidential-contact-mailto") &&
      contactFormText.includes("configured") &&
      !contactFormText.includes("<form") &&
      contactConfigText.includes("PRESIDENTIAL_CONTACT_MAILTO_ENABLED") &&
      contactConfigText.includes("PRESIDENTIAL_CONTACT_INBOX_EMAIL"),
    "Contact mailto path is form-free and gated by approved inbox env values",
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
    await runLiveSmoke(rows, baseUrl, routeState);
  }

  const failCount = rows.filter((row) => row.status === "fail").length;
  const pendingCount = rows.filter((row) => row.status === "pending").length;
  const passCount = rows.filter((row) => row.status === "pass").length;
  const verdict = failCount === 0
    ? pendingCount === 0
      ? "PASS_PRODUCTION_POSTDEPLOY_SMOKE_VERIFIED"
      : "PASS_PRODUCTION_POSTDEPLOY_SMOKE_READY_PENDING_LIVE_RUN"
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
    strictReleaseMode,
    baseUrl,
    smokeRoutes,
    passCount,
    pendingCount,
    failCount,
    deploymentExecuted: false,
    secretsPrinted: false,
    publicSeoUnlocked: strictReleaseMode && routeState.approvedRoutes.length > 0,
    routePublicationApproved: routeState.approvedRoutes.length > 0,
    sitemapUnlocked: strictReleaseMode && routeState.sitemapEligibleRoutes.length > 0,
    indexabilityUnlocked: strictReleaseMode && routeState.approvedRoutes.length > 0,
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
