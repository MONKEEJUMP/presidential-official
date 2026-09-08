import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const builtAppRoot = path.join(webRoot, ".next", "server", "app");
const nextBin = path.join(webRoot, "node_modules", "next", "dist", "bin", "next");
const appRoot = path.join(webRoot, "src", "app");
const componentsRoot = path.join(webRoot, "src", "components");
const seoRoot = path.join(webRoot, "src", "lib", "seo");
const schemaConstantsPath = path.join(seoRoot, "schema", "constants.ts");
const packageJsonPath = path.join(webRoot, "package.json");
const runtimeHost = "127.0.0.1";
const runtimeBasePort = Number(process.env.PRESIDENTIAL_ACCESSIBILITY_QA_PORT || "3346");
const resultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "279-step10o-accessibility-semantic-readiness-results.csv",
);
const workRoot = path.join(root, "sources", "spud", "work", "step10o-accessibility-semantic-readiness");
const statusJsonPath = path.join(workRoot, "step10o-accessibility-semantic-readiness-status.json");
const statusMdPath = path.join(workRoot, "step10o-accessibility-semantic-readiness-status.md");

const renderedRoutes = [
  { path: "/", label: "home", htmlPath: "index.html", dynamicArtifactPath: "page.js", expectedH1: "Presidential Moon Rocks" },
  { path: "/moon-rocks", label: "moonRocks", htmlPath: "moon-rocks.html", expectedH1: "Presidential Moon Rocks" },
  { path: "/moon-pods", label: "moonPods", htmlPath: "moon-pods.html", expectedH1: "Presidential Moon Pods" },
  { path: "/orbit", label: "orbit", htmlPath: "orbit.html", expectedH1: "Presidential Orbit" },
  { path: "/our-story", label: "ourStory", htmlPath: "our-story.html", expectedH1: "The Presidential Story" },
  { path: "/learn", label: "learn", htmlPath: "learn.html", expectedH1: "Learn Presidential" },
  { path: "/find-us", label: "findUs", htmlPath: "find-us.html", expectedH1: "Find Presidential Near You" },
  { path: "/contact", label: "contact", htmlPath: "contact.html", expectedH1: "Contact Presidential" },
  {
    path: "/presidential-accessibility-not-found-probe",
    label: "notFound",
    htmlPath: "_not-found.html",
    dynamicArtifactPath: "_not-found/page.js",
    expectedH1: "Page not found",
    allowNotOk: true,
  },
];

for (const route of renderedRoutes) {
  route.dynamicArtifactPath ??= `${route.path.replace(/^\/+/, "")}/page.js`;
}

const textExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const publicUnlockPattern =
  /public seo unlocked|route publication approved|sitemap inclusion approved|index,\s*follow approved|deployment approved|schema approved|metadata approved|product page approved|locator page approved/i;
const nonProductionHostPattern =
  /\b(?:localhost|127\.0\.0\.1|vercel\.app|wix(?:site|static)?\.com|wix\.com|googleusercontent\.com|drive\.google\.com|presidential\.vip|presidential\.rocks|presidential\.online|presidential\.us|presidentialca\.com|www\.presidentialmoonrocks\.com)\b/i;
const badControlTextPattern = /^\s*(?:click here|learn more|read more|more|go|submit|button|link)\s*$/i;
const roleButtonOrLinkPattern = /role=["'](?:button|link)["']/i;
const positiveTabIndexPattern = /tabIndex=\{?[1-9]\d*\}?|tabindex=["']?[1-9]\d*/i;
const autoFocusPattern = /\bautoFocus\b|\bautofocus\b/i;
function extractApprovedSameAs(source) {
  const match = source.match(/APPROVED_SAME_AS\s*=\s*\[([\s\S]*?)\]\s*as const/);
  return match ? [...match[1].matchAll(/"([^"]*)"/g)].map((entry) => entry[1]) : [];
}

const approvedExternalHrefs = new Set(
  extractApprovedSameAs(readFileSync(schemaConstantsPath, "utf8")),
);

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
    const fullPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git", ".lighthouseci", "cache"].includes(entry.name)) {
        continue;
      }
      files.push(...walkTextFiles(fullPath));
    } else if (textExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

function decodeHtml(text) {
  return text
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
  const pattern = new RegExp(`${attribute}\\s*=\\s*["']([^"']*)["']`, "i");
  return decodeHtml(tag.match(pattern)?.[1] ?? "");
}

function getTags(html, tagName) {
  const cleanHtml = stripScriptsAndStyles(html);
  const pattern = new RegExp(`<${tagName}\\b[^>]*>(?:[\\s\\S]*?<\\/${tagName}>)?`, "gi");
  return Array.from(cleanHtml.matchAll(pattern)).map((match) => match[0]);
}

function getOpeningTags(html, tagName) {
  const cleanHtml = stripScriptsAndStyles(html);
  const pattern = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  return Array.from(cleanHtml.matchAll(pattern)).map((match) => match[0]);
}

function getTagText(tag) {
  return visibleTextFromHtml(tag);
}

function getIds(html) {
  const ids = new Set();
  for (const match of html.matchAll(/\bid=["']([^"']+)["']/gi)) {
    ids.add(decodeHtml(match[1]));
  }
  return ids;
}

function duplicateIds(html) {
  const counts = new Map();
  for (const match of html.matchAll(/\bid=["']([^"']+)["']/gi)) {
    const id = decodeHtml(match[1]);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([id, count]) => `${id}:${count}`);
}

function referencedAriaIds(html) {
  const refs = [];
  for (const match of html.matchAll(/\b(?:aria-labelledby|aria-describedby)=["']([^"']+)["']/gi)) {
    const attrValue = decodeHtml(match[1]);
    refs.push(...attrValue.split(/\s+/).filter(Boolean));
  }
  return refs;
}

function addCheck(rows, check, passed, details) {
  rows.push({
    check,
    status: passed ? "pass" : "fail",
    details,
    public_unlock: "no",
  });
  return passed;
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

  if (!response.ok && !route.allowNotOk) {
    throw new Error(`${route.path} returned ${response.status}`);
  }

  if (!html.trim()) {
    throw new Error(`${route.path} returned empty HTML`);
  }

  return {
    html,
    status: response.status,
    ok: response.ok,
  };
}

async function waitForRuntimeServer(baseUrl) {
  let lastError;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/contact`);
      await response.text();
      if (response.ok) {
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

function collectSourceMatches(files, pattern) {
  const matches = [];
  for (const file of files) {
    const text = readIfExists(file);
    for (const [index, line] of text.split(/\r?\n/).entries()) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        matches.push(`${rel(file)}:${index + 1}:${line.trim()}`);
      }
    }
  }
  return matches;
}

function checkRenderedRoute(route, rendered, rows, summaries) {
  const htmlPath = path.join(builtAppRoot, route.htmlPath);
  const dynamicArtifactPath = path.join(builtAppRoot, route.dynamicArtifactPath);
  const staticArtifactExists = existsSync(htmlPath);
  const dynamicArtifactExists = existsSync(dynamicArtifactPath);
  const html = rendered.html;
  const cleanHtml = stripScriptsAndStyles(html);
  const visibleText = visibleTextFromHtml(html);
  const ids = getIds(cleanHtml);
  const ariaRefs = referencedAriaIds(cleanHtml);
  const missingAriaRefs = ariaRefs.filter((id) => !ids.has(id));
  const duplicateIdList = duplicateIds(cleanHtml);
  const htmlTag = cleanHtml.match(/<html\b[^>]*>/i)?.[0] ?? "";
  const titleTags = getTags(cleanHtml, "title");
  const mainTags = getTags(cleanHtml, "main");
  const h1Tags = getTags(cleanHtml, "h1");
  const anchorTags = getTags(cleanHtml, "a");
  const skipLinks = anchorTags.filter((tag) => getAttribute(tag, "href") === "#presidential-main");
  const headingTags = Array.from(cleanHtml.matchAll(/<h([1-6])\b[^>]*>[\s\S]*?<\/h\1>/gi)).map((match) => ({
    level: Number(match[1]),
    text: getTagText(match[0]),
  }));
  const linkTags = getOpeningTags(cleanHtml, "a");
  const buttonTags = getTags(cleanHtml, "button");
  const imgTags = getOpeningTags(cleanHtml, "img");
  const badLinks = linkTags
    .map((tag) => ({ href: getAttribute(tag, "href"), text: getTagText(tag), tag }))
    .filter((link) => !link.href || badControlTextPattern.test(link.text) || (/^https?:\/\//i.test(link.href) && !approvedExternalHrefs.has(link.href)));
  const badButtons = buttonTags
    .map((tag) => ({ type: getAttribute(tag, "type"), text: getTagText(tag), tag }))
    .filter((button) => !button.type || !button.text || badControlTextPattern.test(button.text));
  const imgAltFailures = imgTags
    .map((tag) => ({
      alt: getAttribute(tag, "alt"),
      ariaHidden: getAttribute(tag, "aria-hidden") === "true",
      role: getAttribute(tag, "role"),
      tag,
    }))
    .filter(
      (image) =>
        !/\balt=/.test(image.tag) ||
        (image.alt.trim() === "" &&
          !image.ariaHidden &&
          !["none", "presentation"].includes(image.role)),
    );
  const headingLevelSkips = [];
  const initialHtmlIsAgeGateOnly =
    visibleText.includes("Adults 21+ where legal") && !visibleText.includes(route.expectedH1);
  const initialHtmlWithholdsRouteContent = mainTags.length === 0 && h1Tags.length === 0;

  for (let index = 1; index < headingTags.length; index += 1) {
    const previous = headingTags[index - 1].level;
    const current = headingTags[index].level;
    if (current - previous > 1) {
      headingLevelSkips.push(`${headingTags[index - 1].text || `h${previous}`} -> ${headingTags[index].text || `h${current}`}`);
    }
  }

  addCheck(
    rows,
    `${route.label}.html.exists`,
    html.trim().length > 0 && (staticArtifactExists || dynamicArtifactExists),
    staticArtifactExists
      ? `${rel(htmlPath)} rendered at ${route.path} with status ${rendered.status}`
      : `${rel(dynamicArtifactPath)} rendered at ${route.path} with status ${rendered.status}`,
  );
  addCheck(rows, `${route.label}.html.lang`, /\blang=["']en["']/i.test(htmlTag), htmlTag || "missing html tag");
  addCheck(rows, `${route.label}.viewport.exists`, /<meta\b[^>]*name=["']viewport["']/i.test(cleanHtml), "viewport meta exists");
  addCheck(rows, `${route.label}.title.exists`, titleTags.length >= 1, `${titleTags.length} title tag(s)`);
  addCheck(
    rows,
    `${route.label}.main.single`,
    mainTags.length === 1,
    mainTags.length === 1
      ? `${mainTags.length} main landmark`
      : `route HTML must include exactly one normal main landmark behind the age-gate overlay; found ${mainTags.length}`,
  );
  addCheck(rows, `${route.label}.main.target`, ids.has("presidential-main"), "Route HTML includes the stable skip-link target id");
  addCheck(
    rows,
    `${route.label}.skipLink.targetsMain`,
    skipLinks.length >= 1 && skipLinks.some((tag) => /skip to main content/i.test(getTagText(tag))),
    skipLinks.length
      ? skipLinks.map((tag) => getTagText(tag) || "empty skip-link text").join(" | ")
      : "Missing skip link to #presidential-main",
  );
  addCheck(
    rows,
    `${route.label}.h1.single`,
    h1Tags.length === 1,
    h1Tags.length === 1
      ? `${h1Tags.length} h1 tag(s): ${h1Tags.map(getTagText).join(" | ")}`
      : "route HTML must include exactly one page h1 behind the age-gate overlay",
  );
  addCheck(
    rows,
    `${route.label}.h1.expected`,
    h1Tags.some((tag) => getTagText(tag).toLowerCase().includes(route.expectedH1.toLowerCase())),
    route.expectedH1,
  );
  addCheck(
    rows,
    `${route.label}.headings.nonEmpty`,
    headingTags.length > 0 && headingTags.every((heading) => heading.text.length > 0),
    headingTags.length
      ? headingTags.map((heading) => `h${heading.level}:${heading.text}`).join(" | ")
      : "route HTML must include non-empty headings behind the age-gate overlay",
  );
  addCheck(rows, `${route.label}.headings.noLevelSkips`, headingLevelSkips.length === 0, headingLevelSkips.join(" | ") || "No heading level skips");
  addCheck(rows, `${route.label}.aria.referencesResolve`, missingAriaRefs.length === 0, missingAriaRefs.join(" | ") || "All aria-labelledby/aria-describedby references resolve");
  addCheck(rows, `${route.label}.ids.unique`, duplicateIdList.length === 0, duplicateIdList.join(" | ") || "No duplicate IDs");
  addCheck(rows, `${route.label}.links.safeTextAndHref`, badLinks.length === 0, badLinks.map((link) => `${link.href || "missing"}:${link.text || "empty"}`).join(" | ") || "All links have internal hrefs and useful text");
  addCheck(rows, `${route.label}.buttons.safeTextAndType`, badButtons.length === 0, badButtons.map((button) => `${button.type || "missing"}:${button.text || "empty"}`).join(" | ") || "All buttons have type and useful text");
  addCheck(rows, `${route.label}.images.altText`, imgAltFailures.length === 0, imgAltFailures.length ? `${imgAltFailures.length} image alt issue(s)` : "No image alt failures");
  addCheck(rows, `${route.label}.noPositiveTabIndex`, !positiveTabIndexPattern.test(cleanHtml), "No positive tabindex in rendered output");
  addCheck(rows, `${route.label}.noAutoFocusAttribute`, !autoFocusPattern.test(cleanHtml), "No autofocus attribute in rendered output");
  addCheck(rows, `${route.label}.noNonProductionHostLeakage`, !nonProductionHostPattern.test(cleanHtml), "No preview, Wix, local, alternate, or www host leakage");
  addCheck(rows, `${route.label}.noPublicUnlockSignals`, !publicUnlockPattern.test(visibleText), "No public-unlock text in visible route content");

  summaries.push({
    route: route.path,
    htmlPath: staticArtifactExists ? rel(htmlPath) : rel(dynamicArtifactPath),
    runtimeStatus: rendered.status,
    runtimeOk: rendered.ok,
    mainCount: mainTags.length,
    h1Count: h1Tags.length,
    headingCount: headingTags.length,
    linkCount: linkTags.length,
    buttonCount: buttonTags.length,
    imageCount: imgTags.length,
    visibleTextLength: visibleText.length,
    initialHtmlIsAgeGateOnly,
    initialHtmlWithholdsRouteContent,
  });
}

async function main() {
  const rows = [];
  const summaries = [];
  const sourceFiles = [
    ...walkTextFiles(appRoot),
    ...walkTextFiles(componentsRoot),
    ...walkTextFiles(seoRoot),
  ];
  const sourceText = sourceFiles.map(readIfExists).join("\n");
  const ageGateSource = readIfExists(path.join(componentsRoot, "age-gate.tsx"));
  const pageFrameSource = readIfExists(path.join(componentsRoot, "presidential", "layout", "page-frame.tsx"));
  const loadingSource = readIfExists(path.join(appRoot, "loading.tsx"));
  const packageJson = readIfExists(packageJsonPath);
  const roleButtonOrLinkMatches = collectSourceMatches(sourceFiles, roleButtonOrLinkPattern);
  const positiveTabIndexMatches = collectSourceMatches(sourceFiles, positiveTabIndexPattern);
  const autoFocusMatches = collectSourceMatches(sourceFiles, autoFocusPattern);

  await withRuntimeServer(async (baseUrl) => {
    for (const route of renderedRoutes) {
      const rendered = await fetchRuntimeHtml(baseUrl, route);
      checkRenderedRoute(route, rendered, rows, summaries);
    }
  });

  addCheck(rows, "source.noRoleButtonOrLink", roleButtonOrLinkMatches.length === 0, roleButtonOrLinkMatches.slice(0, 8).join(" | ") || "Semantic HTML is used instead of role=button/link");
  addCheck(rows, "source.noPositiveTabIndex", positiveTabIndexMatches.length === 0, positiveTabIndexMatches.slice(0, 8).join(" | ") || "No positive tabIndex in app/components source");
  addCheck(rows, "source.noAutoFocusAttribute", autoFocusMatches.length === 0, autoFocusMatches.slice(0, 8).join(" | ") || "No autoFocus/autofocus attribute in app/components source");
  addCheck(rows, "ageGate.acceptedStateUnmountsOverlay", /status === "accepted"[\s\S]*?return null;/.test(ageGateSource), "Accepted adult-confirmation state removes the modal overlay instead of leaving a blocking full-screen dialog mounted");
  addCheck(rows, "ageGate.acceptFocusesMain", /shouldFocusMainRef/.test(ageGateSource) && /getElementById\("presidential-main"\)\?\.focus\(\)/.test(ageGateSource), "User-initiated adult confirmation moves keyboard focus to the page main landmark");
  addCheck(rows, "ageGate.togglesBackgroundInert", /setAttribute\("inert", ""\)/.test(ageGateSource) && /removeAttribute\("inert"\)/.test(ageGateSource) && /setAttribute\("aria-hidden", "true"\)/.test(ageGateSource) && /removeAttribute\("aria-hidden"\)/.test(ageGateSource), "Age gate toggles inert and aria-hidden on the page content wrapper");
  addCheck(rows, "ageGate.modalHasFocusTrap", /aria-modal="true"/.test(ageGateSource) && /handleDialogKeyDown/.test(ageGateSource) && /event\.key !== "Tab"/.test(ageGateSource), "Age gate dialog declares modal semantics and traps Tab between dialog controls");
  addCheck(rows, "pageFrame.skipLinkTargetsMain", /href="#presidential-main"/.test(pageFrameSource) && /Skip to main content/.test(pageFrameSource), "Page frame renders a keyboard-visible skip link to main content");
  addCheck(rows, "pageFrame.mainTargetStable", /id="presidential-main"/.test(pageFrameSource) && /tabIndex=\{-1\}/.test(pageFrameSource), "Page frame gives main content a stable focus target");
  addCheck(rows, "loading.noMainLandmark", loadingSource === "" || (!/<main\b/i.test(loadingSource) && /role="status"/.test(loadingSource)), "No loading interstitial (owner order 2026-07-11); if one ever returns it must use status semantics without a second main landmark");
  addCheck(rows, "source.noPublicUnlockSignals", !publicUnlockPattern.test(sourceText), "No public-unlock text in accessibility source surfaces");
  addCheck(rows, "package.verifyHasStep10O", /security:accessibility:verify/.test(packageJson), "npm verify chain includes Step 10O verifier");

  const verdict = rows.every((row) => row.status === "pass")
    ? "PASS_ACCESSIBILITY_SEMANTIC_READINESS_NO_PUBLIC_UNLOCK"
    : "FAIL_ACCESSIBILITY_SEMANTIC_READINESS_REVIEW_REQUIRED";

  mkdirSync(path.dirname(resultsPath), { recursive: true });
  writeFileSync(
    resultsPath,
    [
      "check,status,details,public_unlock",
      ...rows.map((row) => [row.check, row.status, row.details, row.public_unlock].map(csvEscape).join(",")),
    ].join("\n") + "\n",
  );

  const payload = {
    verdict,
    officialSourcePosture: {
      wcagHeadingsAndLabels:
        "W3C WCAG 2.2 says headings and labels help users understand page organization and controls.",
      waiHeadings:
        "WAI page-structure guidance recommends headings that reflect page organization and labeled regions.",
      mdnSemanticHtml:
        "MDN recommends native semantic HTML and meaningful labels before ARIA workarounds.",
      nextAccessibility:
        "Next.js includes accessibility linting through eslint-plugin-jsx-a11y as an early static check.",
    },
    routeCount: renderedRoutes.length,
    routeSummaries: summaries,
    sourceTextFileCount: sourceFiles.length,
    passCount: rows.filter((row) => row.status === "pass").length,
    failCount: rows.filter((row) => row.status === "fail").length,
    publicSeoUnlocked: false,
    routePublicationApproved: false,
    sitemapInclusionApproved: false,
    indexabilityApproved: false,
    deploymentApproved: false,
    providerConnected: false,
    rows,
  };

  mkdirSync(workRoot, { recursive: true });
  writeFileSync(statusJsonPath, JSON.stringify(payload, null, 2) + "\n");
  writeFileSync(
    statusMdPath,
    [
      "# Step 10O Accessibility / Semantic Readiness Status",
      "",
      `Verdict: ${verdict}`,
      "",
      `Rendered routes checked: ${renderedRoutes.length}`,
      `Source text files scanned: ${sourceFiles.length}`,
      `Checks passed: ${payload.passCount}/${rows.length}`,
      "",
      "No public SEO unlock, route publication approval, sitemap inclusion, indexability promotion, deployment approval, provider connection, or client data import occurred.",
      "",
    ].join("\n"),
  );

  console.log(verdict);
  console.log(`Checks passed: ${payload.passCount}/${rows.length}`);
  if (verdict.startsWith("FAIL")) {
    console.error(rows.filter((row) => row.status === "fail").map((row) => `${row.check}: ${row.details}`).join("\n"));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
