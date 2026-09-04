import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const options = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const split = arg.indexOf("=");
  return [arg.slice(2, split), arg.slice(split + 1)];
}));
const base = new URL(options.base ?? "https://presidentialmoonrocks.com");
const canonicalOrigin = "https://presidentialmoonrocks.com";
const guidePaths = [
  "/learn/what-are-moon-rocks", "/learn/what-is-live-resin",
  "/learn/what-is-live-rosin", "/learn/what-are-liquid-diamonds",
  "/learn/infusion-science", "/learn/flavor-science",
  "/learn/different-extracts-need-different-heat",
];
const target = "/moon-rocks/presidential-line";
const baseline = options.baseline ? JSON.parse(await readFile(options.baseline, "utf8")) : null;
const findings = [];

function decode(value) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
function textOnly(html) {
  return decode(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}
function attr(tag, name) {
  return decode(tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"))?.[1] ?? "");
}
function check(condition, message) {
  if (!condition) findings.push(message);
}
async function read(path) {
  const response = await fetch(new URL(path, base), {
    redirect: "manual", signal: AbortSignal.timeout(20000),
  });
  const html = await response.text();
  const tags = [...html.matchAll(/<(?:meta|link)\b[^>]*>/gi)].map((m) => m[0]);
  const jsonLd = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((m) => {
      try { const value = JSON.parse(m[1]); return Array.isArray(value) ? value : value["@graph"] ?? [value]; }
      catch { findings.push(`${path}: invalid JSON-LD`); return []; }
    });
  const visibleText = textOnly(html);
  const result = {
    path, status: response.status,
    title: textOnly(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ""),
    h1: [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => textOnly(m[1])),
    canonical: attr(tags.find((t) => attr(t, "rel") === "canonical") ?? "", "href"),
    description: attr(tags.find((t) => attr(t, "name") === "description") ?? "", "content"),
    robots: attr(tags.find((t) => attr(t, "name") === "robots") ?? "", "content"),
    xRobots: response.headers.get("x-robots-tag"),
    visibleTextSha256: createHash("sha256").update(visibleText).digest("hex"),
    textWithoutNewLinkSha256: createHash("sha256").update(visibleText.replace("Explore the Presidential Line collection.", "").replace(/\s+/g, " ").trim()).digest("hex"),
    jsonLd,
    followedTargetLinks: [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)]
      .filter((m) => {
        const href = new URL(attr(m[1], "href") || "/", base);
        return [base.origin, canonicalOrigin].includes(href.origin) && href.pathname === target && !/\bnofollow\b/i.test(attr(m[1], "rel"));
      })
      .map((m) => textOnly(m[2])),
  };
  return result;
}

const guides = [];
for (const path of guidePaths) {
  const page = await read(path);
  guides.push(page);
  check(page.status === 200, `${path}: expected 200`);
  check(page.h1.length === 1, `${path}: expected one H1`);
  check(page.canonical === canonicalOrigin + path, `${path}: canonical mismatch`);
  check(!/noindex/i.test(page.robots), `${path}: HTML noindex`);
  if (options.preview === "true") check(/noindex/i.test(page.xRobots ?? ""), `${path}: preview noindex missing`);
  else check(!/noindex/i.test(page.xRobots ?? ""), `${path}: unexpected HTTP noindex`);
  const crumbs = page.jsonLd.filter((data) => data["@type"] === "BreadcrumbList");
  check(crumbs.length === 1, `${path}: expected one BreadcrumbList`);
  if (crumbs.length === 1) {
    const items = crumbs[0].itemListElement;
    check(Array.isArray(items) && items.length >= 2, `${path}: breadcrumb trail missing`);
    if (Array.isArray(items)) {
      check(items.every((item, i) => item["@type"] === "ListItem" && item.position === i + 1 && item.name && new URL(item.item).origin === canonicalOrigin), `${path}: invalid breadcrumb items`);
      check(items.at(-1)?.item === page.canonical && items.at(-1)?.name === page.h1[0], `${path}: breadcrumb does not match visible guide`);
    }
  }
  check(page.jsonLd.every((data) => data["@type"] === "BreadcrumbList"), `${path}: unapproved schema type added`);
  if (baseline) {
    const before = baseline.guides.find((entry) => entry.path === path);
    assert(before, `Missing baseline for ${path}`);
    for (const key of ["title", "h1", "canonical", "description", "robots", "visibleTextSha256"]) {
      check(JSON.stringify(page[key]) === JSON.stringify(before[key]), `${path}: visible content/metadata changed (${key})`);
    }
  }
}
const sourcePages = await Promise.all(["/about", "/moon-rocks"].map(read));
if (baseline) {
  for (const page of sourcePages) {
    const before = baseline.sourcePages.find((entry) => entry.path === page.path);
    assert(before, `Missing source-page baseline for ${page.path}`);
    check(page.textWithoutNewLinkSha256 === before.visibleTextSha256, `${page.path}: existing visible copy changed`);
    for (const key of ["title", "h1", "canonical", "description", "robots"]) {
      check(JSON.stringify(page[key]) === JSON.stringify(before[key]), `${page.path}: metadata changed (${key})`);
    }
  }
}
const distinctSources = sourcePages.filter((page) => page.status === 200 && page.followedTargetLinks.length).map((page) => page.path);
check(new Set(distinctSources).size === 2, "Presidential Line needs followed links from both distinct source URLs");
const destination = await read(target);
check(destination.status === 200 && destination.canonical === canonicalOrigin + target, "Presidential Line destination is not canonical HTTP 200");
const missing = await read("/learn/pw7404-nonexistent-guide-check");
check(missing.status === 404 && missing.jsonLd.length === 0, "Unknown guide must remain 404 without schema");
const result = { provenance: "PW7404-1026-learn-schema-link-qa", checkedAt: new Date().toISOString(), base: base.origin, guides, sourcePages, distinctSources, destinationStatus: destination.status, unknownGuideStatus: missing.status, findings };
if (options.out) {
  const output = resolve(options.out);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(result, null, 2) + "\n");
}
console.log(JSON.stringify({ base: base.origin, guides: guides.length, distinctSources, findings }, null, 2));
if (findings.length) process.exitCode = 1;
