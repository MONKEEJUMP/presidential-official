import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), "utf8");
const checks = [];

function check(name, passed, details) {
  checks.push({ name, passed, details });
}

const experience = read("src/components/presidential/vapes/vape-experience.tsx");
const experienceLoader = read("src/components/presidential/vapes/vape-experience-loader.tsx");
const vapeFragment = read("src/components/presidential/vapes/vape-fragment.ts");
const film = read("src/components/presidential/vapes/orbit-hero-film.tsx");
const showroom = read("src/components/presidential/vapes/vape-showroom.tsx");
const routeShell = read("src/components/seo/presidential-route-shell.tsx");
const salesDashboard = read("src/app/sales/sales-dashboard.tsx");
const sales = read("src/lib/sales.ts");
const salesBrowse = read("src/lib/sales-browse-server.ts");
const header = read("src/components/presidential/layout/site-header.tsx");
const statePage = read("src/components/presidential/modules/state-page-shell.tsx");
const about = read("src/components/presidential/modules/about-company-shell.tsx");
const homepage = read("src/components/presidential/modules/homepage-foundation-shell.tsx");
const authority = read("src/components/presidential/modules/our-story-authority-sources.tsx");
const routes = read("src/lib/seo/routes.ts");
const metadata = read("src/lib/seo/metadata.ts");
const learnGuidePage = read("src/app/learn/[guide]/page.tsx");
const sanityReadClient = read("src/lib/cms/sanity-read-client.ts");
const approvedRoutes = read("src/lib/seo/approved-public-routes.ts");
const productMetadata = read("src/lib/seo/pw7404-1019-product-metadata.ts");
const partnersShell = read("src/components/presidential/modules/partners-page-shell.tsx");
const partnersGenerator = read("scripts/build-partners-snapshot.mjs");
const partnersSnapshot = JSON.parse(read("src/content/partners.json"));
const partnersStatePage = read("src/app/partners/[state]/page.tsx");
const itemListSchema = read("src/lib/seo/schema/itemList.ts");
const outboundGate = read("scripts/presidential-outbound-link-readiness-qa.mjs");
const internalLinkGate = read("scripts/presidential-internal-link-graph-qa.mjs");
const linkIntentGate = read("scripts/presidential-navigation-cta-intent-qa.mjs");
const blockedLogoHashes = new Set([...partnersGenerator.matchAll(/'([0-9a-f]{64})'/g)].map((match) => match[1]));
const invalidPartnerLogos = partnersSnapshot.brands.filter((brand) => {
  if (!brand.logo) return false;
  const content = readFileSync(path.join(root, "public", brand.logo));
  const hash = createHash("sha256").update(content).digest("hex");
  return blockedLogoHashes.has(hash) || (brand.logo.endsWith(".svg") && /data-icon=["'](?:instagram|facebook|tiktok|youtube|twitter)["']/i.test(content.toString("utf8")));
});

check("vapes.pageshowPreservesHash", /const resetScroll = \(\) => \{\s*if \(!window\.location\.hash\)/s.test(experienceLoader), "initial pageshow reset re-checks the current hash before the explorer mounts");
check("vapes.malformedFragmentSafe", vapeFragment.includes("catch") && vapeFragment.includes("return rawFragment"), "malformed percent escapes fall back to the raw fragment");
check("vapes.archiveDeferred", experience.includes("archiveOpened ? <div") && experience.includes("setArchiveOpened(true)"), "96-image archive is absent until first open");
check("vapes.explorerDeferred", experienceLoader.includes("IntersectionObserver") && experienceLoader.includes("rootMargin: '600px 0px'") && experienceLoader.includes("dynamic(") && experienceLoader.includes("DEFERRED_SECTION_IDS") && showroom.includes("<VapeExperienceLoader"), "below-fold interactive explorer and its JavaScript load near the viewport while advertised fragment targets remain reachable");
check("vapes.educationControls", film.includes("controls={!blueprint}"), "education film retains controls while blueprint remains control-free");
check("vapes.posterFailureFallback", film.includes("onError={() => setPosterReady(true)}"), "poster failure no longer blocks video mounting");
check("vapes.heroCaption", showroom.includes("THE PRESIDENTIAL VAPE EXPERIENCE"), "non-blueprint hero caption is restored");
check("cms.vapeRoutesRead", routeShell.includes('"moon-pods"') && routeShell.includes('"orbit"') && routeShell.includes("cmsModules={cmsModules ?? undefined}"), "approved Moon Pods and Orbit CMS modules are composed with the showroom");
check("cms.approvedGuideSlugsRemainReachable", learnGuidePage.includes("export const dynamicParams = true") && learnGuidePage.includes("generateStaticParams") && learnGuidePage.includes("APPROVED_PUBLIC_LEARN_GUIDE_ROUTES"), "approved CMS guides can render on demand while known guides remain prebuilt");
check("cms.runtimeFixtureUsesDirectImport", sanityReadClient.includes("PRESIDENTIAL_CMS_RUNTIME_SMOKE_FIXTURE") && sanityReadClient.includes("mock-sanity-fetch-approved-cms.cjs"), "Next server route imports the smoke fixture inside its own runtime worker");
check("sales.deviceTimeZone", sales.includes("export function salesDateKey") && salesBrowse.includes("normalizedTimeZone") && salesDashboard.includes("snapshot?.timeZone"), "client day-bound badges use the same validated zone sent to browse_sales_targets");
check("sales.claimReleaseScoped", salesDashboard.includes('activeDoorId && workMode === "log"'), "history close cannot release another tab's log claim");
check("header.escapeScoped", header.includes('event.key === "Escape" && (navigationOpen || openGroup !== null)'), "global Escape handler runs only for open navigation");
check("state.newYorkSubsetScoped", statePage.includes('Presidential Near Me in <span className={`block ${stateFontClass(state.slug)}`}>New York</span>'), "New York subset font wraps only New York");
check("about.mobileHeadingFits", about.includes("text-[clamp(2.25rem,11vw,3rem)]"), "about H1 uses a narrow-screen fluid size");
check("homepage.moonRockFinishes", homepage.includes("finished with kief or diamonds, as identified on the package"), "homepage definition covers both documented finish families");
check("authority.linksFailClosed", !authority.includes("href={source.href}"), "unapproved independent-coverage URLs are not public anchors");
check("metadata.approvedSocialAsset", metadata.includes("/media/brand/presidential-banner.png") && !metadata.includes("/social/og-default.png"), "default social metadata uses the registered approved banner");
check("metadata.unapprovedCtrClaimRemoved", !routes.includes("six product groupings"), "post-approval CTR claim no longer inherits the August approval record");
check("partners.distinctVisitNames", partnersShell.includes('aria-label={`Visit ${brand.name} site`}'), "every Visit link includes its partner name for assistive technology");
check("partners.websiteValidation", partnersGenerator.includes("Invalid concatenated website") && partnersSnapshot.brands.every((brand) => !brand.website || ((brand.website.match(/https?:\/\//gi) ?? []).length === 1 && ["http:", "https:"].includes(new URL(brand.website).protocol))), "snapshot generation rejects concatenated or non-HTTP partner destinations");
check("partners.outboundApprovalBound", outboundGate.includes("partnerWebsiteListSha256") && outboundGate.includes("partners.snapshotOutboundApproval") && outboundGate.includes("approvedPartnerUrls.has(parsed.href)"), "partner links are allowed only when the exact owner-approved snapshot digest matches");
check("partners.schemaOmitsGenericRetailerUrl", !partnersStatePage.includes("path:`/find-us/${state}`") && itemListSchema.includes("...(item.path ? {url: canonicalUrl(item.path)} : {})"), "partner Organizations omit URL when no unique retailer page exists");
check("partners.placeholderLogosBlocked", blockedLogoHashes.size >= 9 && invalidPartnerLogos.length === 0, `${invalidPartnerLogos.length} blocked or social-icon logo assignment(s) remain`);
check("partners.encodedOutboundHrefs", outboundGate.includes('replace(/&amp;/gi, "&")') && outboundGate.includes("approvedPartnerUrls.has(decodedValue)"), "built HTML entities are decoded before exact partner-link approval checks");
check("partners.internalLinkInventories", internalLinkGate.includes("...partnerRoutePaths") && linkIntentGate.includes("...partnerRoutePaths") && linkIntentGate.includes('"/partners",'), "Partners hub and state routes are registered in internal-link QA inventories");
for (const [name, value] of [
  ["presidentialCannabis", "Meet Presidential Cannabis, the official brand behind Moon Rocks, infused pre-rolls, tobacco-free blunts and minis. Find licensed retailers."],
  ["presidentialBlunts", "Explore Presidential Blunts, tobacco-free infused hemp wraps in the House Line. Review product details and find licensed retailers. Availability varies."],
  ["presidentialPrerolls", "Explore Presidential Prerolls, the House Line infused pre-roll format. Review product details and find licensed retailers. Availability varies."],
]) {
  const source = name === "presidentialCannabis" ? approvedRoutes : productMetadata;
  check(`metadata.${name}Snippet`, source.includes(value) && value.length <= 160, `${value.length} characters`);
}

const failed = checks.filter((item) => !item.passed);
console.log(JSON.stringify({ verdict: failed.length ? "FAIL_REVIEW_DEBT_REGRESSION" : "PASS_REVIEW_DEBT_REGRESSION", checks }, null, 2));
if (failed.length) process.exitCode = 1;
