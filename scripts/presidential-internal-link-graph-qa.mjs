import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const builtAppRoot = path.join(webRoot, ".next", "server", "app");
const routesSourcePath = path.join(webRoot, "src", "lib", "seo", "routes.ts");
const packageJsonPath = path.join(webRoot, "package.json");
const resultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "293-step10r-internal-link-graph-results.csv",
);
const workRoot = path.join(root, "sources", "spud", "work", "step10r-internal-link-graph-readiness");
const statusJsonPath = path.join(workRoot, "step10r-internal-link-graph-status.json");
const statusMdPath = path.join(workRoot, "step10r-internal-link-graph-status.md");

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

const fallbackRoutes = [
  { route: "/_not-found", label: "notFound", file: "_not-found.html" },
];

const mandatoryStaticPaths = publicRoutes.map((route) => route.route);
const allowedRenderedHrefs = new Set([
  ...mandatoryStaticPaths,
]);
const futureOrTemplatePatterns = [
  /\/learn\/(?:%5Bguide%5D|\[guide\])/i,
  /\/find-us\/\[state\]/i,
  /\/moon-rocks\/(?:silver|gold|rose-gold)/i,
  /^\/(?:official-presidential|pre-rolls|blunts)(?:\/|$)/i,
];
const forbiddenHrefPatterns = [
  /^https?:\/\//i,
  /^mailto:/i,
  /^tel:/i,
  /^javascript:/i,
  /^#/,
  /(?:localhost|127\.0\.0\.1|vercel\.app|wix(?:site|static)?\.com|wix\.com|googleusercontent\.com|drive\.google\.com|presidential\.vip|presidential\.rocks|presidential\.online|presidential\.us|presidentialca\.com|www\.presidentialmoonrocks\.com)/i,
  /^\/(?:api|admin|private|preview|draft|internal)(?:\/|$)/i,
  ...futureOrTemplatePatterns,
];
const publicUnlockPattern =
  /public seo unlocked|route publication approved|sitemap inclusion approved|index,\s*follow approved|deployment approved|schema approved|metadata approved|product page approved|locator page approved/i;
const weakAnchorTextPattern = /^\s*(?:click here|learn more|read more|more|go|link|button)\s*$/i;

const rows = [];
const graph = new Map();
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

function warn(scope, check, details) {
  addRow(scope, check, "warn", details);
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
  const cleanHtml = stripScriptsAndStyles(html);
  return Array.from(cleanHtml.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)).map(
    (match) => match[0],
  );
}

function normalizeHref(href) {
  if (href === "") {
    return href;
  }

  if (href === "https://presidentialmoonrocks.com") {
    return "/";
  }

  if (href.startsWith("https://presidentialmoonrocks.com/")) {
    return href.slice("https://presidentialmoonrocks.com".length);
  }

  return href.replace(/\/$/, "") || "/";
}

function renderedRequiredLinksFor(routePath, registryLinks) {
  if (routePath === "/") {
    return mandatoryStaticPaths.filter((entry) => entry !== "/");
  }

  return registryLinks.filter((entry) => allowedRenderedHrefs.has(entry));
}

function parseRegistryLinks(routePath) {
  const source = readRequired(routesSourcePath, "registry", "routesSource.exists");
  if (!source) {
    return [];
  }

  const escapedPath = routePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pathMatch = source.match(new RegExp(`path:\\s*["']${escapedPath}["']`, "m"));
  if (!pathMatch?.index) {
    return [];
  }

  const linksToIndex = source.indexOf("linksTo:", pathMatch.index);
  if (linksToIndex === -1) {
    return [];
  }

  const openingBracketIndex = source.indexOf("[", linksToIndex);
  if (openingBracketIndex === -1) {
    return [];
  }

  let depth = 0;
  let quote = "";
  let escaped = false;
  let closingBracketIndex = -1;

  for (let index = openingBracketIndex; index < source.length; index += 1) {
    const character = source[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === "\\") {
      escaped = quote !== "";
      continue;
    }

    if (quote) {
      if (character === quote) {
        quote = "";
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }

    if (character === "[") {
      depth += 1;
    } else if (character === "]") {
      depth -= 1;
      if (depth === 0) {
        closingBracketIndex = index;
        break;
      }
    }
  }

  const linksBlock = closingBracketIndex === -1
    ? ""
    : source.slice(openingBracketIndex + 1, closingBracketIndex);

  return Array.from(linksBlock.matchAll(/["']([^"']+)["']/g)).map((match) => match[1]);
}

function checkRenderedRoute(routeConfig) {
  const scope = `public:${routeConfig.route}`;
  const html = readRequired(path.join(builtAppRoot, routeConfig.file), scope, "html.exists");
  if (!html) {
    return;
  }

  const anchorTags = extractAnchorTags(html);
  const anchors = anchorTags.map((tag) => ({
    href: normalizeHref(getAttribute(tag, "href")),
    text: visibleTextFromHtml(tag),
    target: getAttribute(tag, "target"),
    rel: getAttribute(tag, "rel"),
  }));
  const hrefs = anchors.map((anchor) => anchor.href).filter(Boolean);
  const uniqueHrefs = Array.from(new Set(hrefs));
  const badHrefs = anchors
    .filter((anchor) => !anchor.href || forbiddenHrefPatterns.some((pattern) => pattern.test(anchor.href)))
    .map((anchor) => `${anchor.href || "(empty)"} :: ${anchor.text || "(empty text)"}`);
  const unregisteredHrefs = uniqueHrefs.filter((href) => !allowedRenderedHrefs.has(href));
  const weakText = anchors
    .filter((anchor) => !anchor.text || weakAnchorTextPattern.test(anchor.text))
    .map((anchor) => `${anchor.href || "(empty)"} :: ${anchor.text || "(empty text)"}`);
  const targetBlankWithoutRel = anchors
    .filter((anchor) => anchor.target === "_blank" && !/\bnoopener\b/i.test(anchor.rel))
    .map((anchor) => `${anchor.href} :: rel=${anchor.rel || "(none)"}`);
  const registryLinks = parseRegistryLinks(routeConfig.route);
  const requiredRenderedLinks = renderedRequiredLinksFor(routeConfig.route, registryLinks);
  const missingRequired = requiredRenderedLinks.filter((href) => !uniqueHrefs.includes(href));
  const duplicateHrefs = Array.from(
    hrefs.reduce((counts, href) => counts.set(href, (counts.get(href) ?? 0) + 1), new Map()),
  )
    .filter(([, count]) => count > 1)
    .map(([href, count]) => `${href}:${count}`);

  graph.set(routeConfig.route, uniqueHrefs.filter((href) => allowedRenderedHrefs.has(href)));
  summaries.push({
    route: routeConfig.route,
    anchorCount: anchors.length,
    uniqueInternalHrefs: uniqueHrefs.length,
    registryLinks,
    requiredRenderedLinks,
    missingRequired,
    duplicateHrefs,
  });

  recordCheck(scope, "anchors.present", anchors.length > 0, `count=${anchors.length}`, "no crawlable anchors found");
  recordCheck(scope, "anchors.hrefsSafe", badHrefs.length === 0, "all hrefs are safe internal paths", badHrefs.join("; "));
  recordCheck(
    scope,
    "anchors.registeredRoutesOnly",
    unregisteredHrefs.length === 0,
    "all rendered hrefs are mandatory static route records",
    unregisteredHrefs.join("; "),
  );
  recordCheck(scope, "anchors.textDescriptive", weakText.length === 0, "anchor text is descriptive", weakText.join("; "));
  recordCheck(
    scope,
    "anchors.noTargetBlankSecurityGap",
    targetBlankWithoutRel.length === 0,
    "no target=_blank rel gaps",
    targetBlankWithoutRel.join("; "),
  );
  recordCheck(
    scope,
    "registry.renderedIntentCovered",
    missingRequired.length === 0,
    `covered=${requiredRenderedLinks.join(", ") || "(none required)"}`,
    `missing=${missingRequired.join(", ")}`,
  );

  if (duplicateHrefs.length > 0) {
    warn(scope, "anchors.duplicateHrefWatch", duplicateHrefs.join("; "));
  } else {
    pass(scope, "anchors.duplicateHrefWatch", "no duplicate hrefs");
  }
}

function reachableFromHome() {
  const visited = new Set();
  const queue = ["/"];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);
    for (const next of graph.get(current) ?? []) {
      if (!visited.has(next)) {
        queue.push(next);
      }
    }
  }

  return visited;
}

function checkFallbackRoute(routeConfig) {
  const scope = `fallback:${routeConfig.route}`;
  const html = readRequired(path.join(builtAppRoot, routeConfig.file), scope, "html.exists");
  if (!html) {
    return;
  }

  const anchors = extractAnchorTags(html).map((tag) => ({
    href: normalizeHref(getAttribute(tag, "href")),
    text: visibleTextFromHtml(tag),
  }));
  const badHrefs = anchors
    .filter((anchor) => !anchor.href || forbiddenHrefPatterns.some((pattern) => pattern.test(anchor.href)))
    .map((anchor) => `${anchor.href || "(empty)"} :: ${anchor.text || "(empty text)"}`);
  const unregisteredHrefs = anchors
    .map((anchor) => anchor.href)
    .filter((href) => href && !allowedRenderedHrefs.has(href));

  recordCheck(scope, "anchors.hrefsSafe", badHrefs.length === 0, "fallback hrefs are safe", badHrefs.join("; "));
  recordCheck(
    scope,
    "anchors.registeredRoutesOnly",
    unregisteredHrefs.length === 0,
    "fallback links point only to mandatory static routes",
    unregisteredHrefs.join("; "),
  );
}

function checkSitemapAndPackage() {
  const sitemapBody = readRequired(path.join(builtAppRoot, "sitemap.xml.body"), "sitemap", "body.exists");
  const sitemapUrlCount = Array.from(sitemapBody.matchAll(/<url>/gi)).length;
  recordCheck("sitemap", "stillEmpty", sitemapUrlCount === 0, "0 sitemap URL entries", `urlCount=${sitemapUrlCount}`);

  const packageJson = JSON.parse(readRequired(packageJsonPath, "package", "packageJson.exists") || "{}");
  const scripts = packageJson.scripts ?? {};
  recordCheck(
    "package",
    "script.exists",
    scripts["seo:internal-links"] === "node scripts/presidential-internal-link-graph-qa.mjs",
    "seo:internal-links is wired",
    `actual=${scripts["seo:internal-links"] ?? "(missing)"}`,
  );
  recordCheck(
    "package",
    "verifyBuilt.includesStep10R",
    typeof scripts["seo:verify:built"] === "string" && scripts["seo:verify:built"].includes("npm run seo:internal-links"),
    "seo:verify:built includes seo:internal-links",
    `actual=${scripts["seo:verify:built"] ?? "(missing)"}`,
  );
}

function main() {
  mkdirSync(path.dirname(resultsPath), { recursive: true });
  mkdirSync(workRoot, { recursive: true });

  for (const routeConfig of publicRoutes) {
    checkRenderedRoute(routeConfig);
  }

  for (const routeConfig of fallbackRoutes) {
    checkFallbackRoute(routeConfig);
  }

  const reachable = reachableFromHome();
  const unreachable = mandatoryStaticPaths.filter((routePath) => !reachable.has(routePath));
  recordCheck(
    "graph",
    "homeReachability",
    unreachable.length === 0,
    `reachable=${Array.from(reachable).sort().join(", ")}`,
    `unreachable=${unreachable.join(", ")}`,
  );

  const noPublicUnlockHits = rows.filter((row) => publicUnlockPattern.test(row.details));
  recordCheck(
    "global",
    "noPublicUnlockLanguage",
    noPublicUnlockHits.length === 0,
    "no public-unlock language in verifier details",
    noPublicUnlockHits.map((row) => `${row.scope}:${row.check}`).join("; "),
  );

  checkSitemapAndPackage();

  writeFileSync(
    resultsPath,
    [
      "scope,check,status,details,public_unlock",
      ...rows.map((row) =>
        [
          csvEscape(row.scope),
          csvEscape(row.check),
          csvEscape(row.status),
          csvEscape(row.details),
          csvEscape(row.publicUnlock),
        ].join(","),
      ),
    ].join("\n"),
  );

  const failures = rows.filter((row) => row.status === "fail");
  const warnings = rows.filter((row) => row.status === "warn");
  const passCount = rows.filter((row) => row.status === "pass").length;
  const verdict = failures.length === 0
    ? "PASS_INTERNAL_LINK_GRAPH_READINESS_NO_PUBLIC_UNLOCK"
    : "FAIL_INTERNAL_LINK_GRAPH_READINESS";
  const status = {
    step: "10R",
    verdict,
    passCount,
    warningCount: warnings.length,
    failureCount: failures.length,
    public_unlock_blocked: "yes",
    sitemap_empty: "yes",
    mandatoryStaticPaths,
    reachableFromHome: Array.from(reachable).sort(),
    routeSummaries: summaries,
    warnings,
    failures,
  };

  writeFileSync(statusJsonPath, `${JSON.stringify(status, null, 2)}\n`);
  writeFileSync(
    statusMdPath,
    [
      "# Step 10R Internal Link Graph Readiness Status",
      "",
      `Verdict: \`${verdict}\``,
      `Pass: ${passCount}`,
      `Warnings: ${warnings.length}`,
      `Failures: ${failures.length}`,
      "Public unlock: blocked",
      "Sitemap: empty",
      "",
      "## Reachable From Home",
      "",
      Array.from(reachable).sort().map((routePath) => `- ${routePath}`).join("\n"),
      "",
    ].join("\n"),
  );

  if (failures.length > 0) {
    console.error(`${verdict}: ${failures.length} failure(s)`);
    failures.slice(0, 20).forEach((row) => {
      console.error(`- ${row.scope} :: ${row.check} :: ${row.details}`);
    });
    process.exit(1);
  }

  console.log(`${verdict}: ${passCount} pass / ${warnings.length} warn / 0 fail`);
}

main();
