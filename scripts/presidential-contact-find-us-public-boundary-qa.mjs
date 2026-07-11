import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const appRoot = path.join(webRoot, "src", "app");
const findUsAppRoot = path.join(appRoot, "find-us");
const contactPagePath = path.join(appRoot, "contact", "page.tsx");
const findUsPagePath = path.join(findUsAppRoot, "page.tsx");
const contactInquiryFormPath = path.join(appRoot, "contact", "contact-inquiry-form.tsx");
const contactInquiryConfigPath = path.join(appRoot, "contact", "contact-inquiry-config.ts");
const locatorTemplateShellPath = path.join(
  findUsAppRoot,
  "locator-template-shell.tsx",
);
const staticShellPath = path.join(
  webRoot,
  "src",
  "components",
  "presidential",
  "modules",
  "static-route-foundation-shell.tsx",
);
const supportShellPath = path.join(
  webRoot,
  "src",
  "components",
  "presidential",
  "modules",
  "support-route-foundation-shell.tsx",
);
const cmsRendererPath = path.join(
  webRoot,
  "src",
  "components",
  "presidential",
  "modules",
  "cms-homepage-module-renderer.tsx",
);
const routesPath = path.join(webRoot, "src", "lib", "seo", "routes.ts");
const packageJsonPath = path.join(webRoot, "package.json");

function read(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function walk(targetPath) {
  if (!existsSync(targetPath)) {
    return [];
  }

  const stats = statSync(targetPath);
  if (stats.isFile()) {
    return [targetPath];
  }

  return readdirSync(targetPath, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(targetPath, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function routeRecordBlock(source, id) {
  const marker = `id: "${id}"`;
  const start = source.indexOf(marker);
  if (start === -1) {
    return "";
  }

  const nextRecord = source.indexOf("\n  {\n    id:", start + marker.length);
  return source.slice(start, nextRecord === -1 ? source.length : nextRecord);
}

function addCheck(checks, check, passed, details) {
  checks.push({
    check,
    status: passed ? "pass" : "fail",
    details,
    public_unlock: "no",
  });
}

const packageJson = JSON.parse(read(packageJsonPath));
const contactPage = read(contactPagePath);
const contactInquiryForm = read(contactInquiryFormPath);
const contactInquiryConfig = read(contactInquiryConfigPath);
const findUsPage = read(findUsPagePath);
const locatorTemplateShell = read(locatorTemplateShellPath);
const staticShell = read(staticShellPath);
const supportShell = read(supportShellPath);
const cmsRenderer = read(cmsRendererPath);
const routes = read(routesPath);
const findUsRecord = routeRecordBlock(routes, "find-us");
const contactRecord = routeRecordBlock(routes, "contact");
const stateLocatorRecord = routeRecordBlock(routes, "find-us-state");
const cityLocatorRecord = routeRecordBlock(routes, "find-us-city");
const retailerLocatorRecord = routeRecordBlock(routes, "find-us-retailer-detail");
const findUsFiles = walk(findUsAppRoot).map((file) => path.relative(findUsAppRoot, file).replace(/\\/g, "/"));
const findUsDynamicFiles = findUsFiles.filter((file) => file.includes("[") || file.includes("]"));
const expectedDynamicLocatorFiles = [
  "[state]/page.tsx",
  "[state]/[city]/page.tsx",
  "[state]/[city]/[retailer]/page.tsx",
];
const dynamicLocatorFilesMatch =
  findUsDynamicFiles.length === expectedDynamicLocatorFiles.length &&
  expectedDynamicLocatorFiles.every((file) => findUsDynamicFiles.includes(file));
const dynamicLocatorSource = expectedDynamicLocatorFiles
  .map((file) => read(path.join(findUsAppRoot, ...file.split("/"))))
  .join("\n");
// 9083-CODE P4 (owner 8-state ruling, 2026-07-11): /find-us/[state] serves
// the eight config-driven themed brand pages — params come only from
// PRESIDENTIAL_STATES and unknown states still 404. No retailer data reads
// exist anywhere in the lane. City and retailer templates stay empty + 404.
const dynamicLocatorStrictlyDisabled = expectedDynamicLocatorFiles.every((file) => {
  const source = read(path.join(findUsAppRoot, ...file.split("/")));
  const paramsRule =
    file === "[state]/page.tsx"
      ? source.includes("PRESIDENTIAL_STATES.map")
      : /generateStaticParams\s*\(\)\s*{\s*return\s*\[\s*\]/.test(source);
  return (
    source.includes("export const dynamicParams = false") &&
    paramsRule &&
    source.includes("notFound()")
  );
});
const contactAndFindUsSource = [
  contactPage,
  contactInquiryForm,
  contactInquiryConfig,
  findUsPage,
  locatorTemplateShell,
  dynamicLocatorSource,
  staticShell,
  supportShell,
  cmsRenderer,
].join("\n");

const checks = [];

addCheck(
  checks,
  "contact.page.shellOnly",
  contactPage.includes('const ROUTE_PATH = "/contact" as const') &&
    contactPage.includes("<PresidentialRouteShell route={route} />"),
  "Contact page delegates to the gated PresidentialRouteShell.",
);
addCheck(
  checks,
  "findUs.page.shellOnly",
  findUsPage.includes('const ROUTE_PATH = "/find-us" as const') &&
    findUsPage.includes("<PresidentialRouteShell route={route} />"),
  "Find Us page delegates to the gated PresidentialRouteShell.",
);
addCheck(
  checks,
  "findUs.dynamicLocatorShells.failClosed",
  dynamicLocatorFilesMatch &&
    locatorTemplateShell.includes("Verified retailer records are required") &&
    locatorTemplateShell.includes("No customer rows") &&
    dynamicLocatorStrictlyDisabled &&
    !/\bLocalBusiness\b|readPublishedSanity|readDraft|fetch\s*\(|createOrReplace|\.mutate\s*\(|\.patch\s*\(|\.delete\s*\(|\.commit\s*\(|APPROVED_ROUTE_PUBLICATIONS|index_follow|sitemap:\s*["']include["']/i.test(
      [locatorTemplateShell, dynamicLocatorSource].join("\n"),
    ),
  dynamicLocatorFilesMatch
    ? "Dynamic locator routes have no params, generate no pages, and always return notFound()."
    : `Unexpected dynamic Find Us app files: ${findUsDynamicFiles.join(", ") || "none"}`,
);
addCheck(
  checks,
  "findUs.staticShell.defersUnverifiedRetailers",
  staticShell.includes("does not expose unverified retailer rows or generate local listing pages") &&
    staticShell.includes("Verified retailer source required") &&
    staticShell.includes("State and city pages stay gated") &&
    staticShell.includes("Retailer detail pages stay gated") &&
    staticShell.includes("Local listing markup stays off"),
  "Find Us public shell states the locator deferral and keeps local listing surfaces off.",
);
addCheck(
  checks,
  "contact.staticShell.noPublicCapture",
  staticShell.includes("<SupportRouteFoundationShell") &&
    staticShell.includes('route.kind === "contact" || route.kind === "store_locator"') &&
    supportShell.includes('route.kind === "contact" && contactInquiryConfigured') &&
    !supportShell.includes("Approved inbox") &&
    !supportShell.includes("provisioned") &&
    !supportShell.includes("provisioning"),
  "Contact public shell hides the inquiry path until configured and exposes no internal provisioning copy.",
);
addCheck(
  checks,
  "contact.mailtoPath.approvedEnvGated",
  !contactInquiryForm.includes("<form") &&
    !contactInquiryForm.includes("useActionState") &&
    contactInquiryForm.includes("presidential-contact-mailto") &&
    contactInquiryForm.includes("encodeURIComponent(inbox)") &&
    contactInquiryConfig.includes("PRESIDENTIAL_CONTACT_MAILTO_ENABLED") &&
    contactInquiryConfig.includes("PRESIDENTIAL_CONTACT_INBOX_EMAIL") &&
    !/\b(?:fetch\s*\(|XMLHttpRequest|sendBeacon|navigator\.sendBeacon|localStorage|sessionStorage|indexedDB|cookies\s*\(|createOrReplace|\.mutate\s*\(|\.patch\s*\(|\.delete\s*\(|\.commit\s*\(|hubspot|mailchimp|klaviyo|salesforce|typeform|jotform|formspree|recaptcha|hcaptcha|turnstile)\b/i.test(
      [contactInquiryForm, contactInquiryConfig].join("\n"),
    ),
  "Contact path is a validated, approved-env-gated mailto link with no submission provider.",
);
addCheck(
  checks,
  "contact.renderer.publicDetailsApprovalGated",
  cmsRenderer.includes("function canShowPublicContactProfile") &&
    cmsRenderer.includes('value === "approved_public"') &&
    cmsRenderer.includes("profile.emailConflictStatus") &&
    cmsRenderer.includes("isApprovedPublicStatus(profile.emailConflictStatus)") &&
    cmsRenderer.includes("Official contact details are held for client confirmation before public display") &&
    cmsRenderer.includes("showContactDetails && contactProfile.phone") &&
    cmsRenderer.includes("showContactDetails && displayEmail"),
  "CMS contact profile details are hidden unless public-use approval and email-conflict approval are present.",
);
addCheck(
  checks,
  "findUs.routeRegistry.blockedUntilVerified",
  findUsRecord.includes('status: "planned"') &&
    findUsRecord.includes('indexability: "conditional_index"') &&
    findUsRecord.includes('sitemap: "conditional"') &&
    findUsRecord.includes('"verified_store_data"') &&
    findUsRecord.includes('"content_approval"') &&
    findUsRecord.includes('"compliance_review"'),
  "Find Us route keeps verified-store, content, and compliance blocks.",
);
addCheck(
  checks,
  "contact.routeRegistry.blockedUntilOfficialDetails",
  contactRecord.includes('status: "planned"') &&
    contactRecord.includes('indexability: "conditional_index"') &&
    contactRecord.includes('sitemap: "conditional"') &&
    contactRecord.includes('"official_contact_details"') &&
    contactRecord.includes('"content_approval"'),
  "Contact route keeps official-contact-detail and content blocks.",
);
addCheck(
  checks,
  "locator.routeTemplates.conditionalOnly",
  [stateLocatorRecord, cityLocatorRecord, retailerLocatorRecord].every((record) =>
    record.includes('status: "conditional"') &&
    record.includes('sitemap: "conditional"') &&
    record.includes('"verified_store_data"') &&
    record.includes('"compliance_review"'),
  ) && retailerLocatorRecord.includes('"schema_approval"'),
  "State, city, and retailer route templates remain conditional and blocked.",
);
addCheck(
  checks,
  "publicSource.noUnapprovedFormOrSubmissionSurface",
  !/tel:|onSubmit|fetch\s*\(|hubspot|mailchimp|klaviyo|salesforce|typeform|jotform|formspree|recaptcha|hcaptcha|turnstile/i.test(contactAndFindUsSource) &&
    (contactAndFindUsSource.match(/mailto:/g) ?? []).length === 1,
  "Contact/Find Us source contains one validated mailto and no submission, CRM, newsletter, or captcha provider.",
);
addCheck(
  checks,
  "verifyChain.includesBoundary",
  packageJson.scripts?.["verify:app"]?.includes("security:contact-find-us:verify") === true,
  "Self-contained app verification includes this Contact/Find Us boundary check.",
);

const failed = checks.filter((row) => row.status === "fail");
const payload = {
  verdict: failed.length
    ? "FAIL_CONTACT_FIND_US_PUBLIC_BOUNDARY_REVIEW_REQUIRED"
    : "PASS_CONTACT_FIND_US_PUBLIC_BOUNDARY_NO_PUBLIC_UNLOCK",
  checks,
  contactFormApproved: false,
  contactMailtoPathReady: true,
  contactDetailsPublicWithoutApproval: false,
  retailerLocatorApproved: false,
  dynamicLocatorRoutesBuilt: findUsDynamicFiles.length > 0,
  retailerRowsPublic: false,
  localBusinessSchemaUnlocked: false,
  routePublicationApproved: false,
  sitemapUnlocked: false,
  indexabilityUnlocked: false,
  public_unlock: "no",
};

console.log(JSON.stringify(payload, null, 2));

if (failed.length) {
  process.exitCode = 1;
}
