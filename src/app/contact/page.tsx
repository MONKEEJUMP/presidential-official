import type { Metadata } from "next";

import { PresidentialRouteShell } from "@/components/seo/presidential-route-shell";
import {
  buildStaticRouteMetadata,
  getStaticRouteRecord,
} from "@/lib/seo/route-page";

const ROUTE_PATH = "/contact" as const;

export function generateMetadata(): Metadata {
  return buildStaticRouteMetadata(ROUTE_PATH);
}

export default function ContactPage() {
  const route = getStaticRouteRecord(ROUTE_PATH);

  return <PresidentialRouteShell route={route} />;
}

