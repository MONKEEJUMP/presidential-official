import type { Metadata } from "next";

import { HomeRouteShell } from "@/components/seo/home-route-shell";
import {
  buildStaticRouteMetadata,
  getStaticRouteRecord,
} from "@/lib/seo/route-page";

const ROUTE_PATH = "/" as const;

export function generateMetadata(): Metadata {
  return buildStaticRouteMetadata(ROUTE_PATH);
}

export default function Home() {
  const route = getStaticRouteRecord(ROUTE_PATH);

  return <HomeRouteShell route={route} />;
}
