import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();

function read(relativePath) {
  const filePath = path.join(webRoot, relativePath);
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function addCheck(checks, id, passed, details) {
  checks.push({ id, status: passed ? "pass" : "fail", details });
}

const packageJson = JSON.parse(read("package.json"));
const packageLock = JSON.parse(read("package-lock.json"));
const workflow = read(".github/workflows/web-app-gates.yml");
const lighthouse = read("lighthouserc.cjs");
const provider = read("scripts/presidential-production-provider-readiness-qa.mjs");
const release = read("scripts/presidential-production-release-readiness-qa.mjs");
const strictReleaseRunner = read("scripts/run-presidential-strict-release-verify.mjs");
const ageGate = read("src/components/age-gate.tsx");
const layout = read("src/app/layout.tsx");
const contact = read("src/app/contact/contact-inquiry-form.tsx");
const sitemap = read("src/lib/seo/sitemap.ts");
const publication = read("src/lib/seo/source-records/route-publication.ts");
const cmsModuleCoverage = read("scripts/presidential-cms-module-renderer-coverage-qa.mjs");
const routeEvidenceTracker = read("scripts/presidential-route-evidence-tracker-qa.mjs");
const scripts = packageJson.scripts ?? {};
const checks = [];
const requiredLockedSeoAuditAssertions = [
  "document-title",
  "meta-description",
  "http-status-code",
  "link-text",
  "crawlable-anchors",
  "robots-txt",
  "image-alt",
  "hreflang",
  "canonical",
];

addCheck(
  checks,
  "runtime.nodeMajorConstrained",
  packageJson.engines?.node === ">=24.13.0 <25" &&
    packageLock.packages?.[""]?.engines?.node === ">=24.13.0 <25",
  "package and lock metadata constrain Node to the supported 24.x line.",
);
addCheck(
  checks,
  "runtime.packageManagerExact",
  packageJson.packageManager === "npm@11.6.2",
  "packageManager pins the exact npm version used to produce the lockfile.",
);
addCheck(
  checks,
  "verify.lanesSeparated",
  scripts.verify === "npm run verify:web" &&
    scripts["verify:web"]?.includes("npm run cms:verify") &&
    scripts["verify:web"]?.includes("npm run seo:verify:built") &&
    scripts["verify:web"]?.includes("npm run test:launch-controls") &&
    scripts["verify:workspace"]?.includes("npm run db:schema:verify") &&
    !scripts["verify:workspace"]?.includes("npm run build") &&
    scripts["release:verify"] ===
      "node scripts/run-presidential-strict-release-verify.mjs" &&
    strictReleaseRunner.includes('PRESIDENTIAL_RELEASE_VERIFY_MODE: "strict-release"') &&
    strictReleaseRunner.includes('"production:release-mode:verify"') &&
    strictReleaseRunner.includes('"db:live:strict-release"') &&
    !strictReleaseRunner.includes('"verify:workspace"'),
  "Locked app, parent workspace, and strict release verification are distinct lanes.",
);
addCheck(
  checks,
  "release.pendingEvidenceFailsClosed",
  release.includes("BLOCKED_RELEASE_VERIFY_PENDING_REQUIRED_EVIDENCE") &&
    release.includes("release.providerLiveReadExplicit") &&
    release.includes("release.postdeployLiveSmokeExplicit") &&
    release.includes("release.ownerDecisionsClosed") &&
    release.includes("release.routePublicationApproved"),
  "Strict release verification blocks pending provider, live-smoke, owner, and publication evidence.",
);
addCheck(
  checks,
  "provider.noDefaultVercelCall",
  provider.includes(
    'const liveReadEnv = "PRESIDENTIAL_VERCEL_PROVIDER_READINESS_LIVE_READ"',
  ) &&
    provider.includes("const vercelAuthentication = liveProviderCheck") &&
    provider.includes("providerReadOperationCount === 0"),
  "Provider authentication and metadata reads require the explicit live-read flag.",
);
addCheck(
  checks,
  "analytics.adultCookieRequired",
  !/localStorage|sessionStorage/.test(ageGate) &&
    ageGate.includes("await confirmAdultAccess()") &&
    layout.includes("adultConfirmed ? <GoogleAnalytics nonce={nonce} /> : null"),
  "The cookie write completes before unlock and GA is absent without the adult cookie.",
);
addCheck(
  checks,
  "contact.mailtoOnly",
  contact.includes("`mailto:${encodeURIComponent(inbox)}`") &&
    !/"use server"|useActionState|<form\b|<input\b|<textarea\b/.test(contact),
  "Contact exposes only an env-gated mailto link and no submission surface.",
);
addCheck(
  checks,
  "ci.selfContainedAndPinned",
  workflow.includes("npm run verify") &&
    workflow.includes("npm run lhci") &&
    /permissions:\s*\r?\n\s+contents:\s*read/.test(workflow) &&
    workflow.includes("persist-credentials: false") &&
    /actions\/checkout@[0-9a-f]{40}/.test(workflow) &&
    /actions\/setup-node@[0-9a-f]{40}/.test(workflow) &&
    cmsModuleCoverage.includes("studioSourceAvailable") &&
    routeEvidenceTracker.includes("standaloneWebCheckout") &&
    routeEvidenceTracker.includes("standalone_web_contract"),
  "Web CI is self-contained, least-privilege, and uses SHA-pinned official actions.",
);
addCheck(
  checks,
  "lighthouse.requiredStableCategories",
  lighthouse.includes('"categories:performance": ["warn"') &&
    lighthouse.includes('"categories:accessibility": ["error"') &&
    lighthouse.includes('"categories:best-practices": ["error"') &&
    lighthouse.includes('"categories:seo": ["warn"') &&
    requiredLockedSeoAuditAssertions.every((auditId) =>
      lighthouse.includes(`"${auditId}": ["error"`),
    ),
  "Accessibility and best-practices remain required; every crawl-independent SEO audit is required while aggregate SEO accounts for the intentional prelaunch noindex lock.",
);
addCheck(
  checks,
  "publication.lockPreserved",
  layout.includes("index: false") &&
    /APPROVED_ROUTE_PUBLICATIONS\s*=\s*\[\s*\]/.test(publication) &&
    sitemap.includes("ROUTE_REGISTRY.filter(isPresidentialSitemapRoute)"),
  "Robots remains noindex and sitemap remains empty.",
);

const failed = checks.filter((check) => check.status === "fail");
console.log(JSON.stringify({
  verdict: failed.length
    ? "FAIL_LAUNCH_CONTROLS_REVIEW_REQUIRED"
    : "PASS_LAUNCH_CONTROLS_LOCKED_STATE",
  checks,
  deploymentExecuted: false,
  providerMutated: false,
  publicSeoUnlocked: false,
  routePublicationApproved: false,
  sitemapUnlocked: false,
  indexabilityUnlocked: false,
}, null, 2));

if (failed.length) process.exit(1);
