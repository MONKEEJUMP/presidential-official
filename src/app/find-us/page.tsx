import type { Metadata } from "next";

import { PresidentialRouteShell } from "@/components/seo/presidential-route-shell";
import {
  buildStaticRouteMetadata,
  getStaticRouteRecord,
} from "@/lib/seo/route-page";
import { parseLocatorInitialSearch } from "@/lib/locator/inbound-search";

const ROUTE_PATH = "/find-us" as const;

type FindUsPageProps = {
  readonly searchParams: Promise<
    Record<string, string | readonly string[] | undefined>
  >;
};

export function generateMetadata(): Metadata {
  return buildStaticRouteMetadata(ROUTE_PATH);
}

export default async function FindUsPage({ searchParams }: FindUsPageProps) {
  const route = getStaticRouteRecord(ROUTE_PATH);
  const locatorInitialSearch = parseLocatorInitialSearch(await searchParams);

  return (
    <PresidentialRouteShell
      locatorInitialSearch={locatorInitialSearch}
      route={route}
    />
  );
}
