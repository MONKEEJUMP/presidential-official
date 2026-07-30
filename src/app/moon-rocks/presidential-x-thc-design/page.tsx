import type { Metadata } from "next";

import { SeriesPageShell } from "@/components/presidential/modules/series-page-shell";
import { getCatalogSeriesBySlug } from "@/lib/catalog/series-registry";
import {
  buildStaticRouteMetadata,
  getStaticRouteRecord,
} from "@/lib/seo/route-page";

const ROUTE_PATH = "/moon-rocks/presidential-x-thc-design" as const;
const SERIES = getCatalogSeriesBySlug("presidential-x-thc-design");

export function generateMetadata(): Metadata {
  return buildStaticRouteMetadata(ROUTE_PATH);
}

export default function PresidentialThcDesignSeriesPage() {
  return (
    <SeriesPageShell
      definition={SERIES}
      route={getStaticRouteRecord(ROUTE_PATH)}
    />
  );
}
