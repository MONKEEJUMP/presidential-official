import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { stripApprovedVisibleClaimsFromHtml } from "./lib/approved-visible-claims-qa.mjs";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { join } from "node:path";

const projectRoot = process.cwd();
const productionOrigin = "https://presidentialmoonrocks.com";
const nextBin = join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const runtimeHost = "127.0.0.1";
const runtimeBasePort = Number(process.env.PRESIDENTIAL_RENDERED_STATIC_QA_PORT || "3349");

const staticRoutes = [
  { path: "/", label: "home", htmlPath: "index.html", dynamicArtifactPath: "page.js" },
  { path: "/moon-rocks", label: "moonRocks", htmlPath: "moon-rocks.html" },
  { path: "/moon-pods", label: "moonPods", htmlPath: "moon-pods.html" },
  { path: "/orbit", label: "orbit", htmlPath: "orbit.html" },
  { path: "/our-story", label: "ourStory", htmlPath: "our-story.html" },
  { path: "/learn", label: "learn", htmlPath: "learn.html" },
  { path: "/find-us", label: "findUs", htmlPath: "find-us.html" },
  { path: "/contact", label: "contact", htmlPath: "contact.html" },
];

for (const route of staticRoutes) {
  route.dynamicArtifactPath ??= `${route.path.replace(/^\/+/, "")}/page.js`;
}

const paths = {
  appOutputRoot: join(projectRoot, ".next", "server", "app"),
  srcAppRoot: join(projectRoot, "src", "app"),
  sitemapBody: join(projectRoot, ".next", "server", "app", "sitemap.xml.body"),
  robotsBody: join(projectRoot, ".next", "server", "app", "robots.txt.body"),
};

const expectedPageFiles = new Set([
  "page.tsx",
  "contact/page.tsx",
  "drafts/page.tsx",
  "drafts/[slug]/page.tsx",
  "find-us/page.tsx",
  "find-us/[state]/page.tsx",
  "find-us/[state]/[city]/page.tsx",
  "find-us/[state]/[city]/[retailer]/page.tsx",
  "learn/page.tsx",
  "learn/[guide]/page.tsx",
  "moon-pods/page.tsx",
  "moon-rocks/page.tsx",
  "orbit/page.tsx",
  "our-story/page.tsx",
]);

const allowedHtmlOutputs = new Set([
  "_global-error.html",
  "_not-found.html",
  "contact.html",
  "find-us.html",
  "index.html",
  "learn.html",
  "moon-pods.html",
  "moon-rocks.html",
  "orbit.html",
  "our-story.html",
]);

const failures = [];
const passes = [];
const routeSummaries = [];

function pass(check, details = "") {
  passes.push({ check, details });
}

function fail(check, details) {
  failures.push({ check, details });
}

function expectedCanonical(path) {
  return path === "/" ? productionOrigin : `${productionOrigin}${path}`;
}

function toForwardSlashes(path) {
  return path.replaceAll("\\", "/");
}

function listFiles(root, predicate, prefix = "") {
  if (!existsSync(root)) {
    return [];
  }

  return readdirSync(root).flatMap((entry) => {
    const absolute = join(root, entry);
    const relative = prefix ? `${prefix}/${entry}` : entry;
    const stats = statSync(absolute);

    if (stats.isDirectory()) {
      return listFiles(absolute, predicate, relative);
    }

    return predicate(entry, absolute, relative) ? [toForwardSlashes(relative)] : [];
  });
}

function readRequired(path, label) {
  if (!existsSync(path)) {
    fail(`${label}.exists`, `Missing ${path}. Run npm run build before this QA script.`);
    return "";
  }

  pass(`${label}.exists`, path);
  return readFileSync(path, "utf8");
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

async function fetchRuntimeHtml(baseUrl, route) {
  const response = await fetch(`${baseUrl}${route.path}`);
  const html = await response.text();

  if (!response.ok) {
    throw new Error(`${route.path} returned ${response.status}`);
  }

  if (!html.trim()) {
    throw new Error(`${route.path} returned empty HTML`);
  }

  return html;
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
    cwd: projectRoot,
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

function decodeHtml(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function visibleTextFromHtml(html) {
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  const withoutStyles = withoutScripts.replace(/<style[\s\S]*?<\/style>/gi, " ");
  const withoutTags = withoutStyles.replace(/<[^>]+>/g, " ");

  return decodeHtml(withoutTags).replace(/\s+/g, " ").trim();
}

function publicAttributeTextFromHtml(html) {
  return Array.from(
    html.matchAll(/\s(?:aria-label|title|alt)=["']([^"']+)["']/gi),
  )
    .map((match) => decodeHtml(match[1]))
    .join(" ");
}

const rawPublicDomLeakagePatterns = [
  { label: "data-presidential attribute", regex: /\sdata-presidential-[a-z0-9-]+=/gi },
  { label: "blocked_pending", regex: /blocked_pending/gi },
  { label: "internal_foundation", regex: /internal_foundation/gi },
  { label: "source-status", regex: /source-status/gi },
  { label: "route-status", regex: /route-status/gi },
  { label: "locator-status", regex: /locator-status/gi },
  { label: "platform-status", regex: /platform-status/gi },
  { label: "placeholder-status", regex: /placeholder-status/gi },
  { label: "placeholder-kind", regex: /placeholder-kind/gi },
  { label: "public-unlock", regex: /public[-_]unlock/gi },
  { label: "approval-gated", regex: /approval[-\s]gated/gi },
  { label: "route-publication", regex: /route[-_]publication|route publication/gi },
  { label: "pending approval", regex: /pending approval/gi },
  { label: "blocked until", regex: /blocked until/gi },
  { label: "workflow", regex: /\bworkflow\b/gi },
  { label: "staged", regex: /\bstaged\b/gi },
  { label: "placeholder", regex: /\bplaceholder\b/gi },
  { label: "internal", regex: /\binternal\b/gi },
  { label: "shell", regex: /\bshell\b/gi },
  { label: "foundation", regex: /\bfoundation\b/gi },
];

function getAttribute(tag, attribute) {
  const pattern = new RegExp(`${attribute}\\s*=\\s*["']([^"']+)["']`, "i");
  return tag.match(pattern)?.[1] ?? "";
}

function findMeta(html, attribute, value) {
  const pattern = new RegExp(`<meta\\s+[^>]*${attribute}=["']${value}["'][^>]*>`, "i");
  return html.match(pattern)?.[0] ?? "";
}

function findCanonical(html) {
  return html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*>/i)?.[0] ?? "";
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

function extractHttpUrls(text) {
  return Array.from(text.matchAll(/https?:\/\/[^\s"'<>\\)]+/gi)).map(
    (match) => match[0].replace(/[.,;:]+$/g, ""),
  );
}

function checkPublicSeoUrls(check, text, { allowSchemaContext = false } = {}) {
  const badUrls = extractHttpUrls(text).filter((url) => {
    try {
      const parsed = new URL(url);
      if (allowSchemaContext && parsed.origin === "https://schema.org") {
        return false;
      }

      return parsed.origin !== productionOrigin;
    } catch {
      return true;
    }
  });

  if (badUrls.length === 0) {
    pass(check, "all public SEO URLs use the production origin");
    return;
  }

  fail(check, `Unexpected public SEO URLs: ${Array.from(new Set(badUrls)).join(", ")}`);
}

function countPattern(text, pattern) {
  return Array.from(text.matchAll(pattern)).length;
}

function checkNoMatches(check, text, patterns) {
  const hits = patterns.flatMap(({ label, regex }) => {
    const count = countPattern(text, regex);
    return count > 0 ? [`${label}: ${count}`] : [];
  });

  if (hits.length === 0) {
    pass(check, "no hits");
    return;
  }

  fail(check, hits.join("; "));
}

function checkSourceRouteInventory() {
  const pageFiles = listFiles(
    paths.srcAppRoot,
    (entry) => entry === "page.tsx",
  );
  const unexpected = pageFiles.filter((file) => !expectedPageFiles.has(file));
  const missing = Array.from(expectedPageFiles).filter(
    (file) => !pageFiles.includes(file),
  );

  if (unexpected.length === 0 && missing.length === 0) {
    pass("routeInventory.expectedPageFilesOnly", `${pageFiles.length} expected page file(s) found`);
  } else {
    fail(
      "routeInventory.expectedPageFilesOnly",
      `unexpected=${unexpected.join("|") || "none"}; missing=${missing.join("|") || "none"}`,
    );
  }
}

function checkRenderedOutputInventory() {
  const htmlOutputs = listFiles(
    paths.appOutputRoot,
    (entry) => entry.endsWith(".html"),
  );
  const unexpected = htmlOutputs.filter((file) => !allowedHtmlOutputs.has(file));
  const routeArtifactMissing = staticRoutes.filter((route) => {
    const htmlPath = join(paths.appOutputRoot, route.htmlPath);
    const dynamicArtifactPath = join(paths.appOutputRoot, route.dynamicArtifactPath);
    return !existsSync(htmlPath) && !existsSync(dynamicArtifactPath);
  });
  const notFoundMissing =
    !existsSync(join(paths.appOutputRoot, "_not-found.html")) &&
    !existsSync(join(paths.appOutputRoot, "_not-found", "page.js"));

  if (unexpected.length === 0 && routeArtifactMissing.length === 0 && !notFoundMissing) {
    pass("routeInventory.expectedRenderedOutputsOnly", `${htmlOutputs.length} static HTML output(s); dynamic route artifacts accepted`);
  } else {
    fail(
      "routeInventory.expectedRenderedOutputsOnly",
      `unexpected=${unexpected.join("|") || "none"}; missingRoutes=${routeArtifactMissing.map((route) => route.path).join("|") || "none"}; missingNotFound=${notFoundMissing}`,
    );
  }
}

function checkRouteHtml(route, runtimeHtmlByPath) {
  const htmlPath = join(paths.appOutputRoot, route.htmlPath);
  const dynamicArtifactPath = join(paths.appOutputRoot, route.dynamicArtifactPath);
  const staticHtmlExists = existsSync(htmlPath);
  const routeHtml = staticHtmlExists
    ? readRequired(htmlPath, `${route.label}.html`)
    : (runtimeHtmlByPath.get(route.path) ?? "");

  if (!staticHtmlExists && routeHtml && existsSync(dynamicArtifactPath)) {
    pass(`${route.label}.html.exists`, `${dynamicArtifactPath} rendered at ${route.path}`);
  } else if (!staticHtmlExists && !routeHtml) {
    fail(`${route.label}.html.exists`, `Missing ${htmlPath} and runtime HTML for ${route.path}`);
  }

  if (!routeHtml) {
    return;
  }

  const visibleText = visibleTextFromHtml(routeHtml);
  const claimFilteredVisibleText = visibleTextFromHtml(
    stripApprovedVisibleClaimsFromHtml(routeHtml, route.path),
  );
  const publicAttributeText = publicAttributeTextFromHtml(routeHtml);

  checkNoMatches(
    `${route.label}.html.noRawWorkflowAttributeLeakage`,
    routeHtml,
    rawPublicDomLeakagePatterns,
  );

  if (route.path === "/") {
    if (
      routeHtml.includes("Official Presidential Cannabis") &&
      routeHtml.includes("Presidential platforms")
    ) {
      pass(`${route.label}.html.homeSceneFoundationPresent`, "guarded home route composition rendered");
    } else {
      fail(
        `${route.label}.html.homeSceneFoundationPresent`,
        "Guarded home route composition is missing expected public-safe sections",
      );
    }
  } else if (
    route.path === "/moon-rocks" &&
    routeHtml.includes("Inside the Moon Rocks platform") &&
    routeHtml.includes("A cleaner customer path") &&
    routeHtml.includes("Explore Presidential")
  ) {
    pass(`${route.label}.html.staticRouteVisualFoundationPresent`, "Moon Rocks product-platform route composition rendered");
  } else if (
    (route.path === "/moon-pods" || route.path === "/orbit") &&
    routeHtml.includes("platform structure") &&
    routeHtml.includes("Source-confirmed rollout") &&
    routeHtml.includes("Explore Presidential")
  ) {
    pass(`${route.label}.html.staticRouteVisualFoundationPresent`, "product-pillar platform route composition rendered");
  } else if (
    routeHtml.includes("Inside this section") &&
    routeHtml.includes("Explore Presidential")
  ) {
    pass(`${route.label}.html.staticRouteVisualFoundationPresent`, "non-home route composition rendered");
  } else {
    fail(
      `${route.label}.html.staticRouteVisualFoundationPresent`,
      "Non-home route composition is missing expected visitor-facing sections",
    );
  }

  checkNoMatches(`${route.label}.visibleCopy.noInternalWorkflowLanguage`, visibleText, [
    { label: "blocked_pending", regex: /blocked_pending/gi },
    { label: "public-unlock", regex: /public[-\s]unlock/gi },
    { label: "metadata", regex: /\bmetadata\b/gi },
    { label: "schema", regex: /\bschema\b/gi },
    { label: "sitemap", regex: /\bsitemap\b/gi },
    { label: "route-publication", regex: /route[-\s]publication/gi },
    { label: "approval-gated", regex: /approval[-\s]gated/gi },
    { label: "placeholder", regex: /\bplaceholder\b/gi },
    { label: "internal", regex: /\binternal\b/gi },
    { label: "shell", regex: /\bshell\b/gi },
    { label: "foundation", regex: /\bfoundation\b/gi },
    { label: "preview", regex: /\bpreview\b/gi },
    { label: "pending approval", regex: /pending approval/gi },
    { label: "blocked until", regex: /blocked until/gi },
    { label: "workflow", regex: /\bworkflow\b/gi },
    { label: "staged", regex: /\bstaged\b/gi },
  ]);

  checkNoMatches(`${route.label}.attributes.noInternalWorkflowLanguage`, publicAttributeText, [
    { label: "blocked_pending", regex: /blocked_pending/gi },
    { label: "public-unlock", regex: /public[-\s]unlock/gi },
    { label: "metadata", regex: /\bmetadata\b/gi },
    { label: "schema", regex: /\bschema\b/gi },
    { label: "sitemap", regex: /\bsitemap\b/gi },
    { label: "route-publication", regex: /route[-\s]publication/gi },
    { label: "approval status", regex: /approval status/gi },
    { label: "approval-gated", regex: /approval[-\s]gated/gi },
    { label: "placeholder", regex: /\bplaceholder\b/gi },
    { label: "internal", regex: /\binternal\b/gi },
    { label: "shell", regex: /\bshell\b/gi },
    { label: "foundation", regex: /\bfoundation\b/gi },
    { label: "preview", regex: /\bpreview\b/gi },
    { label: "pending approval", regex: /pending approval/gi },
    { label: "blocked until", regex: /blocked until/gi },
    { label: "workflow", regex: /\bworkflow\b/gi },
    { label: "staged", regex: /\bstaged\b/gi },
  ]);

  checkNoMatches(`${route.label}.visibleCopy.noForbiddenClaims`, claimFilteredVisibleText, [
    { label: "accusation language", regex: /\b(imposter|scam|hijack(?:ed|ing)?|stolen|counterfeit|knockoff|fraud)\b/gi },
    { label: "medical/effect language", regex: /\b(euphoric|euphoria|relax(?:ing|ed|ation)?|therapeutic|cerebral|uplifting|sedating|pain|anxiety|sleep|cure|treats?)\b/gi },
    { label: "unsupported superlative", regex: /\b(world'?s strongest|highest form|strongest flavor|most potent|#1\b|number[- ]one|top[- ]?ranked|best)\b/gi },
    { label: "direct commerce language", regex: /\b(price|pricing|inventory|shipping|delivery|deliver|buy online|order online|direct order|checkout|cart|reviews?|ratings?)\b/gi },
  ]);

  checkNoMatches(`${route.label}.html.noPublicUnlockSignals`, routeHtml, [
    { label: "public unlock true", regex: /data-presidential-public-unlock=["']true["']|publicUnlock\s*:\s*true/gi },
    { label: "approved route publication", regex: /route[-\s]publication\s+(approved|unlocked|enabled|live)/gi },
    { label: "schema image unlock", regex: /(schema image|og:image|twitter:image)\s*(approved|unlocked|enabled|live)?/gi },
  ]);

  checkNoMatches(`${route.label}.html.noNonProductionUrls`, routeHtml, [
    { label: "localhost", regex: /https?:\/\/(?:localhost|127\.0\.0\.1)/gi },
    { label: "http production host", regex: /http:\/\/presidentialmoonrocks\.com/gi },
    { label: "www production host", regex: /https?:\/\/www\.presidentialmoonrocks\.com/gi },
    { label: "vercel preview", regex: /https?:\/\/[^"'\s<>]*\.vercel\.app/gi },
    { label: "wix URL", regex: /https?:\/\/[^"'\s<>]*(?:wixsite|wixstatic)\.com/gi },
    { label: "alternate defensive domain", regex: /https?:\/\/[^"'\s<>]*(?:presidentialca\.com|presidential\.vip|presidential\.rocks|presidential\.online|presidential\.us)/gi },
  ]);

  checkPublicSeoUrls(`${route.label}.html.productionUrlOriginsOnly`, routeHtml, {
    allowSchemaContext: true,
  });

  const robotsMeta = findMeta(routeHtml, "name", "robots");
  const googlebotMeta = findMeta(routeHtml, "name", "googlebot");
  const robotsContent = getAttribute(robotsMeta, "content");
  const googlebotContent = getAttribute(googlebotMeta, "content");

  if (/\bnoindex\b/i.test(robotsContent) && /\bfollow\b/i.test(robotsContent)) {
    pass(`${route.label}.metadata.robotsNoindexFollow`, robotsContent);
  } else {
    fail(`${route.label}.metadata.robotsNoindexFollow`, `Unexpected robots meta content: ${robotsContent || "missing"}`);
  }

  if (/\bnoindex\b/i.test(googlebotContent)) {
    pass(`${route.label}.metadata.googlebotNoindex`, googlebotContent);
  } else {
    fail(`${route.label}.metadata.googlebotNoindex`, `Unexpected googlebot meta content: ${googlebotContent || "missing"}`);
  }

  if (!/<meta\s+[^>]*content=["']index,\s*follow["'][^>]*>/i.test(routeHtml)) {
    pass(`${route.label}.metadata.noIndexFollowPromotion`, "no index, follow meta tag found");
  } else {
    fail(`${route.label}.metadata.noIndexFollowPromotion`, "Found index, follow metadata promotion");
  }

  const expectedUrl = expectedCanonical(route.path);
  const canonicalTag = findCanonical(routeHtml);
  const canonicalHref = getAttribute(canonicalTag, "href");
  const ogUrlTag = findMeta(routeHtml, "property", "og:url");
  const ogUrl = getAttribute(ogUrlTag, "content");
  const descriptionText = [
    getAttribute(findMeta(routeHtml, "name", "description"), "content"),
    getAttribute(findMeta(routeHtml, "property", "og:description"), "content"),
    getAttribute(findMeta(routeHtml, "name", "twitter:description"), "content"),
  ].filter(Boolean).join(" ");

  if (canonicalHref === expectedUrl) {
    pass(`${route.label}.metadata.canonicalProductionHost`, canonicalHref);
  } else {
    fail(`${route.label}.metadata.canonicalProductionHost`, `Unexpected canonical href: ${canonicalHref || "missing"}; expected ${expectedUrl}`);
  }

  if (!ogUrl) {
    pass(`${route.label}.metadata.openGraphGatedUntilPublication`, "no og:url emitted while route publication gate is closed");
  } else {
    fail(`${route.label}.metadata.openGraphGatedUntilPublication`, `Unexpected og:url before route publication: ${ogUrl}`);
  }

  checkNoMatches(`${route.label}.metadata.descriptionsNoForbiddenClaims`, descriptionText, [
    { label: "accusation language", regex: /\b(imposter|scam|hijack(?:ed|ing)?|stolen|counterfeit|knockoff|fraud)\b/gi },
    { label: "medical/effect language", regex: /\b(euphoric|euphoria|relax(?:ing|ed|ation)?|therapeutic|cerebral|uplifting|sedating|pain|anxiety|sleep|cure|treats?)\b/gi },
    { label: "unsupported superlative", regex: /\b(world'?s strongest|highest form|strongest flavor|most potent|#1\b|number[- ]one|top[- ]?ranked|best)\b/gi },
    { label: "direct commerce language", regex: /\b(price|pricing|inventory|shipping|delivery|deliver|buy online|order online|direct order|checkout|cart|reviews?|ratings?)\b/gi },
  ]);

  if (!/<meta\s+[^>]*(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*>/i.test(routeHtml)) {
    pass(`${route.label}.metadata.noSocialImages`, "no OG/Twitter image metadata emitted");
  } else {
    fail(`${route.label}.metadata.noSocialImages`, "Found OG/Twitter image metadata before asset approval");
  }

  const jsonLdEntries = extractJsonLd(routeHtml);
  const parseErrors = jsonLdEntries.filter((entry) => entry.error);
  if (parseErrors.length === 0 && jsonLdEntries.length === 0) {
    pass(`${route.label}.jsonld.gatedUntilPublication`, "no JSON-LD emitted while route publication gate is closed");
  } else if (parseErrors.length === 0) {
    pass(`${route.label}.jsonld.valid`, `${jsonLdEntries.length} JSON-LD script(s) parsed`);
  } else {
    fail(
      `${route.label}.jsonld.valid`,
      parseErrors.map((entry) => `script ${entry.index}: ${entry.error}`).join("; "),
    );
  }

  const schemaTypes = jsonLdEntries.flatMap((entry) =>
    entry.data ? collectSchemaTypes(entry.data) : [],
  );
  const allowedTypes = new Set([
    "Organization",
    "WebSite",
    "WebPage",
    "BreadcrumbList",
    "ListItem",
  ]);
  const forbiddenTypes = schemaTypes.filter((type) => !allowedTypes.has(type));

  if (forbiddenTypes.length === 0) {
    pass(`${route.label}.jsonld.allowedTypesOnly`, schemaTypes.join(", "));
  } else {
    fail(`${route.label}.jsonld.allowedTypesOnly`, `Unexpected JSON-LD types: ${forbiddenTypes.join(", ")}`);
  }

  const schemaTypeSet = new Set(schemaTypes);
  if (jsonLdEntries.length === 0) {
    pass(`${route.label}.jsonld.expectedSchemaShape`, "schema gated until route publication");
  } else if (route.path === "/") {
    const requiredHomeTypes = ["Organization", "WebSite", "WebPage"];
    const missingHomeTypes = requiredHomeTypes.filter(
      (type) => !schemaTypeSet.has(type),
    );
    const unexpectedHomeTypes = schemaTypes.filter(
      (type) => !requiredHomeTypes.includes(type),
    );

    if (missingHomeTypes.length === 0 && unexpectedHomeTypes.length === 0) {
      pass(`${route.label}.jsonld.expectedSchemaShape`, "home emits Organization, WebSite, and WebPage only");
    } else {
      fail(
        `${route.label}.jsonld.expectedSchemaShape`,
        `missing=${missingHomeTypes.join("|") || "none"}; unexpected=${unexpectedHomeTypes.join("|") || "none"}`,
      );
    }
  } else {
    const missingNonHomeTypes = ["WebPage", "BreadcrumbList", "ListItem"].filter(
      (type) => !schemaTypeSet.has(type),
    );
    const forbiddenNonHomeTypes = schemaTypes.filter((type) =>
      ["Organization", "WebSite"].includes(type),
    );

    if (missingNonHomeTypes.length === 0 && forbiddenNonHomeTypes.length === 0) {
      pass(`${route.label}.jsonld.expectedSchemaShape`, "non-home route emits WebPage and BreadcrumbList only");
    } else {
      fail(
        `${route.label}.jsonld.expectedSchemaShape`,
        `missing=${missingNonHomeTypes.join("|") || "none"}; forbidden=${forbiddenNonHomeTypes.join("|") || "none"}`,
      );
    }
  }

  const jsonLdData = jsonLdEntries.map((entry) => entry.data).filter(Boolean);
  const webPageObjects = collectObjectsByType(jsonLdData, "WebPage");
  const badWebPageUrls = webPageObjects
    .map((entry) => entry.url)
    .filter((url) => url !== expectedUrl);

  if (jsonLdEntries.length === 0) {
    pass(`${route.label}.jsonld.webPageUrlMatchesCanonical`, "schema gated until route publication");
  } else if (webPageObjects.length > 0 && badWebPageUrls.length === 0) {
    pass(`${route.label}.jsonld.webPageUrlMatchesCanonical`, expectedUrl);
  } else {
    fail(
      `${route.label}.jsonld.webPageUrlMatchesCanonical`,
      `WebPage urls=${webPageObjects.map((entry) => entry.url || "missing").join("|") || "none"}; expected=${expectedUrl}`,
    );
  }

  const jsonLdUrlValues = collectNamedStringValues(
    jsonLdData,
    new Set(["url", "@id"]),
  );
  const badJsonLdUrls = jsonLdUrlValues.filter(({ value }) => {
    if (!/^https?:\/\//i.test(value)) {
      return false;
    }

    try {
      return new URL(value).origin !== productionOrigin;
    } catch {
      return true;
    }
  });

  if (badJsonLdUrls.length === 0) {
    pass(`${route.label}.jsonld.productionUrlFieldsOnly`, "all JSON-LD url/@id fields use production origin");
  } else {
    fail(
      `${route.label}.jsonld.productionUrlFieldsOnly`,
      badJsonLdUrls.map(({ key, value }) => `${key}=${value}`).join("; "),
    );
  }

  const jsonLdKeys = collectObjectKeys(jsonLdEntries.map((entry) => entry.data));
  const blockedJsonLdKeys = new Set([
    "offers",
    "offer",
    "price",
    "priceCurrency",
    "availability",
    "shippingDetails",
    "hasMerchantReturnPolicy",
    "review",
    "aggregateRating",
    "ratingValue",
    "reviewCount",
    "image",
    "logo",
    "photo",
  ]);
  const blockedKeysFound = jsonLdKeys.filter((key) => blockedJsonLdKeys.has(key));

  if (blockedKeysFound.length === 0) {
    pass(`${route.label}.jsonld.noCommerceReviewOrImageKeys`, "no blocked JSON-LD keys found");
  } else {
    fail(
      `${route.label}.jsonld.noCommerceReviewOrImageKeys`,
      `Blocked JSON-LD keys found: ${Array.from(new Set(blockedKeysFound)).join(", ")}`,
    );
  }

  routeSummaries.push({
    route: route.path,
    html_path: route.htmlPath,
    canonical: canonicalHref,
    og_url: ogUrl,
    robots: robotsContent,
    googlebot: googlebotContent,
    jsonld_count: jsonLdEntries.length,
    jsonld_types: Array.from(new Set(schemaTypes)).join("|"),
    visible_text_length: visibleText.length,
  });
}

async function main() {
checkSourceRouteInventory();
checkRenderedOutputInventory();

const runtimeHtmlByPath = new Map();
await withRuntimeServer(async (baseUrl) => {
  for (const route of staticRoutes.filter((entry) => !existsSync(join(paths.appOutputRoot, entry.htmlPath)))) {
    runtimeHtmlByPath.set(route.path, await fetchRuntimeHtml(baseUrl, route));
  }
});

staticRoutes.forEach((route) => checkRouteHtml(route, runtimeHtmlByPath));

const sitemapBody = readRequired(paths.sitemapBody, "sitemap");
const robotsBody = readRequired(paths.robotsBody, "robots");

if (sitemapBody) {
  if (/<urlset\b/i.test(sitemapBody) && !/<url>/i.test(sitemapBody)) {
    pass("sitemap.emptyUrlset", "built sitemap has no URL entries");
  } else {
    fail("sitemap.emptyUrlset", "Built sitemap contains URL entries or is malformed");
  }
}

if (robotsBody) {
  if (/^Allow:\s*\/\s*$/im.test(robotsBody) && !/^Disallow:\s*\/\s*$/im.test(robotsBody)) {
    pass("robots.allowsRootWithoutGlobalBlock", "robots allows root and does not globally disallow /");
  } else {
    fail("robots.allowsRootWithoutGlobalBlock", "robots.txt may globally block crawlable public route content");
  }

  if (robotsBody.includes(`Sitemap: ${productionOrigin}/sitemap.xml`)) {
    pass("robots.productionSitemap", "robots sitemap points to production host");
  } else {
    fail("robots.productionSitemap", "robots sitemap does not point to production host");
  }

  checkPublicSeoUrls("robots.productionUrlOriginsOnly", robotsBody);
}

const verdict = failures.length === 0 ? "PASS" : "FAIL";
const summary = {
  verdict,
  route_count: staticRoutes.length,
  pass_count: passes.length,
  fail_count: failures.length,
  route_summaries: routeSummaries,
  passes,
  failures,
};

console.log("Presidential Rendered Static Routes QA");
console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
