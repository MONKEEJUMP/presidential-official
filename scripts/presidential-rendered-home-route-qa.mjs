import { existsSync, readFileSync } from "node:fs";
import { stripApprovedVisibleClaims } from "./lib/approved-visible-claims-qa.mjs";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { join } from "node:path";

const projectRoot = process.cwd();
const productionOrigin = "https://presidentialmoonrocks.com";
const nextBin = join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const runtimeHost = "127.0.0.1";
const runtimeBasePort = Number(process.env.PRESIDENTIAL_RENDERED_HOME_QA_PORT || "3348");

const paths = {
  homeHtml: join(projectRoot, ".next", "server", "app", "index.html"),
  homeDynamicArtifact: join(projectRoot, ".next", "server", "app", "page.js"),
  sitemapBody: join(projectRoot, ".next", "server", "app", "sitemap.xml.body"),
  robotsBody: join(projectRoot, ".next", "server", "app", "robots.txt.body"),
};

const failures = [];
const passes = [];

function pass(check, details = "") {
  passes.push({ check, details });
}

function fail(check, details) {
  failures.push({ check, details });
}

function readRequired(path, label) {
  if (!existsSync(path)) {
    fail(`${label}.exists`, `Missing ${path}. Run npm run build before this QA script.`);
    return "";
  }

  pass(`${label}.exists`, path);
  return readFileSync(path, "utf8");
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

async function waitForRuntimeServer(baseUrl) {
  let lastError;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/`);
      const html = await response.text();
      if (response.ok && html.trim()) {
        return html;
      }
    } catch (error) {
      lastError = error;
    }

    await sleep(400);
  }

  throw lastError || new Error("Next runtime server did not become ready.");
}

async function readHomeHtml() {
  if (existsSync(paths.homeHtml)) {
    pass("homeHtml.exists", paths.homeHtml);
    return readFileSync(paths.homeHtml, "utf8");
  }

  if (!existsSync(paths.homeDynamicArtifact)) {
    fail("homeHtml.exists", `Missing ${paths.homeHtml} and ${paths.homeDynamicArtifact}. Run npm run build before this QA script.`);
    return "";
  }

  const port = await findOpenPort(runtimeBasePort);
  const baseUrl = `http://${runtimeHost}:${port}`;
  const server = spawn(process.execPath, [nextBin, "start", "-H", runtimeHost, "-p", String(port)], {
    cwd: projectRoot,
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
    const html = await waitForRuntimeServer(baseUrl);
    pass("homeHtml.exists", `${paths.homeDynamicArtifact} rendered from ${baseUrl}/`);
    return html;
  } finally {
    if (!server.killed) {
      server.kill();
    }
    await sleep(250);
  }
}

function decodeHtml(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function visibleTextFromHtml(html) {
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  const withoutStyles = withoutScripts.replace(/<style[\s\S]*?<\/style>/gi, " ");
  const withoutTags = withoutStyles.replace(/<[^>]+>/g, " ");

  return decodeHtml(withoutTags).replace(/\s+/g, " ").trim();
}

function getAttribute(tag, attribute) {
  const pattern = new RegExp(`${attribute}\\s*=\\s*["']([^"']+)["']`, "i");
  return tag.match(pattern)?.[1] ?? "";
}

function findMeta(html, attribute, value) {
  const pattern = new RegExp(`<meta\\s+[^>]*${attribute}=["']${value}["'][^>]*>`, "i");
  return html.match(pattern)?.[0] ?? "";
}

function findCanonical(html) {
  return html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*>/i)?.[0] ?? "";
}

function extractJsonLd(html) {
  return Array.from(
    html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi),
  ).map((match, index) => {
    const raw = decodeHtml(match[1]);

    try {
      return { index, data: JSON.parse(raw), error: null };
    } catch (error) {
      return { index, data: null, error: error instanceof Error ? error.message : String(error) };
    }
  });
}

function collectSchemaTypes(value, types = []) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectSchemaTypes(entry, types));
    return types;
  }

  if (value && typeof value === "object") {
    const type = value["@type"];
    if (Array.isArray(type)) {
      type.forEach((entry) => types.push(String(entry)));
    } else if (type) {
      types.push(String(type));
    }

    Object.values(value).forEach((entry) => collectSchemaTypes(entry, types));
  }

  return types;
}

function countPattern(text, pattern) {
  return Array.from(text.matchAll(pattern)).length;
}

function checkNoMatches(check, text, patterns) {
  const hits = patterns.flatMap(({ label, regex }) => {
    const count = countPattern(text, regex);
    return count > 0 ? [`${label}: ${count}`] : [];
  });

  if (hits.length === 0) {
    pass(check, "no hits");
    return;
  }

  fail(check, hits.join("; "));
}

async function main() {
const homeHtml = await readHomeHtml();
const sitemapBody = readRequired(paths.sitemapBody, "sitemap");
const robotsBody = readRequired(paths.robotsBody, "robots");

if (homeHtml) {
  const visibleText = visibleTextFromHtml(homeHtml);

  checkNoMatches("visibleCopy.noInternalWorkflowLanguage", visibleText, [
    { label: "blocked_pending", regex: /blocked_pending/gi },
    { label: "public-unlock", regex: /public[-\s]unlock/gi },
    { label: "metadata", regex: /\bmetadata\b/gi },
    { label: "schema", regex: /\bschema\b/gi },
    { label: "sitemap", regex: /\bsitemap\b/gi },
    { label: "route-publication", regex: /route[-\s]publication/gi },
    { label: "approval-gated", regex: /approval[-\s]gated/gi },
    { label: "placeholder", regex: /\bplaceholder\b/gi },
    { label: "internal", regex: /\binternal\b/gi },
    { label: "shell", regex: /\bshell\b/gi },
    { label: "foundation", regex: /\bfoundation\b/gi },
    { label: "preview", regex: /\bpreview\b/gi },
    { label: "pending approval", regex: /pending approval/gi },
    { label: "blocked until", regex: /blocked until/gi },
    { label: "workflow", regex: /\bworkflow\b/gi },
    { label: "staged", regex: /\bstaged\b/gi },
  ]);

  checkNoMatches("visibleCopy.noForbiddenClaims", stripApprovedVisibleClaims(visibleText), [
    { label: "accusation language", regex: /\b(imposter|scam|hijack(?:ed|ing)?|stolen|counterfeit|knockoff|fraud)\b/gi },
    { label: "medical/effect language", regex: /\b(euphoric|euphoria|relax(?:ing|ed|ation)?|therapeutic|cerebral|uplifting|sedating|pain|anxiety|sleep|cure|treats?)\b/gi },
    { label: "unsupported superlative", regex: /\b(world'?s strongest|highest form|strongest flavor|most potent|#1\b|number[- ]one|top[- ]?ranked|best)\b/gi },
    { label: "direct commerce language", regex: /\b(price|pricing|inventory|shipping|delivery|deliver|buy online|order online|direct order|checkout|cart|reviews?|ratings?)\b/gi },
  ]);

  checkNoMatches("html.noPublicUnlockSignals", homeHtml, [
    { label: "public unlock true", regex: /data-presidential-public-unlock=["']true["']|publicUnlock\s*:\s*true/gi },
    { label: "approved route publication", regex: /route[-\s]publication\s+(approved|unlocked|enabled|live)/gi },
    { label: "schema image unlock", regex: /(schema image|og:image|twitter:image)\s*(approved|unlocked|enabled|live)?/gi },
  ]);

  checkNoMatches("html.noNonProductionUrls", homeHtml, [
    { label: "localhost", regex: /https?:\/\/(?:localhost|127\.0\.0\.1)/gi },
    { label: "vercel preview", regex: /https?:\/\/[^"'\s<>]*\.vercel\.app/gi },
    { label: "wix URL", regex: /https?:\/\/[^"'\s<>]*(?:wixsite|wixstatic)\.com/gi },
    { label: "alternate defensive domain", regex: /https?:\/\/[^"'\s<>]*(?:presidential\.vip|presidential\.rocks|presidential\.online|presidential\.us)/gi },
  ]);

  const robotsMeta = findMeta(homeHtml, "name", "robots");
  const googlebotMeta = findMeta(homeHtml, "name", "googlebot");
  const robotsContent = getAttribute(robotsMeta, "content");
  const googlebotContent = getAttribute(googlebotMeta, "content");

  if (/\bnoindex\b/i.test(robotsContent) && /\bfollow\b/i.test(robotsContent)) {
    pass("metadata.robotsNoindexFollow", robotsContent);
  } else {
    fail("metadata.robotsNoindexFollow", `Unexpected robots meta content: ${robotsContent || "missing"}`);
  }

  if (/\bnoindex\b/i.test(googlebotContent)) {
    pass("metadata.googlebotNoindex", googlebotContent);
  } else {
    fail("metadata.googlebotNoindex", `Unexpected googlebot meta content: ${googlebotContent || "missing"}`);
  }

  if (!/<meta\s+[^>]*content=["']index,\s*follow["'][^>]*>/i.test(homeHtml)) {
    pass("metadata.noIndexFollowPromotion", "no index, follow meta tag found");
  } else {
    fail("metadata.noIndexFollowPromotion", "Found index, follow metadata promotion");
  }

  const canonicalTag = findCanonical(homeHtml);
  const canonicalHref = getAttribute(canonicalTag, "href");
  const ogUrlTag = findMeta(homeHtml, "property", "og:url");
  const ogUrl = getAttribute(ogUrlTag, "content");
  const descriptionText = [
    getAttribute(findMeta(homeHtml, "name", "description"), "content"),
    getAttribute(findMeta(homeHtml, "property", "og:description"), "content"),
    getAttribute(findMeta(homeHtml, "name", "twitter:description"), "content"),
  ].filter(Boolean).join(" ");

  if (canonicalHref === productionOrigin) {
    pass("metadata.canonicalProductionHost", canonicalHref);
  } else {
    fail("metadata.canonicalProductionHost", `Unexpected canonical href: ${canonicalHref || "missing"}`);
  }

  if (!ogUrl) {
    pass("metadata.openGraphGatedUntilPublication", "no og:url emitted while route publication gate is closed");
  } else {
    fail("metadata.openGraphGatedUntilPublication", `Unexpected og:url before route publication: ${ogUrl}`);
  }

  checkNoMatches("metadata.descriptionsNoForbiddenClaims", descriptionText, [
    { label: "accusation language", regex: /\b(imposter|scam|hijack(?:ed|ing)?|stolen|counterfeit|knockoff|fraud)\b/gi },
    { label: "medical/effect language", regex: /\b(euphoric|euphoria|relax(?:ing|ed|ation)?|therapeutic|cerebral|uplifting|sedating|pain|anxiety|sleep|cure|treats?)\b/gi },
    { label: "unsupported superlative", regex: /\b(world'?s strongest|highest form|strongest flavor|most potent|#1\b|number[- ]one|top[- ]?ranked|best)\b/gi },
    { label: "direct commerce language", regex: /\b(price|pricing|inventory|shipping|delivery|deliver|buy online|order online|direct order|checkout|cart|reviews?|ratings?)\b/gi },
  ]);

  if (!/\b(?:og:image|twitter:image)\b/i.test(homeHtml)) {
    pass("metadata.noSocialImages", "no OG/Twitter images emitted");
  } else {
    fail("metadata.noSocialImages", "Found OG/Twitter image metadata before asset approval");
  }

  const jsonLdEntries = extractJsonLd(homeHtml);
  const parseErrors = jsonLdEntries.filter((entry) => entry.error);
  if (parseErrors.length === 0 && jsonLdEntries.length === 0) {
    pass("jsonld.gatedUntilPublication", "no JSON-LD emitted while route publication gate is closed");
  } else if (parseErrors.length === 0) {
    pass("jsonld.valid", `${jsonLdEntries.length} JSON-LD script(s) parsed`);
  } else {
    fail(
      "jsonld.valid",
      parseErrors.map((entry) => `script ${entry.index}: ${entry.error}`).join("; "),
    );
  }

  const schemaTypes = jsonLdEntries.flatMap((entry) =>
    entry.data ? collectSchemaTypes(entry.data) : [],
  );
  const allowedTypes = new Set(["Organization", "WebSite", "WebPage", "BreadcrumbList"]);
  const forbiddenTypes = schemaTypes.filter((type) => !allowedTypes.has(type));

  if (forbiddenTypes.length === 0) {
    pass("jsonld.allowedTypesOnly", schemaTypes.join(", "));
  } else {
    fail("jsonld.allowedTypesOnly", `Unexpected JSON-LD types: ${forbiddenTypes.join(", ")}`);
  }

  checkNoMatches("jsonld.noCommerceOrImageFields", JSON.stringify(jsonLdEntries.map((entry) => entry.data)), [
    { label: "commerce field", regex: /\b(offers?|price|priceCurrency|availability|shippingDetails|hasMerchantReturnPolicy)\b/gi },
    { label: "review field", regex: /\b(review|aggregateRating|ratingValue|reviewCount)\b/gi },
    { label: "image field", regex: /\b(image|logo|photo)\b/gi },
  ]);
}

if (sitemapBody) {
  if (/<urlset\b/i.test(sitemapBody) && !/<url>/i.test(sitemapBody)) {
    pass("sitemap.emptyUrlset", "built sitemap has no URL entries");
  } else {
    fail("sitemap.emptyUrlset", "Built sitemap contains URL entries or is malformed");
  }
}

if (robotsBody) {
  if (/^Allow:\s*\/\s*$/im.test(robotsBody) && !/^Disallow:\s*\/\s*$/im.test(robotsBody)) {
    pass("robots.allowsRootWithoutGlobalBlock", "robots allows root and does not globally disallow /");
  } else {
    fail("robots.allowsRootWithoutGlobalBlock", "robots.txt may globally block crawlable public route content");
  }

  if (robotsBody.includes(`Sitemap: ${productionOrigin}/sitemap.xml`)) {
    pass("robots.productionSitemap", "robots sitemap points to production host");
  } else {
    fail("robots.productionSitemap", "robots sitemap does not point to production host");
  }
}

const verdict = failures.length === 0 ? "PASS" : "FAIL";
const summary = {
  verdict,
  pass_count: passes.length,
  fail_count: failures.length,
  passes,
  failures,
};

console.log("Presidential Rendered Home Route QA");
console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
