import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const webRoot = process.cwd();
const read = (...segments) => readFileSync(join(webRoot, ...segments), "utf8");
const checks = [];

function check(name, run) {
  run();
  checks.push(name);
}

const learnRoute = read("src", "app", "learn", "[guide]", "page.tsx");
const learnClient = read("src", "lib", "cms", "learn-guide.ts");
const homepageClient = read("src", "lib", "cms", "homepage.ts");
const sitePageClient = read("src", "lib", "cms", "site-page.ts");
const readClient = read("src", "lib", "cms", "sanity-read-client.ts");
const publicContent = read("src", "lib", "cms", "public-content.ts");
const draftAccess = read("src", "lib", "cms", "draft-route-access.ts");
const draftsIndex = read("src", "app", "drafts", "page.tsx");
const draftsDetail = read("src", "app", "drafts", "[slug]", "page.tsx");
const renderer = read("src", "components", "presidential", "modules", "cms-homepage-module-renderer.tsx");
const productRenderer = read("src", "components", "presidential", "modules", "cms-product-module-components.tsx");
const approvedFixture = read("scripts", "mock-sanity-fetch-approved-cms.cjs");
const runtimeSmoke = read("scripts", "presidential-cms-runtime-smoke-qa.mjs");
const liveDraftSmoke = read("scripts", "presidential-cms-live-draft-smoke-qa.mjs");

check("public Learn is approved-CMS-only", () => {
  assert.match(learnRoute, /readPublicRenderableLearnGuideSlugs/);
  assert.match(learnRoute, /if \(!guide\.record \|\| !guide\.modules\.length\) \{\s*notFound\(\)/);
  assert.doesNotMatch(learnRoute, /readDraftLearnGuide|learn-guide-drafts|learnGuideFallbacks|DRAFT_RENDERING/);
});

check("Learn slug query and record use the full gate", () => {
  for (const field of [
    "contentApprovalStatus",
    "sourceProofStatus",
    "legalReviewStatus",
    "assetApprovalStatus",
    "seoApprovalStatus",
    "routePublicationStatus",
  ]) {
    assert.match(learnClient, new RegExp(`approvalGate\\.${field}`));
  }
  assert.match(learnClient, /routePublicationStatus == "index_follow_approved"/);
  assert.match(learnClient, /moduleControl\.renderEligibility == "approved_public"/);
  assert.match(learnClient, /hasPublicCmsApprovalGate\(record\.approvalGate\)/);
});

check("homepage and site pages require one approved hero", () => {
  for (const source of [homepageClient, sitePageClient]) {
    assert.match(source, /PUBLIC_MODULE_RENDER_ELIGIBILITY/);
    assert.match(source, /hasPublicCmsApprovalGate\(record\.approvalGate\)/);
    assert.match(source, /publicHeroes\.length === 1/);
    assert.match(source, /isPublicCmsAsset\(publicHeroes\[0\]\.heroAssetRecord\)/);
  }
});

check("draft access uses a separate timing-safe Bearer token", () => {
  assert.match(draftAccess, /PRESIDENTIAL_PRIVATE_DRAFTS_ROUTE_ENABLED/);
  assert.match(draftAccess, /PRESIDENTIAL_PRIVATE_DRAFTS_ACCESS_TOKEN/);
  assert.match(draftAccess, /timingSafeEqual/);
  assert.match(draftAccess, /authorization/);
  assert.match(draftAccess, /\^Bearer /);
  assert.doesNotMatch(draftAccess, /SANITY_AUTH_TOKEN/);
});

check("draft routes authenticate before remote or local reads", () => {
  const indexBody = draftsIndex.slice(draftsIndex.indexOf("export default async function DraftsPage"));
  const detailBody = draftsDetail.slice(draftsDetail.indexOf("export default async function DraftSitePage"));
  const indexAuth = indexBody.indexOf("hasAuthenticatedPrivateDraftRouteAccess");
  const detailAuth = detailBody.indexOf("hasAuthenticatedPrivateDraftRouteAccess");

  assert.ok(indexAuth >= 0 && indexAuth < indexBody.indexOf("readDraftSitePage"));
  assert.ok(indexAuth < indexBody.indexOf("readProductMediaWorklist"));
  assert.ok(detailAuth >= 0 && detailAuth < detailBody.indexOf("readDraftSitePage"));
  assert.ok(detailAuth < detailBody.indexOf("readProductMediaWorklist"));
});

check("unresolved locator dynamics always 404", () => {
  const locatorPages = [
    read("src", "app", "find-us", "[state]", "page.tsx"),
    read("src", "app", "find-us", "[state]", "[city]", "page.tsx"),
    read("src", "app", "find-us", "[state]", "[city]", "[retailer]", "page.tsx"),
  ];

  for (const page of locatorPages) {
    assert.match(page, /export const dynamicParams = false/);
    assert.match(page, /generateStaticParams\(\) \{\s*return \[\]/);
    assert.match(page, /notFound\(\)/);
    assert.doesNotMatch(page, /LocatorTemplateShell|buildRouteMetadata/);
  }
});

check("Sanity reads have a bounded cancellation-preserving timeout", () => {
  assert.match(readClient, /SANITY_FETCH_TIMEOUT_MS = 5000/);
  assert.match(readClient, /new AbortController\(\)/);
  assert.match(readClient, /controller\.abort\(callerSignal\?\.reason\)/);
  assert.match(readClient, /removeEventListener\("abort", abortFromCaller\)/);
  assert.match(readClient, /fetchSanityJsonWithTimeout/);
});

check("public nested CMS data is sanitized", () => {
  for (const helper of [
    "isPublicCmsAsset",
    "isPublicCmsLinkedRecord",
    "isPublicCmsFact",
    "isPublicCmsCard",
    "isPublicCmsFaqItem",
    "isPublicCmsContactProfile",
  ]) {
    assert.match(publicContent, new RegExp(`function ${helper}`));
  }
  assert.match(renderer, /sanitizePublicCmsModule/);
  assert.match(renderer, /PUBLIC_MODULE_RENDER_ELIGIBILITY/);
  assert.match(productRenderer, /sanitizePublicCmsModule\(module\)/);
});

check("FAQ and related records use their schema shapes", () => {
  assert.match(homepageClient, /items\[\]\{/);
  assert.match(homepageClient, /_type == "reference" => @->\{/);
  assert.match(renderer, /function FaqItems/);
  assert.match(renderer, /portableTextToPlainText\(item\.answer\)/);
  assert.match(renderer, /function RelatedItemLinks/);
  assert.match(renderer, /case "faqBlock":\s*return <FaqModule/);
  assert.match(renderer, /case "relatedContentBlock":\s*return <RelatedContentModule/);
});

check("public route composition has one approved hero H1", () => {
  assert.match(renderer, /heroHeadingLevel = "h1"/);
  assert.match(renderer, /heroIndexes\.length !== 1/);
  assert.match(renderer, /const HeroHeading = headingLevel/);
  assert.match(renderer, /role="img"/);
});

check("approved mock covers exactly 18 schema-shaped blocks", () => {
  const arrayMatch = approvedFixture.match(/const allHomeModuleTypes = (\[[\s\S]*?\]);/);
  assert.ok(arrayMatch);
  const moduleTypes = [...arrayMatch[1].matchAll(/"([A-Za-z]+Block)"/g)].map((match) => match[1]);
  assert.equal(moduleTypes.length, 18);
  assert.equal(new Set(moduleTypes).size, 18);
  assert.match(approvedFixture, /question: "CMS Smoke FAQ Question\?"/);
  assert.match(approvedFixture, /answer: \[\{_type: "block"/);
  assert.match(approvedFixture, /renderEligibility: "approved_public"/);
  assert.match(approvedFixture, /routePublicationStatus: "index_follow_approved"/);
  assert.match(approvedFixture, /heroAssetRecord/);
});

check("smoke scripts choose or refuse ports without killing listeners", () => {
  for (const source of [runtimeSmoke, liveDraftSmoke]) {
    assert.match(source, /createServer/);
    assert.match(source, /Refusing occupied explicitly configured/);
    assert.doesNotMatch(source, /killPortListeners|Stop-Process/);
  }
  assert.doesNotMatch(runtimeSmoke, /killPortListeners\(activePort\)/);
});

console.log("PASS_CMS_RUNTIME_REPAIR_QA");
console.log(`Checks passed: ${checks.length}/${checks.length}`);
