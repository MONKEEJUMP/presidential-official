import type { Metadata } from "next";

import {
  ClosingStripBand,
  ProductExpressionBand,
} from "@/components/ecosystem/ecosystem-bands";
import { PageFrame } from "@/components/presidential/layout/page-frame";
import { PreRollExperience } from "@/components/presidential/prerolls/preroll-experience";
import {
  buildRouteShellJsonLd,
  JsonLd,
} from "@/lib/seo/schema";
import {
  buildStaticRouteMetadata,
  getStaticRouteRecord,
} from "@/lib/seo/route-page";

const ROUTE_PATH = "/pre-rolls" as const;

export function generateMetadata(): Metadata {
  return buildStaticRouteMetadata(ROUTE_PATH);
}

export default function PreRollsPage() {
  const route = getStaticRouteRecord(ROUTE_PATH);
  const jsonLdEntries = buildRouteShellJsonLd(route);

  return (
    <>
      {jsonLdEntries.map((entry) => (
        <JsonLd data={entry.data} key={`${route.id}-${entry.id}`} />
      ))}
      <PageFrame className="bg-[#06100f]">
        <PreRollExperience
          afterCollection={<ClosingStripBand scope="pre-rolls" />}
          afterStory={<ProductExpressionBand product="pre-rolls" />}
        />
      </PageFrame>
    </>
  );
}
