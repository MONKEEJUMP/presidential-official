import { getRouteById, getRouteByPath } from "./route-helpers";
import type { SeoRoutePath, SeoRouteRecord } from "./route-types";
import { PRODUCT_METADATA_BY_SLUG } from "./pw7404-1019-product-metadata";
import { relatedGuideForCatalogItem } from "@/lib/catalog/series-registry";

export const CONCRETE_SEO_DOCUMENT_PATHS = [
  "/",
  "/moon-rocks",
  "/moon-pods",
  "/orbit",
  "/vapes",
  "/our-story",
  "/about",
  "/learn",
  "/find-us",
  "/contact",
  "/loyalty",
  "/presidential-thc",
  "/presidential-blunts",
  "/presidential-cannabis",
] as const satisfies readonly SeoRoutePath[];

export const CONCRETE_SEO_REDIRECT_PATHS = [
  "/dispensaries",
] as const satisfies readonly SeoRoutePath[];

export const CONCRETE_SEO_SERIES_PATHS = [
  "/moon-rocks/silver",
  "/moon-rocks/gold",
  "/moon-rocks/rose-gold",
  "/moon-rocks/presidential-line",
  "/moon-rocks/presidential-house-line",
  "/moon-rocks/presidential-x-thc-design",
] as const satisfies readonly SeoRoutePath[];

export const CONCRETE_SEO_SURFACE_COUNTS = {
  staticDocuments: CONCRETE_SEO_DOCUMENT_PATHS.length,
  redirects: CONCRETE_SEO_REDIRECT_PATHS.length,
  series: CONCRETE_SEO_SERIES_PATHS.length,
  products: 47,
  states: 8,
  total: 76,
} as const;

type ConcreteCatalogItem = {
  readonly _id: string;
  readonly name: string;
  readonly series?: string;
  readonly productType?: string;
  readonly description?: string;
  readonly sourceArtifact?: string;
};

type ConcreteState = {
  readonly slug: string;
  readonly name: string;
  readonly seoLine: string;
};

const SERIES_PATH_BY_NAME: Readonly<Record<string, SeoRoutePath>> = {
  "Silver Flavor Series": "/moon-rocks/silver",
  "Gold Strain Series": "/moon-rocks/gold",
  "Rose Gold Connoisseur Series": "/moon-rocks/rose-gold",
  "Presidential Line": "/moon-rocks/presidential-line",
  "Presidential House Line": "/moon-rocks/presidential-house-line",
  "Presidential x THC Design": "/moon-rocks/presidential-x-thc-design",
};

const PRODUCT_H1_OVERRIDE_BY_SLUG: Readonly<Record<string, string>> = {
  "presidential-blunts": "Presidential House Line Blunts",
  "presidential-moon-rocks": "Presidential House Line Moon Rocks",
};

function getRequiredRouteTemplate(id: string): SeoRouteRecord {
  const route = getRouteById(id);

  if (!route) {
    throw new Error(`Missing Presidential SEO route template: ${id}`);
  }

  return route;
}

function getRequiredSeriesRoute(path: SeoRoutePath): SeoRouteRecord {
  const route = getRouteByPath(path);

  if (!route || route.kind !== "product_series") {
    throw new Error(`Missing concrete Presidential series SEO route: ${path}`);
  }

  return route;
}

export function getConcreteSeriesSeoRoutes(): readonly SeoRouteRecord[] {
  return CONCRETE_SEO_SERIES_PATHS.map(getRequiredSeriesRoute);
}

export function buildCatalogProductSeoRoute(
  item: ConcreteCatalogItem,
  slug: string,
): SeoRouteRecord {
  const template = getRequiredRouteTemplate("moon-rocks-product-detail");
  const name = item.name.trim();
  const series = item.series?.trim();
  const seriesPath = series ? SERIES_PATH_BY_NAME[series] : undefined;
  const relatedGuide = relatedGuideForCatalogItem(item);
  const path = `/moon-rocks/${slug}` as const;
  const metadata = PRODUCT_METADATA_BY_SLUG[slug];
  const generatedDescription =
    item.description?.trim() ||
    `Approved product information for ${name}${series ? `, part of the Presidential ${series}` : ""}. Availability varies by licensed retailer.`;

  return {
    ...template,
    id: `moon-rocks-product-${slug}`,
    path,
    canonicalPath: path,
    title: metadata?.seoTitle ?? `${name} | Presidential Moon Rocks`,
    description: metadata?.metaDescription ?? generatedDescription,
    h1: PRODUCT_H1_OVERRIDE_BY_SLUG[slug] ?? name,
    keywords: [
      `${name.toLowerCase()} presidential`,
      `${name.toLowerCase()} moon rocks`,
      ...template.keywords,
    ],
    linksTo: [
      "/moon-rocks",
      ...(seriesPath ? [seriesPath] : []),
      ...(relatedGuide ? [relatedGuide.path] : []),
      "/find-us",
    ],
    sourceArtifact:
      item.sourceArtifact ??
      `${template.sourceArtifact}; Sanity productCatalogItem:${item._id}`,
    notes:
      "Concrete product route materialized from the gated catalog record and the product-detail SEO policy template.",
  };
}

type ConcreteLearnGuide = {
  readonly title: string;
  readonly intro: string;
};

export type ConcreteTermPage = {
  readonly slug: "presidential-thc" | "presidential-blunts" | "presidential-cannabis";
  readonly title: string;
  readonly description: string;
  readonly h1: string;
  readonly keywords: readonly string[];
  readonly linksTo: readonly SeoRoutePath[];
};

export function buildTermSeoRoute(term: ConcreteTermPage): SeoRouteRecord {
  const template = getRequiredRouteTemplate("about");
  const path = `/${term.slug}` as const;

  return {
    ...template,
    id: `presidential-term-${term.slug}`,
    path,
    kind: "brand_story",
    status: "approved",
    indexability: "index_follow",
    sitemap: "include",
    canonicalPath: path,
    title: term.title,
    description: term.description,
    h1: term.h1,
    keywords: term.keywords,
    schema:
      term.slug === "presidential-cannabis"
        ? ["Organization", "WebPage", "BreadcrumbList", "FAQPage"]
        : ["WebPage", "BreadcrumbList"],
    requiredData: ["owner-approved term-page copy", "approved Presidential imagery"],
    requiredApprovals: [],
    blocks: [],
    linksTo: term.linksTo,
    sourceArtifact:
      "THREE-TERM-PAGES-DRAFT-2.md; 6112-SPUD owner route publication approval",
    notes:
      "Distinct informational brand-term route materialized through the same approved concrete-route pattern used by learn guides.",
  };
}

export function buildLearnGuideSeoRoute(
  guide: ConcreteLearnGuide,
  slug: string,
): SeoRouteRecord {
  const template = getRequiredRouteTemplate("learn-guide");
  const path = `/learn/${slug}` as const;

  return {
    ...template,
    id: `learn-guide-${slug}`,
    path,
    status: "approved",
    indexability: "index_follow",
    sitemap: "include",
    canonicalPath: path,
    title: `${guide.title.trim()} | Presidential Learn`,
    description: guide.intro.trim(),
    h1: guide.title.trim(),
    schema: ["WebPage", "BreadcrumbList"],
    linksTo: ["/learn", "/moon-rocks", "/find-us"],
    blocks: [],
    sourceArtifact:
      `${template.sourceArtifact}; approved Sanity learnGuide:${slug}; ` +
      "6108-FABLE approved copy; 6110-FABLE CMS publication; 6111-SPUD owner route publication approval",
    notes:
      "Concrete learn-guide route materialized from the approved CMS record and the central publication gate.",
  };
}

export function buildStateSeoRoute(
  state: ConcreteState,
): SeoRouteRecord {
  const template = getRequiredRouteTemplate("find-us-state");
  const path = `/find-us/${state.slug}` as const;
  const isNewYork = state.slug === "ny";

  return {
    ...template,
    id: `find-us-state-${state.slug}`,
    path,
    canonicalPath: path,
    title: isNewYork
      ? "Presidential Near Me in New York | Official Locator"
      : `Presidential in ${state.name} | Official Presidential Site`,
    description: state.seoLine,
    h1: isNewYork ? "Presidential Near Me in New York" : state.name,
    keywords: [
      `presidential moon rocks ${state.name.toLowerCase()}`,
      `where to buy presidential ${state.name.toLowerCase()}`,
      ...(isNewYork ? ["presidential near me"] : []),
    ],
    linksTo: ["/find-us", "/moon-rocks"],
    sourceArtifact: `${template.sourceArtifact}; src/lib/find-us/states.ts`,
    notes:
      "Concrete state route materialized from the priority-market record and the state-locator SEO policy template.",
  };
}
