import type { Metadata } from "next";

import { SeriesPageShell } from "@/components/presidential/modules/series-page-shell";
import {
  buildCatalogSeriesMetadata,
  getCatalogSeriesBySlug,
} from "@/lib/catalog/series-registry";

const SERIES = getCatalogSeriesBySlug("presidential-line");

export function generateMetadata(): Metadata {
  return buildCatalogSeriesMetadata(SERIES);
}

export default function PresidentialLineSeriesPage() {
  return <SeriesPageShell definition={SERIES} />;
}
