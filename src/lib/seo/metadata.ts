import type { Metadata } from "next";

import { isIndexFollow, isPrivateOrFutureRoute } from "./indexability";
import {
  assertMetadataTextSafe,
  buildRouteMetadataUrlFields,
} from "./metadata-helpers";
import { getRoutePublicationGateBlockReasons } from "./source-records";
import type {
  BuildRouteMetadataInput,
  RouteMetadataRobotsPolicy,
} from "./metadata-types";
import { PRESIDENTIAL_NAME, PRODUCTION_ORIGIN } from "./schema/constants";
import type { SeoRouteRecord } from "./route-types";

export const METADATA_BASE = new URL(PRODUCTION_ORIGIN);
export const OPEN_GRAPH_SITE_NAME = PRESIDENTIAL_NAME;
export const TWITTER_CARD_TYPE = "summary" as const;

export function isRouteMetadataIndexable(route: SeoRouteRecord): boolean {
  return (
    route.status === "approved" &&
    isIndexFollow(route) &&
    route.blocks.length === 0 &&
    getRoutePublicationGateBlockReasons(route).length === 0
  );
}

export function buildRouteRobots(
  route: SeoRouteRecord,
): RouteMetadataRobotsPolicy {
  const index = isRouteMetadataIndexable(route);
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
  const socialPreviewApproved = isRouteMetadataIndexable(route);

  return {
    metadataBase: METADATA_BASE,
    title,
    description,
    alternates: {
      canonical,
    },
    robots: buildRouteRobots(route),
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
