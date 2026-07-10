import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();

function read(relativePath) {
  const filePath = path.join(webRoot, relativePath);
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function walkSource(relativePath) {
  const targetPath = path.join(webRoot, relativePath);
  if (!existsSync(targetPath)) return [];
  if (statSync(targetPath).isFile()) return [targetPath];

  return readdirSync(targetPath, { withFileTypes: true }).flatMap((entry) => {
    const childPath = path.join(targetPath, entry.name);
    return entry.isDirectory()
      ? walkSource(path.relative(webRoot, childPath))
      : /\.(?:js|jsx|ts|tsx)$/.test(entry.name)
        ? [childPath]
        : [];
  });
}

function addCheck(checks, id, passed, details) {
  checks.push({
    id,
    status: passed ? "pass" : "fail",
    details,
    publicUnlock: false,
  });
}

const packageJson = JSON.parse(read("package.json"));
const constantsSource = read("src/app/age-gate-constants.ts");
const actionSource = read("src/app/age-gate-actions.ts");
const gateSource = read("src/components/age-gate.tsx");
const layoutSource = read("src/app/layout.tsx");
const proxySource = read("src/proxy.ts");
const analyticsSource = read("src/components/analytics/google-analytics.tsx");
const publicSource = walkSource("src")
  .map((filePath) => readFileSync(filePath, "utf8"))
  .join("\n");
const checks = [];

addCheck(
  checks,
  "age.cookieOnlyAuthority",
  constantsSource.includes('ADULT_CONFIRMATION_COOKIE = "presidential_adult_confirmed"') &&
    actionSource.includes('"use server";') &&
    actionSource.includes("cookieStore.set(ADULT_CONFIRMATION_COOKIE, \"true\"") &&
    actionSource.includes("httpOnly: true") &&
    actionSource.includes('sameSite: "lax"') &&
    actionSource.includes('path: "/"') &&
    !/localStorage|sessionStorage|indexedDB/.test(gateSource),
  "The HTTP-only adult cookie is the sole persistent age-confirmation authority.",
);
addCheck(
  checks,
  "age.unlockAfterCookieWrite",
  gateSource.indexOf("await confirmAdultAccess()") >= 0 &&
    gateSource.indexOf("await confirmAdultAccess()") <
      gateSource.indexOf('setStatus("accepted")'),
  "The client unlocks gated content only after the server action sets the cookie.",
);
addCheck(
  checks,
  "analytics.layoutRequiresAdultCookie",
  layoutSource.includes("cookies()).get(ADULT_CONFIRMATION_COOKIE)?.value === \"true\"") &&
    layoutSource.includes("adultConfirmed ? <GoogleAnalytics nonce={nonce} /> : null"),
  "The root layout omits GA markup until the adult cookie is valid.",
);
addCheck(
  checks,
  "analytics.cspRequiresAdultCookie",
  proxySource.includes("request.cookies.get(ADULT_CONFIRMATION_COOKIE)?.value === \"true\"") &&
    proxySource.includes("adultConfirmed && isGoogleAnalyticsEnabled()") &&
    proxySource.includes("analyticsAllowed ? \"https://www.googletagmanager.com\" : \"\""),
  "The proxy omits GA script/connect/image hosts from CSP until the adult cookie is valid.",
);
addCheck(
  checks,
  "analytics.envGateStillRequired",
  analyticsSource.includes("getGoogleAnalyticsMeasurementId()") &&
    analyticsSource.includes("if (!measurementId) return null"),
  "Adult confirmation does not bypass the existing analytics environment gate.",
);
addCheck(
  checks,
  "storage.noClientPersistence",
  !/localStorage|sessionStorage|indexedDB|document\.cookie/.test(publicSource),
  "Public source contains no client-side storage or script-readable cookie authority.",
);
addCheck(
  checks,
  "package.readOnlyRegressionWired",
  packageJson.scripts?.["security:browser-storage:verify"] ===
    "node scripts/presidential-browser-storage-consent-qa.mjs",
  "The read-only browser-storage regression check remains wired.",
);

const failed = checks.filter((check) => check.status === "fail");
const payload = {
  verdict: failed.length
    ? "FAIL_BROWSER_STORAGE_CONSENT_REVIEW_REQUIRED"
    : "PASS_BROWSER_STORAGE_COOKIE_AUTHORITY_NO_PUBLIC_UNLOCK",
  checks,
  analyticsApproved: false,
  publicSeoUnlocked: false,
  routePublicationApproved: false,
  sitemapUnlocked: false,
  indexabilityUnlocked: false,
};

console.log(JSON.stringify(payload, null, 2));
if (failed.length) process.exit(1);
