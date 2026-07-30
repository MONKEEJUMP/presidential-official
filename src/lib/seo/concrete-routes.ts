import { getRouteById, getRouteByPath } from "./route-helpers";
import type { SeoRoutePath, SeoRouteRecord } from "./route-types";

export const CONCRETE_SEO_DOCUMENT_PATHS = [
  "/",
  "/moon-rocks",
  "/moon-pods",
  "/orbit",
  "/vapes",
  "/our-story",
  "/learn",
  "/find-us",
  "/contact",
  "/loyalty",
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
  total: 72,
} as const;

type ConcreteCatalogItem = {
  readonly _id: string;
  readonly name: string;
  readonly series?: string;
  readonly description?: string;
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
  const path = `/moon-rocks/${slug}` as const;
  const description =
    item.description?.trim() ||
    `Approved product information for ${name}${series ? `, part of the Presidential ${series}` : ""}. Availability varies by licensed retailer.`;

  return {
    ...template,
    id: `moon-rocks-product-${slug}`,
    path,
    canonicalPath: path,
    title: `${name} | Presidential Moon Rocks`,
    description,
    h1: name,
    keywords: [
      `${name.toLowerCase()} presidential`,
      `${name.toLowerCase()} moon rocks`,
      ...template.keywords,
    ],
    linksTo: [
      "/moon-rocks",
      ...(seriesPath ? [seriesPath] : []),
      "/find-us",
    ],
    sourceArtifact: `${template.sourceArtifact}; Sanity productCatalogItem:${item._id}`,
    notes:
      "Concrete product route materialized from the gated catalog record and the product-detail SEO policy template.",
  };
}

export function buildStateSeoRoute(
  state: ConcreteState,
): SeoRouteRecord {
  const template = getRequiredRouteTemplate("find-us-state");
  const path = `/find-us/${state.slug}` as const;

  return {
    ...template,
    id: `find-us-state-${state.slug}`,
    path,
    canonicalPath: path,
    title: `Presidential in ${state.name} | Official Presidential Site`,
    description: state.seoLine,
    h1: state.name,
    keywords: [
      `presidential moon rocks ${state.name.toLowerCase()}`,
      `where to buy presidential ${state.name.toLowerCase()}`,
    ],
    linksTo: ["/find-us", "/moon-rocks"],
    sourceArtifact: `${template.sourceArtifact}; src/lib/find-us/states.ts`,
    notes:
      "Concrete state route materialized from the priority-market record and the state-locator SEO policy template.",
  };
}
