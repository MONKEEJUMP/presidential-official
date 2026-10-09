import type { Metadata } from "next";

import {
  ClosingStripBand,
  ProductExpressionBand,
} from "@/components/ecosystem/ecosystem-bands";
import { BluntsExperience } from "@/components/presidential/blunts/blunts-experience";
import { AnswerSections } from "@/components/presidential/modules/answer-sections";
import { BLUNT_ANSWERS } from "@/components/presidential/modules/top50-content";
import { buildVaultCardsBySection } from "@/components/vault/format-cards";
import { PageFrame } from "@/components/presidential/layout/page-frame";
import { buildStaticRouteMetadata, getStaticRouteRecord } from "@/lib/seo/route-page";
import { buildRouteShellJsonLd, JsonLd } from "@/lib/seo/schema";

const ROUTE_PATH = "/blunts" as const;

export function generateMetadata(): Metadata {
  return buildStaticRouteMetadata(ROUTE_PATH);
}

export default function BluntsPage() {
  const route = getStaticRouteRecord(ROUTE_PATH);
  const jsonLdEntries = buildRouteShellJsonLd(route);
  return (
    <>
      {jsonLdEntries.map((entry) => <JsonLd data={entry.data} key={`${route.id}-${entry.id}`} />)}
      <PageFrame className="bg-[#06100f]">
        <BluntsExperience
          afterCollection={
            <>
              <AnswerSections eyebrow="Moon Rock blunt questions" id="blunts-answers" items={BLUNT_ANSWERS} />
              <ClosingStripBand scope="blunts" />
            </>
          }
          afterStory={<ProductExpressionBand product="blunts" />}
          vaultCards={buildVaultCardsBySection("blunts")}
        />
      </PageFrame>
    </>
  );
}
