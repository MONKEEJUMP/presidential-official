import type { SeoRoutePath, SeoRouteRecord } from "./route-types";

export type BuildRouteMetadataInput = {
  route: SeoRouteRecord;
  title?: string;
  description?: string;
  canonicalPath?: SeoRoutePath;
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
