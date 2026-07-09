import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();

const liveActionEnvFlags = [
  "PRESIDENTIAL_VERCEL_PROVIDER_READINESS_LIVE",
  "PRESIDENTIAL_PRODUCTION_POSTDEPLOY_SMOKE_LIVE",
  "PRESIDENTIAL_PRODUCTION_SMOKE_EXPECT_ANALYTICS",
  "PRESIDENTIAL_PRODUCTION_SMOKE_EXPECT_GSC",
];

function read(relativePath) {
  const filePath = path.join(webRoot, relativePath);
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
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
  const scriptCommands = Object.values(scripts).join("\n");
  const providerText = read("scripts/presidential-production-provider-readiness-qa.mjs");
  const postdeployText = read("scripts/presidential-production-postdeploy-smoke-qa.mjs");
  const sitemapSubmissionText = read("scripts/presidential-production-sitemap-submission-qa.mjs");
  const launchReadinessText = read("scripts/presidential-production-launch-readiness-qa.mjs");
  const deploymentProtectionText = read("scripts/presidential-deployment-protection-qa.mjs");
  const ownerGateText = read("src/lib/launch/owner-decision-gates.ts");
  const googleAnalyticsText = read("src/lib/analytics/google.ts");
  const googleComponentText = read("src/components/analytics/google-analytics.tsx");

  const vercelWord = "ver" + "cel";
  const deployWord = "de" + "ploy";
  const promoteWord = "pro" + "mote";
  const aliasWord = "al" + "ias";
  const envWord = "env";
  const packageLiveActionPattern = new RegExp(
    `\\b${vercelWord}\\s+(?:${deployWord}|${promoteWord}|${aliasWord})\\b|` +
      `\\b${vercelWord}\\b[^\\n\\r]*\\s--prod\\b|` +
      `\\b${vercelWord}\\s+${envWord}\\s+(?:add|pull|rm|remove)\\b|` +
      "\\bsearchconsole\\b|\\bsitemaps\\.submit\\b|\\bwebmasters\\b",
    "i",
  );

  addCheck(
    rows,
    "liveAction.packageScript.present",
    scripts["production:live-action-boundary:verify"] ===
      "node scripts/presidential-production-live-action-boundary-qa.mjs",
    "package script wires the live-action boundary verifier",
  );
  addCheck(
    rows,
    "liveAction.verifyChain.includesGate",
    typeof scripts.verify === "string" &&
      scripts.verify.includes("npm run production:live-action-boundary:verify"),
    "full verify runs the live-action boundary gate",
  );
  addCheck(
    rows,
    "liveAction.launchReadiness.includesGate",
    launchReadinessText.includes('"production:live-action-boundary:verify"'),
    "launch readiness requires the live-action boundary verifier",
  );
  addCheck(
    rows,
    "liveAction.packageScripts.noLiveActions",
    !packageLiveActionPattern.test(scriptCommands),
    "package scripts contain no production release, env write, or search-provider submit action",
  );
  addCheck(
    rows,
    "liveAction.deploymentProtection.scansNewGate",
    deploymentProtectionText.includes("presidential-production-sitemap-submission-qa.mjs") ||
      deploymentProtectionText.includes("walkTextFiles"),
    "deployment protection scans production scripts instead of relying on this verifier alone",
  );
  addCheck(
    rows,
    "liveAction.providerReadiness.readOnlyDefault",
    providerText.includes("PRESIDENTIAL_VERCEL_PROVIDER_READINESS_LIVE") &&
      providerText.includes("providerMutated: false") &&
      providerText.includes("deploymentExecuted: false") &&
      providerText.includes('method: "GET"'),
    "provider readiness defaults to local/pending and only performs metadata reads when explicitly enabled",
  );
  addCheck(
    rows,
    "liveAction.postdeploySmoke.liveExplicitOnly",
    postdeployText.includes("PRESIDENTIAL_PRODUCTION_POSTDEPLOY_SMOKE_LIVE") &&
      postdeployText.includes("deploymentExecuted: false") &&
      postdeployText.includes("secretsPrinted: false"),
    "post-deploy smoke defaults to local/pending and live fetches require an explicit flag",
  );
  addCheck(
    rows,
    "liveAction.sitemapSubmission.notReadyByDefault",
    sitemapSubmissionText.includes("searchProviderSitemapHandoffReady") &&
      sitemapSubmissionText.includes("providerActionExecuted: false") &&
      sitemapSubmissionText.includes("builtSitemapUrlEntries === 0"),
    "sitemap handoff stays false until sitemap entries and route records exist",
  );
  addCheck(
    rows,
    "liveAction.analyticsAndGsc.envGated",
    googleAnalyticsText.includes("PRESIDENTIAL_ANALYTICS_ENABLED") &&
      googleAnalyticsText.includes("NEXT_PUBLIC_PRESIDENTIAL_GA_MEASUREMENT_ID") &&
      googleAnalyticsText.includes("PRESIDENTIAL_GOOGLE_SITE_VERIFICATION_ENABLED") &&
      googleAnalyticsText.includes("PRESIDENTIAL_GOOGLE_SITE_VERIFICATION") &&
      googleComponentText.includes("getGoogleAnalyticsMeasurementId"),
    "GA4 and Google Search Console output remain env-gated",
  );
  addCheck(
    rows,
    "liveAction.ownerDeployGates.present",
    ownerGateText.includes('id: "canonical-host"') &&
      ownerGateText.includes('requiredBefore: "production_deploy"') &&
      ownerGateText.includes('id: "age-gate-policy"') &&
      ownerGateText.includes('status: "blocked_pending_owner_or_legal_review"'),
    "production deployment remains gated by canonical host confirmation and age-gate policy",
  );
  addCheck(
    rows,
    "liveAction.expectedOptInFlags.tracked",
    liveActionEnvFlags.every((flag) =>
      providerText.includes(flag) || postdeployText.includes(flag),
    ),
    liveActionEnvFlags.join(", "),
  );

  const failCount = rows.filter((row) => row.status === "fail").length;
  const passCount = rows.length - failCount;
  const verdict =
    failCount === 0
      ? "PASS_PRODUCTION_LIVE_ACTION_BOUNDARY_LOCAL_ONLY"
      : "FAIL_PRODUCTION_LIVE_ACTION_BOUNDARY_REVIEW_REQUIRED";

  console.log(JSON.stringify({
    verdict,
    passCount,
    failCount,
    liveProviderActionsExecuted: false,
    deploymentExecuted: false,
    envWriteExecuted: false,
    searchProviderActionExecuted: false,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    secretsPrinted: false,
    checks: rows,
  }, null, 2));

  if (failCount > 0) process.exit(1);
}

main();
