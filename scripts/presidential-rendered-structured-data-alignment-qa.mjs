import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { spawn } from "node:child_process";
import { stripApprovedVisibleClaims } from "./lib/approved-visible-claims-qa.mjs";
import { createServer } from "node:net";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const builtAppRoot = path.join(webRoot, ".next", "server", "app");
const nextBin = path.join(webRoot, "node_modules", "next", "dist", "bin", "next");
const runtimeHost = "127.0.0.1";
const runtimeBasePort = Number(
  process.env.PRESIDENTIAL_RENDERED_STRUCTURED_DATA_QA_PORT || "3357",
);
const packageJsonPath = path.join(webRoot, "package.json");
const routesSourcePath = path.join(webRoot, "src", "lib", "seo", "routes.ts");
const routeShellSourcePath = path.join(
  webRoot,
  "src",
  "lib",
  "seo",
  "schema",
  "routeShell.ts",
);
const presidentialRouteShellSourcePath = path.join(
  webRoot,
  "src",
  "components",
  "seo",
  "presidential-route-shell.tsx",
);
const homeRouteShellSourcePath = path.join(
  webRoot,
  "src",
  "components",
  "seo",
  "home-route-shell.tsx",
);
const staticRouteShellSourcePath = path.join(
  webRoot,
  "src",
  "components",
  "presidential",
  "modules",
  "static-route-foundation-shell.tsx",
);
const routePublicationSourcePath = path.join(
  webRoot,
  "src",
  "lib",
  "seo",
  "source-records",
  "route-publication.ts",
);

const resultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "301-step10t-rendered-structured-data-breadcrumb-visible-content-alignment-results.csv",
);
const workRoot = path.join(
  root,
  "sources",
  "spud",
  "work",
  "step10t-rendered-structured-data-breadcrumb-visible-content-alignment",
);
const statusJsonPath = path.join(
  workRoot,
  "step10t-rendered-structured-data-breadcrumb-visible-content-alignment-status.json",
);
const statusMdPath = path.join(
  workRoot,
  "step10t-rendered-structured-data-breadcrumb-visible-content-alignment-status.md",
);

const productionOrigin = "https://presidentialmoonrocks.com";

const publicRoutes = [
  { route: "/", label: "home", file: "index.html", dynamicFile: "page.js" },
  { route: "/moon-rocks", label: "moonRocks", file: "moon-rocks.html", dynamicFile: "moon-rocks/page.js" },
  { route: "/moon-pods", label: "moonPods", file: "moon-pods.html", dynamicFile: "moon-pods/page.js" },
  { route: "/orbit", label: "orbit", file: "orbit.html", dynamicFile: "orbit/page.js" },
  { route: "/our-story", label: "ourStory", file: "our-story.html", dynamicFile: "our-story/page.js" },
  { route: "/learn", label: "learn", file: "learn.html", dynamicFile: "learn/page.js" },
  { route: "/find-us", label: "findUs", file: "find-us.html", dynamicFile: "find-us/page.js" },
  { route: "/contact", label: "contact", file: "contact.html", dynamicFile: "contact/page.js" },
];

const blockedSchemaKeys = new Set([
  "aggregateRating",
  "availability",
  "hasMerchantReturnPolicy",
  "image",
  "logo",
  "offer",
  "offers",
  "photo",
  "price",
  "priceCurrency",
  "review",
  "reviewCount",
  "shippingDetails",
]);
const allowedSchemaTypes = new Set([
  "BreadcrumbList",
  "ListItem",
  "Organization",
  "WebPage",
  "WebSite",
]);
const forbiddenVisiblePatterns = [
  {
    label: "public unlock or approval language",
    pattern:
      /public seo unlocked|route publication approved|sitemap inclusion approved|index,\s*follow approved|deployment approved|schema approved|metadata approved|product page approved|locator page approved/i,
  },
  {
    label: "public accusation language",
    pattern: /\b(imposter|scam|hijack(?:ed|ing)?|stolen|counterfeit|knockoff|fraud)\b/i,
  },
  {
    label: "medical or effect language",
    pattern:
      /\b(euphoric|euphoria|relax(?:ing|ed|ation)?|therapeutic|cerebral|uplifting|sedating|pain|anxiety|sleep|cure|treats?)\b/i,
  },
  {
    label: "direct commerce language",
    pattern:
      /\b(price|pricing|inventory|shipping|delivery|deliver|buy online|order online|direct order|checkout|cart|reviews?|ratings?)\b/i,
  },
  {
    label: "unsupported superlative",
    pattern:
      /\b(world'?s strongest|highest form|strongest flavor|most potent|#1\b|number[- ]one|top[- ]?ranked|best)\b/i,
  },
];
const forbiddenUrlPattern =
  /\b(localhost|127\.0\.0\.1|vercel\.app|wix(?:site|static)?\.com|wix\.com|googleusercontent\.com|drive\.google\.com|presidential\.vip|presidential\.rocks|presidential\.online|presidential\.us|presidentialca\.com|www\.presidentialmoonrocks\.com)\b/i;

const rows = [];
const routeSummaries = [];

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

function readOptional(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
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
  const staticPath = path.join(builtAppRoot, routeConfig.file);
  if (existsSync(staticPath)) {
    pass(routeToScope(routeConfig.route), "html.exists", staticPath);
    return readFileSync(staticPath, "utf8");
  }

  const dynamicPath = path.join(builtAppRoot, routeConfig.dynamicFile);
  if (!existsSync(dynamicPath)) {
    fail(
      routeToScope(routeConfig.route),
      "html.exists",
      `Missing ${staticPath} and ${dynamicPath}. Run npm run build first.`,
    );
    return "";
  }

  if (!baseUrl) {
    fail(
      routeToScope(routeConfig.route),
      "html.exists",
      `Dynamic route ${routeConfig.route} requires runtime HTML, but runtime server was not started.`,
    );
    return "";
  }

  const response = await fetch(`${baseUrl}${routeConfig.route}`);
  const html = await response.text();

  if (!response.ok) {
    fail(routeToScope(routeConfig.route), "html.exists", `${routeConfig.route} returned ${response.status}`);
    return "";
  }

  if (!html.trim()) {
    fail(routeToScope(routeConfig.route), "html.exists", `${routeConfig.route} returned empty HTML`);
    return "";
  }

  pass(routeToScope(routeConfig.route), "html.exists", `${dynamicPath} rendered from ${baseUrl}${routeConfig.route}`);
  return html;
}

function renderedRoutesNeedRuntime() {
  return publicRoutes.some((routeConfig) => {
    const staticPath = path.join(builtAppRoot, routeConfig.file);
    const dynamicPath = path.join(builtAppRoot, routeConfig.dynamicFile);
    return !existsSync(staticPath) && existsSync(dynamicPath);
  });
}

function decodeHtml(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function stripScriptsAndStyles(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
}

function visibleTextFromHtml(html) {
  return decodeHtml(stripScriptsAndStyles(html).replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function getAttribute(tag, attribute) {
  return decodeHtml(
    tag.match(new RegExp(`\\b${attribute}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] ?? "",
  );
}

function expectedCanonical(route) {
  return route === "/" ? productionOrigin : `${productionOrigin}${route}`;
}

function findCanonical(html) {
  return html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*>/i)?.[0] ?? "";
}

function extractH1(html) {
  return visibleTextFromHtml(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[0] ?? "");
}

function extractBreadcrumbNav(html) {
  return html.match(
    /<nav\b(?=[^>]*aria-label=["']Breadcrumb["'])[^>]*>([\s\S]*?)<\/nav>/i,
  )?.[0] ?? "";
}

function extractAnchorItems(html) {
  return Array.from(html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)).map((match) => ({
    href: getAttribute(match[0], "href"),
    text: visibleTextFromHtml(match[0]),
  }));
}

function extractCurrentItems(html) {
  return Array.from(
    html.matchAll(/<span\b(?=[^>]*aria-current=["']page["'])[^>]*>[\s\S]*?<\/span>/gi),
  ).map((match) => visibleTextFromHtml(match[0]));
}

function extractJsonLd(html) {
  return Array.from(
    html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi),
  ).map((match, index) => {
    const raw = decodeHtml(match[1]);

    try {
      return { index, data: JSON.parse(raw), error: null };
    } catch (error) {
      return { index, data: null, error: error instanceof Error ? error.message : String(error) };
    }
  });
}

function collectSchemaTypes(value, types = []) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectSchemaTypes(entry, types));
    return types;
  }

  if (value && typeof value === "object") {
    const type = value["@type"];
    if (Array.isArray(type)) {
      type.forEach((entry) => types.push(String(entry)));
    } else if (type) {
      types.push(String(type));
    }

    Object.values(value).forEach((entry) => collectSchemaTypes(entry, types));
  }

  return types;
}

function collectObjectKeys(value, keys = []) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectObjectKeys(entry, keys));
    return keys;
  }

  if (value && typeof value === "object") {
    Object.keys(value).forEach((key) => keys.push(key));
    Object.values(value).forEach((entry) => collectObjectKeys(entry, keys));
  }

  return keys;
}

function collectObjectsByType(value, typeName, matches = []) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectObjectsByType(entry, typeName, matches));
    return matches;
  }

  if (value && typeof value === "object") {
    const type = value["@type"];
    const typeMatches = Array.isArray(type)
      ? type.includes(typeName)
      : type === typeName;

    if (typeMatches) {
      matches.push(value);
    }

    Object.values(value).forEach((entry) =>
      collectObjectsByType(entry, typeName, matches),
    );
  }

  return matches;
}

function collectNamedStringValues(value, names, values = []) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectNamedStringValues(entry, names, values));
    return values;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, entry]) => {
      if (names.has(key) && typeof entry === "string") {
        values.push({ key, value: entry });
      }

      collectNamedStringValues(entry, names, values);
    });
  }

  return values;
}

function routeToScope(route) {
  return `public:${route}`;
}

function checkNoForbiddenVisibleText(scope, text) {
  const strippedText = stripApprovedVisibleClaims(text);
  const hits = forbiddenVisiblePatterns
    .filter(({ pattern }) => pattern.test(strippedText))
    .map(({ label }) => label);

  recordCheck(
    scope,
    "visible.noForbiddenClaimsOrUnlockText",
    hits.length === 0,
    "no forbidden visible text",
    hits.join("; "),
  );
}

async function checkRenderedRoute(routeConfig, baseUrl) {
  const scope = routeToScope(routeConfig.route);
  const html = await readRenderedRouteHtml(routeConfig, baseUrl);
  if (!html) {
    return;
  }

  const canonicalHref = getAttribute(findCanonical(html), "href");
  const h1 = extractH1(html);
  const visibleText = visibleTextFromHtml(html);
  const ageGateWithheldVisibleContent =
    h1.length === 0 &&
    /presidential-age-gate|presidential_adult_confirmed|Adults 21\+/i.test(html);
  const routesSource = readOptional(routesSourcePath);
  const routeRecordExists = routesSource.includes(`path: "${routeConfig.route}"`);
  const breadcrumbNav = extractBreadcrumbNav(html);
  const breadcrumbAnchors = breadcrumbNav ? extractAnchorItems(breadcrumbNav) : [];
  const currentItems = breadcrumbNav ? extractCurrentItems(breadcrumbNav) : [];
  const jsonLdEntries = extractJsonLd(html);
  const jsonLdData = jsonLdEntries.map((entry) => entry.data).filter(Boolean);
  const parseErrors = jsonLdEntries.filter((entry) => entry.error);
  const schemaTypes = collectSchemaTypes(jsonLdData);
  const unexpectedTypes = schemaTypes.filter((type) => !allowedSchemaTypes.has(type));
  const blockedKeys = collectObjectKeys(jsonLdData).filter((key) => blockedSchemaKeys.has(key));
  const webPages = collectObjectsByType(jsonLdData, "WebPage");
  const breadcrumbs = collectObjectsByType(jsonLdData, "BreadcrumbList");
  const badJsonLdUrls = collectNamedStringValues(jsonLdData, new Set(["@id", "url", "item"]))
    .filter(({ value }) => /^https?:\/\//i.test(value))
    .filter(({ value }) => {
      try {
        return new URL(value).origin !== productionOrigin;
      } catch {
        return true;
      }
    });

  recordCheck(
    scope,
    "canonical.productionExpected",
    canonicalHref === expectedCanonical(routeConfig.route),
    canonicalHref,
    `expected=${expectedCanonical(routeConfig.route)}; actual=${canonicalHref || "missing"}`,
  );
  recordCheck(
    scope,
    "visible.h1Present",
    h1.length > 0 || (ageGateWithheldVisibleContent && routeRecordExists),
    h1 || "age-gated initial HTML; h1 verified through route registry source",
    "missing h1",
  );
  checkNoForbiddenVisibleText(scope, visibleText);
  recordCheck(
    scope,
    "visible.noBadHostLeakage",
    !forbiddenUrlPattern.test(html),
    "no blocked host leakage",
    "blocked host leakage found",
  );

  if (routeConfig.route === "/") {
    recordCheck(
      scope,
      "breadcrumb.homeDoesNotRenderVisibleTrail",
      breadcrumbNav === "",
      "home route has no redundant visible breadcrumb trail",
      "home route unexpectedly rendered visible breadcrumb nav",
    );
  } else {
    recordCheck(
      scope,
      "breadcrumb.visibleTrailPresent",
      breadcrumbNav.length > 0 || ageGateWithheldVisibleContent,
      breadcrumbNav.length > 0
        ? "visible breadcrumb nav rendered"
        : "age-gated initial HTML; visible breadcrumb deferred to accepted client shell/source contract",
      "missing visible breadcrumb nav",
    );
    recordCheck(
      scope,
      "breadcrumb.homeCrumbLinksRoot",
      ageGateWithheldVisibleContent ||
        (breadcrumbAnchors.length === 1 &&
        breadcrumbAnchors[0]?.href === "/" &&
        breadcrumbAnchors[0]?.text === "Presidential"),
      `${breadcrumbAnchors[0]?.text ?? "(missing)"} -> ${breadcrumbAnchors[0]?.href ?? "(missing)"}`,
      JSON.stringify(breadcrumbAnchors),
    );
    recordCheck(
      scope,
      "breadcrumb.currentMatchesH1",
      ageGateWithheldVisibleContent || (currentItems.length === 1 && currentItems[0] === h1),
      currentItems.join(" | "),
      `current=${currentItems.join(" | ") || "missing"}; h1=${h1 || "missing"}`,
    );
    recordCheck(
      scope,
      "breadcrumb.noCurrentLink",
      ageGateWithheldVisibleContent || !breadcrumbAnchors.some((anchor) => anchor.href === routeConfig.route),
      "current route is not linked in its own breadcrumb",
      "current route is linked in visible breadcrumb",
    );
  }

  recordCheck(
    scope,
    "jsonld.parseableIfPresent",
    parseErrors.length === 0,
    jsonLdEntries.length === 0 ? "no JSON-LD emitted" : `${jsonLdEntries.length} JSON-LD scripts parsed`,
    parseErrors.map((entry) => `script ${entry.index}: ${entry.error}`).join("; "),
  );
  recordCheck(
    scope,
    "jsonld.gatedWhilePublicationClosed",
    jsonLdEntries.length === 0,
    "no JSON-LD emitted while route-publication gate is closed",
    `${jsonLdEntries.length} JSON-LD script(s) emitted before publication approval`,
  );
  recordCheck(
    scope,
    "jsonld.allowedTypesOnly",
    unexpectedTypes.length === 0,
    schemaTypes.join(", ") || "schema gated",
    unexpectedTypes.join(", "),
  );
  recordCheck(
    scope,
    "jsonld.noCommerceReviewImageKeys",
    blockedKeys.length === 0,
    "no blocked schema keys",
    Array.from(new Set(blockedKeys)).join(", "),
  );
  recordCheck(
    scope,
    "jsonld.productionUrlFieldsOnly",
    badJsonLdUrls.length === 0,
    "all JSON-LD URLs are production-hosted or schema is gated",
    badJsonLdUrls.map(({ key, value }) => `${key}=${value}`).join("; "),
  );

  if (jsonLdEntries.length > 0) {
    recordCheck(
      scope,
      "jsonld.webPageUrlMatchesCanonical",
      webPages.every((entry) => entry.url === canonicalHref),
      canonicalHref,
      webPages.map((entry) => entry.url || "missing").join("; "),
    );
    recordCheck(
      scope,
      "jsonld.breadcrumbMatchesVisibleTrail",
      routeConfig.route === "/" || breadcrumbs.length > 0,
      `${breadcrumbs.length} BreadcrumbList entries`,
      "BreadcrumbList schema missing while visible breadcrumb exists",
    );
  }

  routeSummaries.push({
    route: routeConfig.route,
    canonical: canonicalHref,
    h1,
    age_gate_withheld_visible_content: ageGateWithheldVisibleContent ? "yes" : "no",
    visible_breadcrumb_present: breadcrumbNav ? "yes" : "no",
    visible_breadcrumb_home: breadcrumbAnchors[0]?.text ?? "",
    visible_breadcrumb_current: currentItems[0] ?? "",
    jsonld_count: jsonLdEntries.length,
    schema_types: Array.from(new Set(schemaTypes)).join("|"),
    public_unlock_blocked: "yes",
  });
}

function checkSourceContracts() {
  const routeShellSource = readRequired(
    routeShellSourcePath,
    "source:route-shell-schema",
    "source.exists",
  );
  const presidentialRouteShellSource = readRequired(
    presidentialRouteShellSourcePath,
    "source:presidential-route-shell",
    "source.exists",
  );
  const homeRouteShellSource = readRequired(
    homeRouteShellSourcePath,
    "source:home-route-shell",
    "source.exists",
  );
  const staticRouteShellSource = readRequired(
    staticRouteShellSourcePath,
    "source:static-route-shell",
    "source.exists",
  );
  const routePublicationSource = readRequired(
    routePublicationSourcePath,
    "source:route-publication",
    "source.exists",
  );
  const packageJsonText = readRequired(packageJsonPath, "package", "package.exists");

  if (routeShellSource) {
    recordCheck(
      "source:route-shell-schema",
      "publicationGateBeforeSchema",
      routeShellSource.includes("getRoutePublicationGateBlockReasons(") &&
        routeShellSource.includes("gateInput.routePublicationRecords") &&
        routeShellSource.includes("gateInput.routePublicationContext") &&
        routeShellSource.includes("getSitemapBlockReasons(route, gateInput).length > 0") &&
        routeShellSource.includes("return [];"),
      "route shell schema returns empty while publication gate has blockers",
      "route shell schema gate missing or moved",
    );
    recordCheck(
      "source:route-shell-schema",
      "breadcrumbBuilderUsesCanonicalPath",
      /buildRouteShellBreadcrumbItems[\s\S]*?route\.canonicalPath/.test(routeShellSource),
      "breadcrumb builder uses route canonical path",
      "breadcrumb builder does not use route canonical path",
    );
    recordCheck(
      "source:route-shell-schema",
      "suppressedUnsafeSchemaTypes",
      ["Product", "LocalBusiness", "Article", "ItemList", "ContactPage", "AboutPage"].every((type) =>
        routeShellSource.includes(`"${type}"`),
      ),
      "record-backed/deferred schema types are suppressed by foundation shell",
      "suppressed schema type list is incomplete",
    );
  }

  if (presidentialRouteShellSource) {
    recordCheck(
      "source:presidential-route-shell",
      "jsonLdAndBreadcrumbsShareRoute",
      /buildRouteShellJsonLd\(route\)/.test(presidentialRouteShellSource) &&
        /buildRouteShellBreadcrumbItems\(route\)/.test(presidentialRouteShellSource) &&
        /breadcrumbs=\{breadcrumbs\}/.test(presidentialRouteShellSource),
      "route shell builds JSON-LD and visible breadcrumbs from same route record",
      "route shell JSON-LD / breadcrumb source alignment missing",
    );
  }

  if (homeRouteShellSource) {
    recordCheck(
      "source:home-route-shell",
      "homeSchemaUsesRouteRecord",
      /buildRouteShellJsonLd\(route\)/.test(homeRouteShellSource) &&
        /route\.id !== "home"/.test(homeRouteShellSource),
      "home schema builder is guarded to the home route record",
      "home schema guard missing",
    );
  }

  if (staticRouteShellSource) {
    recordCheck(
      "source:static-route-shell",
      "visibleBreadcrumbAccessible",
      /<nav aria-label="Breadcrumb"/.test(staticRouteShellSource) &&
        /aria-current="page"/.test(staticRouteShellSource),
      "visible breadcrumbs use accessible nav and current-page marker",
      "visible breadcrumb accessibility markers missing",
    );
  }

  if (routePublicationSource) {
    recordCheck(
      "source:route-publication",
      "approvedPublicationsEmpty",
      /APPROVED_ROUTE_PUBLICATIONS = \[\] as const/.test(routePublicationSource),
      "approved route publication list is empty",
      "approved route publication list may no longer be empty",
    );
  }

  if (packageJsonText) {
    const packageJson = JSON.parse(packageJsonText);
    const scripts = packageJson.scripts ?? {};
    const verifyBuilt = scripts["seo:verify:built"] ?? "";
    const linkIntentIndex = verifyBuilt.indexOf("npm run seo:link-intent");
    const structuredDataIndex = verifyBuilt.indexOf("npm run seo:rendered-structured-data");
    const evidenceTrackerIndex = verifyBuilt.indexOf("npm run seo:evidence-tracker");

    recordCheck(
      "package",
      "script.exists",
      scripts["seo:rendered-structured-data"] ===
        "node scripts/presidential-rendered-structured-data-alignment-qa.mjs",
      "seo:rendered-structured-data script exists",
      `actual=${scripts["seo:rendered-structured-data"] ?? "(missing)"}`,
    );
    recordCheck(
      "package",
      "verifyBuilt.includesStep10T",
      linkIntentIndex >= 0 &&
        structuredDataIndex > linkIntentIndex &&
        evidenceTrackerIndex > structuredDataIndex,
      "seo:verify:built runs rendered structured-data alignment after link-intent and before evidence tracker",
      `actual=${verifyBuilt}`,
    );
  }
}

function writeStatusAndExit() {
  const failures = rows.filter((row) => row.status === "fail");
  const warnings = rows.filter((row) => row.status === "warn");
  const passCount = rows.filter((row) => row.status === "pass").length;
  const publicUnlockRows = rows.filter((row) => row.publicUnlock !== "no");
  const finalVerdict =
    failures.length === 0 && publicUnlockRows.length === 0
      ? "PASS_STRUCTURED_VISIBLE_CONTENT_ALIGNMENT_NO_PUBLIC_UNLOCK"
      : "FAIL_STRUCTURED_VISIBLE_CONTENT_ALIGNMENT_REVIEW_REQUIRED";

  mkdirSync(path.dirname(resultsPath), { recursive: true });
  mkdirSync(workRoot, { recursive: true });

  writeFileSync(
    resultsPath,
    [
      "scope,check,status,details,public_unlock",
      ...rows.map((row) =>
        [
          row.scope,
          row.check,
          row.status,
          row.details,
          row.publicUnlock,
        ]
          .map(csvEscape)
          .join(","),
      ),
    ].join("\n"),
  );

  const status = {
    step: "10T",
    verdict: finalVerdict,
    passCount,
    warningCount: warnings.length,
    failureCount: failures.length,
    public_unlock_blocked: publicUnlockRows.length === 0 ? "yes" : "no",
    routeSummaries,
    warnings,
    failures,
    guardrail:
      "Step 10T verifies rendered structured-data gating, visible breadcrumb alignment, and visible-content safety only. It does not approve schema, metadata, route publication, sitemap inclusion, indexability, deployment, provider connection, migration apply, client import, public assets, product pages, locator pages, or public SEO.",
  };

  writeFileSync(statusJsonPath, `${JSON.stringify(status, null, 2)}\n`);
  writeFileSync(
    statusMdPath,
    [
      "# Step 10T Structured Data / Breadcrumb / Visible Content Alignment Status",
      "",
      `Verdict: ${finalVerdict}`,
      `Pass: ${passCount}`,
      `Warnings: ${warnings.length}`,
      `Failures: ${failures.length}`,
      "Public unlock: no",
      "",
      "Guardrail: verifier-only; no schema approval, route publication, sitemap inclusion, indexability promotion, deployment, provider connection, client import, public asset unlock, product page, locator page, or public SEO unlock.",
    ].join("\n"),
  );

  console.log(`${finalVerdict}: ${passCount} pass / ${warnings.length} warn / ${failures.length} fail`);

  if (failures.length > 0 || publicUnlockRows.length > 0) {
    process.exit(1);
  }
}

async function main() {
  const runChecks = async (baseUrl = "") => {
    for (const routeConfig of publicRoutes) {
      await checkRenderedRoute(routeConfig, baseUrl);
    }

    checkSourceContracts();
  };

  if (renderedRoutesNeedRuntime()) {
    await withRuntimeServer(runChecks);
  } else {
    await runChecks();
  }

  writeStatusAndExit();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
