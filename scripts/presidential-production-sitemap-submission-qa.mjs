import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  getRoutePublicationRuntimeState,
  routeStateMatchesMode as evaluateRouteStateMode,
  sitemapStateMatchesMode as evaluateSitemapStateMode,
} from "./lib/route-publication-runtime-state.mjs";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const workRoot = path.join(root, "sources", "spud", "work", "step11-production-sitemap-submission");
const statusJsonPath = path.join(workRoot, "step11-production-sitemap-submission-status.json");

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

function parseSitemapUrls(body) {
  return [...body.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => match[1]);
}

function writeFullArtifact(payload) {
  mkdirSync(workRoot, { recursive: true });
  writeFileSync(statusJsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function main() {
  const rows = [];
  const packageJsonText = read("package.json");
  const packageJson = JSON.parse(packageJsonText);
  const scripts = packageJson.scripts ?? {};
  const scriptCommands = Object.values(scripts).join("\n");
  const strictReleaseMode =
    process.env.PRESIDENTIAL_RELEASE_VERIFY_MODE === "strict-release";
  const routeState = getRoutePublicationRuntimeState();
  const sitemapSourceText = read("src/lib/seo/sitemap.ts");
  const sitemapRouteText = read("src/app/sitemap.ts");
  const routePublicationText = read("src/lib/seo/source-records/route-publication.ts");
  const launchReadinessText = read("scripts/presidential-production-launch-readiness-qa.mjs");
  const postdeployText = read("scripts/presidential-production-postdeploy-smoke-qa.mjs");
  const strictRunnerText = read("scripts/run-presidential-strict-release-verify.mjs");
  const builtSitemapBody = read(".next/server/app/sitemap.xml.body");

  const builtSitemapExists = builtSitemapBody.length > 0;
  const builtSitemapUrls = parseSitemapUrls(builtSitemapBody);
  const builtSitemapUrlEntries = builtSitemapUrls.length;
  const expectedSitemapUrls = routeState.sitemapEligibleRoutes.map(
    (route) => route.canonicalUrl,
  );
  const exactExpectedSitemap = evaluateSitemapStateMode(
    routeState,
    builtSitemapUrls,
    strictReleaseMode,
  );
  const approvedRoutesAreEligible =
    routeState.approvedRoutes.length > 0 &&
    routeState.approvedRoutes.every((route) => route.sitemapEligible);
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
    postdeployText.includes("expectedPublished") &&
    postdeployText.includes("sitemapContainsRoute");
  const routeStateMatchesMode = evaluateRouteStateMode(
    routeState,
    strictReleaseMode,
  );
  const sitemapStateMatchesMode = exactExpectedSitemap;
  const searchHandoffReady =
    strictReleaseMode && routeStateMatchesMode && sitemapStateMatchesMode;

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
    scriptCommand(scripts, "release:verify") ===
      "node scripts/run-presidential-strict-release-verify.mjs" &&
      strictRunnerText.includes('"production:sitemap-submission:verify"'),
    "the dedicated strict release runner executes the sitemap handoff readiness gate",
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
    "sitemapSubmission.currentSitemap.matchesMode",
    builtSitemapExists && sitemapStateMatchesMode,
    `mode=${strictReleaseMode ? "strict-release" : "locked"}; built=${builtSitemapUrlEntries}; expected=${expectedSitemapUrls.length}`,
  );
  addCheck(
    rows,
    "sitemapSubmission.sitemapUsesRouteGate",
    sitemapUsesGate,
    "sitemap generation flows through the route/indexability gate and excludes templates",
  );
  addCheck(
    rows,
    "sitemapSubmission.routePublication.matchesMode",
    routeStateMatchesMode,
    strictReleaseMode
      ? `approved routes=${routeState.approvedRoutes.length}; all must be sitemap eligible`
      : "route publication remains closed in default locked verification",
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
    strictReleaseMode ? searchHandoffReady : !searchHandoffReady,
    strictReleaseMode
      ? "search-provider handoff is ready only for the exact approved sitemap set"
      : "search-provider handoff remains false in locked verification",
  );

  const failCount = rows.filter((row) => row.status === "fail").length;
  const passCount = rows.length - failCount;
  const verdict =
    failCount === 0
      ? "PASS_PRODUCTION_SITEMAP_SUBMISSION_GATE_LOCAL_NO_PROVIDER_ACTION"
      : "FAIL_PRODUCTION_SITEMAP_SUBMISSION_GATE_REVIEW_REQUIRED";

  const payload = {
    verdict,
    passCount,
    failCount,
    builtSitemapUrlEntries,
    expectedSitemapUrls,
    strictReleaseMode,
    searchProviderSitemapHandoffReady: searchHandoffReady,
    providerActionExecuted: false,
    deploymentExecuted: false,
    routePublicationApproved: routeState.approvedRoutes.length > 0,
    sitemapUnlocked: searchHandoffReady,
    indexabilityUnlocked: approvedRoutesAreEligible,
    secretsPrinted: false,
    checks: rows,
  };

  writeFullArtifact(payload);

  console.log(JSON.stringify({
    verdict,
    passCount,
    failCount,
    builtSitemapUrlEntries,
    expectedSitemapUrls,
    strictReleaseMode,
    searchProviderSitemapHandoffReady: searchHandoffReady,
    providerActionExecuted: false,
    deploymentExecuted: false,
    routePublicationApproved: routeState.approvedRoutes.length > 0,
    sitemapUnlocked: searchHandoffReady,
    indexabilityUnlocked: approvedRoutesAreEligible,
    secretsPrinted: false,
    fullArtifact: statusJsonPath,
  }, null, 2));

  if (failCount > 0) process.exit(1);
}

main();
