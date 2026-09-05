import type { SeoRoutePath, SeoRouteRecord } from "./route-types";
import type {
  RoutePublicationGateContext,
  RoutePublicationRecord,
} from "./source-records";

export type RoutePublicationGateInput = {
  routePublicationRecords?: readonly RoutePublicationRecord[];
  routePublicationContext?: RoutePublicationGateContext;
};

export type BuildRouteMetadataInput = RoutePublicationGateInput & {
  route: SeoRouteRecord;
  title?: string;
  description?: string;
  canonicalPath?: SeoRoutePath;
  socialImage?: {
    readonly url: string;
    readonly width: number;
    readonly height: number;
    readonly alt?: string;
  };
};

export type RouteMetadataRobotsPolicy = {
  index: boolean;
  follow: boolean;
  googleBot: {
    index: boolean;
    follow: boolean;
    noimageindex: boolean;
    "max-video-preview": -1;
    "max-image-preview": "large";
    "max-snippet": -1;
  };
};

export type MetadataTextField = "title" | "description" | "openGraph" | "twitter";

export type RouteMetadataUrlFields = {
  canonical: string;
  openGraphUrl: string;
};
