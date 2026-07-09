import type { SeoRouteRecord } from "./route-types";
import { getRoutePublicationGateBlockReasons } from "./source-records";
import type { RoutePublicationGateInput } from "./metadata-types";

export function isIndexFollow(route: SeoRouteRecord): boolean {
  return route.indexability === "index_follow";
}

export function isNoindex(route: SeoRouteRecord): boolean {
  return route.indexability === "noindex";
}

export function isPrivateOrFutureRoute(route: SeoRouteRecord): boolean {
  return (
    route.status === "private" ||
    route.status === "future" ||
    route.status === "blocked"
  );
}

export function getSitemapBlockReasons(
  route: SeoRouteRecord,
  gateInput: RoutePublicationGateInput = {},
): readonly string[] {
  const reasons: string[] = [];

  if (route.status !== "approved") {
    reasons.push(`status:${route.status}`);
  }

  if (route.indexability !== "index_follow") {
    reasons.push(`indexability:${route.indexability}`);
  }

  if (route.sitemap !== "include") {
    reasons.push(`sitemap:${route.sitemap}`);
  }

  for (const block of route.blocks) {
    reasons.push(`block:${block}`);
  }

  reasons.push(
    ...getRoutePublicationGateBlockReasons(
      route,
      gateInput.routePublicationRecords,
      gateInput.routePublicationContext,
    ),
  );

  return reasons;
}

export function isSitemapEligible(
  route: SeoRouteRecord,
  gateInput: RoutePublicationGateInput = {},
): boolean {
  return (
    route.status === "approved" &&
    route.indexability === "index_follow" &&
    route.sitemap === "include" &&
    route.blocks.length === 0 &&
    getRoutePublicationGateBlockReasons(
      route,
      gateInput.routePublicationRecords,
      gateInput.routePublicationContext,
    ).length === 0
  );
}

export function requiresHumanOrLegalGate(route: SeoRouteRecord): boolean {
  return route.requiredApprovals.some((approval) =>
    /legal|compliance|executive|client|approval/i.test(approval),
  );
}
