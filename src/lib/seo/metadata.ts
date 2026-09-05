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

// Route metadata emits absolute URLs; omitting a base prevents Next.js from
// collapsing the homepage's canonical trailing slash.
export const METADATA_BASE = null;
export const OPEN_GRAPH_SITE_NAME = PRESIDENTIAL_NAME;
export const TWITTER_CARD_TYPE = "summary_large_image" as const;

const DEFAULT_SOCIAL_IMAGE = {
  url: `${PRODUCTION_ORIGIN}/social/og-default.png`,
  width: 1200,
  height: 630,
  alt: "Presidential logo",
} as const;

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
  const socialImage = input.socialImage ?? DEFAULT_SOCIAL_IMAGE;
  if (socialPreviewApproved) {
    const imageUrl = new URL(socialImage.url);
    const approvedHost = imageUrl.origin === PRODUCTION_ORIGIN ||
      (imageUrl.origin === "https://cdn.sanity.io" &&
        imageUrl.pathname.startsWith("/images/4bl3xvem/production/"));
    if (!approvedHost || imageUrl.username || imageUrl.password ||
      !Number.isInteger(socialImage.width) || socialImage.width <= 0 ||
      !Number.isInteger(socialImage.height) || socialImage.height <= 0) {
      throw new Error(`Invalid approved social image or dimensions for ${route.path}`);
    }
  }
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
            images: [socialImage],
          },
          twitter: {
            card: TWITTER_CARD_TYPE,
            title,
            description,
            images: [socialImage.url],
          },
        }
      : {}),
  };
}
