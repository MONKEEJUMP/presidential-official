import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const appOutputRoot = path.join(webRoot, ".next", "server", "app");
const appSourceRoot = path.join(webRoot, "src", "app");
const packageJsonPath = path.join(webRoot, "package.json");
const productionOrigin = "https://presidentialmoonrocks.com";

const resultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "289-step10q-rendered-head-metadata-results.csv",
);
const workRoot = path.join(
  root,
  "sources",
  "spud",
  "work",
  "step10q-rendered-head-metadata-readiness",
);
const statusJsonPath = path.join(workRoot, "step10q-rendered-head-metadata-status.json");
const statusMdPath = path.join(workRoot, "step10q-rendered-head-metadata-status.md");

const publicRoutes = [
  { route: "/", label: "home", file: "index.html" },
  { route: "/moon-rocks", label: "moonRocks", file: "moon-rocks.html" },
  { route: "/moon-pods", label: "moonPods", file: "moon-pods.html" },
  { route: "/orbit", label: "orbit", file: "orbit.html" },
  { route: "/our-story", label: "ourStory", file: "our-story.html" },
  { route: "/learn", label: "learn", file: "learn.html" },
  { route: "/find-us", label: "findUs", file: "find-us.html" },
  { route: "/contact", label: "contact", file: "contact.html" },
];

const fallbackSurfaces = [
  { route: "/_not-found", label: "notFound", file: "_not-found.html" },
  { route: "/_global-error", label: "globalError", file: "_global-error.html" },
];

const forbiddenHeadPatterns = [
  {
    label: "public unlock language",
    pattern:
      /public seo unlocked|route publication approved|sitemap inclusion approved|index,\s*follow approved|deployment approved|schema approved|metadata approved|product page approved|locator page approved/i,
  },
  {
    label: "threat accusation language",
    pattern: /\b(imposter|scam|hijack(?:ed|ing)?|stolen|counterfeit|knockoff|fraud)\b/i,
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
    label: "direct commerce language",
    pattern:
      /\b(price|pricing|inventory|shipping|delivery|deliver|buy online|order online|direct order|checkout|cart|reviews?|ratings?)\b/i,
  },
  {
    label: "bad host leakage",
    pattern:
      /\b(localhost|127\.0\.0\.1|vercel\.app|wix(?:site|static)?\.com|wix\.com|googleusercontent\.com|drive\.google\.com|presidential\.vip|presidential\.rocks|presidential\.online|presidential\.us|presidentialca\.com|www\.presidentialmoonrocks\.com)\b/i,
  },
  {
    label: "unresolved dynamic template",
    pattern: /\/learn\/(?:%5Bguide%5D|\[guide\])/i,
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

function warn(scope, check, details) {
  addRow(scope, check, "warn", details);
}

function readRequired(filePath, scope) {
  if (!existsSync(filePath)) {
    fail(scope, "html.exists", `Missing ${filePath}. Run npm run build first.`);
    return "";
  }

  pass(scope, "html.exists", filePath);
  return readFileSync(filePath, "utf8");
}

function decodeHtml(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractHead(html) {
  return html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? html;
}

function tags(html, tagName) {
  return Array.from(html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, "gi"))).map(
    (match) => match[0],
  );
}

function attr(tag, name) {
  return decodeHtml(
    tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1] ?? "",
  );
}

function titleTags(head) {
  return Array.from(head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)).map(
    (match) => decodeHtml(match[1]).trim(),
  );
}

function metaByName(head, name) {
  return tags(head, "meta").filter((tag) => attr(tag, "name").toLowerCase() === name);
}

function canonicalTags(head) {
  return tags(head, "link").filter((tag) => attr(tag, "rel").toLowerCase() === "canonical");
}

function expectedCanonical(route) {
  return route === "/" ? productionOrigin : `${productionOrigin}${route}`;
}

function contentOf(tag) {
  return attr(tag, "content");
}

function checkNoForbiddenHeadText(scope, head) {
  const hits = forbiddenHeadPatterns
    .filter(({ pattern }) => pattern.test(head))
    .map(({ label }) => label);

  if (hits.length === 0) {
    pass(scope, "head.noForbiddenPublicText", "no forbidden head text or host leakage");
  } else {
    fail(scope, "head.noForbiddenPublicText", hits.join("; "));
  }
}

function recordCheck(scope, check, condition, passDetails, failDetails) {
  if (condition) {
    pass(scope, check, passDetails);
  } else {
    fail(scope, check, failDetails);
  }
}

function recordWarningCheck(scope, check, condition, passDetails, warnDetails) {
  if (condition) {
    pass(scope, check, passDetails);
  } else {
    warn(scope, check, warnDetails);
  }
}

function checkPublicRoute({ route, label, file }) {
  const scope = `public:${route}`;
  const html = readRequired(path.join(appOutputRoot, file), scope);
  if (!html) {
    return;
  }

  const head = extractHead(html);
  const titles = titleTags(head);
  const descriptions = metaByName(head, "description");
  const canonicals = canonicalTags(head);
  const robots = metaByName(head, "robots");
  const googlebot = metaByName(head, "googlebot");
  const openGraph = tags(head, "meta").filter((tag) =>
    attr(tag, "property").toLowerCase().startsWith("og:"),
  );
  const twitter = tags(head, "meta").filter((tag) =>
    attr(tag, "name").toLowerCase().startsWith("twitter:"),
  );
  const ogImages = openGraph.filter((tag) => attr(tag, "property").toLowerCase() === "og:image");
  const twitterImages = twitter.filter((tag) => attr(tag, "name").toLowerCase() === "twitter:image");
  const expectedUrl = expectedCanonical(route);
  const canonicalHref = canonicals.length === 1 ? attr(canonicals[0], "href") : "";
  const robotsContent = robots.length === 1 ? contentOf(robots[0]) : "";
  const googlebotContent = googlebot.length === 1 ? contentOf(googlebot[0]) : "";

  recordCheck(scope, "head.titleExactlyOne", titles.length === 1, titles[0], `count=${titles.length}`);
  recordCheck(
    scope,
    "head.descriptionExactlyOne",
    descriptions.length === 1,
    contentOf(descriptions[0]),
    `count=${descriptions.length}`,
  );
  recordCheck(scope, "head.canonicalExactlyOne", canonicals.length === 1, canonicalHref, `count=${canonicals.length}`);
  recordCheck(
    scope,
    "head.canonicalProductionUrl",
    canonicalHref === expectedUrl,
    canonicalHref,
    `expected=${expectedUrl}; actual=${canonicalHref || "missing"}`,
  );
  recordCheck(scope, "head.robotsExactlyOne", robots.length === 1, robotsContent, `count=${robots.length}`);
  recordCheck(
    scope,
    "head.robotsNoindexFollow",
    /\bnoindex\b/i.test(robotsContent) && /\bfollow\b/i.test(robotsContent),
    robotsContent,
    robotsContent || "missing",
  );
  recordCheck(
    scope,
    "head.googlebotNoindex",
    googlebot.length === 1 && /\bnoindex\b/i.test(googlebotContent),
    googlebotContent,
    googlebotContent || `count=${googlebot.length}`,
  );
  recordCheck(
    scope,
    "head.noIndexFollowPromotion",
    !/<meta\b[^>]*content=["']index,\s*follow["'][^>]*>/i.test(head),
    "no exact index, follow promotion",
    "found exact index, follow meta tag",
  );
  recordCheck(
    scope,
    "head.openGraphGated",
    openGraph.length === 0,
    "no Open Graph emitted while route-publication gate is closed",
    `count=${openGraph.length}`,
  );
  recordCheck(
    scope,
    "head.twitterGated",
    twitter.length === 0,
    "no Twitter metadata emitted while route-publication gate is closed",
    `count=${twitter.length}`,
  );
  recordCheck(
    scope,
    "head.noSocialImages",
    ogImages.length === 0 && twitterImages.length === 0,
    "no social image metadata",
    `og:image=${ogImages.length}; twitter:image=${twitterImages.length}`,
  );

  checkNoForbiddenHeadText(scope, head);

  routeSummaries.push({
    route,
    label,
    title_count: titles.length,
    description_count: descriptions.length,
    canonical_count: canonicals.length,
    canonical: canonicalHref,
    robots_count: robots.length,
    robots: robotsContent,
    googlebot_count: googlebot.length,
    open_graph_count: openGraph.length,
    twitter_count: twitter.length,
    public_unlock_blocked: "yes",
  });
}

function checkFallbackSurface({ route, label, file }) {
  const scope = `fallback:${route}`;
  const html = readRequired(path.join(appOutputRoot, file), scope);
  if (!html) {
    return;
  }

  const head = extractHead(html);
  const titles = titleTags(head);
  const descriptions = metaByName(head, "description");
  const canonicals = canonicalTags(head);
  const robots = metaByName(head, "robots");
  const robotsValues = robots.map(contentOf).join(" | ");
  const hasNoindex = robots.some((tag) => /\bnoindex\b/i.test(contentOf(tag)));

  recordCheck(
    scope,
    "head.titleExists",
    titles.length >= 1,
    titles.join(" | "),
    "missing title",
  );

  if (label === "notFound") {
    recordWarningCheck(
      scope,
      "head.descriptionExists",
      descriptions.length >= 1,
      contentOf(descriptions[0]),
      "description is absent on fallback surface",
    );
    recordCheck(
      scope,
      "head.noindexPresent",
      hasNoindex,
      robotsValues,
      "no noindex robots meta found",
    );
    recordWarningCheck(
      scope,
      "head.robotsSingle",
      robots.length === 1,
      robotsValues,
      `fallback has ${robots.length} robots tags: ${robotsValues || "none"}`,
    );
    recordWarningCheck(
      scope,
      "head.noCanonicalRequiredForFallback",
      canonicals.length === 0,
      "no canonical required for not-found fallback",
      `canonical count=${canonicals.length}`,
    );
  }

  if (label === "globalError") {
    const sourcePath = path.join(appSourceRoot, "global-error.tsx");
    const sourceText = existsSync(sourcePath) ? readFileSync(sourcePath, "utf8") : "";
    recordCheck(
      scope,
      "source.noindexFollowPresent",
      /noindex,\s*follow/i.test(sourceText),
      "global-error source contains noindex, follow",
      "global-error source missing noindex, follow",
    );
    recordWarningCheck(
      scope,
      "head.noindexPresent",
      hasNoindex,
      robotsValues,
      "built _global-error.html does not expose robots; Step 10N watches the Next generated fallback and source contains noindex",
    );
  }

  const fallbackOpenGraph = tags(head, "meta").filter((tag) =>
    attr(tag, "property").toLowerCase().startsWith("og:"),
  );
  const fallbackTwitter = tags(head, "meta").filter((tag) =>
    attr(tag, "name").toLowerCase().startsWith("twitter:"),
  );

  recordWarningCheck(
    scope,
    "head.noOpenGraphRequiredForFallback",
    fallbackOpenGraph.length === 0,
    "no fallback Open Graph emitted",
    "fallback emitted Open Graph metadata",
  );
  recordWarningCheck(
    scope,
    "head.noTwitterRequiredForFallback",
    fallbackTwitter.length === 0,
    "no fallback Twitter metadata emitted",
    "fallback emitted Twitter metadata",
  );

  checkNoForbiddenHeadText(scope, head);

  routeSummaries.push({
    route,
    label,
    title_count: titles.length,
    description_count: descriptions.length,
    canonical_count: canonicals.length,
    robots_count: robots.length,
    robots: robotsValues,
    open_graph_count: fallbackOpenGraph.length,
    twitter_count: fallbackTwitter.length,
    public_unlock_blocked: "yes",
  });
}

function checkSitemapAndRobots() {
  const sitemapPath = path.join(appOutputRoot, "sitemap.xml.body");
  const robotsPath = path.join(appOutputRoot, "robots.txt.body");
  const scope = "global:sitemap-robots";

  const sitemap = readRequired(sitemapPath, scope);
  const robots = readRequired(robotsPath, scope);

  if (sitemap) {
    recordCheck(
      scope,
      "sitemap.emptyUrlset",
      /<urlset\b/i.test(sitemap) && !/<url>/i.test(sitemap),
      "built sitemap has zero url entries",
      "built sitemap is not empty",
    );
    recordCheck(
      scope,
      "sitemap.noForbiddenText",
      !forbiddenHeadPatterns.some(({ pattern }) => pattern.test(sitemap)),
      "no forbidden sitemap text",
      "forbidden text or host leakage found",
    );
  }

  if (robots) {
    recordCheck(
      scope,
      "robots.productionSitemapPointer",
      robots.includes(`Sitemap: ${productionOrigin}/sitemap.xml`),
      "robots points at production sitemap",
      "robots sitemap pointer is missing or wrong",
    );
    recordCheck(
      scope,
      "robots.noGlobalDisallow",
      !/^Disallow:\s*\/\s*$/im.test(robots),
      "robots does not globally disallow /",
      "robots globally disallows /",
    );
  }
}

function checkVerifyChain() {
  const packageJsonText = existsSync(packageJsonPath)
    ? readFileSync(packageJsonPath, "utf8")
    : "";
  const packageJson = packageJsonText ? JSON.parse(packageJsonText) : {};
  const scripts = packageJson.scripts ?? {};

  recordCheck(
    "package",
    "script.exists",
    typeof scripts["seo:head-metadata"] === "string",
    "seo:head-metadata script is present",
    "seo:head-metadata script is missing",
  );
  recordCheck(
    "package",
    "verifyChain.includesStep10Q",
    typeof scripts["seo:verify:built"] === "string" &&
      scripts["seo:verify:built"].includes("seo:head-metadata"),
    "seo:verify:built includes seo:head-metadata",
    "seo:verify:built does not include seo:head-metadata",
  );
}

publicRoutes.forEach(checkPublicRoute);
fallbackSurfaces.forEach(checkFallbackSurface);
checkSitemapAndRobots();
checkVerifyChain();

const failCount = rows.filter((row) => row.status === "fail").length;
const warnCount = rows.filter((row) => row.status === "warn").length;
const passCount = rows.filter((row) => row.status === "pass").length;
const verdict =
  failCount === 0
    ? "PASS_RENDERED_HEAD_METADATA_READINESS_NO_PUBLIC_UNLOCK"
    : "FAIL_RENDERED_HEAD_METADATA_READINESS_REVIEW_REQUIRED";

mkdirSync(path.dirname(resultsPath), { recursive: true });
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
  verdict,
  pass_count: passCount,
  warn_count: warnCount,
  fail_count: failCount,
  route_summaries: routeSummaries,
  policy: {
    public_routes:
      "Public route shells must remain noindex, canonicalized to the production origin, free of OG/Twitter/social images while route-publication gates are closed, and free of forbidden claims or host leakage.",
    fallback_surfaces:
      "Fallback surfaces use separate rules: safe/noindex where feasible, no host leakage, no public-unlock language, and no requirement for canonical/OG/Twitter parity.",
    no_public_unlock: true,
  },
  rows,
};

mkdirSync(workRoot, { recursive: true });
writeFileSync(statusJsonPath, JSON.stringify(payload, null, 2) + "\n");
writeFileSync(
  statusMdPath,
  [
    "# Step 10Q Rendered Head / Metadata Readiness Status",
    "",
    `Verdict: ${verdict}`,
    "",
    `Pass: ${passCount}`,
    `Warn: ${warnCount}`,
    `Fail: ${failCount}`,
    "",
    "Public route policy: noindex/follow, production canonical, no Open Graph/Twitter while route-publication gates remain closed, no social images, no forbidden claims, no bad hosts.",
    "",
    "Fallback policy: no public unlock, no bad hosts, no unsafe language; not-found/global-error are tracked separately from public route pages.",
    "",
    "No public SEO unlock, route publication, sitemap inclusion, indexability promotion, metadata approval, schema promotion, image approval, deployment, provider connection, migration apply, or client import occurred.",
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
