import type { Metadata } from "next";

import { isIndexFollow, isPrivateOrFutureRoute } from "./indexability";
import {
  assertMetadataTextSafe,
  buildRouteMetadataUrlFields,
} from "./metadata-helpers";
import {
  getApprovedRouteMetadataEmissionBlockReasons,
  getRoutePublicationGateBlockReasons,
} from "./source-records";
import type {
  BuildRouteMetadataInput,
  RoutePublicationGateInput,
  RouteMetadataRobotsPolicy,
} from "./metadata-types";
import { PRESIDENTIAL_NAME, PRODUCTION_ORIGIN } from "./schema/constants";
import type { SeoRouteRecord } from "./route-types";

export const METADATA_BASE = new URL(PRODUCTION_ORIGIN);
export const OPEN_GRAPH_SITE_NAME = PRESIDENTIAL_NAME;
export const TWITTER_CARD_TYPE = "summary" as const;

export function isRouteMetadataIndexable(
  route: SeoRouteRecord,
  gateInput: RoutePublicationGateInput = {},
): boolean {
  return (
    route.status === "approved" &&
    isIndexFollow(route) &&
    route.blocks.length === 0 &&
    getRoutePublicationGateBlockReasons(
      route,
      gateInput.routePublicationRecords,
      gateInput.routePublicationContext,
    ).length === 0
  );
}

export function buildRouteRobots(
  route: SeoRouteRecord,
  gateInput: RoutePublicationGateInput = {},
): RouteMetadataRobotsPolicy {
  const index = isRouteMetadataIndexable(route, gateInput);
  const follow =
    index ||
    (route.indexability === "conditional_index" && !isPrivateOrFutureRoute(route));

  return {
    index,
    follow,
    googleBot: {
      index,
      follow,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  };
}

export function buildRouteMetadata(input: BuildRouteMetadataInput): Metadata {
  const route = input.route;
  const title = assertMetadataTextSafe(input.title ?? route.title, "title");
  const description = assertMetadataTextSafe(
    input.description ?? route.description,
    "description",
  );
  const { canonical, openGraphUrl } = buildRouteMetadataUrlFields(input);
  const gateInput = {
    routePublicationRecords: input.routePublicationRecords,
    routePublicationContext: input.routePublicationContext,
  };
  const socialPreviewApproved = isRouteMetadataIndexable(route, gateInput);
  const robots = buildRouteRobots(route, gateInput);
  const metadataEmissionBlockReasons =
    getApprovedRouteMetadataEmissionBlockReasons(
      route,
      {
        title,
        description,
        canonicalUrl: canonical,
        robotsDirective:
          robots.index && robots.follow ? "index_follow" : "noindex_follow",
        h1: route.h1,
        ogTitle: title,
        ogDescription: description,
      },
      input.routePublicationRecords,
      input.routePublicationContext,
    );

  if (socialPreviewApproved && metadataEmissionBlockReasons.length > 0) {
    throw new Error(
      `Approved route metadata emission mismatch: ${metadataEmissionBlockReasons.join(", ")}`,
    );
  }

  return {
    metadataBase: METADATA_BASE,
    title,
    description,
    alternates: {
      canonical,
    },
    robots,
    ...(socialPreviewApproved
      ? {
          openGraph: {
            title,
            description,
            url: openGraphUrl,
            siteName: OPEN_GRAPH_SITE_NAME,
            type: "website",
          },
          twitter: {
            card: TWITTER_CARD_TYPE,
            title,
            description,
          },
        }
      : {}),
  };
}
