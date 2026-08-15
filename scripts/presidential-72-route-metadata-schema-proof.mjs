import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";

import {
  OWNER_PREVIEW_PRODUCT_ROUTES,
  OWNER_PREVIEW_SERIES_ROUTES,
} from "./lib/owner-preview-route-inventory.mjs";

const webRoot = process.cwd();
const workspaceRoot = path.resolve(webRoot, "..");
const productionOrigin = "https://presidentialmoonrocks.com";
const runtimeHost = "127.0.0.1";
const runtimeBasePort = Number(process.env.PRESIDENTIAL_72_ROUTE_QA_PORT || "3372");
const nextBin = path.join(webRoot, "node_modules", "next", "dist", "bin", "next");
const proofRoot = path.join(
  workspaceRoot,
  "sources",
  "spud",
  "work",
  "seo-foundation-reconciliation",
);
const csvPath = path.join(
  workspaceRoot,
  "docs",
  "phase1-seo-artifacts",
  "PW7404-1018-presidential-seo-foundation-72-route-metadata-schema-proof-matrix.csv",
);
const jsonPath = path.join(
  proofRoot,
  "PW7404-1018-presidential-seo-foundation-72-route-proof.json",
);
const markdownPath = path.join(
  proofRoot,
  "PW7404-1018-presidential-seo-foundation-72-route-proof.md",
);

const staticDocuments = [
  ["/", "home", "Organization|WebSite|WebPage"],
  ["/moon-rocks", "product-platform", "WebPage|BreadcrumbList|Product"],
  ["/moon-pods", "product-platform", "WebPage|BreadcrumbList"],
  ["/orbit", "technology-platform", "WebPage|BreadcrumbList"],
  ["/vapes", "product-platform", "WebPage|BreadcrumbList"],
  ["/our-story", "brand-story", "AboutPage|WebPage|BreadcrumbList"],
  ["/learn", "learn-hub", "WebPage|BreadcrumbList|ItemList"],
  ["/find-us", "store-locator", "WebPage|BreadcrumbList|ItemList"],
  ["/contact", "contact", "ContactPage|WebPage|BreadcrumbList"],
  ["/loyalty", "future-module", "WebPage"],
].map(([route, kind, declaredSchema]) => ({
  route,
  kind,
  declaredSchema,
  surfaceType: "document",
}));

const seriesDocuments = OWNER_PREVIEW_SERIES_ROUTES.map((entry) => ({
  route: entry.path,
  kind: "product-series",
  declaredSchema: "WebPage|BreadcrumbList|ItemList",
  surfaceType: "document",
}));

const productDocuments = OWNER_PREVIEW_PRODUCT_ROUTES.map((entry) => ({
  route: entry.path,
  kind: "product-detail",
  declaredSchema: "WebPage|BreadcrumbList|Product",
  surfaceType: "document",
}));

const stateDocuments = ["az", "ca", "mi", "nv", "ny", "ok", "wa"].map(
  (slug) => ({
    route: `/find-us/${slug}`,
    kind: "state-locator",
    declaredSchema: "WebPage|BreadcrumbList|ItemList",
    surfaceType: "document",
  }),
);

const redirectSurfaces = [
  {
    route: "/dispensaries",
    kind: "redirect",
    declaredSchema: "",
    surfaceType: "redirect",
    expectedLocation: "/find-us",
  },
];

const surfaces = [
  ...staticDocuments,
  ...seriesDocuments,
  ...productDocuments,
  ...stateDocuments,
  ...redirectSurfaces,
];

if (surfaces.length !== 72) {
  throw new Error(`Expected 72 rendered route surfaces; found ${surfaces.length}.`);
}

if (new Set(surfaces.map((surface) => surface.route)).size !== surfaces.length) {
  throw new Error("The rendered 72-route proof inventory contains duplicate paths.");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findOpenPort(startPort) {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.once("error", (error) => {
      if (error.code === "EADDRINUSE" || error.code === "EACCES") {
        server.close(() => findOpenPort(startPort + 1).then(resolve, reject));
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

async function waitForServer(baseUrl) {
  let lastError;

  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/contact`, { redirect: "manual" });
      if (response.status === 200) return;
    } catch (error) {
      lastError = error;
    }

    await sleep(500);
  }

  throw lastError || new Error("Next production server did not become ready.");
}

function decodeHtml(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractHead(html) {
  return html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || "";
}

function tags(source, tagName) {
  return Array.from(
    source.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, "gi")),
    (match) => match[0],
  );
}

function attr(tag, name) {
  return decodeHtml(
    tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1] ||
      "",
  );
}

function metaTags(head, attribute, value) {
  return tags(head, "meta").filter(
    (tag) => attr(tag, attribute).toLowerCase() === value.toLowerCase(),
  );
}

function extractJsonLdTypes(html) {
  const types = [];
  const scripts = Array.from(
    html.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
    (match) => decodeHtml(match[1]).trim(),
  );

  for (const source of scripts) {
    try {
      const parsed = JSON.parse(source);
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        if (typeof node?.["@type"] === "string") types.push(node["@type"]);
      }
    } catch {
      types.push("INVALID_JSON");
    }
  }

  return { count: scripts.length, types };
}

function expectedCanonical(route) {
  return route === "/" ? productionOrigin : `${productionOrigin}${route}`;
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function inspectSourceWiring() {
  const read = (relativePath) =>
    readFileSync(path.join(webRoot, relativePath), "utf8");
  const productPage = read("src/app/moon-rocks/[product-or-strain]/page.tsx");
  const statePage = read("src/app/find-us/[state]/page.tsx");
  const seriesShell = read(
    "src/components/presidential/modules/series-page-shell.tsx",
  );
  const metadataHelper = read("src/lib/seo/metadata.ts");
  const robotsHelper = read("src/lib/seo/robots.ts");
  const concreteRoutes = read("src/lib/seo/concrete-routes.ts");

  return {
    concrete_surface_count_locked:
      concreteRoutes.includes("total: 72") &&
      concreteRoutes.includes("products: 47") &&
      concreteRoutes.includes("states: 8"),
    product_metadata_materialized:
      productPage.includes("buildCatalogProductSeoRoute") &&
      productPage.includes("buildRouteMetadata"),
    product_schema_caller_connected:
      productPage.includes("buildProductRouteJsonLd") &&
      productPage.includes("<JsonLd"),
    state_metadata_materialized:
      statePage.includes("buildStateSeoRoute") &&
      statePage.includes("buildRouteMetadata"),
    state_schema_caller_connected:
      statePage.includes("buildRouteShellJsonLd") &&
      statePage.includes("<JsonLd"),
    series_schema_caller_connected:
      seriesShell.includes("buildRouteShellJsonLd") &&
      seriesShell.includes("<JsonLd"),
    social_metadata_publication_gated:
      metadataHelper.includes(
        "socialPreviewApproved = isRouteMetadataIndexable(route, gateInput)",
      ) &&
      metadataHelper.includes("...(socialPreviewApproved"),
    robots_sitemap_uses_canonical_helper:
      robotsHelper.includes(
        'ROBOTS_SITEMAP_URL = canonicalUrl("/sitemap.xml")',
      ) && robotsHelper.includes("sitemap: ROBOTS_SITEMAP_URL"),
  };
}

async function inspectSurface(baseUrl, surface, sequence) {
  const response = await fetch(`${baseUrl}${surface.route}`, { redirect: "manual" });

  if (surface.surfaceType === "redirect") {
    const location = response.headers.get("location") || "";
    const pass =
      [307, 308].includes(response.status) &&
      (location === surface.expectedLocation ||
        location === `${baseUrl}${surface.expectedLocation}`);

    return {
      sequence,
      route: surface.route,
      kind: surface.kind,
      surface_type: "redirect",
      http_status: response.status,
      title: "",
      description: "",
      canonical: "",
      canonical_self: "n/a",
      robots: "",
      noindex: "n/a",
      open_graph_count: 0,
      twitter_count: 0,
      declared_schema: "",
      emitted_schema_count: 0,
      emitted_schema_types: "",
      gate_state: "redirect-only",
      redirect_location: location,
      verdict: pass ? "PASS" : "FAIL",
    };
  }

  const html = await response.text();
  const head = extractHead(html);
  const titles = Array.from(
    head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi),
    (match) => decodeHtml(match[1]).trim(),
  );
  const descriptions = metaTags(head, "name", "description");
  const canonicals = tags(head, "link").filter(
    (tag) => attr(tag, "rel").toLowerCase() === "canonical",
  );
  const robotsTags = metaTags(head, "name", "robots");
  const openGraph = tags(head, "meta").filter((tag) =>
    attr(tag, "property").toLowerCase().startsWith("og:"),
  );
  const twitter = tags(head, "meta").filter((tag) =>
    attr(tag, "name").toLowerCase().startsWith("twitter:"),
  );
  const h1Count = Array.from(html.matchAll(/<h1\b/gi)).length;
  const structuredData = extractJsonLdTypes(html);
  const canonical = canonicals.length === 1 ? attr(canonicals[0], "href") : "";
  const robots =
    robotsTags.length === 1 ? attr(robotsTags[0], "content").toLowerCase() : "";
  const canonicalSelf = canonical === expectedCanonical(surface.route);
  const noindex = /\bnoindex\b/.test(robots);
  const pass =
    response.status === 200 &&
    html.length > 0 &&
    titles.length === 1 &&
    descriptions.length === 1 &&
    canonicals.length === 1 &&
    canonicalSelf &&
    robotsTags.length === 1 &&
    noindex &&
    openGraph.length === 0 &&
    twitter.length === 0 &&
    structuredData.count === 0 &&
    h1Count === 1;

  return {
    sequence,
    route: surface.route,
    kind: surface.kind,
    surface_type: "document",
    http_status: response.status,
    title: titles[0] || "",
    description:
      descriptions.length === 1 ? attr(descriptions[0], "content") : "",
    canonical,
    canonical_self: canonicalSelf ? "yes" : "no",
    robots,
    noindex: noindex ? "yes" : "no",
    open_graph_count: openGraph.length,
    twitter_count: twitter.length,
    declared_schema: surface.declaredSchema,
    emitted_schema_count: structuredData.count,
    emitted_schema_types: structuredData.types.join("|"),
    h1_count: h1Count,
    gate_state: "closed-noindex-social-and-schema-suppressed",
    redirect_location: "",
    verdict: pass ? "PASS" : "FAIL",
  };
}

async function inspectGlobalFiles(baseUrl) {
  const [robotsResponse, sitemapResponse] = await Promise.all([
    fetch(`${baseUrl}/robots.txt`),
    fetch(`${baseUrl}/sitemap.xml`),
  ]);
  const [robots, sitemap] = await Promise.all([
    robotsResponse.text(),
    sitemapResponse.text(),
  ]);

  return {
    robots_status: robotsResponse.status,
    robots_sitemap_pointer:
      robots.includes(`Sitemap: ${productionOrigin}/sitemap.xml`),
    sitemap_status: sitemapResponse.status,
    sitemap_url_count: Array.from(sitemap.matchAll(/<url>/gi)).length,
  };
}

async function main() {
  const port = await findOpenPort(runtimeBasePort);
  const baseUrl = `http://${runtimeHost}:${port}`;
  const server = spawn(
    process.execPath,
    [nextBin, "start", "-H", runtimeHost, "-p", String(port)],
    {
      cwd: webRoot,
      env: {
        ...process.env,
        PRESIDENTIAL_HOMEPAGE_CMS_RENDERING_ENABLED: "false",
        PRESIDENTIAL_SITE_PAGE_CMS_RENDERING_ENABLED: "false",
        PRESIDENTIAL_LEARN_GUIDE_CMS_RENDERING_ENABLED: "false",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  server.stdout.resume();
  server.stderr.resume();

  try {
    await waitForServer(baseUrl);
    const rows = [];
    const sourceWiring = inspectSourceWiring();

    for (const [index, surface] of surfaces.entries()) {
      rows.push(await inspectSurface(baseUrl, surface, index + 1));
    }

    const globalFiles = await inspectGlobalFiles(baseUrl);
    const failures = rows.filter((row) => row.verdict === "FAIL");
    const sourceWiringPassed = Object.values(sourceWiring).every(Boolean);
    const verdict =
      failures.length === 0 &&
      sourceWiringPassed &&
      globalFiles.robots_status === 200 &&
      globalFiles.robots_sitemap_pointer &&
      globalFiles.sitemap_status === 200 &&
      globalFiles.sitemap_url_count === 0
        ? "PASS_72_ROUTE_SEO_FOUNDATION_NO_PUBLIC_UNLOCK"
        : "FAIL_72_ROUTE_SEO_FOUNDATION_REVIEW_REQUIRED";
    const columns = [
      "sequence",
      "route",
      "kind",
      "surface_type",
      "http_status",
      "title",
      "description",
      "canonical",
      "canonical_self",
      "robots",
      "noindex",
      "open_graph_count",
      "twitter_count",
      "declared_schema",
      "emitted_schema_count",
      "emitted_schema_types",
      "h1_count",
      "gate_state",
      "redirect_location",
      "verdict",
    ];

    mkdirSync(path.dirname(csvPath), { recursive: true });
    mkdirSync(proofRoot, { recursive: true });
    writeFileSync(
      csvPath,
      [
        columns.join(","),
        ...rows.map((row) =>
          columns.map((column) => csvEscape(row[column])).join(","),
        ),
      ].join("\n") + "\n",
    );
    writeFileSync(
      jsonPath,
      JSON.stringify(
        {
          verdict,
          route_count: rows.length,
          document_count: rows.filter((row) => row.surface_type === "document")
            .length,
          redirect_count: rows.filter((row) => row.surface_type === "redirect")
            .length,
          pass_count: rows.length - failures.length,
          fail_count: failures.length,
          canonical_reconciliation_target_count: 56,
          no_public_unlock: true,
          global_files: globalFiles,
          source_wiring: sourceWiring,
          rows,
        },
        null,
        2,
      ) + "\n",
    );
    writeFileSync(
      markdownPath,
      [
        "# Presidential 72-Route Metadata And Schema Proof",
        "",
        `Verdict: ${verdict}`,
        "",
        `Routes: ${rows.length} (71 documents + 1 canonical redirect)`,
        `Pass: ${rows.length - failures.length}`,
        `Fail: ${failures.length}`,
        `Robots sitemap pointer: ${globalFiles.robots_sitemap_pointer ? "present" : "missing"}`,
        `Sitemap URL count: ${globalFiles.sitemap_url_count}`,
        `Source wiring checks: ${sourceWiringPassed ? "all pass" : "review required"}`,
        "",
        "Every document must render one production self-canonical and remain noindex. Open Graph, Twitter, and JSON-LD stay suppressed until the route-publication evidence gates approve that route.",
        "",
        "No public indexing, sitemap inclusion, social metadata, or schema publication was unlocked by this proof.",
        "",
      ].join("\n"),
    );

    console.log(verdict);
    console.log(
      `Routes: ${rows.length}; passed: ${rows.length - failures.length}; failed: ${failures.length}`,
    );
    console.log(
      `Robots sitemap pointer: ${globalFiles.robots_sitemap_pointer}; sitemap URLs: ${globalFiles.sitemap_url_count}`,
    );
    console.log(`Source wiring checks: ${sourceWiringPassed}`);

    if (verdict.startsWith("FAIL")) {
      console.error(
        failures
          .map(
            (row) =>
              `${row.route}: status=${row.http_status}, canonical=${row.canonical_self}, noindex=${row.noindex}, og=${row.open_graph_count}, twitter=${row.twitter_count}, schema=${row.emitted_schema_count}, h1=${row.h1_count}`,
          )
          .join("\n"),
      );
      process.exitCode = 1;
    }
  } finally {
    if (!server.killed) server.kill();
    await sleep(250);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
