import type { Metadata } from "next";

import {
  ClosingStripBand,
  ProductExpressionBand,
} from "@/components/ecosystem/ecosystem-bands";
import { PageFrame } from "@/components/presidential/layout/page-frame";
import { AnswerSections } from "@/components/presidential/modules/answer-sections";
import { PRE_ROLL_ANSWERS } from "@/components/presidential/modules/salvage-content";
import { PreRollExperience } from "@/components/presidential/prerolls/preroll-experience";
import { buildVaultCardsBySection } from "@/components/vault/format-cards";
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
          afterCollection={
            <>
              <AnswerSections eyebrow="Presidential pre-roll questions" id="pre-rolls-answers" items={PRE_ROLL_ANSWERS} />
              <ClosingStripBand scope="pre-rolls" />
            </>
          }
          afterStory={<ProductExpressionBand product="pre-rolls" />}
          vaultCards={buildVaultCardsBySection("pre-rolls")}
        />
      </PageFrame>
    </>
  );
}
