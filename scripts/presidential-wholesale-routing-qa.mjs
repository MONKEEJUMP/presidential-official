import { readFileSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();

function read(relativePath) {
  return readFileSync(path.join(webRoot, relativePath), "utf8");
}

function check(id, passed, details) {
  return { id, status: passed ? "pass" : "fail", details };
}

const contactSource = read(
  "src/components/presidential/contact/contact-sales-experience.tsx",
);
const headerSource = read(
  "src/components/presidential/layout/site-header.tsx",
);

const checks = [
  check(
    "contact.wholesaleRoutesToHub",
    contactSource.includes('href: "/wholesale"') &&
      contactSource.includes('href="/wholesale"'),
    "Path 02 and the hero wholesale CTA route to /wholesale.",
  ),
  check(
    "contact.partnerRoutesToApplication",
    contactSource.includes('href: "/wholesale/apply"') &&
      contactSource.includes('href="/wholesale/apply"'),
    "Path 03 and the lower partner CTA route to /wholesale/apply.",
  ),
  check(
    "contact.noMailtoCtas",
    !contactSource.includes("href={wholesaleMailto}") &&
      !contactSource.includes("href={partnershipMailto}"),
    "Primary wholesale and partner CTAs no longer depend on a local email client.",
  ),
  check(
    "header.wholesaleRoutesToHub",
    /href="\/wholesale"[\s\S]{0,180}>\s*Wholesale\s*</.test(headerSource),
    "The shared Wholesale header item routes to /wholesale.",
  ),
  check(
    "header.loginRemainsPrivateSales",
    /href="\/sales"[\s\S]{0,220}>\s*Login\s*</.test(headerSource),
    "The existing Login item retains the private /sales destination.",
  ),
  check(
    "header.connectGroupStillPresent",
    /id:\s*"connect"[\s\S]{0,120}label:\s*"Connect"/.test(headerSource),
    "The Connect navigation group remains present.",
  ),
];

const failed = checks.filter((entry) => entry.status === "fail");
console.log(JSON.stringify({
  verdict: failed.length ? "FAIL_WHOLESALE_ROUTING" : "PASS_WHOLESALE_ROUTING",
  checks,
}, null, 2));

if (failed.length) process.exit(1);
