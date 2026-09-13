import type { Metadata } from "next";

import { buildRouteMetadata } from "./metadata";
import { getRouteByPath, isRouteTemplate } from "./route-helpers";
import type { SeoRoutePath, SeoRouteRecord } from "./route-types";

export const STATIC_ROUTE_SHELL_PATHS = [
  "/",
  "/moon-rocks",
  "/moon-pods",
  "/orbit",
  "/vapes",
  "/pre-rolls",
  "/blunts",
  "/our-story",
  "/about",
  "/learn",
  "/find-us",
  "/contact",
  "/wholesale",
  "/pop-up",
] as const satisfies readonly SeoRoutePath[];

const staticRouteShellPaths = new Set<SeoRoutePath>(STATIC_ROUTE_SHELL_PATHS);

export function getStaticRouteRecord(path: SeoRoutePath): SeoRouteRecord {
  const route = getRouteByPath(path);

  if (!route) {
    throw new Error(`Missing Presidential route shell record: ${path}`);
  }

  if (isRouteTemplate(route)) {
    throw new Error(`Route shell cannot use unresolved template route: ${path}`);
  }

  return route;
}

export function buildStaticRouteMetadata(path: SeoRoutePath): Metadata {
  return buildRouteMetadata({ route: getStaticRouteRecord(path) });
}

export function getStaticRouteShellLinks(
  route: SeoRouteRecord,
): readonly SeoRouteRecord[] {
  return route.linksTo
    .filter((path) => staticRouteShellPaths.has(path))
    .map((path) => getRouteByPath(path))
    .filter((linkedRoute): linkedRoute is SeoRouteRecord => Boolean(linkedRoute));
}
