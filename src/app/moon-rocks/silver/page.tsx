import type { Metadata } from "next";

import { SeriesPageShell } from "@/components/presidential/modules/series-page-shell";
import {
  buildStaticRouteMetadata,
  getStaticRouteRecord,
} from "@/lib/seo/route-page";

const ROUTE_PATH = "/moon-rocks/silver" as const;

export function generateMetadata(): Metadata {
  return buildStaticRouteMetadata(ROUTE_PATH);
}

export default function SilverSeriesPage() {
  const route = getStaticRouteRecord(ROUTE_PATH);

  return <SeriesPageShell route={route} seriesName="Silver Flavor Series" />;
}
