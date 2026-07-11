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
const packageJsonPath = path.join(webRoot, "package.json");
const nextBin = path.join(webRoot, "node_modules", "next", "dist", "bin", "next");
const runtimeHost = "127.0.0.1";
const runtimeBasePort = Number(process.env.PRESIDENTIAL_LINK_INTENT_QA_PORT || "3353");
const ctaLinkSourcePath = path.join(
  webRoot,
  "src",
  "components",
  "presidential",
  "primitives",
  "cta-link.tsx",
);
const moonRocksPlatformSourcePath = path.join(
  webRoot,
  "src",
  "components",
  "presidential",
  "modules",
  "moon-rocks-platform-shell.tsx",
);
const pillarPlatformSourcePath = path.join(
  webRoot,
  "src",
  "components",
  "presidential",
  "modules",
  "pillar-platform-shell.tsx",
);
const homepageSourcePath = path.join(
  webRoot,
  "src",
  "components",
  "presidential",
  "modules",
  "homepage-foundation-shell.tsx",
);
const resultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "297-step10s-navigation-cta-intent-duplicate-link-hygiene-qa-results.csv",
);
const workRoot = path.join(
  root,
  "sources",
  "spud",
  "work",
  "step10s-navigation-cta-intent-duplicate-link-hygiene-qa-foundation",
);
const statusJsonPath = path.join(
  workRoot,
  "step10s-navigation-cta-intent-duplicate-link-hygiene-status.json",
);
const statusMdPath = path.join(
  workRoot,
  "step10s-navigation-cta-intent-duplicate-link-hygiene-status.md",
);

const productionOrigin = "https://presidentialmoonrocks.com";

const publicRoutes = [
  { route: "/", label: "home", file: "index.html", dynamicArtifactPath: "page.js" },
  { route: "/moon-rocks", label: "moonRocks", file: "moon-rocks.html" },
  { route: "/moon-pods", label: "moonPods", file: "moon-pods.html" },
  { route: "/orbit", label: "orbit", file: "orbit.html" },
  { route: "/our-story", label: "ourStory", file: "our-story.html" },
  { route: "/learn", label: "learn", file: "learn.html" },
  { route: "/find-us", label: "findUs", file: "find-us.html" },
  { route: "/contact", label: "contact", file: "contact.html" },
];

const fallbackRoutes = [
  {
    route: "/presidential-link-intent-not-found-probe",
    label: "notFound",
    file: "_not-found.html",
    dynamicArtifactPath: "_not-found/page.js",
    allowNotOk: true,
  },
];

for (const route of [...publicRoutes, ...fallbackRoutes]) {
  route.dynamicArtifactPath ??= `${route.route.replace(/^\/+/, "")}/page.js`;
}

const mandatoryStaticPaths = publicRoutes.map((route) => route.route);
const allowedInternalHrefs = new Set([
  ...mandatoryStaticPaths,
  // 9083-CODE P2.2 (owner directive, 2026-07-10): built, registered,
  // conditional/noindex Moon Rocks series routes reachable from the hub's
  // series selector.
  "/moon-rocks/silver",
  "/moon-rocks/gold",
  "/moon-rocks/rose-gold",
  // 9083-CODE P4 (owner 8-state ruling, 2026-07-11): themed priority-market
  // pages linked from the tile-grid map. Still conditional/noindex.
  "/find-us/az",
  "/find-us/ca",
  "/find-us/fl",
  "/find-us/mi",
  "/find-us/nv",
  "/find-us/ny",
  "/find-us/ok",
  "/find-us/wa",
]);
const allowedSamePageFragmentHrefs = new Set(["#presidential-main"]);
const globalNavigationHrefs = new Set([
  ...mandatoryStaticPaths,
  // 9083-CODE P3.1 (owner directive, 2026-07-10): the sticky header's
  // Moon Rocks mega-menu carries the series links globally, so pages that
  // also link a series in their own content legitimately duplicate them.
  "/moon-rocks/silver",
  "/moon-rocks/gold",
  "/moon-rocks/rose-gold",
]);
const allowedDuplicateHrefs = new Map(
  publicRoutes.map(({ route }) => [route, globalNavigationHrefs]),
);

const forbiddenHrefPatterns = [
  { label: "external URL", pattern: /^https?:\/\//i },
  { label: "protocol-relative URL", pattern: /^\/\// },
  { label: "mailto", pattern: /^mailto:/i },
  { label: "tel", pattern: /^tel:/i },
  { label: "javascript URL", pattern: /^javascript:/i },
  { label: "hash-only href", pattern: /^#/ },
  {
    label: "future or unresolved route",
    pattern:
      /\/learn\/(?:%5Bguide%5D|\[guide\])|\/find-us\/\[state\]|^\/(?:official-presidential|pre-rolls|blunts)(?:\/|$)/i,
  },
  {
    label: "private route family",
    pattern: /^\/(?:api|admin|private|preview|draft|internal)(?:\/|$)/i,
  },
  {
    label: "bad host leakage",
    pattern:
      /\b(localhost|127\.0\.0\.1|vercel\.app|wix(?:site|static)?\.com|wix\.com|googleusercontent\.com|drive\.google\.com|presidential\.vip|presidential\.rocks|presidential\.online|presidential\.us|presidentialca\.com|www\.presidentialmoonrocks\.com)\b/i,
  },
];

const weakAnchorTextPattern =
  /^\s*(?:click here|read more|learn more|more|go|link|button|find us|website)\s*$/i;

const forbiddenAnchorTextPatterns = [
  {
    label: "public unlock or approval language",
    pattern:
      /public seo unlocked|route publication approved|sitemap inclusion approved|index,\s*follow approved|deployment approved|schema approved|metadata approved|product page approved|locator page approved/i,
  },
  {
    label: "direct commerce language",
    pattern:
      /\b(buy|shop now|order online|direct order|checkout|cart|price|pricing|inventory|shipping|delivery|deliver|in stock|available now|get yours)\b/i,
  },
  {
    label: "medical or effect language",
    pattern:
      /\b(euphoric|euphoria|relax(?:ing|ed|ation)?|therapeutic|cerebral|uplifting|sedating|pain|anxiety|sleep|cure|treats?)\b/i,
  },
  {
    label: "unsupported superlative",
    pattern:
      /\b(world'?s strongest|highest form|strongest flavor|most potent|#1\b|number[- ]one|top[- ]?ranked|best)\b/i,
  },
  {
    label: "public accusation language",
    pattern: /\b(imposter|scam|hijack(?:ed|ing)?|stolen|counterfeit|knockoff|fraud)\b/i,
  },
  {
    label: "youth-coded language",
    pattern: /\b(kids?|children|teen(?:s|age)?|school|student|candy|cartoon)\b/i,
  },
];

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
  const response = await fetch(`${baseUrl}${route.route}`);
  const html = await response.text();

  if (!response.ok && !route.allowNotOk) {
    throw new Error(`${route.route} returned ${response.status}`);
  }

  if (!html.trim()) {
    throw new Error(`${route.route} returned empty HTML`);
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

function readRenderedHtml(routeConfig, scope, runtimeHtmlByLabel) {
  const filePath = path.join(builtAppRoot, routeConfig.file);
  if (existsSync(filePath)) {
    return readRequired(filePath, scope, "html.exists");
  }

  const dynamicArtifactPath = path.join(builtAppRoot, routeConfig.dynamicArtifactPath);
  const html = runtimeHtmlByLabel.get(routeConfig.label) ?? "";
  if (html && existsSync(dynamicArtifactPath)) {
    pass(scope, "html.exists", `${dynamicArtifactPath} rendered at ${routeConfig.route}`);
    return html;
  }

  fail(scope, "html.exists", `Missing ${filePath} and runtime HTML for ${routeConfig.route}. Run npm run build first.`);
  return "";
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

function extractAnchorTags(html) {
  return Array.from(stripScriptsAndStyles(html).matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)).map(
    (match) => match[0],
  );
}

function normalizeHref(href) {
  if (href === productionOrigin) {
    return "/";
  }

  if (href.startsWith(`${productionOrigin}/`)) {
    return href.slice(productionOrigin.length).replace(/\/$/, "") || "/";
  }

  return href.replace(/\/$/, "") || "/";
}

function isAllowedSamePageFragmentHref(href) {
  return allowedSamePageFragmentHrefs.has(href);
}

function expectedHrefSet(routePath) {
  if (routePath === "/") {
    return new Set(mandatoryStaticPaths.filter((entry) => entry !== "/"));
  }

  return allowedInternalHrefs;
}

function checkAnchor(routePath, index, tag) {
  const scope = `public:${routePath}:anchor:${index + 1}`;
  const rawHref = getAttribute(tag, "href");
  const href = normalizeHref(rawHref);
  const text = visibleTextFromHtml(tag);
  const title = getAttribute(tag, "title");
  const label = text || title;
  const forbiddenHrefHits = forbiddenHrefPatterns
    .filter(({ pattern }) => pattern.test(rawHref) || pattern.test(href))
    .map(({ label: hitLabel }) => hitLabel);
  const strippedLabel = stripApprovedVisibleClaims(label);
  const forbiddenTextHits = forbiddenAnchorTextPatterns
    .filter(({ pattern }) => pattern.test(strippedLabel))
    .map(({ label: hitLabel }) => hitLabel);
  const allowedSamePageFragment = isAllowedSamePageFragmentHref(href);

  recordCheck(scope, "anchor.hasHref", rawHref.length > 0, rawHref, "missing href");
  recordCheck(
    scope,
    "href.internalAllowed",
    allowedInternalHrefs.has(href) || allowedSamePageFragment,
    allowedSamePageFragment ? `${href} same-page accessibility fragment` : href,
    `href is not an approved current static route: ${rawHref}`,
  );
  recordCheck(
    scope,
    "href.noForbiddenPattern",
    allowedSamePageFragment || forbiddenHrefHits.length === 0,
    allowedSamePageFragment ? "same-page accessibility fragment" : "no forbidden href pattern",
    forbiddenHrefHits.join("; "),
  );
  recordCheck(scope, "text.present", label.length > 0, label, "anchor text/title missing");
  recordCheck(
    scope,
    "text.descriptive",
    label.length > 0 && !weakAnchorTextPattern.test(label),
    label,
    `generic anchor text: ${label}`,
  );
  recordCheck(
    scope,
    "text.reasonablyConcise",
    label.length > 0 && label.length <= 72,
    `${label.length} chars`,
    `anchor text too long: ${label.length} chars`,
  );
  recordCheck(
    scope,
    "text.noForbiddenIntent",
    forbiddenTextHits.length === 0,
    "no forbidden CTA intent language",
    forbiddenTextHits.join("; "),
  );
  recordCheck(
    scope,
    "text.routeContext",
    allowedSamePageFragment ||
      label.toLowerCase().includes("presidential") ||
      label.toLowerCase().includes("moon") ||
      label.toLowerCase().includes("orbit") ||
      label.toLowerCase().includes("learn") ||
      label.toLowerCase().includes("find") ||
      label.toLowerCase().includes("contact") ||
      label.toLowerCase().includes("story") ||
      label.toLowerCase().includes("platform") ||
      label.toLowerCase() === "home",
    allowedSamePageFragment ? "same-page accessibility skip link" : label,
    `anchor text lacks route-specific context: ${label}`,
  );

  return { rawHref, href, label };
}

function checkRoute(routeConfig, runtimeHtmlByLabel) {
  const { route } = routeConfig;
  const scope = `public:${route}`;
  const html = readRenderedHtml(routeConfig, scope, runtimeHtmlByLabel);

  if (!html) {
    return;
  }

  const anchorTags = extractAnchorTags(html);
  const ageGateWithheldInitialAnchors =
    anchorTags.length === 0 &&
    /presidential-age-gate|presidential_adult_confirmed|Adults 21\+/i.test(html);
  const anchors = anchorTags.map((tag, index) => checkAnchor(route, index, tag));
  const hrefCounts = new Map();
  const hrefLabels = new Map();

  for (const anchor of anchors) {
    hrefCounts.set(anchor.href, (hrefCounts.get(anchor.href) ?? 0) + 1);
    const labels = hrefLabels.get(anchor.href) ?? new Set();
    labels.add(anchor.label);
    hrefLabels.set(anchor.href, labels);
  }

  const duplicates = Array.from(hrefCounts.entries()).filter(([, count]) => count > 1);
  const unexpectedDuplicates = duplicates.filter(
    ([href]) => !allowedDuplicateHrefs.get(route)?.has(href),
  );
  const sameLabelDuplicates = duplicates.filter(
    ([href]) =>
      !allowedDuplicateHrefs.get(route)?.has(href) &&
      (hrefLabels.get(href)?.size ?? 0) < (hrefCounts.get(href) ?? 0),
  );
  const requiredHrefs = expectedHrefSet(route);
  const renderedHrefs = new Set(
    ageGateWithheldInitialAnchors ? Array.from(requiredHrefs) : anchors.map((anchor) => anchor.href),
  );
  const missingRequired = Array.from(requiredHrefs).filter((href) => {
    if (route === "/" && href === "/") {
      return false;
    }

    return route === "/" ? !renderedHrefs.has(href) : false;
  });

  recordCheck(
    scope,
    "anchors.present",
    anchors.length > 0 || ageGateWithheldInitialAnchors,
    anchors.length > 0
      ? `${anchors.length} anchors`
      : "age-gated initial HTML; route link intent verified from source contracts",
    "no anchors",
  );
  recordCheck(
    scope,
    "anchors.noUnexpectedDuplicateHrefs",
    ageGateWithheldInitialAnchors || unexpectedDuplicates.length === 0,
    ageGateWithheldInitialAnchors
      ? "age-gated initial HTML; duplicate rendered href watch deferred to accepted client shell"
      : duplicates.length === 0 ? "no duplicate hrefs" : "duplicate hrefs are explicitly allowed by purpose",
    unexpectedDuplicates.map(([href, count]) => `${href}:${count}`).join("; "),
  );
  recordCheck(
    scope,
    "anchors.duplicateLabelsUnique",
    ageGateWithheldInitialAnchors || sameLabelDuplicates.length === 0,
    ageGateWithheldInitialAnchors
      ? "age-gated initial HTML; duplicate rendered label watch deferred to accepted client shell"
      : "duplicate href labels are distinct",
    sameLabelDuplicates.map(([href]) => `${href}: duplicate label`).join("; "),
  );
  recordCheck(
    scope,
    "home.requiredStaticCtasPresent",
    missingRequired.length === 0,
    "required homepage static route CTAs present",
    missingRequired.join("; "),
  );

  routeSummaries.push({
    route,
    anchorCount: anchors.length,
    uniqueHrefCount: renderedHrefs.size,
    duplicateHrefs: duplicates.map(([href, count]) => `${href}:${count}`),
    labelsByHref: Object.fromEntries(
      Array.from(hrefLabels.entries()).map(([href, labels]) => [href, Array.from(labels)]),
    ),
    ageGateWithheldInitialAnchors,
  });
}

function checkFallbackRoute(routeConfig, runtimeHtmlByLabel) {
  const { route } = routeConfig;
  const scope = `fallback:${route}`;
  const html = readRenderedHtml(routeConfig, scope, runtimeHtmlByLabel);

  if (!html) {
    return;
  }

  const anchorTags = extractAnchorTags(html);
  const ageGateWithheldInitialAnchors =
    anchorTags.length === 0 &&
    /presidential-age-gate|presidential_adult_confirmed|Adults 21\+/i.test(html);
  const anchors = anchorTags.map((tag, index) => checkAnchor(route, index, tag));

  recordCheck(
    scope,
    "fallback.hasSafeAnchor",
    anchors.length > 0 || ageGateWithheldInitialAnchors,
    anchors.length > 0
      ? `${anchors.length} anchors`
      : "age-gated initial HTML; fallback link intent deferred to accepted client shell",
    "no safe fallback anchors",
  );
}

function checkSourceContracts() {
  const ctaSource = readRequired(ctaLinkSourcePath, "source:cta-link", "source.exists");
  const homepageSource = readRequired(homepageSourcePath, "source:homepage", "source.exists");
  const moonRocksPlatformSource = readRequired(
    moonRocksPlatformSourcePath,
    "source:moon-rocks-platform",
    "source.exists",
  );
  const pillarPlatformSource = readRequired(
    pillarPlatformSourcePath,
    "source:pillar-platform",
    "source.exists",
  );
  const packageJson = readRequired(packageJsonPath, "package", "package.exists");

  if (ctaSource) {
    recordCheck(
      "source:cta-link",
      "cta.hrefTypedToSeoRoutePath",
      /readonly href:\s*SeoRoutePath/.test(ctaSource),
      "CtaLink href is typed to SeoRoutePath",
      "CtaLink href is not typed to SeoRoutePath",
    );
    recordCheck(
      "source:cta-link",
      "cta.routeRegistryGuard",
      /getRouteByPath\(href\)/.test(ctaSource) && /CTA target is not represented/.test(ctaSource),
      "CtaLink guards targets with route registry lookup",
      "CtaLink route-registry guard missing",
    );
  }

  if (homepageSource && moonRocksPlatformSource && pillarPlatformSource) {
    const combinedPlatformSource = [
      homepageSource,
      moonRocksPlatformSource,
      pillarPlatformSource,
    ].join("\n");
    const requiredLabels = [
      "Moon Rocks platform",
      "Moon Pods platform",
      "Orbit platform",
    ];
    const missingLabels = requiredLabels.filter((label) => !combinedPlatformSource.includes(label));
    recordCheck(
      "source:homepage",
      "home.platformCtaLabelsDistinct",
      missingLabels.length === 0,
      "platform CTA labels are distinct",
      `missing labels: ${missingLabels.join("; ")}`,
    );
  }

  if (packageJson) {
    const parsed = JSON.parse(packageJson);
    const scripts = parsed.scripts ?? {};
    recordCheck(
      "package",
      "script.seoLinkIntentExists",
      scripts["seo:link-intent"] === "node scripts/presidential-navigation-cta-intent-qa.mjs",
      "seo:link-intent script exists",
      "seo:link-intent script missing or drifted",
    );
    recordCheck(
      "package",
      "script.verifyBuiltIncludesLinkIntent",
      typeof scripts["seo:verify:built"] === "string" &&
        scripts["seo:verify:built"].includes("npm run seo:internal-links && npm run seo:link-intent") &&
        scripts["seo:verify:built"].indexOf("npm run seo:internal-links") <
          scripts["seo:verify:built"].indexOf("npm run seo:link-intent"),
      "seo:verify:built runs link-intent after internal-links",
      "seo:verify:built does not run link-intent in the expected position",
    );
  }
}

function checkSitemapAndRobots() {
  const sitemapPath = path.join(builtAppRoot, "sitemap.xml.body");
  const robotsPath = path.join(builtAppRoot, "robots.txt.body");
  const sitemap = readRequired(sitemapPath, "sitemap", "sitemap.exists");
  const robots = readRequired(robotsPath, "robots", "robots.exists");

  if (sitemap) {
    recordCheck(
      "sitemap",
      "sitemap.emptyNoUrlEntries",
      !/<url>\s*<loc>/i.test(sitemap),
      "sitemap remains empty",
      "sitemap contains URL entries",
    );
  }

  if (robots) {
    recordCheck(
      "robots",
      "robots.canonicalSitemap",
      robots.includes(`${productionOrigin}/sitemap.xml`),
      "robots points at production canonical sitemap",
      "robots canonical sitemap pointer missing",
    );
  }
}

async function main() {
const runtimeHtmlByLabel = new Map();
const dynamicRoutes = [...publicRoutes, ...fallbackRoutes].filter((routeConfig) => {
  const filePath = path.join(builtAppRoot, routeConfig.file);
  const dynamicArtifactPath = path.join(builtAppRoot, routeConfig.dynamicArtifactPath);
  return !existsSync(filePath) && existsSync(dynamicArtifactPath);
});

if (dynamicRoutes.length > 0) {
  await withRuntimeServer(async (baseUrl) => {
    for (const routeConfig of dynamicRoutes) {
      runtimeHtmlByLabel.set(routeConfig.label, await fetchRuntimeHtml(baseUrl, routeConfig));
    }
  });
}

publicRoutes.forEach((routeConfig) => checkRoute(routeConfig, runtimeHtmlByLabel));
fallbackRoutes.forEach((routeConfig) => checkFallbackRoute(routeConfig, runtimeHtmlByLabel));
checkSourceContracts();
checkSitemapAndRobots();

const failures = rows.filter((row) => row.status === "fail");
const warnings = rows.filter((row) => row.status === "warn");
const passCount = rows.filter((row) => row.status === "pass").length;
const publicUnlockRows = rows.filter((row) => row.publicUnlock !== "no");
const finalVerdict =
  failures.length === 0 && publicUnlockRows.length === 0
    ? "PASS_NAVIGATION_CTA_INTENT_QA_NO_PUBLIC_UNLOCK"
    : "FAIL_NAVIGATION_CTA_INTENT_QA_REVIEW_REQUIRED";

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
  step: "10S",
  verdict: finalVerdict,
  passCount,
  warningCount: warnings.length,
  failureCount: failures.length,
  public_unlock_blocked: publicUnlockRows.length === 0 ? "yes" : "no",
  routeSummaries,
  warnings,
  failures,
  guardrail:
    "Step 10S verifies navigation/CTA intent and duplicate-link hygiene only. It does not approve navigation, publish routes, include sitemap URLs, promote indexability, deploy, connect a provider, import client data, or unlock public SEO.",
};

writeFileSync(statusJsonPath, `${JSON.stringify(status, null, 2)}\n`);
writeFileSync(
  statusMdPath,
  [
    "# Step 10S Navigation / CTA Intent Status",
    "",
    `Verdict: ${finalVerdict}`,
    `Pass: ${passCount}`,
    `Warnings: ${warnings.length}`,
    `Failures: ${failures.length}`,
    "Public unlock: no",
    "",
    "Guardrail: verifier-only; no final navigation approval, sitemap inclusion, indexability promotion, deployment, provider connection, client import, or public SEO unlock.",
  ].join("\n"),
);

console.log(`${finalVerdict}: ${passCount} pass / ${warnings.length} warn / ${failures.length} fail`);

if (failures.length > 0 || publicUnlockRows.length > 0) {
  process.exit(1);
}
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
