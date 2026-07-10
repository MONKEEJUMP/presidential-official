import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const contactRoot = path.join(webRoot, "src", "app", "contact");

function read(relativePath) {
  const filePath = path.join(webRoot, relativePath);
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function addCheck(checks, id, passed, details) {
  checks.push({
    id,
    status: passed ? "pass" : "fail",
    details,
    publicUnlock: false,
  });
}

const packageJson = JSON.parse(read("package.json"));
const configSource = read("src/app/contact/contact-inquiry-config.ts");
const componentSource = read("src/app/contact/contact-inquiry-form.tsx");
const contactFiles = existsSync(contactRoot)
  ? readdirSync(contactRoot).sort()
  : [];
const contactSource = contactFiles
  .filter((fileName) => /\.(?:ts|tsx)$/.test(fileName))
  .map((fileName) => readFileSync(path.join(contactRoot, fileName), "utf8"))
  .join("\n");
const checks = [];

addCheck(
  checks,
  "contact.noServerActionSurface",
  !contactFiles.includes("contact-inquiry-actions.ts") &&
    !contactFiles.includes("contact-inquiry-types.ts") &&
    !/"use server"|useActionState|formAction|<form\b|<input\b|<textarea\b/i.test(
      contactSource,
    ),
  "The contact route has no server action, form submission, or visitor-input surface.",
);
addCheck(
  checks,
  "contact.mailtoOnly",
  componentSource.includes("getApprovedContactInbox") &&
    componentSource.includes("if (!inbox)") &&
    componentSource.includes("return null") &&
    componentSource.includes("`mailto:${encodeURIComponent(inbox)}`") &&
    componentSource.includes('id="presidential-contact-mailto"'),
  "A configured route renders only a validated mailto link; a disabled route renders nothing.",
);
addCheck(
  checks,
  "contact.inboxStrictlyGated",
  configSource.includes('import "server-only"') &&
    configSource.includes("PRESIDENTIAL_CONTACT_MAILTO_ENABLED") &&
    configSource.includes("PRESIDENTIAL_CONTACT_INBOX_EMAIL") &&
    configSource.includes("inbox.length > 254") &&
    configSource.includes("/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/") &&
    configSource.includes('!== "true"'),
  "The recipient stays server-only, length-bounded, format-checked, and explicitly enabled.",
);
addCheck(
  checks,
  "contact.noStorageOrProviderCalls",
  !/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|cookies\s*\(|hubspot|mailchimp|klaviyo|formspree|recaptcha|hcaptcha|turnstile/i.test(
    contactSource,
  ),
  "Contact source performs no storage, provider request, CRM, or captcha operation.",
);
addCheck(
  checks,
  "contact.noInternalDisabledCopy",
  !/not provisioned|provisioning|contact status|disabled form/i.test(componentSource),
  "The disabled contact state exposes no internal provisioning copy.",
);
addCheck(
  checks,
  "package.readOnlyRegressionWired",
  packageJson.scripts?.["security:contact-forms:verify"] ===
    "node scripts/presidential-contact-form-submission-qa.mjs",
  "The read-only mailto regression check remains wired.",
);

const failed = checks.filter((check) => check.status === "fail");
const payload = {
  verdict: failed.length
    ? "FAIL_CONTACT_MAILTO_BOUNDARY_REVIEW_REQUIRED"
    : "PASS_CONTACT_MAILTO_ONLY_NO_SUBMISSION_SURFACE",
  checks,
  contactFormApproved: false,
  contactMailtoConfigured: false,
  contactDataStored: false,
  thirdPartyProviderUsed: false,
  publicSeoUnlocked: false,
  routePublicationApproved: false,
  sitemapUnlocked: false,
  indexabilityUnlocked: false,
};

console.log(JSON.stringify(payload, null, 2));
if (failed.length) process.exit(1);
