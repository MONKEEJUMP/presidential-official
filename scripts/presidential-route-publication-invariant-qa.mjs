import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const sourceRoot = path.join(webRoot, "src", "lib", "seo");
const builtAppRoot = path.join(webRoot, ".next", "server", "app");
const nextBin = path.join(webRoot, "node_modules", "next", "dist", "bin", "next");
const runtimeHost = "127.0.0.1";
const runtimeBasePort = Number(process.env.PRESIDENTIAL_PUBLICATION_INVARIANT_QA_PORT || "3358");
const outDir = path.join(os.tmpdir(), "presidential-route-publication-invariant-qa");
const packageJsonPath = path.join(webRoot, "package.json");
const routePublicationSourcePath = path.join(
  webRoot,
  "src",
  "lib",
  "seo",
  "source-records",
  "route-publication.ts",
);
const metadataSourcePath = path.join(webRoot, "src", "lib", "seo", "metadata.ts");
const indexabilitySourcePath = path.join(
  webRoot,
  "src",
  "lib",
  "seo",
  "indexability.ts",
);
const sitemapSourcePath = path.join(webRoot, "src", "lib", "seo", "sitemap.ts");
const routeShellSourcePath = path.join(
  webRoot,
  "src",
  "lib",
  "seo",
  "schema",
  "routeShell.ts",
);

const resultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "309-step10v-route-publication-invariant-results.csv",
);
const workRoot = path.join(
  root,
  "sources",
  "spud",
  "work",
  "step10v-route-publication-invariant-qa",
);
const statusJsonPath = path.join(
  workRoot,
  "step10v-route-publication-invariant-status.json",
);
const statusMdPath = path.join(
  workRoot,
  "step10v-route-publication-invariant-status.md",
);

const productionOrigin = "https://presidentialmoonrocks.com";
const publicRoutes = [
  { route: "/", file: "index.html", dynamicFile: "page.js" },
  { route: "/moon-rocks", file: "moon-rocks.html", dynamicFile: "moon-rocks/page.js" },
  { route: "/moon-pods", file: "moon-pods.html", dynamicFile: "moon-pods/page.js" },
  { route: "/orbit", file: "orbit.html", dynamicFile: "orbit/page.js" },
  { route: "/our-story", file: "our-story.html", dynamicFile: "our-story/page.js" },
  { route: "/learn", file: "learn.html", dynamicFile: "learn/page.js" },
  { route: "/find-us", file: "find-us.html", dynamicFile: "find-us/page.js" },
  { route: "/contact", file: "contact.html", dynamicFile: "contact/page.js" },
];

const forbiddenUnlockPattern =
  /public seo unlocked|route publication approved|sitemap inclusion approved|index,\s*follow approved|robots index approved|metadata approved|schema approved|open graph approved|twitter approved|deployment approved|provider connection approved|migration apply approved|client import approved/i;
const forbiddenHostPattern =
  /\b(localhost|127\.0\.0\.1|vercel\.app|wix(?:site|static)?\.com|wix\.com|googleusercontent\.com|drive\.google\.com|presidential\.vip|presidential\.rocks|presidential\.online|presidential\.us|presidentialca\.com|www\.presidentialmoonrocks\.com)\b/i;

const rows = [];
const summaries = [];

function csvEscape(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function addRow(scope, check, status, details, publicUnlock = "no") {
  rows.push({ scope, check, status, details, publicUnlock });
}

function pass(scope, check, details = "pass") {
  addRow(scope, check, "pass", details);
}

function fail(scope, check, details) {
  addRow(scope, check, "fail", details);
}

function recordCheck(scope, check, condition, passDetails, failDetails) {
  if (condition) {
    pass(scope, check, passDetails);
  } else {
    fail(scope, check, failDetails);
  }
}

function readRequired(filePath, scope, check) {
  if (!existsSync(filePath)) {
    fail(scope, check, `Missing ${filePath}. Run npm run build first.`);
    return "";
  }

  pass(scope, check, filePath);
  return readFileSync(filePath, "utf8");
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function findOpenPort(startPort) {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.once("error", (error) => {
      if (error.code === "EADDRINUSE" || error.code === "EACCES") {
        server.close(() => {
          findOpenPort(startPort + 1).then(resolve, reject);
        });
        return;
      }

      reject(error);
    });

    server.listen(startPort, runtimeHost, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : startPort;
      server.close(() => resolve(port));
    });
  });
}

async function waitForRuntimeServer(baseUrl) {
  let lastError;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/contact`);
      const html = await response.text();
      if (response.ok && html.trim()) {
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await sleep(400);
  }

  throw lastError || new Error("Next runtime server did not become ready.");
}

async function withRuntimeServer(callback) {
  const port = await findOpenPort(runtimeBasePort);
  const baseUrl = `http://${runtimeHost}:${port}`;
  const server = spawn(process.execPath, [nextBin, "start", "-H", runtimeHost, "-p", String(port)], {
    cwd: webRoot,
    env: {
      ...process.env,
      PRESIDENTIAL_SANITY_READ_CLIENT_ENABLED: "false",
      PRESIDENTIAL_HOMEPAGE_CMS_RENDERING_ENABLED: "false",
      PRESIDENTIAL_SITE_PAGE_CMS_RENDERING_ENABLED: "false",
      PRESIDENTIAL_LEARN_GUIDE_CMS_RENDERING_ENABLED: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  server.stdout.resume();
  server.stderr.resume();

  try {
    await waitForRuntimeServer(baseUrl);
    return await callback(baseUrl);
  } finally {
    if (!server.killed) {
      server.kill();
    }
    await sleep(250);
  }
}

async function readRenderedRouteHtml(routeConfig, baseUrl) {
  const scope = `rendered:${routeConfig.route}`;
  const staticPath = path.join(builtAppRoot, routeConfig.file);
  if (existsSync(staticPath)) {
    pass(scope, "html.exists", staticPath);
    return readFileSync(staticPath, "utf8");
  }

  const dynamicPath = path.join(builtAppRoot, routeConfig.dynamicFile);
  if (!existsSync(dynamicPath)) {
    fail(scope, "html.exists", `Missing ${staticPath} and ${dynamicPath}. Run npm run build first.`);
    return "";
  }

  if (!baseUrl) {
    fail(
      scope,
      "html.exists",
      `Dynamic route ${routeConfig.route} requires runtime HTML, but runtime server was not started.`,
    );
    return "";
  }

  const response = await fetch(`${baseUrl}${routeConfig.route}`);
  const html = await response.text();

  if (!response.ok) {
    fail(scope, "html.exists", `${routeConfig.route} returned ${response.status}`);
    return "";
  }

  if (!html.trim()) {
    fail(scope, "html.exists", `${routeConfig.route} returned empty HTML`);
    return "";
  }

  pass(scope, "html.exists", `${dynamicPath} rendered from ${baseUrl}${routeConfig.route}`);
  return html;
}

function renderedRoutesNeedRuntime() {
  return publicRoutes.some((routeConfig) => {
    const staticPath = path.join(builtAppRoot, routeConfig.file);
    const dynamicPath = path.join(builtAppRoot, routeConfig.dynamicFile);
    return !existsSync(staticPath) && existsSync(dynamicPath);
  });
}

function collectTypeScriptFiles(directory) {
  const files = [];

  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(".ts")) {
        files.push(fullPath);
      }
    }
  }

  walk(directory);
  return files;
}

function compileSeoLibrary() {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const program = ts.createProgram(collectTypeScriptFiles(sourceRoot), {
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    noEmitOnError: true,
    outDir,
    rootDir: path.join(webRoot, "src"),
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2022,
  });

  const emitResult = program.emit();
  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics)
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);

  if (diagnostics.length) {
    const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => webRoot,
      getNewLine: () => "\n",
    });
    fail("compiled-seo-library", "typescript.compile", formatted);
    return false;
  }

  pass("compiled-seo-library", "typescript.compile", "SEO library compiled for invariant probing");
  return true;
}

function decodeHtml(value) {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function tags(html, tagName) {
  return Array.from(html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, "gi"))).map(
    (match) => match[0],
  );
}

function attr(tag, name) {
  return decodeHtml(
    tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] ??
      "",
  );
}

function extractHead(html) {
  return html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? html;
}

function expectedCanonical(route) {
  return route === "/" ? productionOrigin : `${productionOrigin}${route}`;
}

function loadCompiledModules() {
  const require = createRequire(import.meta.url);
  const distRoot = path.join(outDir, "lib", "seo");

  return {
    routes: require(path.join(distRoot, "routes.js")),
    metadata: require(path.join(distRoot, "metadata.js")),
    indexability: require(path.join(distRoot, "indexability.js")),
    sitemap: require(path.join(distRoot, "sitemap.js")),
    routeShell: require(path.join(distRoot, "schema", "routeShell.js")),
    publication: require(
      path.join(distRoot, "source-records", "route-publication.js"),
    ),
  };
}

function checkSourceContracts() {
  const routePublicationSource = readRequired(
    routePublicationSourcePath,
    "source:route-publication",
    "source.exists",
  );
  const metadataSource = readRequired(metadataSourcePath, "source:metadata", "source.exists");
  const indexabilitySource = readRequired(
    indexabilitySourcePath,
    "source:indexability",
    "source.exists",
  );
  const sitemapSource = readRequired(sitemapSourcePath, "source:sitemap", "source.exists");
  const routeShellSource = readRequired(
    routeShellSourcePath,
    "source:route-shell-schema",
    "source.exists",
  );
  const packageJsonText = readRequired(packageJsonPath, "package", "package.exists");

  if (routePublicationSource) {
    recordCheck(
      "source:route-publication",
      "approvedPublicationsEmpty",
      /APPROVED_ROUTE_PUBLICATIONS\s*=\s*\[\]\s+as\s+const/.test(routePublicationSource),
      "approved route-publication records are empty",
      "approved route-publication records are no longer empty",
    );
  }

  if (metadataSource) {
    recordCheck(
      "source:metadata",
      "robotsUsesPublicationGate",
      metadataSource.includes("getRoutePublicationGateBlockReasons(route).length === 0"),
      "metadata indexability requires route-publication gate",
      "metadata indexability no longer requires route-publication gate",
    );
    recordCheck(
      "source:metadata",
      "socialPreviewUsesMetadataIndexability",
      metadataSource.includes("const socialPreviewApproved = isRouteMetadataIndexable(route)") &&
        metadataSource.includes("socialPreviewApproved"),
      "Open Graph/Twitter are gated through route metadata indexability",
      "Open Graph/Twitter may bypass route metadata indexability",
    );
  }

  if (indexabilitySource) {
    recordCheck(
      "source:indexability",
      "sitemapUsesPublicationGate",
      indexabilitySource.includes("getRoutePublicationGateBlockReasons(route).length === 0") &&
        indexabilitySource.includes("reasons.push(...getRoutePublicationGateBlockReasons(route))"),
      "sitemap eligibility and block reasons include route-publication gate",
      "sitemap gate no longer includes route-publication gate",
    );
  }

  if (sitemapSource) {
    recordCheck(
      "source:sitemap",
      "sitemapUsesEligibilityHelper",
      sitemapSource.includes("isSitemapEligible(route)") &&
        sitemapSource.includes("ROUTE_REGISTRY.filter(isPresidentialSitemapRoute)"),
      "sitemap output flows through isSitemapEligible",
      "sitemap output may bypass route eligibility",
    );
  }

  if (routeShellSource) {
    recordCheck(
      "source:route-shell-schema",
      "jsonLdUsesPublicationGate",
      /getRoutePublicationGateBlockReasons\(route\)\.length > 0[\s\S]*?return \[\];/.test(
        routeShellSource,
      ),
      "route-shell JSON-LD returns empty while publication gate has blockers",
      "route-shell JSON-LD may bypass route-publication gate",
    );
  }

  if (packageJsonText) {
    const packageJson = JSON.parse(packageJsonText);
    const scripts = packageJson.scripts ?? {};
    const verifyBuilt = scripts["seo:verify:built"] ?? "";
    const structuredDataIndex = verifyBuilt.indexOf("npm run seo:rendered-structured-data");
    const invariantIndex = verifyBuilt.indexOf("npm run seo:publication-invariants");
    const evidenceIndex = verifyBuilt.indexOf("npm run seo:evidence-tracker");

    recordCheck(
      "package",
      "script.exists",
      scripts["seo:publication-invariants"] ===
        "node scripts/presidential-route-publication-invariant-qa.mjs",
      "seo:publication-invariants script exists",
      `actual=${scripts["seo:publication-invariants"] ?? "(missing)"}`,
    );
    recordCheck(
      "package",
      "verifyBuilt.order",
      structuredDataIndex >= 0 &&
        invariantIndex > structuredDataIndex &&
        evidenceIndex > invariantIndex,
      "seo:verify:built runs publication invariants after rendered structured data and before evidence tracker",
      `actual=${verifyBuilt}`,
    );
  }
}

function checkRuntimeInvariants() {
  if (!compileSeoLibrary()) {
    return;
  }

  const {
    routes,
    metadata,
    indexability,
    sitemap,
    routeShell,
    publication,
  } = loadCompiledModules();
  const { ROUTE_REGISTRY } = routes;
  const {
    buildRouteMetadata,
    buildRouteRobots,
    isRouteMetadataIndexable,
  } = metadata;
  const { getSitemapBlockReasons, isSitemapEligible } = indexability;
  const { buildPresidentialSitemap, getPresidentialSitemapRoutes } = sitemap;
  const { buildRouteShellJsonLd } = routeShell;
  const {
    APPROVED_ROUTE_PUBLICATIONS,
    getRoutePublicationGateBlockReasons,
  } = publication;

  recordCheck(
    "runtime:route-publication",
    "approvedPublicationRecords.empty",
    APPROVED_ROUTE_PUBLICATIONS.length === 0,
    "0 approved route-publication records",
    `${APPROVED_ROUTE_PUBLICATIONS.length} approved route-publication records found`,
  );

  const sitemapRoutes = getPresidentialSitemapRoutes();
  const sitemapEntries = buildPresidentialSitemap();
  recordCheck(
    "runtime:sitemap",
    "routes.empty",
    sitemapRoutes.length === 0,
    "0 sitemap-eligible routes while publication gate is closed",
    `${sitemapRoutes.length} sitemap-eligible routes found`,
  );
  recordCheck(
    "runtime:sitemap",
    "entries.empty",
    sitemapEntries.length === 0,
    "0 sitemap entries while publication gate is closed",
    `${sitemapEntries.length} sitemap entries found`,
  );

  for (const route of ROUTE_REGISTRY) {
    const scope = `runtime:route:${route.path}`;
    const isTemplateRoute = route.path.includes("[") || route.path.includes("]");
    const blockReasons = getRoutePublicationGateBlockReasons(route);
    const sitemapBlockReasons = getSitemapBlockReasons(route);
    const robots = buildRouteRobots(route);
    let routeMetadata = {};
    let jsonLd = [];

    if (isTemplateRoute) {
      let templateMetadataBlocked = false;
      try {
        buildRouteMetadata({ route });
      } catch {
        templateMetadataBlocked = true;
      }

      recordCheck(
        scope,
        "metadata.templateCanonicalRefused",
        templateMetadataBlocked,
        "unresolved template route metadata canonical is refused",
        "unresolved template route emitted concrete metadata",
      );
    } else {
      routeMetadata = buildRouteMetadata({ route });
      jsonLd = buildRouteShellJsonLd(route);
    }

    recordCheck(
      scope,
      "publicationGate.closed",
      blockReasons.includes("source_record:route_publication_missing"),
      "route-publication missing blocks route",
      `block reasons=${blockReasons.join("; ") || "none"}`,
    );
    recordCheck(
      scope,
      "metadata.notIndexable",
      isRouteMetadataIndexable(route) === false,
      "metadata indexability is false",
      "metadata indexability became true",
    );
    recordCheck(
      scope,
      "robots.noindex",
      robots.index === false && robots.googleBot?.index === false,
      "robots index and googleBot index remain false",
      JSON.stringify(robots),
    );
    recordCheck(
      scope,
      "sitemap.ineligible",
      isSitemapEligible(route) === false &&
        sitemapBlockReasons.some((reason) =>
          reason.startsWith("source_record:route_publication_missing"),
        ),
      "sitemap eligibility is blocked by route-publication gate",
      `eligible=${isSitemapEligible(route)}; reasons=${sitemapBlockReasons.join("; ")}`,
    );
    recordCheck(
      scope,
      "metadata.socialPreviewGated",
      isTemplateRoute || (!("openGraph" in routeMetadata) && !("twitter" in routeMetadata)),
      "Open Graph and Twitter are absent while route-publication gate is closed",
      "Open Graph or Twitter emitted while route-publication gate is closed",
    );
    recordCheck(
      scope,
      "schema.jsonLdGated",
      jsonLd.length === 0,
      "route-shell JSON-LD is empty while route-publication gate is closed",
      `${jsonLd.length} JSON-LD entries emitted`,
    );
  }

  const homeRoute = ROUTE_REGISTRY.find((route) => route.path === "/");
  if (!homeRoute) {
    fail("runtime:synthetic-promotion", "homeRoute.exists", "home route missing");
    return;
  }

  const syntheticRegistryPromotion = {
    ...homeRoute,
    status: "approved",
    indexability: "index_follow",
    sitemap: "include",
    blocks: [],
  };
  const syntheticRobots = buildRouteRobots(syntheticRegistryPromotion);
  const syntheticMetadata = buildRouteMetadata({ route: syntheticRegistryPromotion });

  recordCheck(
    "runtime:synthetic-promotion",
    "registryOnlyPromotion.metadataBlocked",
    isRouteMetadataIndexable(syntheticRegistryPromotion) === false,
    "registry-only promotion is blocked from metadata indexability",
    "registry-only promotion became metadata-indexable without route-publication record",
  );
  recordCheck(
    "runtime:synthetic-promotion",
    "registryOnlyPromotion.robotsBlocked",
    syntheticRobots.index === false && syntheticRobots.googleBot?.index === false,
    "registry-only promotion still emits robots noindex",
    JSON.stringify(syntheticRobots),
  );
  recordCheck(
    "runtime:synthetic-promotion",
    "registryOnlyPromotion.sitemapBlocked",
    isSitemapEligible(syntheticRegistryPromotion) === false,
    "registry-only promotion remains sitemap-ineligible",
    "registry-only promotion became sitemap-eligible without route-publication record",
  );
  recordCheck(
    "runtime:synthetic-promotion",
    "registryOnlyPromotion.socialBlocked",
    !("openGraph" in syntheticMetadata) && !("twitter" in syntheticMetadata),
    "registry-only promotion cannot emit Open Graph/Twitter",
    "registry-only promotion emitted Open Graph or Twitter",
  );
  recordCheck(
    "runtime:synthetic-promotion",
    "registryOnlyPromotion.jsonLdBlocked",
    buildRouteShellJsonLd(syntheticRegistryPromotion).length === 0,
    "registry-only promotion cannot emit route-shell JSON-LD",
    "registry-only promotion emitted route-shell JSON-LD",
  );
}

async function checkRenderedPublicRoutes(baseUrl) {
  for (const routeConfig of publicRoutes) {
    const { route } = routeConfig;
    const scope = `rendered:${route}`;
    const html = await readRenderedRouteHtml(routeConfig, baseUrl);
    if (!html) {
      continue;
    }

    const head = extractHead(html);
    const metaTags = tags(head, "meta");
    const linkTags = tags(head, "link");
    const robots = metaTags
      .filter((tag) => attr(tag, "name").toLowerCase() === "robots")
      .map((tag) => attr(tag, "content"));
    const googlebot = metaTags
      .filter((tag) => attr(tag, "name").toLowerCase() === "googlebot")
      .map((tag) => attr(tag, "content"));
    const canonicals = linkTags
      .filter((tag) => attr(tag, "rel").toLowerCase() === "canonical")
      .map((tag) => attr(tag, "href"));
    const openGraph = metaTags.filter((tag) =>
      attr(tag, "property").toLowerCase().startsWith("og:"),
    );
    const twitter = metaTags.filter((tag) =>
      attr(tag, "name").toLowerCase().startsWith("twitter:"),
    );
    const jsonLdCount = (html.match(/type=["']application\/ld\+json["']/gi) ?? [])
      .length;

    recordCheck(
      scope,
      "robots.noindexVisible",
      robots.length === 1 && /\bnoindex\b/i.test(robots[0]),
      robots.join(" | "),
      `robots=${robots.join(" | ") || "missing"}`,
    );
    recordCheck(
      scope,
      "googlebot.noindexVisible",
      googlebot.length === 1 && /\bnoindex\b/i.test(googlebot[0]),
      googlebot.join(" | "),
      `googlebot=${googlebot.join(" | ") || "missing"}`,
    );
    recordCheck(
      scope,
      "canonical.productionOnly",
      canonicals.length === 1 && canonicals[0] === expectedCanonical(route),
      canonicals[0] ?? "",
      `expected=${expectedCanonical(route)}; actual=${canonicals.join(" | ") || "missing"}`,
    );
    recordCheck(
      scope,
      "socialPreview.gated",
      openGraph.length === 0 && twitter.length === 0,
      "no Open Graph/Twitter tags while route-publication gate is closed",
      `og=${openGraph.length}; twitter=${twitter.length}`,
    );
    recordCheck(
      scope,
      "jsonLd.gated",
      jsonLdCount === 0,
      "no JSON-LD emitted while route-publication gate is closed",
      `${jsonLdCount} JSON-LD scripts emitted`,
    );
    recordCheck(
      scope,
      "unlockLanguage.absent",
      !forbiddenUnlockPattern.test(html),
      "no public-unlock language in rendered route",
      "public-unlock language found",
    );
    recordCheck(
      scope,
      "badHosts.absent",
      !forbiddenHostPattern.test(html),
      "no forbidden host leakage in rendered route",
      "forbidden host leakage found",
    );

    summaries.push({
      route,
      robots: robots.join(" | "),
      googlebot: googlebot.join(" | "),
      canonical: canonicals[0] ?? "",
      open_graph_count: openGraph.length,
      twitter_count: twitter.length,
      jsonld_count: jsonLdCount,
      public_unlock_blocked: "yes",
    });
  }
}

function checkRenderedSitemapRobots() {
  const sitemapText = readRequired(
    path.join(builtAppRoot, "sitemap.xml.body"),
    "rendered:sitemap",
    "sitemap.exists",
  );
  const robotsText = readRequired(
    path.join(builtAppRoot, "robots.txt.body"),
    "rendered:robots",
    "robots.exists",
  );

  if (sitemapText) {
    recordCheck(
      "rendered:sitemap",
      "emptyUrlset",
      /<urlset\b/i.test(sitemapText) && !/<url>/i.test(sitemapText),
      "sitemap has zero URL entries",
      "sitemap contains URL entries before route-publication approval",
    );
    recordCheck(
      "rendered:sitemap",
      "noBadHosts",
      !forbiddenHostPattern.test(sitemapText),
      "no forbidden host leakage in sitemap",
      "forbidden host leakage found in sitemap",
    );
  }

  if (robotsText) {
    recordCheck(
      "rendered:robots",
      "productionSitemapPointer",
      robotsText.includes(`Sitemap: ${productionOrigin}/sitemap.xml`),
      "robots points to production sitemap",
      "robots sitemap pointer is missing or non-production",
    );
    recordCheck(
      "rendered:robots",
      "doesNotHideNoindexRoutesFromCrawlers",
      !/^Disallow:\s*\/\s*$/im.test(robotsText),
      "robots does not globally disallow /, so noindex remains crawl-visible",
      "robots globally disallows / and may hide noindex from crawlers",
    );
  }
}

function writeStatusAndExit() {
  const failCount = rows.filter((row) => row.status === "fail").length;
  const warnCount = rows.filter((row) => row.status === "warn").length;
  const passCount = rows.filter((row) => row.status === "pass").length;
  const verdict =
    failCount === 0
      ? "PASS_ROUTE_PUBLICATION_INVARIANT_NO_PUBLIC_UNLOCK"
      : "FAIL_ROUTE_PUBLICATION_INVARIANT_REVIEW_REQUIRED";

  mkdirSync(path.dirname(resultsPath), { recursive: true });
  mkdirSync(workRoot, { recursive: true });

  writeFileSync(
    resultsPath,
    [
      "scope,check,status,details,public_unlock",
      ...rows.map((row) =>
        [row.scope, row.check, row.status, row.details, row.publicUnlock]
          .map(csvEscape)
          .join(","),
      ),
    ].join("\n") + "\n",
  );

  const payload = {
    step: "10V",
    verdict,
    pass_count: passCount,
    warning_count: warnCount,
    failure_count: failCount,
    rendered_route_summaries: summaries,
    policy: {
      invariant:
        "With APPROVED_ROUTE_PUBLICATIONS empty, route registry promotion alone must not unlock robots indexability, sitemap eligibility, JSON-LD, Open Graph, Twitter metadata, rendered public route publication, or public SEO.",
      no_public_unlock: true,
    },
    rows,
  };

  writeFileSync(statusJsonPath, JSON.stringify(payload, null, 2) + "\n");
  writeFileSync(
    statusMdPath,
    [
      "# Step 10V Route Publication Invariant QA Status",
      "",
      `Verdict: ${verdict}`,
      "",
      `Pass: ${passCount}`,
      `Warn: ${warnCount}`,
      `Fail: ${failCount}`,
      "",
      "Invariant: with approved route-publication records empty, route registry promotion alone cannot unlock robots indexability, sitemap eligibility, JSON-LD, Open Graph, Twitter metadata, rendered public route publication, or public SEO.",
      "",
      "No public SEO unlock, route publication, sitemap inclusion, indexability promotion, metadata approval, schema promotion, Open Graph/Twitter promotion, deployment, provider connection, migration apply, client import, product page, locator page, or public asset unlock occurred.",
      "",
    ].join("\n"),
  );

  console.log(verdict);
  console.log(`Checks passed: ${passCount}; warnings: ${warnCount}; failures: ${failCount}`);
  if (failCount > 0) {
    console.error(
      rows
        .filter((row) => row.status === "fail")
        .map((row) => `${row.scope} ${row.check}: ${row.details}`)
        .join("\n"),
    );
    process.exit(1);
  }
}

async function main() {
  checkSourceContracts();
  checkRuntimeInvariants();

  if (renderedRoutesNeedRuntime()) {
    await withRuntimeServer(checkRenderedPublicRoutes);
  } else {
    await checkRenderedPublicRoutes();
  }

  checkRenderedSitemapRobots();
  writeStatusAndExit();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
