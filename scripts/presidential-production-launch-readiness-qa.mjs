import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { expectedProductionEnvNames } from "./presidential-production-env-contract.mjs";
import {
  getRoutePublicationRuntimeState,
  routeStateMatchesMode,
} from "./lib/route-publication-runtime-state.mjs";

const webRoot = process.cwd();

const requiredScripts = [
  "production:env-contract:verify",
  "production:provider-readiness:verify",
  "production:canonical-host:verify",
  "production:postdeploy-smoke:verify",
  "production:sitemap-submission:verify",
  "production:live-action-boundary:verify",
  "production:measurement-rendering:verify",
  "production:lockfile-reproducibility:verify",
  "production:release-mode:verify",
  "production:launch-readiness:verify",
  "production:owner-gates:verify",
];

function read(relativePath) {
  const filePath = path.join(webRoot, relativePath);
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function ownerGateBlock(source, id) {
  const match = source.match(new RegExp(`\\{\\s*id:\\s*"${id}"[\\s\\S]*?\\n\\s*\\}`));
  return match?.[0] ?? "";
}

function ownerGateMatches(source, id, expected) {
  const block = ownerGateBlock(source, id);
  return Object.entries(expected).every(([key, value]) => block.includes(`${key}: "${value}"`));
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
  const strictReleaseMode =
    process.env.PRESIDENTIAL_RELEASE_VERIFY_MODE === "strict-release";
  const strictRunnerText = read("scripts/run-presidential-strict-release-verify.mjs");
  const routeState = getRoutePublicationRuntimeState();
  const envContractText = read("scripts/presidential-production-env-contract-qa.mjs");
  const envContractSourceText = read("scripts/presidential-production-env-contract.mjs");
  const providerText = read("scripts/presidential-production-provider-readiness-qa.mjs");
  const canonicalText = read("scripts/presidential-production-canonical-host-qa.mjs");
  const postdeployText = read("scripts/presidential-production-postdeploy-smoke-qa.mjs");
  const sitemapSubmissionText = read("scripts/presidential-production-sitemap-submission-qa.mjs");
  const liveActionBoundaryText = read("scripts/presidential-production-live-action-boundary-qa.mjs");
  const measurementRenderingText = read("scripts/presidential-production-measurement-rendering-qa.mjs");
  const lockfileReproducibilityText = read("scripts/presidential-production-lockfile-reproducibility-qa.mjs");
  const ownerGateText = read("src/lib/launch/owner-decision-gates.ts");
  const contactConfigText = read("src/app/contact/contact-inquiry-config.ts");
  const contactFormText = read("src/app/contact/contact-inquiry-form.tsx");
  const proxyText = read("src/proxy.ts");
  const analyticsText = read("src/components/analytics/google-analytics.tsx");
  const googleText = read("src/lib/analytics/google.ts");
  const routePublicationText = read("src/lib/seo/source-records/route-publication.ts");
  const routeEvidenceTrackerText = read("scripts/presidential-route-evidence-tracker-qa.mjs");

  addCheck(
    rows,
    "launchReadiness.packageScripts.present",
    requiredScripts.every((scriptName) => typeof scripts[scriptName] === "string"),
    requiredScripts.join(", "),
  );
  addCheck(
    rows,
    "launchReadiness.verifyChain.includesS11",
    requiredScripts.every((scriptName) =>
      `${scripts["verify:web"] ?? ""}`.includes(`npm run ${scriptName}`) ||
      strictRunnerText.includes(`"${scriptName}"`),
    ),
    "complete web verification or the strict release runner executes every S11 readiness gate",
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
    expectedProductionEnvNames.every((name) => envContractSourceText.includes(`"${name}"`)) &&
      envContractText.includes("expectedProductionEnvNames"),
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
      read("src/app/layout.tsx").includes("adultConfirmed ? <GoogleAnalytics nonce={nonce} /> : null") &&
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
    "launchReadiness.contactPostdeploySmoke.gated",
    contactConfigText.includes("PRESIDENTIAL_CONTACT_MAILTO_ENABLED") &&
      contactConfigText.includes("PRESIDENTIAL_CONTACT_INBOX_EMAIL") &&
      contactFormText.includes("presidential-contact-mailto") &&
      !contactFormText.includes("<form") &&
      postdeployText.includes("PRESIDENTIAL_PRODUCTION_SMOKE_EXPECT_CONTACT_MAILTO_READY") &&
      postdeployText.includes("postdeploy.live.contact.noServerForm") &&
      postdeployText.includes("postdeploy.live.contact.expectedEnvValid") &&
      postdeployText.includes("postdeploy.live.contact.noThirdPartyProvider") &&
      liveActionBoundaryText.includes("PRESIDENTIAL_PRODUCTION_SMOKE_EXPECT_CONTACT_MAILTO_READY"),
    "Contact mailto handling is env-gated, form-free, hidden by default, and covered by explicit smoke expectations",
  );
  addCheck(
    rows,
    "launchReadiness.sitemapSubmission.localGate",
    sitemapSubmissionText.includes("strictReleaseMode") &&
      sitemapSubmissionText.includes("exactExpectedSitemap") &&
      sitemapSubmissionText.includes("searchProviderSitemapHandoffReady") &&
      sitemapSubmissionText.includes("providerActionExecuted: false"),
    "sitemap handoff is local-only and validates either the locked empty state or the exact approved release set",
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
    "launchReadiness.lockfileReproducibility.localGate",
    lockfileReproducibilityText.includes('["ci", "--dry-run", "--ignore-scripts"]') &&
      lockfileReproducibilityText.includes("packageLockChanged: false") &&
      lockfileReproducibilityText.includes("dependencyVersionsChanged: false") &&
      lockfileReproducibilityText.includes("deploymentExecuted: false"),
    "lockfile reproducibility is locally proven with npm ci dry-run and no dependency upgrades or deploy action",
  );
  addCheck(
    rows,
    "launchReadiness.routePublication.matchesMode",
    routeStateMatchesMode(routeState, strictReleaseMode),
    strictReleaseMode
      ? "strict release requires approved routes with matching registry and sitemap state"
      : "default verification requires route publication to remain closed",
  );
  addCheck(
    rows,
    "launchReadiness.routePublication.scaffoldsWired",
    routePublicationText.includes("ROUTE_PUBLICATION_EVIDENCE_CATEGORIES") &&
      routePublicationText.includes("getRoutePublicationEvidenceScaffolds") &&
      routePublicationText.includes("ROUTE_PUBLICATION_EVIDENCE_SCAFFOLDS") &&
      routePublicationText.includes("canUnlock: false"),
    "launch route publication evidence scaffolds are wired but cannot unlock routes",
  );
  addCheck(
    rows,
    "launchReadiness.routeEvidenceTracker.scaffoldGate",
    routeEvidenceTrackerText.includes("expectedRoutePublicationEvidenceCategories") &&
      routeEvidenceTrackerText.includes("tracker.routePublicationScaffolds.categoriesExact") &&
      routeEvidenceTrackerText.includes("tracker.routePublicationScaffolds.noUnlock") &&
      routeEvidenceTrackerText.includes("tracker.routePublicationScaffolds.trackerRoutesCovered") &&
      routeEvidenceTrackerText.includes("presidential-route-evidence-tracker-${process.pid}"),
    "route evidence tracker proves exact S10 categories, no-unlock state, tracker coverage, and process-scoped compile output",
  );
  addCheck(
    rows,
    "launchReadiness.ownerDecisionGates.enforced",
    strictReleaseMode
      ? [
          "canonical-host",
          "age-gate-policy",
          "presidential-thc-legal-framing",
          "brand-teal-font",
        ].every((id) => {
          const block = ownerGateBlock(ownerGateText, id);
          return block.length > 0 && !/status:\s*"[^"]*pending/i.test(block);
        })
      : ownerGateMatches(ownerGateText, "canonical-host", {
          status: "implemented_pending_live_confirmation",
          requiredBefore: "production_deploy",
        }) &&
        ownerGateMatches(ownerGateText, "age-gate-policy", {
          status: "blocked_pending_owner_or_legal_review",
          requiredBefore: "production_deploy",
        }) &&
        ownerGateMatches(ownerGateText, "presidential-thc-legal-framing", {
          status: "blocked_pending_owner_or_legal_review",
          requiredBefore: "public_route_unlock",
        }) &&
        ownerGateMatches(ownerGateText, "brand-teal-font", {
          status: "blocked_pending_final_brand_choice",
          requiredBefore: "public_route_unlock",
        }),
    strictReleaseMode
      ? "strict release requires every owner decision gate to be closed"
      : "locked verification requires exact pending owner decision records",
  );

  const failCount = rows.filter((row) => row.status === "fail").length;
  const passCount = rows.length - failCount;
  const verdict = failCount === 0
    ? strictReleaseMode
      ? "PASS_PRODUCTION_LAUNCH_READINESS_STRICT_RELEASE"
      : "PASS_PRODUCTION_LAUNCH_READINESS_LOCAL_LOCKED"
    : "FAIL_PRODUCTION_LAUNCH_READINESS_REVIEW_REQUIRED";

  console.log(JSON.stringify({
    verdict,
    passCount,
    failCount,
    strictReleaseMode,
    deploymentExecuted: false,
    providerMutated: false,
    routePublicationApproved: routeState.approvedRoutes.length > 0,
    sitemapUnlocked: strictReleaseMode && routeState.sitemapEligibleRoutes.length > 0,
    indexabilityUnlocked: strictReleaseMode && routeState.approvedRoutes.length > 0,
    secretsPrinted: false,
    checks: rows,
  }, null, 2));

  if (failCount > 0) process.exit(1);
}

main();
