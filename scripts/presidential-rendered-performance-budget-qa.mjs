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
const nextRoot = path.join(webRoot, ".next");
const builtAppRoot = path.join(nextRoot, "server", "app");
const staticRoot = path.join(nextRoot, "static");
const nextBin = path.join(webRoot, "node_modules", "next", "dist", "bin", "next");
const packageJsonPath = path.join(webRoot, "package.json");
const runtimeHost = "127.0.0.1";
const runtimeBasePort = Number(process.env.PRESIDENTIAL_PERFORMANCE_QA_PORT || "3347");
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
  { label: "home", route: "/", htmlPath: "index.html", dynamicArtifactPath: "page.js", htmlBudgetBytes: 90000, rscPath: "index.rsc", rscBudgetBytes: 45000 },
  // moonRocks HTML budget raised 50000 -> 64000 for the owner-ordered catalog
  // series-selector scene (9083-CODE P2.2/P3, 2026-07-11); still tight enough
  // to catch runaway page growth on the flagship platform hub.
  { label: "moonRocks", route: "/moon-rocks", htmlPath: "moon-rocks.html", htmlBudgetBytes: 64000, rscPath: "moon-rocks.rsc", rscBudgetBytes: 30000 },
  { label: "moonPods", route: "/moon-pods", htmlPath: "moon-pods.html", htmlBudgetBytes: 50000, rscPath: "moon-pods.rsc", rscBudgetBytes: 30000 },
  { label: "orbit", route: "/orbit", htmlPath: "orbit.html", htmlBudgetBytes: 50000, rscPath: "orbit.rsc", rscBudgetBytes: 30000 },
  { label: "ourStory", route: "/our-story", htmlPath: "our-story.html", htmlBudgetBytes: 50000, rscPath: "our-story.rsc", rscBudgetBytes: 25000 },
  { label: "learn", route: "/learn", htmlPath: "learn.html", htmlBudgetBytes: 55000, rscPath: "learn.rsc", rscBudgetBytes: 30000 },
  // findUs HTML budget raised 55000 -> 72000 for the owner-ordered US map
  // centerpiece (9083-CODE P4.1, 2026-07-11: 51-tile grid + state links +
  // nationwide film); still tight against further growth.
  { label: "findUs", route: "/find-us", htmlPath: "find-us.html", htmlBudgetBytes: 72000, rscPath: "find-us.rsc", rscBudgetBytes: 30000 },
  { label: "contact", route: "/contact", htmlPath: "contact.html", htmlBudgetBytes: 55000, rscPath: "contact.rsc", rscBudgetBytes: 30000 },
  {
    label: "notFound",
    route: "/presidential-performance-not-found-probe",
    htmlPath: "_not-found.html",
    dynamicArtifactPath: "_not-found/page.js",
    htmlBudgetBytes: 30000,
    rscPath: "_not-found.rsc",
    rscBudgetBytes: 20000,
    allowNotOk: true,
  },
  { label: "globalError", route: "/_global-error", htmlPath: "_global-error.html", htmlBudgetBytes: 25000, rscPath: "_global-error.rsc", rscBudgetBytes: 15000, staticOnly: true },
];

for (const route of routeOutputs) {
  route.dynamicArtifactPath ??= `${route.route.replace(/^\/+/, "")}/page.js`;
}

const budgets = {
  aggregateRouteHtmlBytes: 500000,
  aggregateRouteRscBytes: 280000,
  staticJsBytes: 850000,
  largestStaticJsBytes: 325000,
  staticCssBytes: 80000,
  // largest-CSS budget raised 50000 -> 64000 for the eight themed state
  // atmospheres, map tiles, and state display faces (9083-CODE P4, owner
  // rulings 2026-07-11); total-CSS budget unchanged.
  largestStaticCssBytes: 64000,
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

async function main() {
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

  const runtimeHtmlByRoute = new Map();
  await withRuntimeServer(async (baseUrl) => {
    for (const route of routeOutputs.filter((entry) => !entry.staticOnly)) {
      runtimeHtmlByRoute.set(route.label, await fetchRuntimeHtml(baseUrl, route));
    }
  });

  for (const route of routeOutputs) {
    const htmlPath = path.join(builtAppRoot, route.htmlPath);
    const rscPath = path.join(builtAppRoot, route.rscPath);
    const dynamicArtifactPath = path.join(builtAppRoot, route.dynamicArtifactPath);
    const staticHtmlExists = existsSync(htmlPath);
    const staticRscExists = existsSync(rscPath);
    const dynamicArtifactExists = existsSync(dynamicArtifactPath);
    const rendered = runtimeHtmlByRoute.get(route.label);
    const html = staticHtmlExists ? readIfExists(htmlPath) : (rendered?.html ?? "");
    const htmlBytes = staticHtmlExists ? sizeOf(htmlPath) : Buffer.byteLength(html, "utf8");
    const rscBytes = staticRscExists ? sizeOf(rscPath) : sizeOf(dynamicArtifactPath);
    const htmlDetails = staticHtmlExists
      ? rel(htmlPath)
      : `${rel(dynamicArtifactPath)} rendered at ${route.route} with status ${rendered?.status ?? "missing"}`;
    const rscDetails = staticRscExists ? rel(rscPath) : rel(dynamicArtifactPath);

    routeHtmlBytes.push(htmlBytes);
    routeRscBytes.push(rscBytes);
    routeSummaries.push({
      route: route.route,
      htmlPath: staticHtmlExists ? rel(htmlPath) : rel(dynamicArtifactPath),
      htmlBytes,
      htmlBudgetBytes: route.htmlBudgetBytes,
      runtimeStatus: rendered?.status ?? null,
      runtimeOk: rendered?.ok ?? null,
      rscPath: staticRscExists ? rel(rscPath) : rel(dynamicArtifactPath),
      rscBytes,
      rscBudgetBytes: route.rscBudgetBytes,
    });

    addCheck(rows, `${route.label}.html.exists`, htmlBytes > 0 && (staticHtmlExists || dynamicArtifactExists), htmlDetails, htmlBytes, "required");
    addCheck(rows, `${route.label}.html.withinBudget`, htmlBytes > 0 && htmlBytes <= route.htmlBudgetBytes, htmlDetails, htmlBytes, route.htmlBudgetBytes);
    addCheck(rows, `${route.label}.rscOrDynamicArtifact.exists`, rscBytes > 0 && (staticRscExists || dynamicArtifactExists), rscDetails, rscBytes, "required");
    addCheck(rows, `${route.label}.rscOrDynamicArtifact.withinBudget`, rscBytes > 0 && rscBytes <= route.rscBudgetBytes, rscDetails, rscBytes, route.rscBudgetBytes);
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
