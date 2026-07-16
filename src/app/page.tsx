import type { Metadata } from "next";

import { HomeRouteShell } from "@/components/seo/home-route-shell";
import { parseLocatorInitialSearch } from "@/lib/locator/inbound-search";
import {
  buildStaticRouteMetadata,
  getStaticRouteRecord,
} from "@/lib/seo/route-page";

const ROUTE_PATH = "/" as const;

type HomePageProps = {
  readonly searchParams: Promise<
    Record<string, string | readonly string[] | undefined>
  >;
};

export function generateMetadata(): Metadata {
  return buildStaticRouteMetadata(ROUTE_PATH);
}

export default async function Home({ searchParams }: HomePageProps) {
  const route = getStaticRouteRecord(ROUTE_PATH);
  const locatorInitialSearch = parseLocatorInitialSearch(await searchParams);

  return (
    <HomeRouteShell
      locatorInitialSearch={locatorInitialSearch}
      route={route}
    />
  );
}
