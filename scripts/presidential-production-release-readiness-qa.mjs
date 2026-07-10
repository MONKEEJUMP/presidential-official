import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { getRoutePublicationRuntimeState } from "./lib/route-publication-runtime-state.mjs";

const webRoot = process.cwd();
const providerLiveReadEnv =
  "PRESIDENTIAL_VERCEL_PROVIDER_READINESS_LIVE_READ";
const postdeployLiveEnv = "PRESIDENTIAL_PRODUCTION_POSTDEPLOY_SMOKE_LIVE";

function read(relativePath) {
  const filePath = path.join(webRoot, relativePath);
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function addGate(gates, id, passed, details) {
  gates.push({
    id,
    status: passed ? "pass" : "blocked",
    details,
    publicUnlock: false,
  });
}

const packageJson = JSON.parse(read("package.json"));
const providerSource = read(
  "scripts/presidential-production-provider-readiness-qa.mjs",
);
const ownerGateSource = read("src/lib/launch/owner-decision-gates.ts");
const strictRunnerSource = read("scripts/run-presidential-strict-release-verify.mjs");
const releaseScript = packageJson.scripts?.["release:verify"] ?? "";
const gates = [];
const routeState = getRoutePublicationRuntimeState();

addGate(
  gates,
  "release.providerLiveReadExplicit",
  process.env[providerLiveReadEnv] === "true",
  `${providerLiveReadEnv}=true is required before strict release verification can read provider state.`,
);
addGate(
  gates,
  "release.postdeployLiveSmokeExplicit",
  process.env[postdeployLiveEnv] === "true",
  `${postdeployLiveEnv}=true is required before strict release verification can fetch the live site.`,
);
addGate(
  gates,
  "release.ownerDecisionsClosed",
  !/status:\s*"(?:implemented_pending|blocked_pending)[^"]*"/.test(
    ownerGateSource,
  ),
  "Owner and legal decision records must contain no pending or blocked status.",
);
addGate(
  gates,
  "release.routePublicationApproved",
  routeState.approvedRecordCount > 0 && routeState.approvedRoutes.length > 0,
  `At least one fully approved route is required; records=${routeState.approvedRecordCount}, approved routes=${routeState.approvedRoutes.length}.`,
);
addGate(
  gates,
  "release.approvedRoutesSitemapEligible",
  routeState.approvedRoutes.length > 0 &&
    routeState.approvedRoutes.every((route) => route.sitemapEligible),
  "Every approved route must also have its registry indexability and sitemap state opened.",
);
addGate(
  gates,
  "release.providerDefaultIsOffline",
  providerSource.includes(`const liveReadEnv = "${providerLiveReadEnv}"`) &&
    providerSource.includes("const vercelAuthentication = liveProviderCheck") &&
    providerSource.includes("providerReadOperationCount === 0"),
  "Provider readiness performs zero provider read operations unless the explicit live-read flag is set.",
);
addGate(
  gates,
  "release.chainSeparated",
  releaseScript === "node scripts/run-presidential-strict-release-verify.mjs" &&
    strictRunnerSource.includes('PRESIDENTIAL_RELEASE_VERIFY_MODE: "strict-release"') &&
    strictRunnerSource.includes('"production:release-mode:verify"') &&
    strictRunnerSource.includes('"production:release-readiness:verify"') &&
    strictRunnerSource.includes('"db:live:strict-release"') &&
    strictRunnerSource.includes('"production:postdeploy-smoke:verify"') &&
    strictRunnerSource.includes('"production:sitemap-submission:verify"') &&
    !strictRunnerSource.includes('"verify:workspace"'),
  "Strict release uses a dedicated fail-fast runner and never reuses locked-state workspace verification.",
);

const blocked = gates.filter((gate) => gate.status === "blocked");
const payload = {
  verdict: blocked.length
    ? "BLOCKED_RELEASE_VERIFY_PENDING_REQUIRED_EVIDENCE"
    : "PASS_RELEASE_PREFLIGHT_REQUIRED_EVIDENCE_PRESENT",
  gates,
  blockedGateCount: blocked.length,
  deploymentExecuted: false,
  providerMutated: false,
  secretsPrinted: false,
  publicSeoUnlocked: false,
  routePublicationApproved: routeState.approvedRoutes.length > 0,
  approvedRouteIds: routeState.approvedRoutes.map((route) => route.routeId),
  sitemapUnlocked: false,
  indexabilityUnlocked: false,
};

console.log(JSON.stringify(payload, null, 2));
if (blocked.length) process.exit(1);
