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
const expectContactFormReady = process.env.PRESIDENTIAL_PRODUCTION_SMOKE_EXPECT_CONTACT_FORM_READY === "true";
const gaMeasurementIdEnv = "NEXT_PUBLIC_PRESIDENTIAL_GA_MEASUREMENT_ID";
const gscVerificationTokenEnv = "PRESIDENTIAL_GOOGLE_SITE_VERIFICATION";
const contactFormEnabledEnv = "PRESIDENTIAL_CONTACT_FORM_ENABLED";
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
  if (!expectContactFormReady) return true;
  const inbox = process.env[contactInboxEnv]?.trim() ?? "";
  return process.env[contactFormEnabledEnv] === "true" && contactInboxPattern.test(inbox);
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

function hasContactFormShell(html) {
  return html.includes("presidential-contact-form-status") && /<form\b/i.test(html);
}

function hasThirdPartyContactProviderSignal(html) {
  return /\b(?:hubspot|mailchimp|klaviyo|salesforce|typeform|jotform|formspree|recaptcha|hcaptcha|turnstile)\b/i.test(html);
}

function hasDisabledContactFormCopy(html) {
  return html.includes("The approved inbox is not provisioned yet.");
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
      ? (expectedGaMeasurementId && hasExpectedAnalyticsTag(homeHtml, expectedGaMeasurementId) ? "pass" : "fail")
      : (!hasAnyAnalyticsTag(homeHtml) ? "pass" : "fail"),
    expectAnalytics
      ? "analytics was expected and the rendered GA4 loader/config matched the expected env id"
      : "analytics was not expected and GA4 tag was absent",
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
    "postdeploy.live.contact.formShell",
    hasContactFormShell(contactHtml) ? "pass" : "fail",
    "Contact route renders the first-party inquiry form shell",
  );
  addCheck(
    rows,
    "postdeploy.live.contact.expectedEnvValid",
    hasExpectedContactInbox() ? "pass" : "fail",
    expectContactFormReady
      ? "Contact form readiness expectation requires enabled flag plus a valid approved inbox in the smoke environment"
      : "Contact form readiness was not expected, so no approved inbox env value is required",
  );
  addCheck(
    rows,
    "postdeploy.live.contact.state",
    expectContactFormReady
      ? (!hasDisabledContactFormCopy(contactHtml) ? "pass" : "fail")
      : (hasDisabledContactFormCopy(contactHtml) ? "pass" : "fail"),
    expectContactFormReady
      ? "Contact form was expected to be active and did not show the disabled-inbox copy"
      : "Contact form was expected to stay disabled until approved inbox provisioning",
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
  const routePublicationText = readSource("src/lib/seo/source-records/route-publication.ts");
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
    "postdeploy.contact.gated",
    contactFormText.includes("presidential-contact-form-status") &&
      contactFormText.includes("configured") &&
      contactConfigText.includes("PRESIDENTIAL_CONTACT_FORM_ENABLED") &&
      contactConfigText.includes("PRESIDENTIAL_CONTACT_INBOX_EMAIL"),
    "Contact form render path is present and gated by approved inbox env values",
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
