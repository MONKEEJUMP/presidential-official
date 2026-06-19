import type { MetadataRoute } from "next";

import { isSitemapEligible } from "./indexability";
import { buildRouteCanonicalUrl, isRouteTemplate } from "./route-helpers";
import type { SeoRouteRecord } from "./route-types";
import { ROUTE_REGISTRY } from "./routes";

export type PresidentialSitemapEntry = MetadataRoute.Sitemap[number];

export function isPresidentialSitemapRoute(route: SeoRouteRecord): boolean {
  return isSitemapEligible(route) && !isRouteTemplate(route);
}

export function buildPresidentialSitemapEntry(
  route: SeoRouteRecord,
): PresidentialSitemapEntry {
  if (!isPresidentialSitemapRoute(route)) {
    throw new Error(`Route is not eligible for sitemap output: ${route.path}`);
  }

  const entry: PresidentialSitemapEntry = {
    url: buildRouteCanonicalUrl(route),
    priority: route.priority / 5,
  };

  if (route.changeFrequency) {
    entry.changeFrequency = route.changeFrequency;
  }

  return entry;
}

export function getPresidentialSitemapRoutes(): readonly SeoRouteRecord[] {
  return ROUTE_REGISTRY.filter(isPresidentialSitemapRoute);
}

export function buildPresidentialSitemap(): MetadataRoute.Sitemap {
  return getPresidentialSitemapRoutes().map(buildPresidentialSitemapEntry);
}

