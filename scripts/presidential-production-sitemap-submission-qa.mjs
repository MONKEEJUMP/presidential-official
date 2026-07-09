import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();

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

function scriptCommand(scripts, scriptName) {
  return typeof scripts[scriptName] === "string" ? scripts[scriptName] : "";
}

function main() {
  const rows = [];
  const packageJsonText = read("package.json");
  const packageJson = JSON.parse(packageJsonText);
  const scripts = packageJson.scripts ?? {};
  const scriptCommands = Object.values(scripts).join("\n");
  const sitemapSourceText = read("src/lib/seo/sitemap.ts");
  const sitemapRouteText = read("src/app/sitemap.ts");
  const routePublicationText = read("src/lib/seo/source-records/route-publication.ts");
  const launchReadinessText = read("scripts/presidential-production-launch-readiness-qa.mjs");
  const postdeployText = read("scripts/presidential-production-postdeploy-smoke-qa.mjs");
  const builtSitemapBody = read(".next/server/app/sitemap.xml.body");

  const builtSitemapExists = builtSitemapBody.length > 0;
  const builtSitemapUrlEntries = (builtSitemapBody.match(/<url>\s*<loc>/gi) ?? []).length;
  const routePublicationClosed = /APPROVED_ROUTE_PUBLICATIONS\s*=\s*\[\]/.test(routePublicationText);
  const routeSequencePresent =
    routePublicationText.includes("ROUTE_PUBLICATION_APPROVAL_SEQUENCE") &&
    routePublicationText.includes('"home"') &&
    routePublicationText.includes('"contact"');
  const sitemapUsesGate =
    sitemapSourceText.includes("isSitemapEligible(route)") &&
    sitemapSourceText.includes("!isRouteTemplate(route)") &&
    sitemapRouteText.includes("buildPresidentialSitemap");
  const postdeployChecksEmptyState =
    postdeployText.includes("postdeploy.live.sitemap.fetch") &&
    postdeployText.includes("notInSitemap") &&
    postdeployText.includes("sitemapUnlocked: false");
  const expectedHardFalseState =
    builtSitemapUrlEntries === 0 &&
    routePublicationClosed &&
    routeSequencePresent &&
    postdeployChecksEmptyState;
  const searchHandoffReady = builtSitemapUrlEntries > 0 && !routePublicationClosed;

  addCheck(
    rows,
    "sitemapSubmission.packageScript.present",
    scriptCommand(scripts, "production:sitemap-submission:verify") ===
      "node scripts/presidential-production-sitemap-submission-qa.mjs",
    "package script wires the sitemap handoff verifier",
  );
  addCheck(
    rows,
    "sitemapSubmission.verifyChain.includesGate",
    scriptCommand(scripts, "verify").includes("npm run production:sitemap-submission:verify"),
    "full verify runs the sitemap handoff readiness gate",
  );
  addCheck(
    rows,
    "sitemapSubmission.launchReadiness.includesGate",
    launchReadinessText.includes('"production:sitemap-submission:verify"'),
    "launch readiness requires the sitemap handoff verifier",
  );
  addCheck(
    rows,
    "sitemapSubmission.noProviderActionScripts",
    !/\bsearchconsole\b|\bwebmasters\b|\bsiteVerification\b|\bsitemaps\.submit\b/i.test(scriptCommands),
    "package scripts contain no search-provider submit or verification mutation command",
  );
  addCheck(
    rows,
    "sitemapSubmission.noNetworkMutationCode",
    !/\bfetch\s*\(|\brequest\s*\(|\bexecFile\s*\(|\bspawn\s*\(/.test(read("scripts/presidential-production-sitemap-submission-qa.mjs")),
    "this verifier is local-only and does not call a provider, shell out, or mutate state",
  );
  addCheck(
    rows,
    "sitemapSubmission.builtSitemap.present",
    builtSitemapExists,
    "built sitemap artifact must exist before evaluating submission readiness",
  );
  addCheck(
    rows,
    "sitemapSubmission.currentSitemap.empty",
    builtSitemapExists && builtSitemapUrlEntries === 0,
    `built sitemap URL entries: ${builtSitemapUrlEntries}`,
  );
  addCheck(
    rows,
    "sitemapSubmission.sitemapUsesRouteGate",
    sitemapUsesGate,
    "sitemap generation flows through the route/indexability gate and excludes templates",
  );
  addCheck(
    rows,
    "sitemapSubmission.routePublication.closed",
    routePublicationClosed,
    "route publication source remains empty until per-route records are added",
  );
  addCheck(
    rows,
    "sitemapSubmission.routePublication.sequencePresent",
    routeSequencePresent,
    "route-publication order is encoded before any public opening",
  );
  addCheck(
    rows,
    "sitemapSubmission.postdeployChecksSitemapState",
    postdeployChecksEmptyState,
    "post-deploy smoke verifies sitemap fetch and route absence from sitemap",
  );
  addCheck(
    rows,
    "sitemapSubmission.readyFalseUntilSignalsExist",
    !searchHandoffReady && expectedHardFalseState,
    "search-provider sitemap handoff is not ready while sitemap entries and route records are absent",
  );

  const failCount = rows.filter((row) => row.status === "fail").length;
  const passCount = rows.length - failCount;
  const verdict =
    failCount === 0
      ? "PASS_PRODUCTION_SITEMAP_SUBMISSION_GATE_LOCAL_NO_PROVIDER_ACTION"
      : "FAIL_PRODUCTION_SITEMAP_SUBMISSION_GATE_REVIEW_REQUIRED";

  console.log(JSON.stringify({
    verdict,
    passCount,
    failCount,
    builtSitemapUrlEntries,
    searchProviderSitemapHandoffReady: searchHandoffReady,
    providerActionExecuted: false,
    deploymentExecuted: false,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    secretsPrinted: false,
    checks: rows,
  }, null, 2));

  if (failCount > 0) process.exit(1);
}

main();
