import type { Metadata } from "next";

import { ContactSalesExperience } from "@/components/presidential/contact/contact-sales-experience";
import { PageFrame } from "@/components/presidential/layout/page-frame";
import {
  buildStaticRouteMetadata,
  getStaticRouteRecord,
} from "@/lib/seo/route-page";
import { buildRouteShellJsonLd, JsonLd } from "@/lib/seo/schema";

const ROUTE_PATH = "/contact" as const;

export function generateMetadata(): Metadata {
  return buildStaticRouteMetadata(ROUTE_PATH);
}

export default function ContactPage() {
  const route = getStaticRouteRecord(ROUTE_PATH);
  const jsonLdEntries = buildRouteShellJsonLd(route);

  return (
    <>
      {jsonLdEntries.map((entry) => (
        <JsonLd data={entry.data} key={`${route.id}-${entry.id}`} />
      ))}
      <PageFrame className="bg-[#030807]">
        <ContactSalesExperience />
      </PageFrame>
    </>
  );
}
