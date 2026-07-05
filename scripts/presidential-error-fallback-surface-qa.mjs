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
const appRoot = path.join(webRoot, "src", "app");
const builtAppRoot = path.join(webRoot, ".next", "server", "app");
const packageJsonPath = path.join(webRoot, "package.json");
const resultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "275-step10n-error-fallback-surface-readiness-results.csv",
);
const workRoot = path.join(root, "sources", "spud", "work", "step10n-error-fallback-surface-readiness");
const statusJsonPath = path.join(workRoot, "step10n-error-fallback-surface-readiness-status.json");
const statusMdPath = path.join(workRoot, "step10n-error-fallback-surface-readiness-status.md");

const sourceFiles = {
  notFound: path.join(appRoot, "not-found.tsx"),
  error: path.join(appRoot, "error.tsx"),
  globalError: path.join(appRoot, "global-error.tsx"),
  loading: path.join(appRoot, "loading.tsx"),
};

const builtFiles = {
  notFoundHtml: path.join(builtAppRoot, "_not-found.html"),
  notFoundMeta: path.join(builtAppRoot, "_not-found.meta"),
  globalErrorHtml: path.join(builtAppRoot, "_global-error.html"),
  globalErrorMeta: path.join(builtAppRoot, "_global-error.meta"),
};

const textExtensions = new Set([".html", ".js", ".json", ".mjs", ".rsc", ".ts", ".tsx"]);
const fallbackSourceBasenames = new Set([
  "not-found.tsx",
  "error.tsx",
  "global-error.tsx",
  "global-not-found.tsx",
  "loading.tsx",
]);

const publicUnlockPattern =
  /public seo unlocked|route publication approved|sitemap inclusion approved|index,\s*follow approved|deployment approved|schema approved|metadata approved|product page approved|locator page approved/i;
const threatLanguagePattern = /\b(?:fake|imposter|stolen|hijacked|scam|threat domain)\b/i;
const medicalOrEffectPattern =
  /\b(?:disease|treat|treatment|cure|pain|anxiety|sleep|cancer|therapeutic|euphoric|relaxing|cerebral|uplifting|sedating)\b/i;
const directCommercePattern =
  /\b(?:buy now|order now|place an order|checkout|add to cart|shipping available|ships? to|delivery available|price list|pricing available|inventory available|in stock|direct order|online order)\b/i;
const nonProductionHostPattern =
  /\b(?:localhost|127\.0\.0\.1|vercel\.app|wix(?:site|static)?\.com|wix\.com|googleusercontent\.com|drive\.google\.com|presidential\.vip|presidential\.rocks|presidential\.online|presidential\.us|presidentialca\.com|www\.presidentialmoonrocks\.com)\b/i;
const externalUrlPattern = /https?:\/\/[^\s"'<>\\)]+/gi;
const formPattern = /<form\b/i;
const formFieldPattern = /<(?:input|textarea|select)\b/i;
const submitLogicPattern = /\b(?:formAction|onSubmit|useActionState|useFormStatus|FormData|fetch\s*\(|axios|XMLHttpRequest|sendBeacon|navigator\.sendBeacon)\b/i;
const externalFormActionPattern = /<form\b[^>]*\baction=["']https?:\/\//i;
const errorDetailLeakPattern = /\berror\.(?:message|digest|stack|cause)\b|\berror\s*:\s*String\(|JSON\.stringify\(\s*error/i;

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
      if (["node_modules", ".git", ".lighthouseci", "cache"].includes(entry.name)) {
        continue;
      }
      files.push(...walkTextFiles(fullPath));
    } else if (textExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

function parseMetaStatus(filePath) {
  try {
    return JSON.parse(readIfExists(filePath)).status;
  } catch {
    return null;
  }
}

function collectExternalUrls(text) {
  return Array.from(text.matchAll(externalUrlPattern)).map((match) => match[0]);
}

function collectMatches(files, pattern) {
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

function addCheck(rows, check, passed, details) {
  rows.push({
    check,
    status: passed ? "pass" : "fail",
    details,
    public_unlock: "no",
  });
  return passed;
}

function hasUseClientDirective(text) {
  return /^["']use client["'];?/m.test(text.trimStart());
}

function sourceFallbackFiles() {
  return walkTextFiles(appRoot).filter((file) => fallbackSourceBasenames.has(path.basename(file)));
}

function main() {
  const rows = [];
  const fallbackSources = sourceFallbackFiles();
  const fallbackSourceText = fallbackSources.map(readIfExists).join("\n");
  const notFoundText = readIfExists(sourceFiles.notFound);
  const errorText = readIfExists(sourceFiles.error);
  const globalErrorText = readIfExists(sourceFiles.globalError);
  const loadingText = readIfExists(sourceFiles.loading);
  const notFoundHtml = readIfExists(builtFiles.notFoundHtml);
  const globalErrorHtml = readIfExists(builtFiles.globalErrorHtml);
  const combinedFallbackText = [fallbackSourceText, notFoundHtml, globalErrorHtml].join("\n");
  const packageJson = readIfExists(packageJsonPath);

  const notFoundStatus = parseMetaStatus(builtFiles.notFoundMeta);
  const globalErrorStatus = parseMetaStatus(builtFiles.globalErrorMeta);
  const sourceExternalUrls = collectExternalUrls(fallbackSourceText);
  const builtExternalUrls = collectExternalUrls([notFoundHtml, globalErrorHtml].join("\n"));
  const unexpectedExternalUrls = [...sourceExternalUrls, ...builtExternalUrls].filter(
    (url) => !url.startsWith("https://presidentialmoonrocks.com"),
  );
  const sourceForms = collectMatches(fallbackSources, formPattern);
  const sourceFields = collectMatches(fallbackSources, formFieldPattern);
  const sourceSubmissionLogic = collectMatches(fallbackSources, submitLogicPattern);
  const sourceErrorDetailLeaks = collectMatches([sourceFiles.error, sourceFiles.globalError].filter(existsSync), errorDetailLeakPattern);
  const globalErrorHasFrameworkFallback = /A server error occurred\. Reload to try again\./i.test(globalErrorHtml);

  const checks = [
    addCheck(rows, "source.notFoundExists", existsSync(sourceFiles.notFound), rel(sourceFiles.notFound)),
    addCheck(rows, "source.errorExists", existsSync(sourceFiles.error), rel(sourceFiles.error)),
    addCheck(rows, "source.globalErrorExists", existsSync(sourceFiles.globalError), rel(sourceFiles.globalError)),
    addCheck(rows, "source.loadingExists", existsSync(sourceFiles.loading), rel(sourceFiles.loading)),
    addCheck(rows, "source.errorIsClientComponent", hasUseClientDirective(errorText), "error.tsx declares use client"),
    addCheck(rows, "source.globalErrorIsClientComponent", hasUseClientDirective(globalErrorText), "global-error.tsx declares use client"),
    addCheck(rows, "source.globalErrorHasHtmlAndBody", /<html\b/i.test(globalErrorText) && /<body\b/i.test(globalErrorText), "global-error.tsx owns html/body when root layout is replaced"),
    addCheck(rows, "source.globalErrorHasRobotsNoindex", /noindex,\s*follow/i.test(globalErrorText), "global-error.tsx includes explicit noindex, follow metadata"),
    addCheck(rows, "source.notFoundRobotsNoindex", /robots:\s*{[\s\S]*index:\s*false[\s\S]*follow:\s*true/i.test(notFoundText), "not-found.tsx metadata remains noindex/follow"),
    addCheck(rows, "source.loadingIsNeutral", /Loading Presidential/i.test(loadingText) && !publicUnlockPattern.test(loadingText), "loading.tsx uses neutral official language"),
    addCheck(rows, "source.noForms", sourceForms.length === 0, sourceForms.slice(0, 8).join(" | ") || "No forms in fallback source files"),
    addCheck(rows, "source.noFields", sourceFields.length === 0, sourceFields.slice(0, 8).join(" | ") || "No input, textarea, or select fields in fallback source files"),
    addCheck(rows, "source.noSubmissionLogic", sourceSubmissionLogic.length === 0, sourceSubmissionLogic.slice(0, 8).join(" | ") || "No submission logic in fallback source files"),
    addCheck(rows, "source.noErrorDetailsLeak", sourceErrorDetailLeaks.length === 0, sourceErrorDetailLeaks.slice(0, 8).join(" | ") || "Error message, digest, stack, and cause are not rendered"),
    addCheck(rows, "built.notFoundHtmlExists", existsSync(builtFiles.notFoundHtml), rel(builtFiles.notFoundHtml)),
    addCheck(rows, "built.notFoundStatus404", notFoundStatus === 404, `status=${notFoundStatus}`),
    addCheck(rows, "built.notFoundBrandOwned", /Official Presidential/i.test(notFoundHtml) && /Page not found/i.test(notFoundHtml), "Built not-found output uses Presidential fallback copy"),
    addCheck(rows, "built.notFoundNoindex", /name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(notFoundHtml), "Built not-found output contains noindex robots metadata"),
    addCheck(rows, "built.globalErrorHtmlExists", existsSync(builtFiles.globalErrorHtml), rel(builtFiles.globalErrorHtml)),
    addCheck(rows, "built.globalErrorStatus500", globalErrorStatus === 500, `status=${globalErrorStatus}`),
    addCheck(rows, "built.globalErrorFrameworkFallbackWatched", globalErrorHasFrameworkFallback, "Next-generated _global-error fallback is present and separately scanned"),
    addCheck(rows, "built.globalErrorNoExternalFormAction", !externalFormActionPattern.test(globalErrorHtml), "No external form action in generated global error fallback"),
    addCheck(rows, "built.globalErrorNoInputFields", !formFieldPattern.test(globalErrorHtml), "No input, textarea, or select fields in generated global error fallback"),
    addCheck(rows, "fallback.noPublicUnlockSignals", !publicUnlockPattern.test(combinedFallbackText), "No public SEO, deployment, route-publication, sitemap, schema, metadata, product, or locator unlock signals"),
    addCheck(rows, "fallback.noThreatLanguage", !threatLanguagePattern.test(combinedFallbackText), "No imposter/threat-domain accusation language"),
    addCheck(rows, "fallback.noMedicalOrEffectClaims", !medicalOrEffectPattern.test(combinedFallbackText), "No medical or effect claims"),
    addCheck(rows, "fallback.noDirectCommerceClaims", !directCommercePattern.test(combinedFallbackText), "No buy/order/checkout/shipping/pricing/inventory claims"),
    addCheck(rows, "fallback.noNonProductionHostLeakage", !nonProductionHostPattern.test(combinedFallbackText), "No preview, Wix, local, alternate, or www host leakage"),
    addCheck(rows, "fallback.noUnexpectedExternalUrls", unexpectedExternalUrls.length === 0, unexpectedExternalUrls.join(" | ") || "No unexpected external URLs in fallback source or built output"),
    addCheck(rows, "package.verifyHasStep10N", /security:error-fallbacks:verify/.test(packageJson), "npm verify chain includes Step 10N verifier"),
  ];

  const verdict = checks.every(Boolean)
    ? "PASS_ERROR_FALLBACK_SURFACE_READINESS_NO_PUBLIC_UNLOCK"
    : "FAIL_ERROR_FALLBACK_SURFACE_READINESS_REVIEW_REQUIRED";

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
      nextErrorHandling:
        "Next.js App Router uses error and global-error file conventions for uncaught exceptions. Global error UI replaces the root layout and must define html/body.",
      nextNotFound:
        "Next.js not-found handles notFound() and unmatched routes. 404 status pages receive noindex behavior.",
      presidentialLaw:
        "Fallback surfaces must not bypass no source, no proof, no approval, no publish.",
    },
    sourceFiles: Object.fromEntries(
      Object.entries(sourceFiles).map(([key, file]) => [key, { path: rel(file), exists: existsSync(file) }]),
    ),
    builtFiles: Object.fromEntries(
      Object.entries(builtFiles).map(([key, file]) => [key, { path: rel(file), exists: existsSync(file) }]),
    ),
    notFoundStatus,
    globalErrorStatus,
    globalErrorHasFrameworkFallback,
    sourceExternalUrls,
    builtExternalUrls,
    unexpectedExternalUrls,
    publicSeoUnlocked: false,
    routePublicationApproved: false,
    sitemapInclusionApproved: false,
    indexabilityApproved: false,
    deploymentApproved: false,
    contactFormApproved: false,
    providerConnected: false,
    rows,
  };

  mkdirSync(workRoot, { recursive: true });
  writeFileSync(statusJsonPath, JSON.stringify(payload, null, 2) + "\n");
  writeFileSync(
    statusMdPath,
    [
      "# Step 10N Error / Fallback Surface Readiness Status",
      "",
      `Verdict: ${verdict}`,
      "",
      `Source fallback files scanned: ${fallbackSources.length}`,
      `Not-found status: ${notFoundStatus}`,
      `Global error status: ${globalErrorStatus}`,
      `Generated global-error framework fallback watched: ${globalErrorHasFrameworkFallback ? "yes" : "no"}`,
      "",
      "No public SEO unlock, route publication approval, sitemap inclusion, indexability approval, deployment approval, contact form approval, provider connection, or client data import occurred.",
      "",
    ].join("\n"),
  );

  console.log(verdict);
  console.log(`Checks passed: ${rows.filter((row) => row.status === "pass").length}/${rows.length}`);
  if (verdict.startsWith("FAIL")) {
    console.error(rows.filter((row) => row.status === "fail").map((row) => `${row.check}: ${row.details}`).join("\n"));
    process.exit(1);
  }
}

main();
