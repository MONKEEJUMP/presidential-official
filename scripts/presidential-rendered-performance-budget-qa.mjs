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
const nextRoot = path.join(webRoot, ".next");
const builtAppRoot = path.join(nextRoot, "server", "app");
const staticRoot = path.join(nextRoot, "static");
const packageJsonPath = path.join(webRoot, "package.json");
const docsResultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "283-step10p-rendered-performance-budget-results.csv",
);
const workRoot = path.join(root, "sources", "spud", "work", "step10p-rendered-performance-budget-readiness");
const statusJsonPath = path.join(workRoot, "step10p-rendered-performance-budget-status.json");
const statusMdPath = path.join(workRoot, "step10p-rendered-performance-budget-status.md");

const routeOutputs = [
  { label: "home", route: "/", htmlPath: "index.html", htmlBudgetBytes: 90000, rscPath: "index.rsc", rscBudgetBytes: 45000 },
  { label: "moonRocks", route: "/moon-rocks", htmlPath: "moon-rocks.html", htmlBudgetBytes: 50000, rscPath: "moon-rocks.rsc", rscBudgetBytes: 30000 },
  { label: "moonPods", route: "/moon-pods", htmlPath: "moon-pods.html", htmlBudgetBytes: 50000, rscPath: "moon-pods.rsc", rscBudgetBytes: 30000 },
  { label: "orbit", route: "/orbit", htmlPath: "orbit.html", htmlBudgetBytes: 50000, rscPath: "orbit.rsc", rscBudgetBytes: 30000 },
  { label: "ourStory", route: "/our-story", htmlPath: "our-story.html", htmlBudgetBytes: 50000, rscPath: "our-story.rsc", rscBudgetBytes: 25000 },
  { label: "learn", route: "/learn", htmlPath: "learn.html", htmlBudgetBytes: 55000, rscPath: "learn.rsc", rscBudgetBytes: 30000 },
  { label: "findUs", route: "/find-us", htmlPath: "find-us.html", htmlBudgetBytes: 55000, rscPath: "find-us.rsc", rscBudgetBytes: 30000 },
  { label: "contact", route: "/contact", htmlPath: "contact.html", htmlBudgetBytes: 55000, rscPath: "contact.rsc", rscBudgetBytes: 30000 },
  { label: "notFound", route: "/_not-found", htmlPath: "_not-found.html", htmlBudgetBytes: 30000, rscPath: "_not-found.rsc", rscBudgetBytes: 20000 },
  { label: "globalError", route: "/_global-error", htmlPath: "_global-error.html", htmlBudgetBytes: 25000, rscPath: "_global-error.rsc", rscBudgetBytes: 15000 },
];

const budgets = {
  aggregateRouteHtmlBytes: 500000,
  aggregateRouteRscBytes: 280000,
  staticJsBytes: 850000,
  largestStaticJsBytes: 325000,
  staticCssBytes: 80000,
  largestStaticCssBytes: 50000,
  staticFontBytes: 225000,
  staticImageBytes: 75000,
  staticTotalBytes: 1300000,
  staticFileCount: 80,
};

const publicUnlockPattern =
  /public seo unlocked|route publication approved|sitemap inclusion approved|deployment approved|schema approved|metadata approved|product page approved|locator page approved/i;
const nonProductionHostPattern =
  /\b(?:localhost|127\.0\.0\.1|vercel\.app|wix(?:site|static)?\.com|wix\.com|googleusercontent\.com|drive\.google\.com|presidential\.vip|presidential\.rocks|presidential\.online|presidential\.us|presidentialca\.com|www\.presidentialmoonrocks\.com)\b/i;
const remoteUrlPattern = /https?:\/\/(?!(?:presidentialmoonrocks\.com|schema\.org|www\.sitemaps\.org)\b)[^"')\s<>]+/gi;

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

function sizeOf(filePath) {
  return existsSync(filePath) ? statSync(filePath).size : 0;
}

function walkFiles(targetPath) {
  if (!existsSync(targetPath)) {
    return [];
  }

  const stats = statSync(targetPath);
  if (stats.isFile()) {
    return [targetPath];
  }

  const files = [];
  for (const entry of readdirSync(targetPath, { withFileTypes: true })) {
    const fullPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function addCheck(rows, check, passed, details, actual = "", budget = "") {
  rows.push({
    check,
    status: passed ? "pass" : "fail",
    details,
    actual,
    budget,
    public_unlock: "no",
  });
  return passed;
}

function groupStaticFiles(files) {
  const groups = {
    js: [],
    css: [],
    font: [],
    image: [],
    other: [],
  };

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (ext === ".js" || ext === ".mjs") {
      groups.js.push(file);
    } else if (ext === ".css") {
      groups.css.push(file);
    } else if ([".woff2", ".woff", ".ttf", ".otf"].includes(ext)) {
      groups.font.push(file);
    } else if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".svg", ".ico"].includes(ext)) {
      groups.image.push(file);
    } else {
      groups.other.push(file);
    }
  }

  return groups;
}

function totalBytes(files) {
  return files.reduce((sum, file) => sum + sizeOf(file), 0);
}

function largestFile(files) {
  return files
    .map((file) => ({ file, bytes: sizeOf(file) }))
    .sort((a, b) => b.bytes - a.bytes)[0] ?? { file: "", bytes: 0 };
}

function scanBuiltText(files) {
  const matches = {
    publicUnlock: [],
    nonProductionHost: [],
    remoteUrl: [],
  };

  const textExtensions = new Set([".html", ".txt", ".xml", ".json", ".js", ".css", ".rsc", ".body"]);
  for (const file of files) {
    if (!textExtensions.has(path.extname(file).toLowerCase()) && !file.endsWith(".body")) {
      continue;
    }
    const text = readIfExists(file);
    if (publicUnlockPattern.test(text)) {
      matches.publicUnlock.push(rel(file));
    }
    if (nonProductionHostPattern.test(text)) {
      matches.nonProductionHost.push(rel(file));
    }
    const remoteMatches = Array.from(text.matchAll(remoteUrlPattern)).map((match) => `${rel(file)}:${match[0]}`);
    matches.remoteUrl.push(...remoteMatches);
  }

  return matches;
}

function main() {
  const rows = [];
  const routeSummaries = [];
  const staticFiles = walkFiles(staticRoot);
  const builtTextFiles = walkFiles(builtAppRoot);
  const staticGroups = groupStaticFiles(staticFiles);
  const routeHtmlBytes = [];
  const routeRscBytes = [];

  addCheck(rows, "build.nextRoot.exists", existsSync(nextRoot), rel(nextRoot));
  addCheck(rows, "build.appOutput.exists", existsSync(builtAppRoot), rel(builtAppRoot));
  addCheck(rows, "build.staticOutput.exists", existsSync(staticRoot), rel(staticRoot));

  for (const route of routeOutputs) {
    const htmlPath = path.join(builtAppRoot, route.htmlPath);
    const rscPath = path.join(builtAppRoot, route.rscPath);
    const htmlBytes = sizeOf(htmlPath);
    const rscBytes = sizeOf(rscPath);
    const html = readIfExists(htmlPath);

    routeHtmlBytes.push(htmlBytes);
    routeRscBytes.push(rscBytes);
    routeSummaries.push({
      route: route.route,
      htmlPath: rel(htmlPath),
      htmlBytes,
      htmlBudgetBytes: route.htmlBudgetBytes,
      rscPath: rel(rscPath),
      rscBytes,
      rscBudgetBytes: route.rscBudgetBytes,
    });

    addCheck(rows, `${route.label}.html.exists`, existsSync(htmlPath), rel(htmlPath), htmlBytes, "required");
    addCheck(rows, `${route.label}.html.withinBudget`, htmlBytes > 0 && htmlBytes <= route.htmlBudgetBytes, rel(htmlPath), htmlBytes, route.htmlBudgetBytes);
    addCheck(rows, `${route.label}.rsc.exists`, existsSync(rscPath), rel(rscPath), rscBytes, "required");
    addCheck(rows, `${route.label}.rsc.withinBudget`, rscBytes > 0 && rscBytes <= route.rscBudgetBytes, rel(rscPath), rscBytes, route.rscBudgetBytes);
    addCheck(rows, `${route.label}.html.noPublicUnlockSignals`, !publicUnlockPattern.test(html), "no public-unlock wording", htmlBytes, "no hits");
    addCheck(rows, `${route.label}.html.noNonProductionHostLeakage`, !nonProductionHostPattern.test(html), "no preview/Wix/local/alternate host leakage", htmlBytes, "no hits");
  }

  const aggregateHtmlBytes = routeHtmlBytes.reduce((sum, bytes) => sum + bytes, 0);
  const aggregateRscBytes = routeRscBytes.reduce((sum, bytes) => sum + bytes, 0);
  const jsBytes = totalBytes(staticGroups.js);
  const cssBytes = totalBytes(staticGroups.css);
  const fontBytes = totalBytes(staticGroups.font);
  const imageBytes = totalBytes(staticGroups.image);
  const staticBytes = totalBytes(staticFiles);
  const largestJs = largestFile(staticGroups.js);
  const largestCss = largestFile(staticGroups.css);
  const matches = scanBuiltText(builtTextFiles);
  const packageJson = readIfExists(packageJsonPath);

  addCheck(rows, "routes.aggregateHtml.withinBudget", aggregateHtmlBytes <= budgets.aggregateRouteHtmlBytes, "aggregate rendered route HTML bytes", aggregateHtmlBytes, budgets.aggregateRouteHtmlBytes);
  addCheck(rows, "routes.aggregateRsc.withinBudget", aggregateRscBytes <= budgets.aggregateRouteRscBytes, "aggregate rendered RSC bytes", aggregateRscBytes, budgets.aggregateRouteRscBytes);
  addCheck(rows, "static.fileCount.withinBudget", staticFiles.length <= budgets.staticFileCount, "static file count", staticFiles.length, budgets.staticFileCount);
  addCheck(rows, "static.total.withinBudget", staticBytes <= budgets.staticTotalBytes, "all .next/static bytes", staticBytes, budgets.staticTotalBytes);
  addCheck(rows, "static.js.totalWithinBudget", jsBytes <= budgets.staticJsBytes, "static JavaScript bytes", jsBytes, budgets.staticJsBytes);
  addCheck(rows, "static.js.largestWithinBudget", largestJs.bytes <= budgets.largestStaticJsBytes, rel(largestJs.file), largestJs.bytes, budgets.largestStaticJsBytes);
  addCheck(rows, "static.css.totalWithinBudget", cssBytes <= budgets.staticCssBytes, "static CSS bytes", cssBytes, budgets.staticCssBytes);
  addCheck(rows, "static.css.largestWithinBudget", largestCss.bytes <= budgets.largestStaticCssBytes, rel(largestCss.file), largestCss.bytes, budgets.largestStaticCssBytes);
  addCheck(rows, "static.fonts.totalWithinBudget", fontBytes <= budgets.staticFontBytes, "static font bytes", fontBytes, budgets.staticFontBytes);
  addCheck(rows, "static.images.totalWithinBudget", imageBytes <= budgets.staticImageBytes, "static image/icon bytes", imageBytes, budgets.staticImageBytes);
  addCheck(rows, "built.noPublicUnlockSignals", matches.publicUnlock.length === 0, matches.publicUnlock.join(" | ") || "no public-unlock wording", matches.publicUnlock.length, 0);
  addCheck(rows, "built.noNonProductionHostLeakage", matches.nonProductionHost.length === 0, matches.nonProductionHost.join(" | ") || "no non-production host leakage", matches.nonProductionHost.length, 0);
  addCheck(rows, "built.noUnexpectedRemoteUrls", matches.remoteUrl.length === 0, matches.remoteUrl.slice(0, 10).join(" | ") || "no unexpected remote URLs", matches.remoteUrl.length, 0);
  addCheck(rows, "package.verifyHasStep10P", packageJson.includes("security:performance-budget:verify"), "npm verify chain includes Step 10P verifier");

  const passCount = rows.filter((row) => row.status === "pass").length;
  const failCount = rows.length - passCount;
  const verdict = failCount === 0
    ? "PASS_RENDERED_PERFORMANCE_BUDGET_READINESS_NO_PUBLIC_UNLOCK"
    : "FAIL_RENDERED_PERFORMANCE_BUDGET_READINESS_REVIEW_REQUIRED";

  mkdirSync(path.dirname(docsResultsPath), { recursive: true });
  mkdirSync(workRoot, { recursive: true });

  const csvHeader = ["check", "status", "details", "actual", "budget", "public_unlock"];
  writeFileSync(
    docsResultsPath,
    [
      csvHeader.map(csvEscape).join(","),
      ...rows.map((row) => csvHeader.map((key) => csvEscape(row[key] ?? "")).join(",")),
    ].join("\n"),
  );

  const status = {
    verdict,
    officialSourcePosture: {
      webPerformanceBudgets: "web.dev and MDN describe performance budgets as limits that prevent regressions in page weight, resource count, and related metrics.",
      lighthouseBudgets: "Lighthouse supports budgets as a way to check resource size and quantity regressions.",
      nextBundleAnalysis: "Next.js documents bundle analysis and package bundling review for identifying large client/server modules.",
    },
    budgets,
    routeCount: routeOutputs.length,
    routeSummaries,
    staticSummary: {
      staticFileCount: staticFiles.length,
      staticTotalBytes: staticBytes,
      jsFileCount: staticGroups.js.length,
      jsBytes,
      largestJs: { path: rel(largestJs.file), bytes: largestJs.bytes },
      cssFileCount: staticGroups.css.length,
      cssBytes,
      largestCss: { path: rel(largestCss.file), bytes: largestCss.bytes },
      fontFileCount: staticGroups.font.length,
      fontBytes,
      imageFileCount: staticGroups.image.length,
      imageBytes,
      otherFileCount: staticGroups.other.length,
      otherBytes: totalBytes(staticGroups.other),
    },
    passCount,
    failCount,
    publicSeoUnlocked: false,
    routePublicationApproved: false,
    sitemapInclusionApproved: false,
    indexabilityApproved: false,
    deploymentApproved: false,
    providerConnected: false,
    rows,
  };

  writeFileSync(statusJsonPath, `${JSON.stringify(status, null, 2)}\n`);
  writeFileSync(
    statusMdPath,
    [
      "# Step 10P Rendered Performance Budget Readiness Status",
      "",
      `Verdict: ${verdict}`,
      `Checks: ${passCount}/${rows.length}`,
      `Routes checked: ${routeOutputs.length}`,
      `Static bytes: ${staticBytes}`,
      `JavaScript bytes: ${jsBytes}`,
      `CSS bytes: ${cssBytes}`,
      "Public unlock: no",
      "",
      "Final signal:",
      "",
      verdict,
      "",
    ].join("\n"),
  );

  if (failCount > 0) {
    console.error(verdict);
    console.error(`Checks passed: ${passCount}/${rows.length}`);
    process.exit(1);
  }

  console.log(verdict);
  console.log(`Checks passed: ${passCount}/${rows.length}`);
}

main();
