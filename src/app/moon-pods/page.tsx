import type { Metadata } from "next";

import { PresidentialRouteShell } from "@/components/seo/presidential-route-shell";
import {
  buildStaticRouteMetadata,
  getStaticRouteRecord,
} from "@/lib/seo/route-page";

const ROUTE_PATH = "/moon-pods" as const;

export function generateMetadata(): Metadata {
  return buildStaticRouteMetadata(ROUTE_PATH);
}

export default function MoonPodsPage() {
  const route = getStaticRouteRecord(ROUTE_PATH);

  return <PresidentialRouteShell route={route} />;
}

