import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const nextConfigPath = path.join(webRoot, "next.config.ts");
const packageJsonPath = path.join(webRoot, "package.json");
const builtAppRoot = path.join(webRoot, ".next", "server", "app");
const schemaConstantsPath = path.join(webRoot, "src", "lib", "seo", "schema", "constants.ts");
const organizationSchemaPath = path.join(webRoot, "src", "lib", "seo", "schema", "organization.ts");
const ctaLinkPath = path.join(webRoot, "src", "components", "presidential", "primitives", "cta-link.tsx");
const contactInquiryFormPath = path.join(webRoot, "src", "app", "contact", "contact-inquiry-form.tsx");
const contactInquiryConfigPath = path.join(webRoot, "src", "app", "contact", "contact-inquiry-config.ts");
const docsResultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "267-step10l-outbound-link-readiness-results.csv",
);
const workRoot = path.join(root, "sources", "spud", "work", "step10l-outbound-link-readiness");
const statusJsonPath = path.join(workRoot, "step10l-outbound-link-readiness-status.json");
const statusMdPath = path.join(workRoot, "step10l-outbound-link-readiness-status.md");

const productionOrigin = "https://presidentialmoonrocks.com";
const schemaOrigin = "https://schema.org";
const allowedOrigins = new Set([productionOrigin, schemaOrigin]);

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

const hrefUrlPattern = /\bhref\s*=\s*(?:"([^"]+)"|'([^']+)'|{\s*["'`]([^"'`]+)["'`]\s*})/gi;
const targetBlankAnchorPattern = /<a\b[^>]*\btarget=(?:"_blank"|'_blank'|{["']_blank["']})[^>]*>/gi;
const relNoopenerPattern = /\brel=(?:"[^"]*\bnoopener\b[^"]*"|'[^']*\bnoopener\b[^']*'|{["'][^"']*\bnoopener\b[^"']*["']})/i;
const mailOrTelPattern = /\bhref\s*=\s*(?:"(?:mailto|tel):|'(?:mailto|tel):|{\s*["'`](?:mailto|tel):)/i;
const socialProfilePattern =
  /\b(?:facebook\.com|instagram\.com|tiktok\.com|youtube\.com|youtu\.be|x\.com|twitter\.com|linkedin\.com|weedmaps\.com|leafly\.com|dutchie\.com|iheartjane\.com|jane\.app)\b/i;
const blockedHostPattern =
  /\b(?:static\.)?wixstatic\.com\b|\bwixsite\.com\b|\bwix\.com\b|\bdrive\.google\.com\b|\bdocs\.google\.com\b|\bgoogleusercontent\.com\b|\bvercel\.app\b|\bvercel\.com\b|\bwww\.presidentialmoonrocks\.com\b|\bpresidentialca\.com\b|\bpresidential\.vip\b|\bpresidential\.rocks\b|\bpresidential\.online\b|\bpresidential\.us\b|\blocalhost\b|\b127\.0\.0\.1\b/i;
const publicSocialEnvPattern =
  /\bNEXT_PUBLIC_[A-Z0-9_]*(?:FACEBOOK|INSTAGRAM|TIKTOK|YOUTUBE|TWITTER|LINKEDIN|WEEDMAPS|LEAFLY|DUTCHIE|JANE|SOCIAL|PROFILE)[A-Z0-9_]*\b/i;
const publicUnlockPattern =
  /outbound links approved|external links approved|social profiles approved|sameas approved|sameAs approved|profile links approved|public seo unlocked|route publication approved|sitemap inclusion approved|index,\s*follow approved|deployment approved/i;

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

function collectLineMatches(files, pattern) {
  const matches = [];
  for (const file of files) {
    const text = readIfExists(file);
    const lines = text.split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        matches.push(`${rel(file)}:${index + 1}:${line.trim()}`);
      }
    }
  }
  return matches;
}

function collectHrefValues(files) {
  const values = [];
  for (const file of files) {
    const text = readIfExists(file);
    const lines = text.split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      hrefUrlPattern.lastIndex = 0;
      let match;
      while ((match = hrefUrlPattern.exec(line)) !== null) {
        const value = match[1] ?? match[2] ?? match[3] ?? "";
        values.push({
          file: rel(file),
          line: index + 1,
          value,
          text: line.trim(),
        });
      }
    }
  }
  return values;
}

function externalHrefViolations(hrefs) {
  const violations = [];
  for (const href of hrefs) {
    if (!/^https?:\/\//i.test(href.value)) {
      continue;
    }

    try {
      const parsed = new URL(href.value);
      if (allowedOrigins.has(parsed.origin)) {
        continue;
      }
      violations.push(`${href.file}:${href.line}:${href.value}`);
    } catch {
      violations.push(`${href.file}:${href.line}:malformed absolute href ${href.value}`);
    }
  }
  return violations;
}

function targetBlankViolations(files) {
  const violations = [];
  for (const file of files) {
    const text = readIfExists(file);
    targetBlankAnchorPattern.lastIndex = 0;
    let match;
    while ((match = targetBlankAnchorPattern.exec(text)) !== null) {
      const tag = match[0];
      if (!relNoopenerPattern.test(tag)) {
        violations.push(`${rel(file)}:${tag}`);
      }
    }
  }
  return violations;
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
  const schemaConstantsText = readIfExists(schemaConstantsPath);
  const organizationSchemaText = readIfExists(organizationSchemaPath);
  const ctaLinkText = readIfExists(ctaLinkPath);
  const contactInquiryFormText = readIfExists(contactInquiryFormPath);
  const contactInquiryConfigText = readIfExists(contactInquiryConfigPath);
  const packageJsonText = readIfExists(packageJsonPath);
  const nextConfigText = readIfExists(nextConfigPath);
  const sourceText = sourceFiles.map(readIfExists).join("\n");
  const builtText = builtFiles.map(readIfExists).join("\n");
  const combinedPublicText = [sourceText, builtText, packageJsonText, nextConfigText].join("\n");

  const sourceHrefs = collectHrefValues(sourceFiles);
  const builtHrefs = collectHrefValues(builtFiles);
  const sourceExternalHrefViolations = externalHrefViolations(sourceHrefs);
  const builtExternalHrefViolations = externalHrefViolations(builtHrefs);
  const sourceTargetBlankViolations = targetBlankViolations(sourceFiles);
  const builtTargetBlankViolations = targetBlankViolations(builtFiles);
  const sourceMailOrTelMatches = collectLineMatches(sourceFiles, mailOrTelPattern);
  const builtMailOrTelMatches = collectLineMatches(builtFiles, mailOrTelPattern);
  const sourceSocialMatches = collectLineMatches(sourceFiles, socialProfilePattern);
  const builtSocialMatches = collectLineMatches(builtFiles, socialProfilePattern);
  const sourceBlockedHostMatches = collectLineMatches(sourceFiles, blockedHostPattern);
  const builtBlockedHostMatches = collectLineMatches(builtFiles, blockedHostPattern);
  const sourcePublicSocialEnvMatches = collectLineMatches(sourceFiles, publicSocialEnvPattern);
  const hasApprovedSameAsEmpty = /APPROVED_SAME_AS\s*=\s*\[\]\s*as const/.test(schemaConstantsText);
  const organizationUsesWhitelist = organizationSchemaText.includes("sameAs: [...APPROVED_SAME_AS]");
  const ctaLinkInternalOnly = ctaLinkText.includes("readonly href: SeoRoutePath;");
  const ctaLinkRegistryGuard = ctaLinkText.includes("getRouteByPath(href)") && ctaLinkText.includes("throw new Error");
  const sourceHasOnlyApprovedGatedMailto =
    sourceMailOrTelMatches.length === 1 &&
    sourceMailOrTelMatches[0].startsWith("web/src/app/contact/contact-inquiry-form.tsx:") &&
    contactInquiryFormText.includes("mailto:${encodeURIComponent(inbox)}") &&
    contactInquiryConfigText.includes('import "server-only"') &&
    contactInquiryConfigText.includes("PRESIDENTIAL_CONTACT_MAILTO_ENABLED") &&
    contactInquiryConfigText.includes("PRESIDENTIAL_CONTACT_INBOX_EMAIL");

  const checks = [
    addCheck(rows, "builtOutput.exists", builtFiles.length > 0, `${builtFiles.length} built text file(s) scanned`),
    addCheck(rows, "source.externalHrefApprovedOriginsOnly", sourceExternalHrefViolations.length === 0, sourceExternalHrefViolations.length ? sourceExternalHrefViolations.slice(0, 10).join(" | ") : "No unapproved external href values in public source"),
    addCheck(rows, "built.externalHrefApprovedOriginsOnly", builtExternalHrefViolations.length === 0, builtExternalHrefViolations.length ? builtExternalHrefViolations.slice(0, 10).join(" | ") : "No unapproved external href values in built output"),
    addCheck(rows, "source.targetBlankNoopener", sourceTargetBlankViolations.length === 0, sourceTargetBlankViolations.length ? sourceTargetBlankViolations.slice(0, 10).join(" | ") : "No target=_blank anchors without noopener in public source"),
    addCheck(rows, "built.targetBlankNoopener", builtTargetBlankViolations.length === 0, builtTargetBlankViolations.length ? builtTargetBlankViolations.slice(0, 10).join(" | ") : "No target=_blank anchors without noopener in built output"),
    addCheck(rows, "source.onlyApprovedGatedMailto", sourceHasOnlyApprovedGatedMailto, sourceHasOnlyApprovedGatedMailto ? "Only the server-validated, explicit-env-gated Contact mailto template exists in source" : sourceMailOrTelMatches.slice(0, 10).join(" | ") || "Expected gated Contact mailto template is missing"),
    addCheck(rows, "built.noMailtoOrTel", builtMailOrTelMatches.length === 0, builtMailOrTelMatches.length ? builtMailOrTelMatches.slice(0, 10).join(" | ") : "No mailto: or tel: links in built output"),
    addCheck(rows, "source.noSocialProfileUrls", sourceSocialMatches.length === 0, sourceSocialMatches.length ? sourceSocialMatches.slice(0, 10).join(" | ") : "No social/marketplace profile URLs in public source before client confirmation"),
    addCheck(rows, "built.noSocialProfileUrls", builtSocialMatches.length === 0, builtSocialMatches.length ? builtSocialMatches.slice(0, 10).join(" | ") : "No social/marketplace profile URLs in built output before client confirmation"),
    addCheck(rows, "source.noBlockedOrAlternateHosts", sourceBlockedHostMatches.length === 0, sourceBlockedHostMatches.length ? sourceBlockedHostMatches.slice(0, 10).join(" | ") : "No threat, preview, noncanonical, alternate, localhost, Vercel, Wix, or Google Drive hosts in public source"),
    addCheck(rows, "built.noBlockedOrAlternateHosts", builtBlockedHostMatches.length === 0, builtBlockedHostMatches.length ? builtBlockedHostMatches.slice(0, 10).join(" | ") : "No threat, preview, noncanonical, alternate, localhost, Vercel, Wix, or Google Drive hosts in built output"),
    addCheck(rows, "source.noPublicSocialProfileEnvNames", sourcePublicSocialEnvMatches.length === 0, sourcePublicSocialEnvMatches.length ? sourcePublicSocialEnvMatches.slice(0, 10).join(" | ") : "No public social/profile environment variable names in public source"),
    addCheck(rows, "schema.sameAsWhitelistEmpty", hasApprovedSameAsEmpty, "APPROVED_SAME_AS remains an empty whitelist until client-confirmed profiles exist"),
    addCheck(rows, "schema.organizationUsesSameAsWhitelistOnly", organizationUsesWhitelist, "Organization schema emits sameAs only from APPROVED_SAME_AS"),
    addCheck(rows, "cta.internalRouteTypeOnly", ctaLinkInternalOnly, "CtaLink href remains typed as SeoRoutePath"),
    addCheck(rows, "cta.routeRegistryGuard", ctaLinkRegistryGuard, "CtaLink validates every destination through the route registry"),
    addCheck(rows, "noPublicUnlockSignals", !publicUnlockPattern.test(combinedPublicText), "Outbound link readiness does not approve external links, social profiles, sameAs, route publication, deployment, sitemap inclusion, indexability, or public SEO"),
  ];

  const verdict = checks.every(Boolean)
    ? "PASS_OUTBOUND_LINK_READINESS_NO_PUBLIC_UNLOCK"
    : "FAIL_OUTBOUND_LINK_READINESS_REVIEW_REQUIRED";

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
      nextLink:
        "Next.js Link is the primary component for client-side navigation between internal routes.",
      googleOutboundLinks:
        "Google Search Central says ordinary outbound links do not need rel qualification, while sponsored, paid, ad, comment, forum, or untrusted links should be qualified with appropriate rel values.",
      mdnAnchor:
        "MDN defines the anchor element as a hyperlink created with href, and link text should indicate destination.",
      mdnNoopener:
        "MDN documents rel=noopener as preventing a new browsing context from receiving opener access.",
      mdnNoreferrer:
        "MDN documents rel=noreferrer as omitting the Referer header and behaving as if noopener were also specified.",
    },
    sourceTextFileCount: sourceFiles.length,
    builtTextFileCount: builtFiles.length,
    allowedOrigins: [...allowedOrigins],
    sourceHrefCount: sourceHrefs.length,
    builtHrefCount: builtHrefs.length,
    sourceExternalHrefViolations,
    builtExternalHrefViolations,
    sourceTargetBlankViolations,
    builtTargetBlankViolations,
    sourceMailOrTelMatches,
    builtMailOrTelMatches,
    sourceSocialMatches,
    builtSocialMatches,
    sourceBlockedHostMatches,
    builtBlockedHostMatches,
    sourcePublicSocialEnvMatches,
    checks: Object.fromEntries(rows.map((row) => [row.check, row.status === "pass"])),
    outboundLinksApproved: false,
    socialProfilesApproved: false,
    sameAsApproved: false,
    alternateDomainsApprovedForPublicSeo: false,
    threatDomainsLeaked: false,
    mailtoOrTelApproved: false,
    publicSeoUnlocked: false,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    deploymentApproved: false,
    guardrail:
      "Step 10L is outbound link, external URL, and social profile readiness only. It permits canonical production and schema.org URL constants plus the exact server-validated, explicit-env-gated Contact mailto template, which remains absent from the default build. Other outbound anchors, social profile URLs, sameAs approvals, mailto/tel links, noncanonical alternate hosts, route publication, deployment, sitemap inclusion, indexability, and public SEO remain blocked until approval records exist.",
  };

  mkdirSync(workRoot, { recursive: true });
  writeFileSync(statusJsonPath, JSON.stringify(payload, null, 2));
  writeFileSync(
    statusMdPath,
    [
      "# Step 10L Outbound Link / Social Profile Readiness Status",
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
      "Final signal: `STEP_10L_OUTBOUND_LINK_READINESS_COMPLETE_NO_PUBLIC_UNLOCK`",
    ].join("\n") + "\n",
  );

  console.log(JSON.stringify(payload, null, 2));
  process.exitCode = verdict.startsWith("PASS_") ? 0 : 1;
}

main();
