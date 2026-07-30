import type { Metadata } from "next";

import { SeriesPageShell } from "@/components/presidential/modules/series-page-shell";
import { getCatalogSeriesBySlug } from "@/lib/catalog/series-registry";
import {
  buildStaticRouteMetadata,
  getStaticRouteRecord,
} from "@/lib/seo/route-page";

const ROUTE_PATH = "/moon-rocks/presidential-house-line" as const;
const SERIES = getCatalogSeriesBySlug("presidential-house-line");

export function generateMetadata(): Metadata {
  return buildStaticRouteMetadata(ROUTE_PATH);
}

export default function PresidentialHouseLineSeriesPage() {
  return (
    <SeriesPageShell
      definition={SERIES}
      route={getStaticRouteRecord(ROUTE_PATH)}
    />
  );
}
