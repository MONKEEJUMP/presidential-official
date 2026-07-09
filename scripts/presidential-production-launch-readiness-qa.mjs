import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();

const requiredScripts = [
  "production:env-contract:verify",
  "production:provider-readiness:verify",
  "production:canonical-host:verify",
  "production:postdeploy-smoke:verify",
  "production:sitemap-submission:verify",
  "production:live-action-boundary:verify",
  "production:measurement-rendering:verify",
  "production:launch-readiness:verify",
];

const expectedProductionEnvNames = [
  "PRESIDENTIAL_SANITY_READ_CLIENT_ENABLED",
  "PRESIDENTIAL_HOMEPAGE_CMS_RENDERING_ENABLED",
  "PRESIDENTIAL_SITE_PAGE_CMS_RENDERING_ENABLED",
  "PRESIDENTIAL_LEARN_GUIDE_CMS_RENDERING_ENABLED",
  "PRESIDENTIAL_PRIVATE_DRAFTS_ROUTE_ENABLED",
  "PRESIDENTIAL_SANITY_DRAFT_READ_ENABLED",
  "PRESIDENTIAL_ANALYTICS_ENABLED",
  "NEXT_PUBLIC_PRESIDENTIAL_GA_MEASUREMENT_ID",
  "PRESIDENTIAL_GOOGLE_SITE_VERIFICATION_ENABLED",
  "PRESIDENTIAL_GOOGLE_SITE_VERIFICATION",
  "SANITY_AUTH_TOKEN",
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
  const envContractText = read("scripts/presidential-production-env-contract-qa.mjs");
  const providerText = read("scripts/presidential-production-provider-readiness-qa.mjs");
  const canonicalText = read("scripts/presidential-production-canonical-host-qa.mjs");
  const postdeployText = read("scripts/presidential-production-postdeploy-smoke-qa.mjs");
  const sitemapSubmissionText = read("scripts/presidential-production-sitemap-submission-qa.mjs");
  const liveActionBoundaryText = read("scripts/presidential-production-live-action-boundary-qa.mjs");
  const measurementRenderingText = read("scripts/presidential-production-measurement-rendering-qa.mjs");
  const proxyText = read("src/proxy.ts");
  const analyticsText = read("src/components/analytics/google-analytics.tsx");
  const googleText = read("src/lib/analytics/google.ts");
  const routePublicationText = read("src/lib/seo/source-records/route-publication.ts");

  addCheck(
    rows,
    "launchReadiness.packageScripts.present",
    requiredScripts.every((scriptName) => typeof scripts[scriptName] === "string"),
    requiredScripts.join(", "),
  );
  addCheck(
    rows,
    "launchReadiness.verifyChain.includesS11",
    requiredScripts.every((scriptName) => scripts.verify.includes(`npm run ${scriptName}`)),
    "full verify runs every S11 local-readiness gate",
  );
  addCheck(
    rows,
    "launchReadiness.noDeployCommands",
    !/\bvercel\s+(?:deploy|promote|alias)\b|\bvercel\b[^\n\r]*--prod\b/.test(scriptCommands),
    "package scripts contain no Vercel release, promote, alias, or production release command",
  );
  addCheck(
    rows,
    "launchReadiness.noVercelEnvWrites",
    !/\bvercel\s+env\s+(?:add|pull|rm|remove)\b/i.test(scriptCommands),
    "package scripts contain no Vercel env write or pull command",
  );
  addCheck(
    rows,
    "launchReadiness.envContract.tracksExpectedNames",
    expectedProductionEnvNames.every((name) => envContractText.includes(`"${name}"`)),
    expectedProductionEnvNames.join(", "),
  );
  addCheck(
    rows,
    "launchReadiness.provider.restReadOnly",
    providerText.includes("https://api.vercel.com/v10/projects/") &&
      providerText.includes('method: "GET"') &&
      providerText.includes('url.searchParams.set("decrypt", "false")') &&
      providerText.includes("productionNames.has(name)") &&
      providerText.includes("deploymentExecuted: false") &&
      providerText.includes("providerMutated: false"),
    "Vercel REST env readiness path is metadata-only and records no deploy/no mutation posture",
  );
  addCheck(
    rows,
    "launchReadiness.provider.noCliTokenArgument",
    !providerText.includes("--token"),
    "VERCEL_TOKEN is not passed as a CLI command-line argument",
  );
  addCheck(
    rows,
    "launchReadiness.canonicalRedirect.apexLocked",
    proxyText.includes('const canonicalHostname = "presidentialmoonrocks.com"') &&
      proxyText.includes('"www.presidentialmoonrocks.com"') &&
      proxyText.includes("NextResponse.redirect(url, 308)") &&
      canonicalText.includes("www.presidentialmoonrocks.com"),
    "apex canonical host and defensive www redirect are wired",
  );
  addCheck(
    rows,
    "launchReadiness.analyticsAndGsc.gated",
    analyticsText.includes("getGoogleAnalyticsMeasurementId") &&
      analyticsText.includes("presidential-ga4-loader") &&
      googleText.includes("PRESIDENTIAL_ANALYTICS_ENABLED") &&
      googleText.includes("NEXT_PUBLIC_PRESIDENTIAL_GA_MEASUREMENT_ID") &&
      googleText.includes("PRESIDENTIAL_GOOGLE_SITE_VERIFICATION_ENABLED") &&
      googleText.includes("PRESIDENTIAL_GOOGLE_SITE_VERIFICATION"),
    "GA4 and Google Search Console render only through explicit env gates",
  );
  addCheck(
    rows,
    "launchReadiness.postdeploy.liveExplicitOnly",
    postdeployText.includes("PRESIDENTIAL_PRODUCTION_POSTDEPLOY_SMOKE_LIVE") &&
      postdeployText.includes("set PRESIDENTIAL_PRODUCTION_POSTDEPLOY_SMOKE_LIVE=true") &&
      postdeployText.includes("deploymentExecuted: false") &&
      postdeployText.includes("secretsPrinted: false"),
    "post-deploy smoke is explicit-live only and records no deploy/no secret output posture",
  );
  addCheck(
    rows,
    "launchReadiness.sitemapSubmission.localGate",
    sitemapSubmissionText.includes("PASS_PRODUCTION_SITEMAP_SUBMISSION_GATE_LOCAL_NO_PROVIDER_ACTION") &&
      sitemapSubmissionText.includes("searchProviderSitemapHandoffReady") &&
      sitemapSubmissionText.includes("providerActionExecuted: false") &&
      sitemapSubmissionText.includes("sitemapUnlocked: false"),
    "sitemap handoff remains local-only and false until built sitemap entries plus route records exist",
  );
  addCheck(
    rows,
    "launchReadiness.liveActionBoundary.localOnly",
    liveActionBoundaryText.includes("PASS_PRODUCTION_LIVE_ACTION_BOUNDARY_LOCAL_ONLY") &&
      liveActionBoundaryText.includes("liveProviderActionsExecuted: false") &&
      liveActionBoundaryText.includes("envWriteExecuted: false") &&
      liveActionBoundaryText.includes("searchProviderActionExecuted: false"),
    "live launch actions remain local-only, opt-in, and absent from package scripts by default",
  );
  addCheck(
    rows,
    "launchReadiness.measurementRendering.localGate",
    measurementRenderingText.includes("PASS_PRODUCTION_MEASUREMENT_RENDERING_LOCAL_GATED") &&
      measurementRenderingText.includes("analyticsRenderedByDefault: false") &&
      measurementRenderingText.includes("gscRenderedByDefault: false") &&
      measurementRenderingText.includes("deploymentExecuted: false"),
    "analytics and Google site verification are locally proven gated and absent from default build output",
  );
  addCheck(
    rows,
    "launchReadiness.routePublication.closed",
    /APPROVED_ROUTE_PUBLICATIONS\s*=\s*\[\]/.test(routePublicationText),
    "route publication stays empty until per-route approval records are added",
  );

  const failCount = rows.filter((row) => row.status === "fail").length;
  const passCount = rows.length - failCount;
  const verdict =
    failCount === 0
      ? "PASS_PRODUCTION_LAUNCH_READINESS_LOCAL_NO_DEPLOY_NO_PUBLIC_UNLOCK"
      : "FAIL_PRODUCTION_LAUNCH_READINESS_REVIEW_REQUIRED";

  console.log(JSON.stringify({
    verdict,
    passCount,
    failCount,
    deploymentExecuted: false,
    providerMutated: false,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    secretsPrinted: false,
    checks: rows,
  }, null, 2));

  if (failCount > 0) process.exit(1);
}

main();
