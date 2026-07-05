import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const packageJsonPath = path.join(webRoot, "package.json");
const nextConfigPath = path.join(webRoot, "next.config.ts");
const builtAppRoot = path.join(webRoot, ".next", "server", "app");
const docsResultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "271-step10m-contact-form-submission-readiness-results.csv",
);
const workRoot = path.join(root, "sources", "spud", "work", "step10m-contact-form-submission-readiness");
const statusJsonPath = path.join(workRoot, "step10m-contact-form-submission-readiness-status.json");
const statusMdPath = path.join(workRoot, "step10m-contact-form-submission-readiness-status.md");

const sourceRoots = [
  path.join(webRoot, "src", "app"),
  path.join(webRoot, "src", "components"),
  path.join(webRoot, "src", "lib", "design-system"),
  path.join(webRoot, "src", "lib", "seo"),
  nextConfigPath,
  packageJsonPath,
];

const appRoot = path.join(webRoot, "src", "app");

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

const htmlFormPattern = /<form\b|from\s+["']next\/form["']|<Form\b/;
const formFieldPattern = /<(?:input|textarea|select)\b/i;
const formSubmissionPattern =
  /\b(?:formAction|onSubmit|useActionState|useFormStatus|useFormState|FormData|XMLHttpRequest|sendBeacon|navigator\.sendBeacon)\b|fetch\s*\(|\baxios(?:\.(?:get|post|put|patch|delete|request))?\s*\(|\bmethod\s*=\s*(["'`{])\s*post\b|\baction\s*=\s*(["'`{])\s*(?:https?:\/\/|\/api\/|\/contact|\/submit|\/forms?)/i;
const serverActionPattern = /["']use server["']|^\s*use server\s*;?\s*$/i;
const routeHandlerNamePattern = /route\.(?:ts|tsx|js|jsx)$/i;
const apiRoutePattern = /[\\/](?:pages[\\/]api|src[\\/]pages[\\/]api|src[\\/]app[\\/]api)[\\/]/i;
const mailTelPattern = /\b(?:mailto:|tel:)/i;
const piiFieldPattern =
  /\b(?:name|id)\s*=\s*(["'`{])\s*(?:email|e-mail|phone|telephone|mobile|firstName|first_name|lastName|last_name|fullName|full_name|name|address|street|city|state|zip|postal|message|subject|dob|dateOfBirth|date_of_birth|birthdate|birthday)\b|type\s*=\s*(["'`{])\s*(?:email|tel|file|date|datetime-local)\b/i;
const sensitiveAgePattern =
  /\b(?:dateOfBirth|date_of_birth|birthdate|birth_date|dob|birthday|birth year|birth_year|birth month|birth_month|birth day|birth_day|age_year|ageMonth|ageDay)\b/i;
const crmProviderPattern =
  /\b(?:hubspot|mailchimp|klaviyo|salesforce|constantcontact|constant contact|typeform|jotform|formspree|netlify\s*forms?|zendesk|intercom|drift|helpscout|recaptcha|grecaptcha|hcaptcha|turnstile|captcha)\b/i;
const directCommercePattern =
  /\b(?:buy now|order now|place an order|checkout|add to cart|cart checkout|shipping available|ships? to|delivery available|delivered to your door|price list|pricing available|inventory available|in stock|direct order|online order|e-?commerce)\b/i;
const publicUnlockPattern =
  /contact form approved|form submission approved|crm approved|newsletter approved|lead capture approved|contact data collection approved|public seo unlocked|route publication approved|sitemap inclusion approved|index,\s*follow approved|deployment approved/i;

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
      if (["node_modules", ".next", ".git", ".lighthouseci", "cache"].includes(entry.name)) {
        continue;
      }
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function collectMatches(files, pattern, options = {}) {
  const matches = [];
  for (const file of files) {
    const relativePath = rel(file);
    if (options.skipFiles?.has(relativePath)) {
      continue;
    }

    const text = readIfExists(file);
    const lines = text.split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        matches.push(`${relativePath}:${index + 1}:${line.trim()}`);
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

function appRouteHandlerFiles() {
  return walkFiles(appRoot).filter((file) => routeHandlerNamePattern.test(path.basename(file)));
}

function apiRouteFiles() {
  return walkFiles(path.join(webRoot, "src")).filter((file) => apiRoutePattern.test(file));
}

function main() {
  const rows = [];
  const sourceFiles = sourceRoots.flatMap(walkTextFiles);
  const builtFiles = walkTextFiles(builtAppRoot).filter(
    (file) => !rel(file).includes("web/.next/server/app/_global-error"),
  );
  const directCommercePolicyFiles = new Set(["web/src/lib/seo/metadata-helpers.ts"]);
  const packageJsonText = readIfExists(packageJsonPath);
  const sourceText = sourceFiles.map(readIfExists).join("\n");
  const builtText = builtFiles.map(readIfExists).join("\n");
  const combinedPublicText = [sourceText, builtText, packageJsonText].join("\n");

  const routeHandlers = appRouteHandlerFiles().map(rel);
  const apiRoutes = apiRouteFiles().map(rel);
  const sourceFormMatches = collectMatches(sourceFiles, htmlFormPattern);
  const builtFormMatches = collectMatches(builtFiles, htmlFormPattern);
  const sourceFieldMatches = collectMatches(sourceFiles, formFieldPattern);
  const builtFieldMatches = collectMatches(builtFiles, formFieldPattern);
  const sourceSubmissionMatches = collectMatches(sourceFiles, formSubmissionPattern);
  const builtSubmissionMatches = collectMatches(builtFiles, formSubmissionPattern);
  const sourceServerActionMatches = collectMatches(sourceFiles, serverActionPattern);
  const sourceMailTelMatches = collectMatches(sourceFiles, mailTelPattern);
  const builtMailTelMatches = collectMatches(builtFiles, mailTelPattern);
  const sourcePiiFieldMatches = collectMatches(sourceFiles, piiFieldPattern);
  const builtPiiFieldMatches = collectMatches(builtFiles, piiFieldPattern);
  const sourceSensitiveAgeMatches = collectMatches(sourceFiles, sensitiveAgePattern);
  const builtSensitiveAgeMatches = collectMatches(builtFiles, sensitiveAgePattern);
  const sourceCrmMatches = collectMatches(sourceFiles, crmProviderPattern);
  const builtCrmMatches = collectMatches(builtFiles, crmProviderPattern);
  const packageCrmMatches = crmProviderPattern.test(packageJsonText) ? ["package.json contains CRM/form/captcha provider signal"] : [];
  const sourceCommerceMatches = collectMatches(sourceFiles, directCommercePattern, {
    skipFiles: directCommercePolicyFiles,
  });
  const builtCommerceMatches = collectMatches(builtFiles, directCommercePattern);

  const checks = [
    addCheck(rows, "builtOutput.exists", builtFiles.length > 0, `${builtFiles.length} built text file(s) scanned`),
    addCheck(rows, "app.noRouteHandlers", routeHandlers.length === 0, routeHandlers.length ? routeHandlers.join(" | ") : "No App Router route handlers exist"),
    addCheck(rows, "app.noApiRoutes", apiRoutes.length === 0, apiRoutes.length ? apiRoutes.join(" | ") : "No API route files exist"),
    addCheck(rows, "source.noHtmlOrNextForms", sourceFormMatches.length === 0, sourceFormMatches.length ? sourceFormMatches.slice(0, 10).join(" | ") : "No HTML form or Next Form component in public source"),
    addCheck(rows, "built.noHtmlForms", builtFormMatches.length === 0, builtFormMatches.length ? builtFormMatches.slice(0, 10).join(" | ") : "No form element serialized in built output"),
    addCheck(rows, "source.noInputTextareaSelectFields", sourceFieldMatches.length === 0, sourceFieldMatches.length ? sourceFieldMatches.slice(0, 10).join(" | ") : "No input, textarea, or select fields in public source"),
    addCheck(rows, "built.noInputTextareaSelectFields", builtFieldMatches.length === 0, builtFieldMatches.length ? builtFieldMatches.slice(0, 10).join(" | ") : "No input, textarea, or select fields in built output"),
    addCheck(rows, "source.noSubmissionLogic", sourceSubmissionMatches.length === 0, sourceSubmissionMatches.length ? sourceSubmissionMatches.slice(0, 10).join(" | ") : "No form action, formAction, onSubmit, fetch, axios, FormData, XMLHttpRequest, or sendBeacon submission logic in public source"),
    addCheck(rows, "built.noSubmissionLogic", builtSubmissionMatches.length === 0, builtSubmissionMatches.length ? builtSubmissionMatches.slice(0, 10).join(" | ") : "No submission logic serialized in built output"),
    addCheck(rows, "source.noServerActions", sourceServerActionMatches.length === 0, sourceServerActionMatches.length ? sourceServerActionMatches.slice(0, 10).join(" | ") : "No Server Action directive in public source"),
    addCheck(rows, "source.noMailtoOrTel", sourceMailTelMatches.length === 0, sourceMailTelMatches.length ? sourceMailTelMatches.slice(0, 10).join(" | ") : "No mailto: or tel: contact links before official contact detail approval"),
    addCheck(rows, "built.noMailtoOrTel", builtMailTelMatches.length === 0, builtMailTelMatches.length ? builtMailTelMatches.slice(0, 10).join(" | ") : "No mailto: or tel: contact links in built output"),
    addCheck(rows, "source.noPiiFields", sourcePiiFieldMatches.length === 0, sourcePiiFieldMatches.length ? sourcePiiFieldMatches.slice(0, 10).join(" | ") : "No email, phone, name, address, message, file, date, or DOB field declarations in public source"),
    addCheck(rows, "built.noPiiFields", builtPiiFieldMatches.length === 0, builtPiiFieldMatches.length ? builtPiiFieldMatches.slice(0, 10).join(" | ") : "No PII field declarations in built output"),
    addCheck(rows, "source.noSensitiveAgeFields", sourceSensitiveAgeMatches.length === 0, sourceSensitiveAgeMatches.length ? sourceSensitiveAgeMatches.slice(0, 10).join(" | ") : "No DOB, birthdate, birthday, or sensitive age data fields in public source"),
    addCheck(rows, "built.noSensitiveAgeFields", builtSensitiveAgeMatches.length === 0, builtSensitiveAgeMatches.length ? builtSensitiveAgeMatches.slice(0, 10).join(" | ") : "No sensitive age data fields in built output"),
    addCheck(rows, "source.noCrmFormOrCaptchaProviders", sourceCrmMatches.length === 0, sourceCrmMatches.length ? sourceCrmMatches.slice(0, 10).join(" | ") : "No CRM, newsletter, form, support-widget, or captcha provider signals in public source"),
    addCheck(rows, "built.noCrmFormOrCaptchaProviders", builtCrmMatches.length === 0, builtCrmMatches.length ? builtCrmMatches.slice(0, 10).join(" | ") : "No CRM, newsletter, form, support-widget, or captcha provider signals in built output"),
    addCheck(rows, "package.noCrmFormOrCaptchaDeps", packageCrmMatches.length === 0, packageCrmMatches.join(" | ") || "No CRM, newsletter, form, support-widget, or captcha provider dependencies installed"),
    addCheck(rows, "source.noDirectCommerceContactClaims", sourceCommerceMatches.length === 0, sourceCommerceMatches.length ? sourceCommerceMatches.slice(0, 10).join(" | ") : "No buy/order/checkout/shipping/delivery/pricing/inventory claims in contact/submission source surfaces"),
    addCheck(rows, "built.noDirectCommerceContactClaims", builtCommerceMatches.length === 0, builtCommerceMatches.length ? builtCommerceMatches.slice(0, 10).join(" | ") : "No buy/order/checkout/shipping/delivery/pricing/inventory claims in built output"),
    addCheck(rows, "noPublicUnlockSignals", !publicUnlockPattern.test(combinedPublicText), "Contact/form readiness does not approve contact forms, CRM, lead capture, route publication, deployment, sitemap inclusion, indexability, or public SEO"),
  ];

  const verdict = checks.every(Boolean)
    ? "PASS_CONTACT_FORM_SUBMISSION_READINESS_NO_PUBLIC_UNLOCK"
    : "FAIL_CONTACT_FORM_SUBMISSION_READINESS_REVIEW_REQUIRED";

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
      nextForms:
        "Next.js documents forms and Server Actions as submission/mutation mechanisms that execute server-side and must be treated as deliberate data handling surfaces.",
      mdnForm:
        "MDN defines the HTML form element as a section containing interactive controls for submitting information.",
      mdnFetch:
        "MDN documents fetch as a JavaScript interface for making HTTP requests, including programmatic submission flows.",
      mdnFormData:
        "MDN documents FormData as a way to construct key/value pairs representing form fields for transmission.",
    },
    sourceTextFileCount: sourceFiles.length,
    builtTextFileCount: builtFiles.length,
    routeHandlers,
    apiRoutes,
    sourceFormMatches,
    builtFormMatches,
    sourceFieldMatches,
    builtFieldMatches,
    sourceSubmissionMatches,
    builtSubmissionMatches,
    sourceServerActionMatches,
    sourceMailTelMatches,
    builtMailTelMatches,
    sourcePiiFieldMatches,
    builtPiiFieldMatches,
    sourceSensitiveAgeMatches,
    builtSensitiveAgeMatches,
    sourceCrmMatches,
    builtCrmMatches,
    packageCrmMatches,
    sourceCommerceMatches,
    builtCommerceMatches,
    checks: Object.fromEntries(rows.map((row) => [row.check, row.status === "pass"])),
    contactFormApproved: false,
    formSubmissionApproved: false,
    crmApproved: false,
    leadCaptureApproved: false,
    contactDataCollectionApproved: false,
    officialContactDetailsApproved: false,
    publicSeoUnlocked: false,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    metadataUnlocked: false,
    schemaUnlocked: false,
    deploymentApproved: false,
    providerConnected: false,
    guardrail:
      "Step 10M is contact/form/submission readiness only. It keeps contact forms, Server Actions, route handlers, API submission endpoints, CRM/newsletter/support widgets, PII fields, mailto/tel links, official contact details, route publication, deployment, sitemap inclusion, indexability, and public SEO blocked until approval records exist.",
  };

  mkdirSync(workRoot, { recursive: true });
  writeFileSync(statusJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(
    statusMdPath,
    [
      "# Step 10M Contact / Form / Submission Readiness Status",
      "",
      `Verdict: ${verdict}`,
      "",
      `Source text files scanned: ${sourceFiles.length}`,
      `Built text files scanned: ${builtFiles.length}`,
      `Route handlers found: ${routeHandlers.length}`,
      `API route files found: ${apiRoutes.length}`,
      `Source form matches: ${sourceFormMatches.length}`,
      `Built form matches: ${builtFormMatches.length}`,
      `Source field matches: ${sourceFieldMatches.length}`,
      `Built field matches: ${builtFieldMatches.length}`,
      `Source submission matches: ${sourceSubmissionMatches.length}`,
      `Built submission matches: ${builtSubmissionMatches.length}`,
      `CRM/form provider matches: ${sourceCrmMatches.length + builtCrmMatches.length + packageCrmMatches.length}`,
      "",
      "Public SEO unlocked: false",
      "Contact/form submission approved: false",
      "CRM/lead capture approved: false",
      "",
      payload.guardrail,
      "",
    ].join("\n"),
  );

  console.log(JSON.stringify(payload, null, 2));

  if (verdict !== "PASS_CONTACT_FORM_SUBMISSION_READINESS_NO_PUBLIC_UNLOCK") {
    process.exitCode = 1;
  }
}

main();
