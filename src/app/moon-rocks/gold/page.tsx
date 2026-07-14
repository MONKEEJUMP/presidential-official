import type { Metadata } from "next";

import { SeriesPageShell } from "@/components/presidential/modules/series-page-shell";
import { getCatalogSeriesBySlug } from "@/lib/catalog/series-registry";
import {
  buildStaticRouteMetadata,
  getStaticRouteRecord,
} from "@/lib/seo/route-page";

const ROUTE_PATH = "/moon-rocks/gold" as const;
const SERIES = getCatalogSeriesBySlug("gold");

export function generateMetadata(): Metadata {
  return buildStaticRouteMetadata(ROUTE_PATH);
}

export default function GoldSeriesPage() {
  const route = getStaticRouteRecord(ROUTE_PATH);

  return <SeriesPageShell definition={SERIES} route={route} />;
}
