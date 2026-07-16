import type { MetadataRoute } from "next";

import { isPrivateOrFutureRoute } from "./indexability";
import type { SeoRoutePath, SeoRouteRecord } from "./route-types";
import { ROUTE_REGISTRY } from "./routes";

export const ROBOTS_ALLOW_PATHS = ["/"] as const;

function normalizeDisallowPath(path: SeoRoutePath): readonly string[] {
  const withSlash = path.endsWith("/") ? path : `${path}/`;

  if (path === withSlash) {
    return [path];
  }

  return [path, withSlash];
}

export function isRobotsDisallowRoute(route: SeoRouteRecord): boolean {
  return isPrivateOrFutureRoute(route) || route.kind === "private_system";
}

export function getRobotsDisallowPaths(): readonly string[] {
  const disallowPaths = ROUTE_REGISTRY.filter(isRobotsDisallowRoute).flatMap(
    (route) => normalizeDisallowPath(route.path),
  );

  return [...new Set(disallowPaths)].sort();
}

export function buildPresidentialRobots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [...ROBOTS_ALLOW_PATHS],
      disallow: [...getRobotsDisallowPaths()],
    },
  };
}
