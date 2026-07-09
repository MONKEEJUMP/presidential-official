import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const nextConfigPath = path.join(webRoot, "next.config.ts");
const packageJsonPath = path.join(webRoot, "package.json");
const builtAppRoot = path.join(webRoot, ".next", "server", "app");
const docsResultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "263-step10k-browser-storage-consent-readiness-results.csv",
);
const workRoot = path.join(root, "sources", "spud", "work", "step10k-browser-storage-consent-readiness");
const statusJsonPath = path.join(workRoot, "step10k-browser-storage-consent-readiness-status.json");
const statusMdPath = path.join(workRoot, "step10k-browser-storage-consent-readiness-status.md");

const ageGatePath = path.join(webRoot, "src", "components", "age-gate.tsx");
const ageGateActionPath = path.join(webRoot, "src", "app", "age-gate-actions.ts");
const ageGateConstantsPath = path.join(webRoot, "src", "app", "age-gate-constants.ts");
const layoutPath = path.join(webRoot, "src", "app", "layout.tsx");
const approvedAgeGateFile = "web/src/components/age-gate.tsx";
const approvedAgeGateCookieFile = "web/src/app/age-gate-actions.ts";
const approvedAgeGateLayoutFile = "web/src/app/layout.tsx";
const approvedGatedAnalyticsFiles = new Set([
  "web/src/app/layout.tsx",
  "web/src/components/analytics/google-analytics.tsx",
  "web/src/lib/analytics/google.ts",
]);
const approvedAgeGateStorageKey = "presidential_adult_confirmed";
const approvedAgeGateCookieName = "presidential_adult_confirmed";

const sourceRoots = [
  path.join(webRoot, "src", "app"),
  path.join(webRoot, "src", "components"),
  path.join(webRoot, "src", "lib", "design-system"),
  path.join(webRoot, "src", "lib", "seo"),
  nextConfigPath,
  packageJsonPath,
];

const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".mjs",
  ".rsc",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
]);

const cookiePattern =
  /\b(?:document\.cookie|cookieStore|Set-Cookie|cookies\s*\(|RequestCookies|ResponseCookies|NextResponse\.cookies|from\s+["']next\/headers["'])\b/i;
const storagePattern =
  /\b(?:localStorage|sessionStorage|indexedDB|openDB|IDBDatabase|CacheStorage|caches\s*\.|navigator\.serviceWorker|serviceWorker\.register|ServiceWorkerRegistration)\b/i;
const unapprovedStoragePattern =
  /\b(?:sessionStorage|indexedDB|openDB|IDBDatabase|CacheStorage|caches\s*\.|navigator\.serviceWorker|serviceWorker\.register|ServiceWorkerRegistration)\b/i;
const consentTrackingPattern =
  /\b(?:gtag\s*\(\s*["']consent|analytics_storage|ad_storage|ad_user_data|ad_personalization|personalization_storage|functionality_storage|security_storage|consent mode|Google Consent Mode|cookie consent|cookie banner|CMP|OneTrust|Cookiebot|Usercentrics|TrustArc|Didomi|Osano|Iubenda|Quantcast Choice)\b/i;
const trackingStoragePattern =
  /\b(?:_ga|_gid|_gcl|fbp|fbc|ttclid|gclid|utm_|tracking_id|client_id|visitor_id|session_id|analytics|pixel|fingerprint|retarget|remarketing)\b/i;
const sensitiveAgePattern =
  /\b(?:dateOfBirth|date_of_birth|birthdate|birth_date|dob|birthday|birth year|birth_year|birth month|birth_month|birth day|birth_day|age_year|ageMonth|ageDay)\b/i;
const packageConsentDependencyPattern =
  /"(?:(?:js-cookie|cookies-next|react-cookie|universal-cookie|cookieconsent|vanilla-cookieconsent|@vercel\/analytics|@vercel\/speed-insights|@next\/third-parties|gtag|google-analytics|posthog-js|mixpanel-browser|@segment\/analytics-next|@sentry\/nextjs|@microsoft\/clarity|clarity-js|@one-trust\/[^"]+|@cookiebot\/[^"]+|@usercentrics\/[^"]+))"/i;
const publicUnlockPattern =
  /storage approved|cookie approved|cookie consent approved|tracking approved|analytics approved|pixel approved|consent mode approved|public seo unlocked|route publication approved|sitemap inclusion approved|index,\s*follow approved|deployment approved/i;

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

function collectMatches(files, pattern, options = {}) {
  const matches = [];
  for (const file of files) {
    const relativePath = rel(file);
    const text = readIfExists(file);
    const lines = text.split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      pattern.lastIndex = 0;
      if (!pattern.test(line)) {
        continue;
      }
      if (options.allowAgeGateLocalStorage && isApprovedAgeGateLocalStorageLine(relativePath, line)) {
        continue;
      }
      if (options.allowAgeGateServerCookie && isApprovedAgeGateServerCookieLine(relativePath, line)) {
        continue;
      }
      if (options.allowGatedAnalytics && approvedGatedAnalyticsFiles.has(relativePath)) {
        continue;
      }
      matches.push(`${relativePath}:${index + 1}:${line.trim()}`);
    }
  }
  return matches;
}

function collectBuiltUnapprovedStorageMatches(files) {
  const matches = [];

  for (const file of files) {
    const relativePath = rel(file);
    const text = readIfExists(file);
    const lines = text.split(/\r?\n/);

    for (const [index, line] of lines.entries()) {
      storagePattern.lastIndex = 0;
      unapprovedStoragePattern.lastIndex = 0;

      if (!storagePattern.test(line)) {
        continue;
      }

      const usesApprovedAgeGateLocalStorage =
        /\blocalStorage\b/.test(line) && line.includes(approvedAgeGateStorageKey);

      if (unapprovedStoragePattern.test(line) || !usesApprovedAgeGateLocalStorage) {
        matches.push(`${relativePath}:${index + 1}:${line.trim()}`);
      }
    }
  }

  return matches;
}

function isApprovedAgeGateLocalStorageLine(relativePath, line) {
  if (relativePath !== approvedAgeGateFile) {
    return false;
  }

  return (
    line.includes("window.localStorage.getItem(ADULT_CONFIRMATION_KEY)") ||
    line.includes("window.localStorage.setItem(ADULT_CONFIRMATION_KEY, \"true\")") ||
    line.includes("window.localStorage.removeItem(ADULT_CONFIRMATION_KEY)")
  );
}

function isApprovedAgeGateServerCookieLine(relativePath, line) {
  if (relativePath === approvedAgeGateLayoutFile) {
    return (
      line.includes('from "next/headers"') ||
      line.includes("ADULT_CONFIRMATION_COOKIE") ||
      line.includes("cookies()).get(ADULT_CONFIRMATION_COOKIE)")
    );
  }

  if (relativePath === approvedAgeGateCookieFile) {
    return (
      line.includes('from "next/headers"') ||
      line.includes("ADULT_CONFIRMATION_COOKIE") ||
      line.includes(approvedAgeGateCookieName) ||
      line.includes("cookies()") ||
      line.includes("cookieStore.set") ||
      line.includes("cookieStore.delete")
    );
  }

  if (relativePath.includes("web/.next/server/app/age-gate-actions")) {
    return (
      line.includes(approvedAgeGateCookieName) ||
      line.includes("next/headers") ||
      line.includes("cookies")
    );
  }

  return false;
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

function main() {
  const rows = [];
  const sourceFiles = sourceRoots.flatMap(walkTextFiles);
  const builtFiles = walkTextFiles(builtAppRoot);
  const packageJsonText = readIfExists(packageJsonPath);
  const nextConfigText = readIfExists(nextConfigPath);
  const ageGateText = readIfExists(ageGatePath);
  const ageGateActionText = readIfExists(ageGateActionPath);
  const ageGateConstantsText = readIfExists(ageGateConstantsPath);
  const layoutText = readIfExists(layoutPath);
  const sourceText = sourceFiles.map(readIfExists).join("\n");
  const builtText = builtFiles.map(readIfExists).join("\n");
  const combinedPublicText = [sourceText, builtText, packageJsonText, nextConfigText].join("\n");

  const sourceCookieMatches = collectMatches(sourceFiles, cookiePattern, {
    allowAgeGateServerCookie: true,
  });
  const builtCookieMatches = collectMatches(builtFiles, cookiePattern, {
    allowAgeGateServerCookie: true,
  });
  const sourceUnapprovedStorageMatches = collectMatches(sourceFiles, storagePattern, {
    allowAgeGateLocalStorage: true,
  });
  const sourceBlockedStorageMatches = collectMatches(sourceFiles, unapprovedStoragePattern);
  const builtUnapprovedStorageMatches =
    collectBuiltUnapprovedStorageMatches(builtFiles);
  const sourceConsentMatches = collectMatches(sourceFiles, consentTrackingPattern);
  const builtConsentMatches = collectMatches(builtFiles, consentTrackingPattern);
  const sourceTrackingStorageMatches = collectMatches(sourceFiles, trackingStoragePattern);
  const sourceUnapprovedTrackingStorageMatches = collectMatches(sourceFiles, trackingStoragePattern, {
    allowGatedAnalytics: true,
  });
  const builtTrackingStorageMatches = collectMatches(builtFiles, trackingStoragePattern);
  const sourceSensitiveAgeMatches = collectMatches(sourceFiles, sensitiveAgePattern);
  const builtSensitiveAgeMatches = collectMatches(builtFiles, sensitiveAgePattern);
  const hasPackageConsentDependency = packageConsentDependencyPattern.test(packageJsonText);

  const ageGateUsesExactKey = ageGateText.includes(`const ADULT_CONFIRMATION_KEY = "${approvedAgeGateStorageKey}";`);
  const ageGateReadsKey = ageGateText.includes("window.localStorage.getItem(ADULT_CONFIRMATION_KEY)");
  const ageGateWritesTrueOnly = ageGateText.includes('window.localStorage.setItem(ADULT_CONFIRMATION_KEY, "true")');
  const ageGateCanClearKey = ageGateText.includes("window.localStorage.removeItem(ADULT_CONFIRMATION_KEY)");
  const ageGateHasStorageTryCatch = /try\s*{[\s\S]*localStorage[\s\S]*}\s*catch\s*{/.test(ageGateText);
  const ageGateNoDob = !sensitiveAgePattern.test(ageGateText);
  const ageGateUsesServerActions =
    ageGateText.includes("confirmAdultAccess") &&
    ageGateText.includes("clearAdultAccess") &&
    ageGateText.includes("initialConfirmed");
  const ageGateActionIsScoped =
    ageGateActionText.includes('"use server";') &&
    ageGateActionText.includes('import { cookies } from "next/headers";') &&
    ageGateActionText.includes("ADULT_CONFIRMATION_COOKIE") &&
    ageGateConstantsText.includes(`ADULT_CONFIRMATION_COOKIE = "${approvedAgeGateCookieName}"`) &&
    ageGateActionText.includes("cookieStore.set") &&
    ageGateActionText.includes("httpOnly: true") &&
    ageGateActionText.includes('sameSite: "lax"') &&
    ageGateActionText.includes('path: "/"') &&
    ageGateActionText.includes("cookieStore.delete") &&
    !sensitiveAgePattern.test(ageGateActionText);
  const ageGateIsOverlayController = /export\s+function\s+AgeGate\s*\(/.test(ageGateText);
  const layoutRendersChildrenInServerWrapper =
    layoutText.includes('id="presidential-age-gated-content"') &&
    layoutText.includes("{children}") &&
    layoutText.includes("<AgeGate initialConfirmed={adultConfirmed} />");
  const layoutReadsServerAdultCookie =
    layoutText.includes('from "next/headers"') &&
    layoutText.includes("cookies") &&
    layoutText.includes("ADULT_CONFIRMATION_COOKIE") &&
    layoutText.includes("adultConfirmed") &&
    layoutText.includes("<AgeGate initialConfirmed={adultConfirmed} />");
  const ageGateDisablesBackgroundUntilAccepted =
    ageGateText.includes('getElementById(AGE_GATED_CONTENT_ID)') &&
    ageGateText.includes('setAttribute("aria-hidden", "true")') &&
    ageGateText.includes('setAttribute("inert", "")') &&
    ageGateText.includes('removeAttribute("aria-hidden")') &&
    ageGateText.includes('removeAttribute("inert")');
  const ageGateLocksScroll =
    ageGateText.includes("document.documentElement.style.overflow = \"hidden\"") &&
    ageGateText.includes("document.body.style.overflow = \"hidden\"");

  const checks = [
    addCheck(rows, "builtOutput.exists", builtFiles.length > 0, `${builtFiles.length} built text file(s) scanned`),
    addCheck(rows, "source.onlyApprovedAgeGateCookie", sourceCookieMatches.length === 0, sourceCookieMatches.length ? sourceCookieMatches.slice(0, 10).join(" | ") : "Only the first-party age-gate server cookie surface appears in public source"),
    addCheck(rows, "built.onlyApprovedAgeGateCookie", builtCookieMatches.length === 0, builtCookieMatches.length ? builtCookieMatches.slice(0, 10).join(" | ") : "Only the first-party age-gate server cookie surface appears in built output"),
    addCheck(rows, "source.noUnapprovedStorage", sourceUnapprovedStorageMatches.length === 0, sourceUnapprovedStorageMatches.length ? sourceUnapprovedStorageMatches.slice(0, 10).join(" | ") : "Only approved age-gate localStorage lines appear in public source"),
    addCheck(rows, "source.noSessionIndexedDbCacheOrServiceWorker", sourceBlockedStorageMatches.length === 0, sourceBlockedStorageMatches.length ? sourceBlockedStorageMatches.slice(0, 10).join(" | ") : "No sessionStorage, IndexedDB, CacheStorage, caches API, or service worker registration usage"),
    addCheck(rows, "built.noUnapprovedStorage", builtUnapprovedStorageMatches.length === 0, builtUnapprovedStorageMatches.join(" | ") || "Built output contains no storage surface beyond approved age-gate localStorage"),
    addCheck(rows, "ageGate.exactStorageKey", ageGateUsesExactKey, approvedAgeGateStorageKey),
    addCheck(rows, "ageGate.readsConfirmationKeyOnly", ageGateReadsKey, "Age gate reads only the adult confirmation key"),
    addCheck(rows, "ageGate.writesTrueOnly", ageGateWritesTrueOnly, "Age gate writes only the boolean string true"),
    addCheck(rows, "ageGate.canClearConfirmation", ageGateCanClearKey, "Age gate can clear the confirmation key on decline"),
    addCheck(rows, "ageGate.storageTryCatch", ageGateHasStorageTryCatch, "Age gate storage access is guarded for restricted browsing modes"),
    addCheck(rows, "ageGate.noDobOrSensitiveAgeData", ageGateNoDob, "Age gate does not collect DOB, birthdate, birthday, or date components"),
    addCheck(rows, "ageGate.serverActionCookieScoped", ageGateActionIsScoped, "Age gate server action writes and clears only the adult-confirmation cookie with scoped first-party options"),
    addCheck(rows, "ageGate.clientCallsServerActions", ageGateUsesServerActions, "Age gate accept/decline path calls the scoped server cookie actions"),
    addCheck(rows, "layout.readsServerAdultCookie", layoutReadsServerAdultCookie, "Root layout reads the adult-confirmation cookie and passes only a boolean into the overlay"),
    addCheck(rows, "ageGate.overlayControllerOnly", ageGateIsOverlayController, "Age gate controls overlay state without wrapping route children in a client component"),
    addCheck(rows, "layout.rendersChildrenInServerWrapper", layoutRendersChildrenInServerWrapper, "Route children remain in the server layout DOM behind the adult confirmation overlay"),
    addCheck(rows, "ageGate.disablesBackgroundUntilAccepted", ageGateDisablesBackgroundUntilAccepted, "Age gate marks background content inert and aria-hidden while active"),
    addCheck(rows, "ageGate.scrollLockWhileActive", ageGateLocksScroll, "Age gate locks document and body scroll while active"),
    addCheck(rows, "package.noConsentOrCookieDeps", !hasPackageConsentDependency, "No cookie/consent/analytics helper dependency is installed"),
    addCheck(rows, "source.noConsentModeOrCmp", sourceConsentMatches.length === 0, sourceConsentMatches.length ? sourceConsentMatches.slice(0, 10).join(" | ") : "No consent mode, CMP, cookie banner, or Google consent API usage in public source"),
    addCheck(rows, "built.noConsentModeOrCmp", builtConsentMatches.length === 0, builtConsentMatches.length ? builtConsentMatches.slice(0, 10).join(" | ") : "No consent mode, CMP, or cookie banner usage in built output"),
    addCheck(rows, "source.gatedAnalyticsTrackingOnly", sourceUnapprovedTrackingStorageMatches.length === 0, sourceUnapprovedTrackingStorageMatches.length ? sourceUnapprovedTrackingStorageMatches.slice(0, 10).join(" | ") : "Only approved env-gated GA4/GSC source contains analytics wording; no unapproved tracking storage signals in public source"),
    addCheck(rows, "built.noTrackingStorageKeys", builtTrackingStorageMatches.length === 0, builtTrackingStorageMatches.length ? builtTrackingStorageMatches.slice(0, 10).join(" | ") : "No tracking, analytics, pixel, visitor, session, or UTM storage key signals in built output"),
    addCheck(rows, "source.noSensitiveAgeData", sourceSensitiveAgeMatches.length === 0, sourceSensitiveAgeMatches.length ? sourceSensitiveAgeMatches.slice(0, 10).join(" | ") : "No DOB/birthdate/sensitive age data fields in public source"),
    addCheck(rows, "built.noSensitiveAgeData", builtSensitiveAgeMatches.length === 0, builtSensitiveAgeMatches.length ? builtSensitiveAgeMatches.slice(0, 10).join(" | ") : "No DOB/birthdate/sensitive age data fields in built output"),
    addCheck(rows, "noPublicUnlockSignals", !publicUnlockPattern.test(combinedPublicText), "Browser storage readiness does not approve cookies, consent mode, tracking, analytics, route publication, deployment, sitemap inclusion, indexability, or public SEO"),
  ];

  const verdict = checks.every(Boolean)
    ? "PASS_BROWSER_STORAGE_CONSENT_READINESS_NO_PUBLIC_UNLOCK"
    : "FAIL_BROWSER_STORAGE_CONSENT_READINESS_REVIEW_REQUIRED";

  mkdirSync(path.dirname(docsResultsPath), { recursive: true });
  writeFileSync(
    docsResultsPath,
    [
      "check,status,details,public_unlock",
      ...rows.map((row) => [row.check, row.status, row.details, row.public_unlock].map(csvEscape).join(",")),
    ].join("\n") + "\n",
  );

  const payload = {
    verdict,
    officialSourcePosture: {
      nextCookies:
        "Next.js cookies() is the official App Router API for reading incoming request cookies and reading or writing outgoing cookies in server actions or route handlers.",
      mdnDocumentCookie:
        "MDN documents document.cookie as a JavaScript getter/setter for cookies associated with the current document.",
      mdnWebStorage:
        "MDN documents localStorage and sessionStorage as origin-scoped Web Storage APIs, with localStorage persisting across browser sessions.",
      mdnCookieStore:
        "MDN documents the Cookie Store API as an asynchronous cookie management API available in windows and service workers.",
      googleConsentMode:
        "Google Consent Mode communicates cookie or app identifier consent status to Google tags; it is not a consent banner or widget by itself.",
    },
    sourceTextFileCount: sourceFiles.length,
    builtTextFileCount: builtFiles.length,
    approvedStorageSurface: {
      file: approvedAgeGateFile,
      key: approvedAgeGateStorageKey,
      purpose: "first-party adult confirmation overlay persistence only",
      writes: ["true"],
      sensitiveDataCollected: false,
      trackingOrAnalytics: false,
    },
    approvedCookieSurface: {
      file: approvedAgeGateCookieFile,
      key: approvedAgeGateCookieName,
      purpose: "first-party adult confirmation overlay persistence only",
      writes: ["true"],
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      sensitiveDataCollected: false,
      trackingOrAnalytics: false,
    },
    sourceCookieMatches,
    builtCookieMatches,
    sourceUnapprovedStorageMatches,
    sourceBlockedStorageMatches,
    builtUnapprovedStorageMatches,
    sourceConsentMatches,
    builtConsentMatches,
    sourceTrackingStorageMatches,
    sourceUnapprovedTrackingStorageMatches,
    builtTrackingStorageMatches,
    sourceSensitiveAgeMatches,
    builtSensitiveAgeMatches,
    checks: Object.fromEntries(rows.map((row) => [row.check, row.status === "pass"])),
    browserCookiesApproved: false,
    adultConfirmationCookieAllowed: true,
    consentModeApproved: false,
    cookieBannerApproved: false,
    trackingStorageApproved: false,
    analyticsApproved: false,
    serviceWorkerApproved: false,
    indexedDbApproved: false,
    publicSeoUnlocked: false,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    deploymentApproved: false,
    guardrail:
      "Step 10K is browser storage, cookie, and consent readiness only. It permits the existing first-party adult-confirmation localStorage key and the scoped server-set adult-confirmation cookie while keeping consent mode, cookie banners, analytics/tracking storage, service workers, IndexedDB, route publication, deployment, sitemap inclusion, indexability, and public SEO blocked until approval records exist.",
  };

  mkdirSync(workRoot, { recursive: true });
  writeFileSync(statusJsonPath, JSON.stringify(payload, null, 2));
  writeFileSync(
    statusMdPath,
    [
      "# Step 10K Browser Storage / Cookie / Consent Readiness Status",
      "",
      `Verdict: \`${verdict}\``,
      "",
      "## Checks",
      "",
      ...rows.map((row) => `- \`${row.check}\`: ${row.status.toUpperCase()} - ${row.details}`),
      "",
      "## Guardrail",
      "",
      payload.guardrail,
      "",
      "Final signal: `STEP_10K_BROWSER_STORAGE_CONSENT_READINESS_COMPLETE_NO_PUBLIC_UNLOCK`",
    ].join("\n") + "\n",
  );

  console.log(JSON.stringify(payload, null, 2));
  process.exitCode = verdict.startsWith("PASS_") ? 0 : 1;
}

main();
