import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const webRoot = process.cwd();
const repoRoot = resolve(webRoot, "..");
const studioObjectsPath = join(repoRoot, "studio", "schemaTypes", "presidentialObjects.ts");
const rendererPath = join(
  webRoot,
  "src",
  "components",
  "presidential",
  "modules",
  "cms-homepage-module-renderer.tsx",
);
const productRendererPath = join(
  webRoot,
  "src",
  "components",
  "presidential",
  "modules",
  "cms-product-module-components.tsx",
);
const cmsVerifyPath = join(webRoot, "scripts", "presidential-cms-verify.mjs");
const cmsProjectionPath = join(webRoot, "src", "lib", "cms", "homepage.ts");
const approvedFixturePath = join(webRoot, "scripts", "mock-sanity-fetch-approved-cms.cjs");
const packageJsonPath = join(webRoot, "package.json");
const workRoot = join(repoRoot, "sources", "spud", "work", "cms-module-renderer-coverage");
const statusJsonPath = join(workRoot, "cms-module-renderer-coverage-status.json");

const expectedPageBuilderBlocks = [
  "heroBlock",
  "homepageActBlock",
  "productPlatformBlock",
  "productFormatBlock",
  "productRailBlock",
  "learnGuideBlock",
  "storyProofBlock",
  "locatorShellBlock",
  "legalUtilityBlock",
  "assetProofBlock",
  "contactBlock",
  "faqBlock",
  "guideHubBlock",
  "productFactsBlock",
  "mediaGalleryBlock",
  "comparisonBlock",
  "timelineBlock",
  "relatedContentBlock",
];

function read(filePath) {
  return readFileSync(filePath, "utf8");
}

function unique(values) {
  return [...new Set(values)];
}

function extractStudioDefineTypeNames(source) {
  return unique(
    [...source.matchAll(/export const \w+ = defineType\(\{\s*name: '([^']+)'/gs)].map(
      (match) => match[1],
    ),
  );
}

function extractRendererCases(source) {
  return unique([...source.matchAll(/case "([^"]+)":/g)].map((match) => match[1]));
}

function hasAll(sourceValues, expectedValues) {
  const sourceSet = new Set(sourceValues);
  return expectedValues.every((value) => sourceSet.has(value));
}

function missingValues(sourceValues, expectedValues) {
  const sourceSet = new Set(sourceValues);
  return expectedValues.filter((value) => !sourceSet.has(value));
}

function addCheck(checks, check, passed, details) {
  checks.push({
    check,
    status: passed ? "pass" : "fail",
    details,
    public_unlock: "no",
  });
}

const studioSourceAvailable = existsSync(studioObjectsPath);
const studioObjectsSource = studioSourceAvailable ? read(studioObjectsPath) : "";
const rendererSource = read(rendererPath);
const productRendererSource = read(productRendererPath);
const cmsVerifySource = read(cmsVerifyPath);
const cmsProjectionSource = read(cmsProjectionPath);
const approvedFixtureSource = read(approvedFixturePath);
const packageJson = JSON.parse(read(packageJsonPath));

const studioDefineTypes = extractStudioDefineTypeNames(studioObjectsSource);
const studioPageBuilderBlocks = studioDefineTypes.filter((typeName) =>
  expectedPageBuilderBlocks.includes(typeName),
);
const rendererCases = extractRendererCases(rendererSource);
const missingStudioBlocks = missingValues(studioPageBuilderBlocks, expectedPageBuilderBlocks);
const missingRendererCases = missingValues(rendererCases, expectedPageBuilderBlocks);
const unexpectedStudioMissingFromExpected = studioPageBuilderBlocks.filter(
  (typeName) => !expectedPageBuilderBlocks.includes(typeName),
);

const checks = [];

addCheck(
  checks,
  "studio.pageBuilderBlockCountWhenAvailable",
  !studioSourceAvailable || studioPageBuilderBlocks.length === expectedPageBuilderBlocks.length,
  studioSourceAvailable
    ? `Studio page-builder blocks found: ${studioPageBuilderBlocks.length}/${expectedPageBuilderBlocks.length}`
    : "Studio source is absent from this standalone web checkout; the checked-in web block contract remains authoritative here.",
);
addCheck(
  checks,
  "studio.pageBuilderBlockNamesWhenAvailable",
  !studioSourceAvailable ||
    (missingStudioBlocks.length === 0 && unexpectedStudioMissingFromExpected.length === 0),
  studioSourceAvailable
    ? missingStudioBlocks.length
      ? `Missing from Studio: ${missingStudioBlocks.join(", ")}`
      : "Studio exposes the expected 18 page-builder block types."
    : "Studio cross-check is unavailable; renderer and fixture checks still enforce all 18 web block names.",
);
addCheck(
  checks,
  "web.rendererCoversStudioBlocks",
  hasAll(rendererCases, expectedPageBuilderBlocks),
  missingRendererCases.length
    ? `Missing renderer cases: ${missingRendererCases.join(", ")}`
    : "CMS renderer switch covers every expected page-builder block.",
);
addCheck(
  checks,
  "web.rendererHasFallback",
  rendererSource.includes("function FallbackModule") &&
    /default:\s*return isPrivateRenderMode\(renderMode\)[\s\S]{0,200}<FallbackModule[\s\S]{0,200}: null;/.test(rendererSource),
  "Unknown CMS modules remain inspectable in private preview and fail closed on public routes.",
);
addCheck(
  checks,
  "web.cmsProjectionCarriesRenderGate",
  cmsProjectionSource.includes("moduleControl{") &&
    cmsProjectionSource.includes("componentKey") &&
    cmsProjectionSource.includes("renderEligibility") &&
    cmsProjectionSource.includes("sortIntent"),
  "Sanity projection includes moduleControl component and render-eligibility fields.",
);
addCheck(
  checks,
  "web.productAssetMediaFailsClosed",
  productRendererSource.includes("function canRenderPublicAssetMedia(asset: SanityAssetRecord): boolean") &&
    productRendererSource.includes("return isPublicCmsAsset(asset)") &&
    productRendererSource.includes("sanitizePublicCmsModule(module)") &&
    productRendererSource.includes("const canShowAssetMedia = isPrivate || canRenderPublicAssetMedia(asset)") &&
    productRendererSource.includes("canShowAssetMedia && asset.assetUrl"),
  "Public product media only renders CMS asset URLs after approved_public approval, approved_public provenance, and alt text.",
);
addCheck(
  checks,
  "web.projectionUsesSchemaShapedFaqAndRelatedItems",
  cmsProjectionSource.includes("items[]{") &&
    cmsProjectionSource.includes("question") &&
    cmsProjectionSource.includes("answer") &&
    cmsProjectionSource.includes('_type == "reference" => @->{') &&
    cmsProjectionSource.includes("routePublicationStatus"),
  "Shared projection preserves nested FAQ objects and dereferences related-content records with approval fields.",
);
addCheck(
  checks,
  "fixture.coversExactly18SchemaShapedBlocks",
  /const allHomeModuleTypes = \[[\s\S]*?\];/.test(approvedFixtureSource) &&
    expectedPageBuilderBlocks.every((blockType) => approvedFixtureSource.includes(`"${blockType}"`)) &&
    approvedFixtureSource.includes('renderEligibility: "approved_public"') &&
    approvedFixtureSource.includes("approvedRecordGate") &&
    approvedFixtureSource.includes('routePublicationStatus: "index_follow_approved"') &&
    approvedFixtureSource.includes('question: "CMS Smoke FAQ Question?"') &&
    approvedFixtureSource.includes('answer: [{_type: "block"') &&
    approvedFixtureSource.includes("heroAssetRecord") &&
    approvedFixtureSource.includes("assetUrl"),
  "Approved runtime fixture covers all 18 block names with schema-shaped FAQ, related records, full gates, and approved hero media.",
);
addCheck(
  checks,
  "web.rendererHasDedicatedFaqAndRelatedLinks",
  rendererSource.includes("function FaqModule") &&
    rendererSource.includes("function FaqItems") &&
    rendererSource.includes("function RelatedContentModule") &&
    rendererSource.includes("function RelatedItemLinks") &&
    /case "faqBlock":\s*return <FaqModule/.test(rendererSource) &&
    /case "relatedContentBlock":\s*return <RelatedContentModule/.test(rendererSource),
  "FAQ and related-content blocks use dedicated schema-shaped renderers.",
);
addCheck(
  checks,
  "package.cmsVerifyWiresCoverageGate",
  packageJson.scripts?.["cms:module-renderer:verify"]?.includes("presidential-cms-module-renderer-coverage-qa.mjs") === true &&
    cmsVerifySource.includes("presidential-cms-module-renderer-coverage-qa.mjs"),
  "cms:module-renderer:verify exists and cms:verify runs the module renderer coverage gate.",
);

const failed = checks.filter((row) => row.status === "fail");
const payload = {
  verdict: failed.length
    ? "FAIL_CMS_MODULE_RENDERER_COVERAGE_REVIEW_REQUIRED"
    : "PASS_CMS_MODULE_RENDERER_COVERAGE",
  expectedPageBuilderBlocks,
  studioSourceAvailable,
  studioPageBuilderBlocks,
  rendererCases,
  checks,
  publicSeoUnlocked: false,
  routePublicationApproved: false,
  sitemapUnlocked: false,
  indexabilityUnlocked: false,
  sanityMutated: false,
  guardrail:
    "This verifier proves the checked-in 18-block web contract is covered by the renderer and fixture, and cross-checks Studio when its sibling source is available. It does not read live Sanity, write, mutate, publish, deploy, or unlock public SEO.",
};

mkdirSync(workRoot, { recursive: true });
writeFileSync(statusJsonPath, `${JSON.stringify(payload, null, 2)}\n`);

console.log(payload.verdict);
console.log(`Checks passed: ${checks.length - failed.length}/${checks.length}`);

if (failed.length) {
  for (const row of failed) {
    console.error(`${row.check}: ${row.details}`);
  }
  process.exit(1);
}
