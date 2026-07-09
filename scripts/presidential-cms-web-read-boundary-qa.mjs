import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const cmsRoot = path.join(webRoot, "src", "lib", "cms");
const clientPath = path.join(cmsRoot, "sanity-read-client.ts");
const draftHomepageClientPath = path.join(cmsRoot, "homepage-drafts.ts");
const draftSitePageClientPath = path.join(cmsRoot, "site-page-drafts.ts");
const draftLearnGuideClientPath = path.join(cmsRoot, "learn-guide-drafts.ts");
const indexPath = path.join(cmsRoot, "index.ts");
const packageJsonPath = path.join(webRoot, "package.json");
const appRoot = path.join(webRoot, "src", "app");
const componentsRoot = path.join(webRoot, "src", "components");
const seoRoot = path.join(webRoot, "src", "lib", "seo");
const designSystemRoot = path.join(webRoot, "src", "lib", "design-system");
const routePublicationPath = path.join(
  webRoot,
  "src",
  "lib",
  "seo",
  "source-records",
  "route-publication.ts",
);
const privateCmsConsumerAllowlist = new Set([
  "web/src/app/drafts/[slug]/page.tsx",
  "web/src/app/drafts/page.tsx",
]);
const publicCmsConsumerAllowlist = new Set([
  "web/src/app/learn/[guide]/page.tsx",
  "web/src/components/seo/home-route-shell.tsx",
  "web/src/components/seo/presidential-route-shell.tsx",
]);
const privateDraftsRoutePath = path.join(webRoot, "src", "app", "drafts", "page.tsx");
const privateDraftSitePageRoutePath = path.join(webRoot, "src", "app", "drafts", "[slug]", "page.tsx");
const learnGuideRoutePath = path.join(webRoot, "src", "app", "learn", "[guide]", "page.tsx");
const learnGuideBodyRendererPath = path.join(webRoot, "src", "app", "learn", "[guide]", "learn-guide-cms-body.tsx");
const productMediaWorklistPath = path.join(webRoot, "src", "app", "drafts", "product-media-worklist.ts");
const contactLocatorReadinessPath = path.join(webRoot, "src", "app", "drafts", "contact-locator-readiness.ts");
const cmsModuleRendererPath = path.join(
  webRoot,
  "src",
  "components",
  "presidential",
  "modules",
  "cms-homepage-module-renderer.tsx",
);
const cmsProductModuleComponentsPath = path.join(
  webRoot,
  "src",
  "components",
  "presidential",
  "modules",
  "cms-product-module-components.tsx",
);
const homepageRouteShellPath = path.join(webRoot, "src", "components", "seo", "home-route-shell.tsx");
const presidentialRouteShellPath = path.join(webRoot, "src", "components", "seo", "presidential-route-shell.tsx");
const docsResultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "398-step-cms-web-read-boundary-results.csv",
);
const workRoot = path.join(root, "sources", "spud", "work", "cms-web-read-boundary");
const statusJsonPath = path.join(workRoot, "cms-web-read-boundary-status.json");
const statusMdPath = path.join(workRoot, "cms-web-read-boundary-status.md");

const textExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const publicUnlockPattern =
  /public seo unlocked|route publication approved|sitemap inclusion approved|index,\s*follow approved|deployment approved|schema approved|metadata approved|product page approved|locator page approved/i;
const mutationPattern =
  /\b(createIfNotExists|createOrReplace|create|mutate|mutation|patch|delete|publish|transaction|commit|listen)\b/i;
const secretSurfacePattern =
  /\b(Authorization|Bearer|SANITY_API_KEY|SANITY_API_TOKEN|SANITY_AUTH_TOKEN|SANITY_WRITE_TOKEN|NEXT_PUBLIC_[A-Z0-9_]*(?:TOKEN|SECRET|KEY|AUTH)[A-Z0-9_]*)\b/i;

const rows = [];

function csvEscape(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function toPosix(filePath) {
  return filePath.replace(/\\/g, "/");
}

function rel(filePath) {
  return toPosix(path.relative(root, filePath));
}

function readIfExists(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function stripTypeOnlyImports(source) {
  return source.replace(/import\s+type\s+[\s\S]*?from\s+["'][^"']+["'];?/g, "");
}

function walkTextFiles(targetPath) {
  if (!existsSync(targetPath)) {
    return [];
  }

  const stats = statSync(targetPath);
  if (stats.isFile()) {
    return textExtensions.has(path.extname(targetPath).toLowerCase()) ? [targetPath] : [];
  }

  const files = [];
  for (const entry of readdirSync(targetPath, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git", ".lighthouseci"].includes(entry.name)) {
      continue;
    }

    const fullPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkTextFiles(fullPath));
    } else if (textExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

function addCheck(check, passed, details) {
  rows.push({
    check,
    status: passed ? "pass" : "fail",
    details,
    public_unlock: "no",
  });
}

function collectMatches(files, pattern) {
  const matches = [];

  for (const file of files) {
    const text = readIfExists(file);
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      matches.push(rel(file));
    }
  }

  return matches;
}

function main() {
  const clientSource = readIfExists(clientPath);
  const indexSource = readIfExists(indexPath);
  const packageJson = readIfExists(packageJsonPath);
  const routePublicationSource = readIfExists(routePublicationPath);
  const publicSurfaceFiles = [
    ...walkTextFiles(appRoot),
    ...walkTextFiles(componentsRoot),
    ...walkTextFiles(seoRoot),
    ...walkTextFiles(designSystemRoot),
  ];
  const cmsFiles = walkTextFiles(cmsRoot);
  const cmsFileNames = cmsFiles.map((file) => rel(file)).sort();
  const cmsImports = publicSurfaceFiles
    .map((file) => ({ file, text: readIfExists(file) }))
    .filter(({ text }) => /from\s+["']@\/lib\/cms|from\s+["'][^"']*\/lib\/cms|import\(["'][^"']*\/lib\/cms/.test(stripTypeOnlyImports(text)))
    .map(({ file }) => rel(file));
  const publicCmsImports = cmsImports.filter(
    (file) => !privateCmsConsumerAllowlist.has(file) && !publicCmsConsumerAllowlist.has(file),
  );
  const cmsMutationMatches = collectMatches(cmsFiles, mutationPattern);
  const cmsSecretMatches = collectMatches(cmsFiles, secretSurfacePattern);
  const expectedSecretFiles = new Set([
    rel(draftHomepageClientPath),
    rel(draftSitePageClientPath),
    rel(draftLearnGuideClientPath),
  ]);
  const unexpectedCmsSecretMatches = cmsSecretMatches.filter((file) => !expectedSecretFiles.has(file));
  const publicUnlockMatches = collectMatches(cmsFiles, publicUnlockPattern);
  const privateDraftsRouteSource = readIfExists(privateDraftsRoutePath);
  const privateDraftSitePageRouteSource = readIfExists(privateDraftSitePageRoutePath);
  const learnGuideRouteSource = readIfExists(learnGuideRoutePath);
  const learnGuideBodyRendererSource = readIfExists(learnGuideBodyRendererPath);
  const productMediaWorklistSource = readIfExists(productMediaWorklistPath);
  const contactLocatorReadinessSource = readIfExists(contactLocatorReadinessPath);
  const cmsModuleRendererSource = readIfExists(cmsModuleRendererPath);
  const cmsProductModuleComponentsSource = readIfExists(cmsProductModuleComponentsPath);
  const homepageRouteShellSource = readIfExists(homepageRouteShellPath);
  const presidentialRouteShellSource = readIfExists(presidentialRouteShellPath);
  const draftHomepageClientSource = readIfExists(draftHomepageClientPath);
  const draftSitePageClientSource = readIfExists(draftSitePageClientPath);
  const draftLearnGuideClientSource = readIfExists(draftLearnGuideClientPath);
  const homepageClientSource = readIfExists(path.join(cmsRoot, "homepage.ts"));
  const sitePageClientSource = readIfExists(path.join(cmsRoot, "site-page.ts"));
  const learnGuideClientSource = readIfExists(path.join(cmsRoot, "learn-guide.ts"));

  addCheck("cms.directory.exists", existsSync(cmsRoot), rel(cmsRoot));
  addCheck("cms.client.exists", existsSync(clientPath), rel(clientPath));
  addCheck("cms.index.exists", existsSync(indexPath), rel(indexPath));
  addCheck(
    "cms.files.allowedSetOnly",
    cmsFileNames.join("|") === "web/src/lib/cms/homepage-drafts.ts|web/src/lib/cms/homepage.ts|web/src/lib/cms/index.ts|web/src/lib/cms/learn-guide-drafts.ts|web/src/lib/cms/learn-guide.ts|web/src/lib/cms/sanity-read-client.ts|web/src/lib/cms/site-page-drafts.ts|web/src/lib/cms/site-page.ts",
    cmsFileNames.join(" | "),
  );
  addCheck("client.serverOnly", /import\s+["']server-only["'];/.test(clientSource), "read client is server-only");
  addCheck("client.projectId.current", /SANITY_PROJECT_ID\s*=\s*["']4bl3xvem["']/.test(clientSource), "project id is 4bl3xvem");
  addCheck("client.dataset.production", /SANITY_DATASET\s*=\s*["']production["']/.test(clientSource), "dataset is production");
  addCheck("client.queryEndpoint", /\.apicdn\.sanity\.io/.test(clientSource) && /\/data\/query\//.test(clientSource), "uses Sanity CDN Query API endpoint");
  addCheck("client.publishedPerspective", /defaultPerspective:\s*["']published["']/.test(clientSource) && /perspective/.test(clientSource), "published perspective is explicit");
  addCheck("client.defaultDisabled", /PRESIDENTIAL_SANITY_READ_CLIENT_ENABLED/.test(clientSource) && /===\s*["']true["']/.test(clientSource), "read fetch is opt-in and disabled by default");
  addCheck("client.noDraftQueries", /drafts\\\./.test(clientSource) && /draft documents/.test(clientSource), "draft query guard exists");
  addCheck("client.noUnexpectedSecretSurface", unexpectedCmsSecretMatches.length === 0, unexpectedCmsSecretMatches.join(" | ") || "secret/auth references are isolated to the private draft reader");
  addCheck(
    "client.privateDraftReaderTokenScoped",
    /SANITY_AUTH_TOKEN/.test(draftHomepageClientSource) &&
      /Authorization:\s*`Bearer \$\{token\}`/.test(draftHomepageClientSource) &&
      /PRESIDENTIAL_SANITY_DRAFT_READ_ENABLED/.test(draftHomepageClientSource) &&
      /"drafts\.sitePage\.home"/.test(draftHomepageClientSource),
    "private draft reader requires explicit env gate, token, and drafts.sitePage.home target",
  );
  addCheck(
    "client.privateDraftSitePageReaderScoped",
    /SANITY_AUTH_TOKEN/.test(draftSitePageClientSource) &&
      /Authorization:\s*`Bearer \$\{token\}`/.test(draftSitePageClientSource) &&
      /PRESIDENTIAL_SANITY_DRAFT_READ_ENABLED/.test(draftSitePageClientSource) &&
      /DRAFT_SITE_PAGE_IDS/.test(draftSitePageClientSource) &&
      /draft_slug_not_allowed/.test(draftSitePageClientSource),
    "private draft sitePage reader requires explicit env gate, token, and fixed draft page allowlist",
  );
  addCheck(
    "client.privateDraftLearnGuideReaderScoped",
    /SANITY_AUTH_TOKEN/.test(draftLearnGuideClientSource) &&
      /Authorization:\s*`Bearer \$\{token\}`/.test(draftLearnGuideClientSource) &&
      /PRESIDENTIAL_SANITY_DRAFT_READ_ENABLED/.test(draftLearnGuideClientSource) &&
      /DRAFT_LEARN_GUIDE_SLUGS/.test(draftLearnGuideClientSource) &&
      /draft_slug_not_allowed/.test(draftLearnGuideClientSource) &&
      /perspective["'],\s*["']raw["']/.test(draftLearnGuideClientSource),
    "private draft learnGuide reader requires explicit env gate, token, raw perspective, and fixed Learn slug allowlist",
  );
  addCheck("client.noMutationSurface", cmsMutationMatches.length === 0, cmsMutationMatches.join(" | ") || "no mutation/write/live API references");
  addCheck("client.noUnexpectedCmsImports", publicCmsImports.length === 0, publicCmsImports.join(" | ") || "only approved CMS consumers import cms client");
  addCheck(
    "client.cmsConsumersAllowlisted",
    cmsImports.every((file) => privateCmsConsumerAllowlist.has(file) || publicCmsConsumerAllowlist.has(file)),
    cmsImports.join(" | ") || "no cms consumers",
  );
  addCheck(
    "client.privateDraftsRouteGated",
    /PRESIDENTIAL_PRIVATE_DRAFTS_ROUTE_ENABLED/.test(privateDraftsRouteSource) && /notFound\(\)/.test(privateDraftsRouteSource),
    "private drafts route requires development mode or explicit env gate",
  );
  addCheck(
    "client.privateDraftsRouteUsesDraftReader",
    /readDraftHomepage/.test(privateDraftsRouteSource) && /draftHomepageFixture/.test(privateDraftsRouteSource),
    "private drafts route prefers real draft homepage data and retains fixture fallback",
  );
  addCheck(
    "client.privateDraftsBoardUsesRouteSummaries",
    /DraftRouteBoard/.test(privateDraftsRouteSource) &&
      /readDraftSitePage/.test(privateDraftsRouteSource) &&
      /readProductMediaWorklist/.test(privateDraftsRouteSource) &&
      /readContactLocatorReadiness/.test(privateDraftsRouteSource) &&
      /draftSitePageFixtures/.test(privateDraftsRouteSource),
    "private drafts board reads live draft pages and local product/contact readiness summaries with fixture fallback",
  );
  addCheck(
    "client.privateDraftSitePageRouteGated",
    /PRESIDENTIAL_PRIVATE_DRAFTS_ROUTE_ENABLED/.test(privateDraftSitePageRouteSource) &&
      /notFound\(\)/.test(privateDraftSitePageRouteSource) &&
      /readDraftSitePage/.test(privateDraftSitePageRouteSource),
    "private draft sitePage route is gated and reads only allowed draft pages",
  );
  addCheck(
    "client.privateDraftRoutesForceDynamic",
    /export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/.test(privateDraftsRouteSource) &&
      /export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/.test(privateDraftSitePageRouteSource),
    "private draft routes must be server-rendered on demand so live Sanity draft reads are not baked at build time",
  );
  addCheck(
    "client.privateDraftHelpersServerOnly",
    /import\s+["']server-only["'];/.test(productMediaWorklistSource) &&
      /import\s+["']server-only["'];/.test(contactLocatorReadinessSource),
    "private product/media and contact/locator summary helpers are server-only",
  );
  addCheck(
    "client.privateDraftHelpersLocalJsonOnly",
    /sources[\s\S]*spud[\s\S]*work/.test(productMediaWorklistSource) &&
      /sources[\s\S]*spud[\s\S]*work/.test(contactLocatorReadinessSource) &&
      /readFileSync/.test(productMediaWorklistSource) &&
      /readFileSync/.test(contactLocatorReadinessSource) &&
      !/@\/lib\/cms|readPublishedSanity|readDraftSitePage|readPublishedHomepage|createOrReplace|createIfNotExists|\.mutate\(|\.transaction\(|\.patch\(|\.delete\(|\.commit\(|\.listen\(/.test(productMediaWorklistSource) &&
      !/@\/lib\/cms|readPublishedSanity|readDraftSitePage|readPublishedHomepage|createOrReplace|createIfNotExists|\.mutate\(|\.transaction\(|\.patch\(|\.delete\(|\.commit\(|\.listen\(/.test(contactLocatorReadinessSource),
    "private worklist helpers read local JSON summaries only and do not touch Sanity clients or mutation APIs",
  );
  addCheck(
    "client.privateDraftSitePageRouteUsesWorklists",
    /readProductMediaWorklist/.test(privateDraftSitePageRouteSource) &&
      /readContactLocatorReadiness/.test(privateDraftSitePageRouteSource) &&
      /DraftProductMediaWorklist/.test(privateDraftSitePageRouteSource) &&
      /DraftContactLocatorReadiness/.test(privateDraftSitePageRouteSource),
    "private draft detail routes include product/media and contact/locator readiness panels",
  );
  addCheck(
    "client.homepageCmsReadFallsBackStatic",
    /readPublicRenderableHomepage/.test(homepageRouteShellSource) &&
      /HomepageFoundationShell/.test(homepageRouteShellSource) &&
      /cmsModules/.test(homepageRouteShellSource) &&
      !/draftHomepageFixture/.test(homepageRouteShellSource),
    "homepage may read published Sanity modules but falls back to the existing static homepage",
  );
  addCheck(
    "client.homepageCmsRenderEnvGated",
    /PRESIDENTIAL_HOMEPAGE_CMS_RENDERING_ENABLED/.test(readIfExists(path.join(cmsRoot, "homepage.ts"))) &&
      /ready_for_implementation_candidate/.test(readIfExists(path.join(cmsRoot, "homepage.ts"))) &&
      /approved_public/.test(readIfExists(path.join(cmsRoot, "homepage.ts"))),
    "homepage CMS render adapter requires explicit env gate, route phase, and module eligibility",
  );
  addCheck(
    "client.homepagePublicRenderingApprovalGated",
    /approvalGate\{[\s\S]*contentApprovalStatus[\s\S]*sourceProofStatus[\s\S]*legalReviewStatus[\s\S]*\}/.test(homepageClientSource) &&
      /isHomepageApprovedForPublicRendering/.test(homepageClientSource) &&
      /PUBLIC_RENDERABLE_ROUTE_PHASES\s*=\s*new Set\(\["approved_public"\]\)/.test(homepageClientSource) &&
      /PUBLIC_RENDERABLE_ROUTE_PHASES\.has\(record\.routePhase \|\| ""\)/.test(homepageClientSource) &&
      /contentApprovalStatus\s*===\s*PUBLIC_HOMEPAGE_APPROVAL/.test(homepageClientSource) &&
      /sourceProofStatus\s*===\s*PUBLIC_HOMEPAGE_APPROVAL/.test(homepageClientSource) &&
      /legalReviewStatus\s*===\s*PUBLIC_HOMEPAGE_APPROVAL/.test(homepageClientSource) &&
      /record:\s*approvedRecord/.test(homepageClientSource),
    "homepage public CMS rendering requires approved route phase plus page-level content, source, and legal approval before modules are used",
  );
  addCheck(
    "client.siteRoutesCmsReadFallsBackStatic",
    /readPublicRenderableSitePage/.test(presidentialRouteShellSource) &&
      /MoonRocksPlatformShell/.test(presidentialRouteShellSource) &&
      /PillarPlatformShell/.test(presidentialRouteShellSource) &&
      /StaticRouteFoundationShell/.test(presidentialRouteShellSource) &&
      /cmsSiteRouteIds/.test(presidentialRouteShellSource) &&
      /cmsModules\s*\?/.test(presidentialRouteShellSource),
    "top-level Presidential routes may read published Sanity modules but fall back to existing static shells",
  );
  addCheck(
    "client.productRouteCmsContextExplicit",
    /type\s+CmsProductRoute\s*=\s*["']moon-rocks["']\s*\|\s*["']moon-pods["']\s*\|\s*["']orbit["']/.test(presidentialRouteShellSource) &&
      /function\s+routeToCmsProductRoute/.test(presidentialRouteShellSource) &&
      /productRoute=\{routeToCmsProductRoute\(route\)\}/.test(presidentialRouteShellSource) &&
      /readonly\s+productRoute\?:\s*ProductRouteSlug/.test(cmsModuleRendererSource) &&
      /CmsProductModuleComponents/.test(cmsModuleRendererSource) &&
      /productRoute=\{productRoute\}/.test(cmsModuleRendererSource) &&
      /function\s+getCmsProductRouteProfile/.test(cmsProductModuleComponentsSource) &&
      /PRODUCT_ROUTE_PROFILES/.test(cmsProductModuleComponentsSource),
    "product route CMS rendering passes explicit Moon Rocks, Moon Pods, or Orbit route context into the renderer",
  );
  addCheck(
    "client.supportRouteCmsContextExplicit",
    /type\s+CmsSupportRoute\s*=\s*["']contact["']\s*\|\s*["']find-us["']/.test(presidentialRouteShellSource) &&
      /function\s+routeToCmsSupportRoute/.test(presidentialRouteShellSource) &&
      /supportRoute=\{routeToCmsSupportRoute\(route\)\}/.test(presidentialRouteShellSource) &&
      /readonly\s+supportRoute\?:\s*SupportRouteSlug/.test(cmsModuleRendererSource) &&
      /supportRoute\s*===\s*["']find-us["']/.test(cmsModuleRendererSource) &&
      /supportRoute\s*===\s*["']contact["']/.test(cmsModuleRendererSource),
    "Contact and Find Us CMS rendering passes explicit support-route context into the renderer",
  );
  addCheck(
    "client.sitePageCmsRenderEnvGated",
    /PRESIDENTIAL_SITE_PAGE_CMS_RENDERING_ENABLED/.test(sitePageClientSource) &&
      /ready_for_implementation_candidate/.test(sitePageClientSource) &&
      /approved_public/.test(sitePageClientSource),
    "generic sitePage CMS render adapter requires explicit env gate, route phase, and module eligibility",
  );
  addCheck(
    "client.sitePagePublicRenderingApprovalGated",
    /approvalGate\{[\s\S]*contentApprovalStatus[\s\S]*sourceProofStatus[\s\S]*legalReviewStatus[\s\S]*\}/.test(sitePageClientSource) &&
      /isSitePageApprovedForPublicRendering/.test(sitePageClientSource) &&
      /PUBLIC_RENDERABLE_ROUTE_PHASES\s*=\s*new Set\(\["approved_public"\]\)/.test(sitePageClientSource) &&
      /PUBLIC_RENDERABLE_ROUTE_PHASES\.has\(record\.routePhase \|\| ""\)/.test(sitePageClientSource) &&
      /contentApprovalStatus\s*===\s*PUBLIC_SITE_PAGE_APPROVAL/.test(sitePageClientSource) &&
      /sourceProofStatus\s*===\s*PUBLIC_SITE_PAGE_APPROVAL/.test(sitePageClientSource) &&
      /legalReviewStatus\s*===\s*PUBLIC_SITE_PAGE_APPROVAL/.test(sitePageClientSource) &&
      /record:\s*approvedRecord/.test(sitePageClientSource),
    "generic sitePage public CMS rendering requires approved route phase plus page-level content, source, and legal approval before modules are used",
  );
  addCheck(
    "client.learnGuideCmsRenderEnvGated",
    /PRESIDENTIAL_LEARN_GUIDE_CMS_RENDERING_ENABLED/.test(learnGuideClientSource) &&
      /PRESIDENTIAL_LEARN_GUIDE_DRAFT_RENDERING_ENABLED/.test(learnGuideRouteSource) &&
      /readPublicRenderableLearnGuide/.test(learnGuideRouteSource) &&
      /readDraftLearnGuide/.test(learnGuideRouteSource) &&
      /robots:\s*\{[\s\S]*index:\s*false/.test(learnGuideRouteSource),
    "learn guide routes have env-gated CMS/draft rendering and noindex fallback metadata",
  );
  addCheck(
    "client.learnGuideMetadataUsesApprovedPublicCms",
    /export\s+async\s+function\s+generateMetadata/.test(learnGuideRouteSource) &&
      /readPublicRenderableLearnGuide\(slug/.test(learnGuideRouteSource) &&
      /guide\.record\?\.title\s*\|\|\s*fallback\.title/.test(learnGuideRouteSource) &&
      /guide\.record\?\.intro\s*\|\|\s*fallback\.intro/.test(learnGuideRouteSource) &&
      /robots:\s*\{[\s\S]*index:\s*false/.test(learnGuideRouteSource),
    "learn guide metadata uses approved public CMS title/intro when available and remains noindex while publication is locked",
  );
  addCheck(
    "client.learnGuideStaticParamsUseApprovedCmsSlugs",
    /export\s+async\s+function\s+generateStaticParams/.test(learnGuideRouteSource) &&
      /readPublicRenderableLearnGuideSlugs/.test(learnGuideRouteSource) &&
      !/generateStaticParams[\s\S]{0,500}learnGuideFallbacks\.map/.test(learnGuideRouteSource) &&
      /PUBLIC_LEARN_GUIDE_SLUGS_QUERY/.test(learnGuideClientSource) &&
      /defined\(slug\.current\)/.test(learnGuideClientSource) &&
      /routePhase == ["']approved_public["']/.test(learnGuideClientSource) &&
      /approvalGate\.contentApprovalStatus == ["']approved_public["']/.test(learnGuideClientSource) &&
      /approvalGate\.sourceProofStatus == ["']approved_public["']/.test(learnGuideClientSource) &&
      /approvalGate\.legalReviewStatus == ["']approved_public["']/.test(learnGuideClientSource),
    "learn guide static params are generated from approved CMS slugs instead of hardcoded fixture slugs",
  );
  addCheck(
    "client.learnGuidePublicRenderingApprovalGated",
    /approvalGate\{[\s\S]*contentApprovalStatus[\s\S]*sourceProofStatus[\s\S]*legalReviewStatus[\s\S]*\}/.test(learnGuideClientSource) &&
      /isLearnGuideApprovedForPublicRendering/.test(learnGuideClientSource) &&
      /PUBLIC_RENDERABLE_ROUTE_PHASES\s*=\s*new Set\(\["approved_public"\]\)/.test(learnGuideClientSource) &&
      /PUBLIC_RENDERABLE_ROUTE_PHASES\.has\(record\.routePhase \|\| ""\)/.test(learnGuideClientSource) &&
      /contentApprovalStatus\s*===\s*PUBLIC_LEARN_GUIDE_APPROVAL/.test(learnGuideClientSource) &&
      /sourceProofStatus\s*===\s*PUBLIC_LEARN_GUIDE_APPROVAL/.test(learnGuideClientSource) &&
      /legalReviewStatus\s*===\s*PUBLIC_LEARN_GUIDE_APPROVAL/.test(learnGuideClientSource) &&
      /record:\s*approvedRecord/.test(learnGuideClientSource),
    "learn guide public CMS rendering requires approved route phase plus guide-level content, source, and legal approval before title/body are used",
  );
  addCheck(
    "client.learnGuideModulesEligibilityFiltered",
    /RENDERABLE_MODULE_ELIGIBILITY\s*=\s*["']ready_for_implementation_candidate["']/.test(learnGuideClientSource) &&
      /getRenderableLearnGuideModules/.test(learnGuideClientSource) &&
      /module\.moduleControl\?\.renderEligibility\s*===\s*RENDERABLE_MODULE_ELIGIBILITY/.test(learnGuideClientSource),
    "learn guide public CMS modules are filtered to implementation-ready module eligibility",
  );
  addCheck(
    "client.learnGuideUsesSharedModuleProjection",
    /SITE_PAGE_MODULE_PROJECTION/.test(learnGuideClientSource) &&
      /bodyModules\[\]\{\s*\$\{SITE_PAGE_MODULE_PROJECTION\}/.test(learnGuideClientSource),
    "learn guides reuse the shared CMS module projection instead of drifting into a narrower block subset",
  );
  addCheck(
    "client.learnGuideBodyRendererSpecific",
    /import\s+\{\s*LearnGuideCmsBody\s*\}\s+from\s+["']\.\/learn-guide-cms-body["'];/.test(learnGuideRouteSource) &&
      /<LearnGuideCmsBody\s+modules=\{modules\}\s*\/>/.test(learnGuideRouteSource) &&
      /module\._type\s*===\s*["']learnGuideBlock["']/.test(learnGuideBodyRendererSource) &&
      /function\s+LearnGuideBodyModule/.test(learnGuideBodyRendererSource) &&
      /RelatedProductLinks/.test(learnGuideBodyRendererSource),
    "learn guide routes render guide body sections through a route-local Learn renderer before falling back to shared CMS modules",
  );
  addCheck(
    "client.cmsRendererSupportsDynamicGuideLinks",
    /import\s+Link\s+from\s+["']next\/link["'];/.test(cmsModuleRendererSource) &&
      /const\s+guideHref\s*=\s*asSeoRoutePath\(guide\.slug\s*\?\s*`\/learn\/\$\{guide\.slug\}`/.test(cmsModuleRendererSource) &&
      /<Link[\s\S]{0,300}href=\{guideHref\}/.test(cmsModuleRendererSource),
    "CMS module renderer uses next/link for dynamic Learn guide links",
  );
  addCheck(
    "client.cmsRendererPublicModeDefault",
    /renderMode\s*=\s*["']public["']/.test(cmsModuleRendererSource) &&
      /readonly\s+renderMode\?:\s*CmsRenderMode/.test(cmsModuleRendererSource),
    "CMS module renderer defaults to public-safe mode unless private mode is explicitly requested",
  );
  addCheck(
    "client.cmsRendererInternalFieldsPrivateOnly",
    /function\s+ProofModule\([\s\S]*?if\s*\(!isPrivateRenderMode\(renderMode\)\)\s*\{[\s\S]*?return null;/.test(cmsModuleRendererSource) &&
      /function\s+ModuleMeta\([\s\S]*?if\s*\(!isPrivateRenderMode\(renderMode\)\)\s*\{[\s\S]*?return null;/.test(cmsModuleRendererSource) &&
      /isPrivate\s+&&\s+asset\.savedFile/.test(cmsModuleRendererSource) &&
      /isPrivate\s+&&\s+assets\[0\]\?\.savedFile/.test(cmsModuleRendererSource),
    "internal proof/source/file metadata is private-renderer only",
  );
  addCheck(
    "client.privateRoutesRequestPrivateRenderer",
    /<CmsHomepageModuleRenderer\s+modules=\{renderedHomepage\.modules\s*\|\|\s*\[\]\}\s+renderMode=["']private["']/.test(privateDraftsRouteSource) &&
      /<CmsHomepageModuleRenderer[\s\S]*modules=\{modules\}[\s\S]*supportRoute=\{SUPPORT_ROUTE_SLUGS\.has\(slug\)[\s\S]*renderMode=["']private["']/.test(privateDraftSitePageRouteSource),
    "private draft routes explicitly request private renderer mode",
  );
  addCheck(
    "client.publicRoutesUseDefaultPublicRenderer",
    /<CmsHomepageModuleRenderer\s+modules=\{cmsModules\}\s*\/>/.test(homepageRouteShellSource) &&
      /<CmsHomepageModuleRenderer[\s\S]*modules=\{cmsModules\}/.test(presidentialRouteShellSource) &&
      !/renderMode=["']private["']/.test(homepageRouteShellSource) &&
      !/renderMode=["']private["']/.test(presidentialRouteShellSource),
    "public route shells use the default public-safe CMS renderer mode",
  );
  addCheck(
    "client.publicRoutesDoNotImportPrivateDraftHelpers",
    !/homepage-drafts|site-page-drafts|readDraftHomepage|readDraftSitePage|product-media-worklist|contact-locator-readiness|src\/app\/drafts|@\/app\/drafts/.test(homepageRouteShellSource) &&
      !/homepage-drafts|site-page-drafts|readDraftHomepage|readDraftSitePage|product-media-worklist|contact-locator-readiness|src\/app\/drafts|@\/app\/drafts/.test(presidentialRouteShellSource),
    "public route shells do not import private draft readers, private drafts helpers, or readiness worklists",
  );
  addCheck("client.publicRenderingDisabled", /publicRouteRenderingEnabled:\s*false/.test(clientSource), "public route rendering remains disabled");
  addCheck("client.routeApprovalsEmpty", /APPROVED_ROUTE_PUBLICATIONS\s*=\s*\[\]\s+as\s+const/.test(routePublicationSource), "route publication approvals remain empty");
  addCheck("index.exportsReadOnlyClient", /readPublishedSanity/.test(indexSource) && /SANITY_READ_CLIENT_CONFIG/.test(indexSource), "index exports read-only boundary");
  addCheck(
    "index.noPrivateDraftExports",
    !/homepage-drafts|site-page-drafts|readDraftHomepage|readDraftSitePage|DraftSitePageSlug/.test(indexSource),
    "public CMS barrel does not expose private draft readers or draft route types",
  );
  addCheck("package.scriptWired", /"cms:web-read:verify"\s*:\s*"node scripts\/presidential-cms-web-read-boundary-qa\.mjs"/.test(packageJson), "cms:web-read:verify is wired");
  addCheck("cms.noPublicUnlockSignals", publicUnlockMatches.length === 0, publicUnlockMatches.join(" | ") || "no public-unlock wording");

  const passCount = rows.filter((row) => row.status === "pass").length;
  const failCount = rows.length - passCount;
  const verdict = failCount === 0
    ? "PASS_CMS_WEB_READ_BOUNDARY_NO_PUBLIC_UNLOCK"
    : "FAIL_CMS_WEB_READ_BOUNDARY_REVIEW_REQUIRED";

  mkdirSync(path.dirname(docsResultsPath), { recursive: true });
  mkdirSync(workRoot, { recursive: true });
  writeFileSync(
    docsResultsPath,
    [
      "check,status,details,public_unlock",
      ...rows.map((row) => [row.check, row.status, row.details, row.public_unlock].map(csvEscape).join(",")),
    ].join("\n") + "\n",
  );

  const payload = {
    verdict,
    passCount,
    failCount,
    publicSeoUnlocked: false,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    schemaUnlocked: false,
    sanityMutationEnabled: false,
    sanityPublicRenderingEnabled: false,
    sanityHomepageEnvGatedRenderingEnabled: rows.some((row) => row.check === "client.homepageCmsReadFallsBackStatic" && row.status === "pass"),
    sanityPrivateDraftsRouteEnabled: cmsImports.includes("web/src/app/drafts/page.tsx"),
    rows,
  };

  writeFileSync(statusJsonPath, JSON.stringify(payload, null, 2) + "\n");
  writeFileSync(
    statusMdPath,
    [
      "# CMS Web Read Boundary Status",
      "",
      `Verdict: ${verdict}`,
      `Checks: ${passCount}/${rows.length}`,
      "Public unlock: no",
      "Sanity mutation: no",
      "Broad public route rendering: no",
      "Homepage CMS rendering: env-gated with static fallback",
      "",
    ].join("\n"),
  );

  console.log(verdict);
  console.log(`Checks passed: ${passCount}/${rows.length}`);
  if (failCount > 0) {
    console.error(rows.filter((row) => row.status === "fail").map((row) => `${row.check}: ${row.details}`).join("\n"));
    process.exit(1);
  }
}

main();
