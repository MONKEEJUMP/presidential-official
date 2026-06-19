import { PRODUCTION_ORIGIN, canonicalUrl } from "./schema/constants";
import { MANDATORY_ROUTE_PATHS, ROUTE_REGISTRY } from "./routes";
import type { SeoRoutePath, SeoRouteRecord } from "./route-types";

export { PRODUCTION_ORIGIN };

const routesByPath = new Map<SeoRoutePath, SeoRouteRecord>(
  ROUTE_REGISTRY.map((route) => [route.path, route]),
);

const routesById = new Map<string, SeoRouteRecord>(
  ROUTE_REGISTRY.map((route) => [route.id, route]),
);

export function buildRouteCanonicalUrl(route: SeoRouteRecord): string {
  return canonicalUrl(route.canonicalPath);
}

export function getRouteByPath(path: SeoRoutePath): SeoRouteRecord | undefined {
  return routesByPath.get(path);
}

export function getRouteById(id: string): SeoRouteRecord | undefined {
  return routesById.get(id);
}

export function getMandatoryRoutes(): readonly SeoRouteRecord[] {
  return MANDATORY_ROUTE_PATHS.map((path) => routesByPath.get(path)).filter(
    (route): route is SeoRouteRecord => Boolean(route),
  );
}

export function getMissingMandatoryRoutes(): readonly SeoRoutePath[] {
  return MANDATORY_ROUTE_PATHS.filter((path) => !routesByPath.has(path));
}

export function assertMandatoryRoutesComplete(): void {
  const missing = getMissingMandatoryRoutes();

  if (missing.length > 0) {
    throw new Error(`Missing mandatory Presidential SEO routes: ${missing.join(", ")}`);
  }
}
