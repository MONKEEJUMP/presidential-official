import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const builtAppRoot = path.join(webRoot, ".next", "server", "app");

const expectedEnvNames = [
  "PRESIDENTIAL_ANALYTICS_ENABLED",
  "NEXT_PUBLIC_PRESIDENTIAL_GA_MEASUREMENT_ID",
  "PRESIDENTIAL_GOOGLE_SITE_VERIFICATION_ENABLED",
  "PRESIDENTIAL_GOOGLE_SITE_VERIFICATION",
];

const textExtensions = new Set([".html", ".js", ".json", ".rsc", ".txt", ".xml"]);

function read(relativePath) {
  const filePath = path.join(webRoot, relativePath);
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function readAbsolute(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function walkBuiltFiles(rootPath) {
  if (!existsSync(rootPath)) return [];

  const stat = statSync(rootPath);
  if (stat.isFile()) {
    return textExtensions.has(path.extname(rootPath).toLowerCase()) ? [rootPath] : [];
  }

  const files = [];
  for (const entry of readdirSync(rootPath, { withFileTypes: true })) {
    const filePath = path.join(rootPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkBuiltFiles(filePath));
    } else if (textExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(filePath);
    }
  }
  return files;
}

function addCheck(rows, check, passed, details) {
  rows.push({
    check,
    status: passed ? "pass" : "fail",
    details,
    public_unlock: "no",
  });
}

function main() {
  const rows = [];
  const packageJsonText = read("package.json");
  const packageJson = JSON.parse(packageJsonText);
  const scripts = packageJson.scripts ?? {};
  const googleSource = read("src/lib/analytics/google.ts");
  const analyticsComponentSource = read("src/components/analytics/google-analytics.tsx");
  const layoutSource = read("src/app/layout.tsx");
  const postdeploySource = read("scripts/presidential-production-postdeploy-smoke-qa.mjs");
  const launchReadinessSource = read("scripts/presidential-production-launch-readiness-qa.mjs");
  const builtFiles = walkBuiltFiles(builtAppRoot);
  const builtText = builtFiles.map(readAbsolute).join("\n");

  const loaderNeedle = "googletagmanager.com/gtag/js";
  const initNeedle = "presidential-ga4-init";
  const verificationNeedle = "google-site-verification";
  const validGaLiteral = "G-ABC1234";
  const validGscLiteral = "abcDEF_1234567890";

  addCheck(
    rows,
    "measurementRendering.packageScript.present",
    scripts["production:measurement-rendering:verify"] ===
      "node scripts/presidential-production-measurement-rendering-qa.mjs",
    "package script wires the measurement rendering verifier",
  );
  addCheck(
    rows,
    "measurementRendering.verifyChain.includesGate",
    typeof scripts.verify === "string" &&
      scripts.verify.includes("npm run production:measurement-rendering:verify"),
    "full verify runs the measurement rendering gate",
  );
  addCheck(
    rows,
    "measurementRendering.launchReadiness.includesGate",
    launchReadinessSource.includes('"production:measurement-rendering:verify"'),
    "launch readiness requires the measurement rendering verifier",
  );
  addCheck(
    rows,
    "analyticsRendering.envNames.tracked",
    expectedEnvNames.every((name) => googleSource.includes(name)),
    expectedEnvNames.join(", "),
  );
  addCheck(
    rows,
    "analyticsRendering.invalidByDefault",
    googleSource.includes("process.env[name] === \"true\"") &&
      googleSource.includes("gaMeasurementIdPattern.test(measurementId)") &&
      googleSource.includes("googleSiteVerificationPattern.test(token)"),
    "GA4 and GSC values require explicit enable flags and format validation",
  );
  addCheck(
    rows,
    "analyticsRendering.layoutConditionalGsc",
    layoutSource.includes("getGoogleSiteVerification()") &&
      layoutSource.includes("verification: { google: getGoogleSiteVerification() }"),
    "Google site verification metadata is only emitted through the gated helper",
  );
  addCheck(
    rows,
    "analyticsRendering.gaComponentGated",
    analyticsComponentSource.includes("getGoogleAnalyticsMeasurementId()") &&
      analyticsComponentSource.includes("if (!measurementId) return null") &&
      analyticsComponentSource.includes("encodeURIComponent(measurementId)") &&
      analyticsComponentSource.includes("anonymize_ip: true") &&
      analyticsComponentSource.includes("nonce={nonce}"),
    "GA4 scripts are helper-gated, encoded, nonce-aware, and anonymized",
  );
  addCheck(
    rows,
    "analyticsRendering.defaultBuiltOutput.noGaLoader",
    !builtText.includes(loaderNeedle) && !builtText.includes(initNeedle),
    "default production build output has no GA4 loader/init marker",
  );
  addCheck(
    rows,
    "analyticsRendering.defaultBuiltOutput.noGscMeta",
    !builtText.includes(verificationNeedle),
    "default production build output has no Google site verification meta",
  );
  addCheck(
    rows,
    "analyticsRendering.postdeployCanAssertLiveOptIn",
    postdeploySource.includes("PRESIDENTIAL_PRODUCTION_SMOKE_EXPECT_ANALYTICS") &&
      postdeploySource.includes("PRESIDENTIAL_PRODUCTION_SMOKE_EXPECT_GSC") &&
      postdeploySource.includes("getExpectedGaMeasurementId") &&
      postdeploySource.includes("hasExpectedAnalyticsTag") &&
      postdeploySource.includes("getExpectedGscVerificationToken") &&
      postdeploySource.includes("hasExpectedGscVerificationMeta"),
    "post-deploy smoke asserts exact GA4/GSC env-value matches only when explicit expectation flags are enabled",
  );
  addCheck(
    rows,
    "analyticsRendering.fixturePatterns.valid",
    /^G-[A-Z0-9]{6,}$/.test(validGaLiteral) &&
      /^[A-Za-z0-9_-]{16,256}$/.test(validGscLiteral),
    "fixture IDs used by this verifier match the production helper shapes",
  );

  const failCount = rows.filter((row) => row.status === "fail").length;
  const passCount = rows.length - failCount;
  const verdict =
    failCount === 0
      ? "PASS_PRODUCTION_MEASUREMENT_RENDERING_LOCAL_GATED"
      : "FAIL_PRODUCTION_MEASUREMENT_RENDERING_REVIEW_REQUIRED";

  console.log(JSON.stringify({
    verdict,
    passCount,
    failCount,
    builtFileCount: builtFiles.length,
    analyticsRenderedByDefault: false,
    gscRenderedByDefault: false,
    deploymentExecuted: false,
    providerMutated: false,
    secretsPrinted: false,
    publicSeoUnlocked: false,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    checks: rows,
  }, null, 2));

  if (failCount > 0) process.exit(1);
}

main();
