import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const builtAppRoot = path.join(webRoot, ".next", "server", "app");
const packageJsonPath = path.join(webRoot, "package.json");
const metadataSourcePath = path.join(webRoot, "src", "lib", "seo", "metadata.ts");
const metadataHelpersSourcePath = path.join(
  webRoot,
  "src",
  "lib",
  "seo",
  "metadata-helpers.ts",
);
const routesSourcePath = path.join(webRoot, "src", "lib", "seo", "routes.ts");
const nextBin = path.join(webRoot, "node_modules", "next", "dist", "bin", "next");
const runtimeHost = "127.0.0.1";
const runtimeBasePort = Number(process.env.PRESIDENTIAL_SERP_SNIPPET_QA_PORT || "3351");

const resultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "305-step10u-rendered-title-description-canonical-uniqueness-serp-snippet-readiness-results.csv",
);
const workRoot = path.join(
  root,
  "sources",
  "spud",
  "work",
  "step10u-rendered-title-description-canonical-uniqueness-serp-snippet-readiness",
);
const statusJsonPath = path.join(
  workRoot,
  "step10u-rendered-title-description-canonical-uniqueness-serp-snippet-readiness-status.json",
);
const statusMdPath = path.join(
  workRoot,
  "step10u-rendered-title-description-canonical-uniqueness-serp-snippet-readiness-status.md",
);

const productionOrigin = "https://presidentialmoonrocks.com";

const publicRoutes = [
  {
    route: "/",
    label: "home",
    file: "index.html",
    dynamicArtifactPath: "page.js",
    requiredTitleTerms: ["Presidential"],
    requiredDescriptionTerms: ["Presidential", "cannabis"],
  },
  {
    route: "/moon-rocks",
    label: "moonRocks",
    file: "moon-rocks.html",
    requiredTitleTerms: ["Presidential", "Moon", "Rocks"],
    requiredDescriptionTerms: ["Presidential", "Moon", "Rocks"],
  },
  {
    route: "/moon-pods",
    label: "moonPods",
    file: "moon-pods.html",
    requiredTitleTerms: ["Presidential", "Moon", "Pods"],
    requiredDescriptionTerms: ["Presidential", "Moon", "Pods"],
  },
  {
    route: "/orbit",
    label: "orbit",
    file: "orbit.html",
    requiredTitleTerms: ["Presidential", "Orbit"],
    requiredDescriptionTerms: ["Presidential", "Orbit"],
  },
  {
    route: "/our-story",
    label: "ourStory",
    file: "our-story.html",
    requiredTitleTerms: ["Presidential"],
    requiredDescriptionTerms: ["Presidential"],
  },
  {
    route: "/learn",
    label: "learn",
    file: "learn.html",
    requiredTitleTerms: ["Learn", "Presidential"],
    requiredDescriptionTerms: ["Presidential", "guides"],
  },
  {
    route: "/find-us",
    label: "findUs",
    file: "find-us.html",
    requiredTitleTerms: ["Presidential"],
    requiredDescriptionTerms: ["Presidential", "retailers"],
  },
  {
    route: "/contact",
    label: "contact",
    file: "contact.html",
    requiredTitleTerms: ["Contact", "Presidential"],
    requiredDescriptionTerms: ["Contact", "Presidential"],
  },
];

for (const route of publicRoutes) {
  route.dynamicArtifactPath ??= `${route.route.replace(/^\/+/, "")}/page.js`;
}

const forbiddenSnippetPatterns = [
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
      /\b(price|pricing|inventory|shipping|delivery|deliver|buy online|order online|direct order|checkout|cart|reviews?|ratings?|available now|in stock)\b/i,
  },
  {
    label: "unsupported superlative",
    pattern:
      /\b(world'?s strongest|highest form|strongest flavor|most potent|#1\b|number[- ]one|top[- ]?ranked|best)\b/i,
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

const finalCopyReviewPatterns = [
  {
    label: "foundation approval-process wording",
    pattern: /\bpublic-approved\b/i,
  },
  {
    label: "source-process wording",
    pattern: /\bsource-backed\b/i,
  },
  {
    label: "compliance-process wording",
    pattern: /\bcompliance-reviewed\b/i,
  },
];

const rows = [];
const snippets = [];

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

  if (!response.ok) {
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

function readRenderedRouteHtml(routeRecord, scope, runtimeHtmlByRoute) {
  const filePath = path.join(builtAppRoot, routeRecord.file);
  if (existsSync(filePath)) {
    return readRequired(filePath, scope, "html.exists");
  }

  const dynamicArtifactPath = path.join(builtAppRoot, routeRecord.dynamicArtifactPath);
  const html = runtimeHtmlByRoute.get(routeRecord.route) ?? "";
  if (html && existsSync(dynamicArtifactPath)) {
    pass(scope, "html.exists", `${dynamicArtifactPath} rendered at ${routeRecord.route}`);
    return html;
  }

  fail(scope, "html.exists", `Missing ${filePath} and runtime HTML for ${routeRecord.route}. Run npm run build first.`);
  return "";
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

function normalizeText(value) {
  return decodeHtml(value).replace(/\s+/g, " ").trim();
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
    tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] ??
      "",
  );
}

function titleTags(head) {
  return Array.from(head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)).map(
    (match) => normalizeText(match[1]),
  );
}

function metaDescriptionTags(head) {
  return tags(head, "meta").filter(
    (tag) => attr(tag, "name").toLowerCase() === "description",
  );
}

function canonicalTags(head) {
  return tags(head, "link").filter(
    (tag) => attr(tag, "rel").toLowerCase() === "canonical",
  );
}

function expectedCanonical(route) {
  return route === "/" ? productionOrigin : `${productionOrigin}${route}`;
}

function hasRequiredTerms(value, terms) {
  const lower = value.toLowerCase();
  return terms.every((term) => lower.includes(term.toLowerCase()));
}

function forbiddenHits(value) {
  return forbiddenSnippetPatterns
    .filter(({ pattern }) => pattern.test(value))
    .map(({ label }) => label);
}

function finalCopyReviewHits(value) {
  return finalCopyReviewPatterns
    .filter(({ pattern }) => pattern.test(value))
    .map(({ label }) => label);
}

function wordCounts(value) {
  const counts = new Map();
  for (const rawWord of value.toLowerCase().match(/[a-z0-9]+/g) ?? []) {
    if (["and", "the", "for", "with", "official", "presidential"].includes(rawWord)) {
      continue;
    }
    counts.set(rawWord, (counts.get(rawWord) ?? 0) + 1);
  }
  return counts;
}

function repeatedWords(value) {
  return Array.from(wordCounts(value))
    .filter(([, count]) => count > 1)
    .map(([word, count]) => `${word}:${count}`);
}

function checkPublicRoute(routeRecord, runtimeHtmlByRoute) {
  const { route, requiredTitleTerms, requiredDescriptionTerms } = routeRecord;
  const scope = `public:${route}`;
  const html = readRenderedRouteHtml(routeRecord, scope, runtimeHtmlByRoute);
  if (!html) {
    return;
  }

  const head = extractHead(html);
  const titles = titleTags(head);
  const descriptions = metaDescriptionTags(head).map((tag) =>
    normalizeText(attr(tag, "content")),
  );
  const canonicals = canonicalTags(head).map((tag) => attr(tag, "href"));
  const title = titles[0] ?? "";
  const description = descriptions[0] ?? "";
  const canonical = canonicals[0] ?? "";
  const combinedSnippet = `${title}\n${description}\n${canonical}`;
  const titleRepeats = repeatedWords(title);
  const descriptionRepeats = repeatedWords(description);
  const hits = forbiddenHits(combinedSnippet);
  const launchCopyWarnings = finalCopyReviewHits(combinedSnippet);

  recordCheck(scope, "title.exactlyOne", titles.length === 1, title, `count=${titles.length}`);
  recordCheck(
    scope,
    "description.exactlyOne",
    descriptions.length === 1,
    description,
    `count=${descriptions.length}`,
  );
  recordCheck(
    scope,
    "canonical.exactlyOne",
    canonicals.length === 1,
    canonical,
    `count=${canonicals.length}`,
  );
  recordCheck(
    scope,
    "canonical.productionExpected",
    canonical === expectedCanonical(route),
    canonical,
    `expected=${expectedCanonical(route)}; actual=${canonical || "missing"}`,
  );
  recordCheck(
    scope,
    "title.descriptiveLength",
    title.length >= 15 && title.length <= 65,
    `length=${title.length}`,
    `length=${title.length}; title=${title}`,
  );
  recordCheck(
    scope,
    "description.snippetLength",
    description.length >= 70 && description.length <= 160,
    `length=${description.length}`,
    `length=${description.length}; description=${description}`,
  );
  recordCheck(
    scope,
    "title.requiredTerms",
    hasRequiredTerms(title, requiredTitleTerms),
    requiredTitleTerms.join(", "),
    `missing required title terms: ${requiredTitleTerms.join(", ")}; title=${title}`,
  );
  recordCheck(
    scope,
    "description.requiredTerms",
    hasRequiredTerms(description, requiredDescriptionTerms),
    requiredDescriptionTerms.join(", "),
    `missing required description terms: ${requiredDescriptionTerms.join(", ")}; description=${description}`,
  );
  recordCheck(
    scope,
    "title.notGeneric",
    !/^(home|profile|page|untitled)$/i.test(title),
    title,
    `generic title: ${title}`,
  );
  recordCheck(
    scope,
    "description.notGeneric",
    !/^(home|profile|page|learn more|coming soon)$/i.test(description),
    description,
    `generic description: ${description}`,
  );
  recordCheck(
    scope,
    "snippet.noForbiddenText",
    hits.length === 0,
    "no forbidden snippet text or host leakage",
    hits.join("; "),
  );
  if (launchCopyWarnings.length > 0) {
    warn(
      scope,
      "description.launchCopyReview",
      `${launchCopyWarnings.join("; ")}; safe for noindex foundation but requires final human/client metadata copy review before route publication`,
    );
  } else {
    pass(
      scope,
      "description.launchCopyReview",
      "no foundation/process wording that requires launch-copy review",
    );
  }
  recordCheck(
    scope,
    "title.noKeywordStuffing",
    titleRepeats.length === 0,
    "no repeated non-boilerplate title terms",
    titleRepeats.join("; "),
  );
  recordCheck(
    scope,
    "description.noKeywordStuffing",
    descriptionRepeats.length <= 1,
    "no excessive repeated description terms",
    descriptionRepeats.join("; "),
  );

  snippets.push({
    route,
    title,
    title_length: title.length,
    description,
    description_length: description.length,
    canonical,
  });
}

function checkUniqueness() {
  const scope = "global:serp-snippets";
  const checks = [
    ["title", "titles"],
    ["description", "descriptions"],
    ["canonical", "canonicals"],
  ];

  for (const [field, label] of checks) {
    const groups = new Map();
    for (const snippet of snippets) {
      const normalized = snippet[field].toLowerCase();
      if (!groups.has(normalized)) {
        groups.set(normalized, []);
      }
      groups.get(normalized).push(snippet.route);
    }
    const duplicates = Array.from(groups.values()).filter((routes) => routes.length > 1);
    recordCheck(
      scope,
      `${field}.uniqueAcrossPublicRoutes`,
      duplicates.length === 0,
      `${label} unique across ${snippets.length} public routes`,
      duplicates.map((routes) => routes.join(" + ")).join("; "),
    );
  }

  recordCheck(
    scope,
    "routeCount.expected",
    snippets.length === publicRoutes.length,
    `${snippets.length} public routes checked`,
    `expected ${publicRoutes.length}; actual ${snippets.length}`,
  );
}

function checkSourceAndPackageWiring() {
  const metadataSource = readRequired(metadataSourcePath, "source:metadata", "source.exists");
  const metadataHelpersSource = readRequired(
    metadataHelpersSourcePath,
    "source:metadata-helpers",
    "source.exists",
  );
  const routesSource = readRequired(routesSourcePath, "source:routes", "source.exists");
  const packageJsonText = readRequired(packageJsonPath, "package", "package.exists");

  if (metadataSource) {
    recordCheck(
      "source:metadata",
      "usesSafeTextGuard",
      metadataSource.includes("assertMetadataTextSafe"),
      "metadata uses unsafe text guard",
      "metadata text guard missing",
    );
    recordCheck(
      "source:metadata",
      "socialPreviewStillPublicationGated",
      metadataSource.includes("const socialPreviewApproved = isRouteMetadataIndexable(route, gateInput)") &&
        metadataSource.includes("routePublicationRecords: input.routePublicationRecords") &&
        metadataSource.includes("routePublicationContext: input.routePublicationContext") &&
        metadataSource.includes("socialPreviewApproved"),
      "social preview output remains publication-gated",
      "social preview gate missing",
    );
  }

  if (metadataHelpersSource) {
    recordCheck(
      "source:metadata-helpers",
      "blocksUnsafeSnippetTerms",
      metadataHelpersSource.includes("UNSAFE_METADATA_TEXT_PATTERNS") &&
        metadataHelpersSource.includes("world") &&
        metadataHelpersSource.includes("price"),
      "unsafe metadata text patterns still present",
      "unsafe metadata text patterns missing or drifted",
    );
    recordCheck(
      "source:metadata-helpers",
      "blocksNonProductionUrls",
      metadataHelpersSource.includes("assertProductionMetadataUrl") &&
        metadataHelpersSource.includes("Non-production metadata URL is blocked"),
      "production URL assertion still present",
      "production URL assertion missing",
    );
  }

  if (routesSource) {
    for (const { route } of publicRoutes) {
      recordCheck(
        "source:routes",
        `routeRecord.${route}.hasTitle`,
        new RegExp(`path:\\s*["']${route === "/" ? "\\/" : route}["'][\\s\\S]*?title:\\s*["']`).test(
          routesSource,
        ),
        `${route} title source found`,
        `${route} route title source missing`,
      );
      recordCheck(
        "source:routes",
        `routeRecord.${route}.hasDescription`,
        new RegExp(
          `path:\\s*["']${route === "/" ? "\\/" : route}["'][\\s\\S]*?description:\\s*["']`,
        ).test(routesSource),
        `${route} description source found`,
        `${route} route description source missing`,
      );
    }
  }

  if (packageJsonText) {
    const packageJson = JSON.parse(packageJsonText);
    const scripts = packageJson.scripts ?? {};
    const verifyBuilt = scripts["seo:verify:built"] ?? "";
    const headIndex = verifyBuilt.indexOf("npm run seo:head-metadata");
    const snippetIndex = verifyBuilt.indexOf("npm run seo:serp-snippets");
    const internalLinkIndex = verifyBuilt.indexOf("npm run seo:internal-links");

    recordCheck(
      "package",
      "script.exists",
      scripts["seo:serp-snippets"] ===
        "node scripts/presidential-rendered-serp-snippet-readiness-qa.mjs",
      "seo:serp-snippets script exists",
      `actual=${scripts["seo:serp-snippets"] ?? "(missing)"}`,
    );
    recordCheck(
      "package",
      "verifyBuilt.order",
      headIndex >= 0 &&
        snippetIndex > headIndex &&
        internalLinkIndex > snippetIndex,
      "seo:verify:built runs SERP snippet QA after head metadata and before internal links",
      `actual=${verifyBuilt}`,
    );
  }
}

async function main() {
const runtimeHtmlByRoute = new Map();
const dynamicRoutes = publicRoutes.filter((route) => {
  const filePath = path.join(builtAppRoot, route.file);
  const dynamicArtifactPath = path.join(builtAppRoot, route.dynamicArtifactPath);
  return !existsSync(filePath) && existsSync(dynamicArtifactPath);
});

if (dynamicRoutes.length > 0) {
  await withRuntimeServer(async (baseUrl) => {
    for (const route of dynamicRoutes) {
      runtimeHtmlByRoute.set(route.route, await fetchRuntimeHtml(baseUrl, route));
    }
  });
}

publicRoutes.forEach((route) => checkPublicRoute(route, runtimeHtmlByRoute));
checkUniqueness();
checkSourceAndPackageWiring();

const failCount = rows.filter((row) => row.status === "fail").length;
const warnCount = rows.filter((row) => row.status === "warn").length;
const passCount = rows.filter((row) => row.status === "pass").length;
const verdict =
  failCount === 0
    ? "PASS_RENDERED_SERP_SNIPPET_READINESS_NO_PUBLIC_UNLOCK"
    : "FAIL_RENDERED_SERP_SNIPPET_READINESS_REVIEW_REQUIRED";

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
  snippets,
  policy: {
  public_routes:
      "Rendered public route titles, descriptions, and canonicals must be unique, concise, production-hosted, descriptive, and free of forbidden claims or host leakage while route-publication gates remain closed.",
    launch_copy_review:
      "Foundation/process wording may pass noindex safety checks, but it is warned until human/client/legal metadata copy approval exists.",
    no_public_unlock: true,
  },
  rows,
};

mkdirSync(workRoot, { recursive: true });
writeFileSync(statusJsonPath, JSON.stringify(payload, null, 2) + "\n");
writeFileSync(
  statusMdPath,
  [
    "# Step 10U Rendered SERP Snippet Readiness Status",
    "",
    `Verdict: ${verdict}`,
    "",
    `Pass: ${passCount}`,
    `Warn: ${warnCount}`,
    `Fail: ${failCount}`,
    "",
    "Public route policy: rendered titles, descriptions, and canonicals stay unique, concise, production-hosted, descriptive, and free of forbidden claim/commerce/threat/host leakage.",
    "",
    "Warning policy: foundation/process wording is allowed only as a noindex foundation placeholder and remains a human/client metadata copy review item before any route publication.",
    "",
    "No public SEO unlock, route publication, sitemap inclusion, indexability promotion, metadata approval, schema promotion, Open Graph/Twitter promotion, deployment, provider connection, migration apply, or client import occurred.",
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
