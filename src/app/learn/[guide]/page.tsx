import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  PageFrame,
  Scene,
  SceneStack,
} from "@/components/presidential";
import { AnswerSections } from "@/components/presidential/modules/answer-sections";
import { FindUsCtaShell } from "@/components/presidential/modules/find-us-cta-shell";
import { LEARN_GUIDE_ANSWERS } from "@/components/presidential/modules/learn-guide-answers";
import { RepoOwnedPageCopy } from "@/components/presidential/modules/repo-owned-page-copy";
import Link from "next/link";
import { CtaLink } from "@/components/presidential/primitives/cta-link";
import { SectionHeading } from "@/components/presidential/primitives/section-heading";
import {
  readPublicRenderableLearnGuide,
  readPublicRenderableLearnGuideSlugs,
} from "@/lib/cms";
import { buildLearnGuideSeoRoute } from "@/lib/seo/concrete-routes";
import { APPROVED_PUBLIC_LEARN_GUIDE_ROUTES } from "@/lib/seo/approved-public-routes";
import { buildRouteMetadata } from "@/lib/seo/metadata";
import { buildRouteShellJsonLd, JsonLd } from "@/lib/seo/schema";

import { softenLearnGuideClaims } from "@/lib/cms/learn-guide-claims";
import { REPO_LEARN_GUIDES } from "@/lib/learn/repo-learn-guides";
import { LearnGuideCmsBody } from "./learn-guide-cms-body";

type LearnGuidePageProps = {
  readonly params: Promise<{
    readonly guide: string;
  }>;
};

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await readPublicRenderableLearnGuideSlugs({
    next: { tags: ["sanity-learn-guide-slugs"] },
  });

  const approvedRepoSlugs = APPROVED_PUBLIC_LEARN_GUIDE_ROUTES.map((route) =>
    route.path.replace(/^\/learn\//, ""),
  );
  return Array.from(new Set([...approvedRepoSlugs, ...slugs])).map((guide) => ({ guide }));
}

export async function generateMetadata({ params }: LearnGuidePageProps): Promise<Metadata> {
  const { guide: slug } = await params;
  const guide = await readPublicRenderableLearnGuide(slug, {
    next: { tags: [`sanity-learn-guide-${slug}`] },
  });

  const repoGuide = REPO_LEARN_GUIDES[slug];
  if (!guide.record && repoGuide) {
    const route = APPROVED_PUBLIC_LEARN_GUIDE_ROUTES.find((candidate) => candidate.path === `/learn/${slug}`);
    if (route) return buildRouteMetadata({ route });
  }

  if (!guide.record) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return buildRouteMetadata({
    route: buildLearnGuideSeoRoute(
      {
        title: guide.record.title!,
        intro: guide.record.intro!,
      },
      slug,
    ),
  });
}

export default async function LearnGuidePage({ params }: LearnGuidePageProps) {
  const { guide: slug } = await params;
  const guide = await readPublicRenderableLearnGuide(slug, {
    next: { tags: [`sanity-learn-guide-${slug}`] },
  });

  const repoGuide = REPO_LEARN_GUIDES[slug];
  const repoRoute = APPROVED_PUBLIC_LEARN_GUIDE_ROUTES.find((candidate) => candidate.path === `/learn/${slug}`);
  if (!guide.record && repoGuide && repoRoute) {
    return <RepoLearnGuidePage guide={repoGuide} route={repoRoute} />;
  }

  if (!guide.record || !guide.modules.length) {
    notFound();
  }

  const route = buildLearnGuideSeoRoute(
    { title: guide.record.title!, intro: guide.record.intro! },
    slug,
  );
  const jsonLdEntries = buildRouteShellJsonLd(route);
  const answers = LEARN_GUIDE_ANSWERS[slug];

  return (
    <PageFrame>
      {jsonLdEntries.map((entry) => (
        <JsonLd key={`${route.id}-${entry.id}`} data={entry.data} />
      ))}
      <SceneStack>
        <Scene ariaLabelledBy="presidential-learn-guide-title" tone="default">
          <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.5fr)] lg:items-start">
            <div className="grid gap-6">
              <SectionHeading
                as="h1"
                description={guide.record.intro!}
                id="presidential-learn-guide-title"
                kicker="Presidential Learn"
                title={guide.record.title!}
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <CtaLink href="/learn" variant="secondary">
                  Learn hub
                </CtaLink>
                <CtaLink href="/moon-rocks" variant="secondary">
                  Moon Rocks
                </CtaLink>
              </div>
            </div>
            <aside className="border border-po-line bg-po-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-normal text-po-brand-ink">
                Topic
              </p>
              <p className="mt-3 text-xl font-semibold text-po-ink">
                {guide.record.guideTopic!}
              </p>
              {/* Sitebulb R33 B4: intro under the topic label, with the /about inlink. */}
              {slug === "infusion-science" ? (
                <p className="mt-4 text-sm leading-6 text-po-body">
                  The Presidential Infusion System is the house method of{" "}
                  <Link className="font-semibold underline underline-offset-4" href="/about">Presidential, the Los Angeles cannabis company</Link>:
                  flower first, the series concentrate carried through it, then the finish named on the pack.
                </p>
              ) : null}
              <p className="mt-4 text-sm leading-6 text-po-body">
                Adults 21+ where legal. Guide content is informational.
              </p>
            </aside>
          </div>
        </Scene>

        <LearnGuideCmsBody
          insertAfter={slug === "infusion-science" ? { heading: "What kief adds", node: <InfusionPracticeBlock /> } : undefined}
          modules={softenLearnGuideClaims(slug, guide.modules)}
          sourcePath={`/learn/${slug}`}
        />
        {slug === "different-extracts-need-different-heat" ? <ExtractSeriesBlock /> : null}
        <SurferR44LearnBlock slug={slug} />
        {answers ? (
          <AnswerSections eyebrow={answers.eyebrow} id={`learn-${slug}-answers`} items={answers.items} />
        ) : null}
        {slug === "what-are-moon-rocks" ? (
          <RepoOwnedPageCopy path="/learn/what-are-moon-rocks" />
        ) : null}
        {slug === "flavor-science" ? (
          <RepoOwnedPageCopy path="/learn/flavor-science" />
        ) : null}
        <FindUsCtaShell
          className="po-gold-thread-inlay"
          compact
          sourcePath={`/learn/${slug}`}
        />
      </SceneStack>
    </PageFrame>
  );
}

// SURFER-R13: repo-owned guide layout, mirroring the CMS guide page above.
function RepoLearnGuidePage({
  guide,
  route,
}: {
  readonly guide: (typeof REPO_LEARN_GUIDES)[string];
  readonly route: (typeof APPROVED_PUBLIC_LEARN_GUIDE_ROUTES)[number];
}) {
  const jsonLdEntries = buildRouteShellJsonLd(route);
  return (
    <PageFrame>
      {jsonLdEntries.map((entry) => (
        <JsonLd key={`${route.id}-${entry.id}`} data={entry.data} />
      ))}
      <SceneStack>
        <Scene ariaLabelledBy="presidential-learn-guide-title" tone="default">
          <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.5fr)] lg:items-start">
            <div className="grid gap-6">
              <SectionHeading
                as="h1"
                description={guide.intro}
                id="presidential-learn-guide-title"
                kicker="Presidential Learn"
                title={guide.title}
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <CtaLink href="/learn" variant="secondary">
                  Learn hub
                </CtaLink>
                <CtaLink href="/moon-rocks" variant="secondary">
                  Moon Rocks
                </CtaLink>
              </div>
            </div>
            <aside className="border border-po-line bg-po-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-normal text-po-brand-ink">
                Topic
              </p>
              <p className="mt-3 text-xl font-semibold text-po-ink">{guide.guideTopic}</p>
              <p className="mt-4 text-sm leading-6 text-po-body">
                Adults 21+ where legal. Guide content is informational.
              </p>
            </aside>
          </div>
        </Scene>
        <RepoOwnedPageCopy path="/learn/what-is-thc-distillate" />
        <FindUsCtaShell className="po-gold-thread-inlay" compact sourcePath={route.path} />
      </SceneStack>
    </PageFrame>
  );
}

// SURFER-R44: H3 blocks on three CMS learn guides, after the guide sections.
const SURFER_R44_LEARN: Readonly<Record<string, { readonly id: string; readonly heading: string; readonly body: React.ReactNode }>> = {
  "what-is-live-resin": {
    id: "learn-r44-resin-vs-distillate",
    heading: "Live resin compared with refined distillate",
    body: (
      <>
        Live resin and distillate sit at opposite ends of how much plant character survives extraction. Live resin starts from
        plants frozen at harvest, so more of the plant&apos;s aroma carries through. Distillate is refined until it is close to
        neutral, which is why it often pairs with fruit-forward flavor names. The{" "}
        <Link className="font-semibold underline underline-offset-4" href="/learn/what-is-thc-distillate">explainer on how distillate differs from resin</Link> covers that refining step. For how
        those aroma compounds affect what you taste, read{" "}
        <Link className="font-semibold underline underline-offset-4" href="/learn/flavor-science">aroma compounds and how they reach the palate</Link>. The composition line on each pack names
        the extract used.
      </>
    ),
  },
  "what-is-live-rosin": {
    id: "learn-r44-side-by-side",
    heading: "Rosin, resin and distillate side by side",
    body: (
      <>
        Live rosin, live resin, and distillate are easiest to understand side by side. Rosin is pressed with heat and pressure.
        Live resin is extracted from plants frozen at harvest. Distillate is refined until it is close to neutral in aroma. For
        the frozen-harvest method, read about{" "}
        <Link className="font-semibold underline underline-offset-4" href="/learn/what-is-live-resin">frozen-harvest live resin, for comparison</Link>. For the most refined of the three, see{" "}
        <Link className="font-semibold underline underline-offset-4" href="/learn/what-is-thc-distillate">refined distillate, for contrast</Link>. Whichever extract you are curious about, the
        composition line on the pack in hand names what that product uses.
      </>
    ),
  },
  "what-are-liquid-diamonds": {
    id: "learn-r44-diamond-heat",
    heading: "Heat and handling for diamond builds",
    body: (
      <>
        Diamonds and the concentrates around them respond to heat differently from flower alone, so a gentle, even light
        matters. Rushing the flame can scorch the outer layer before the inside catches. The guide to the{" "}
        <Link className="font-semibold underline underline-offset-4" href="/learn/different-extracts-need-different-heat">right temperature for each extract type</Link> explains why each
        concentrate prefers its own range. For background on a concentrate often discussed alongside diamonds, read the{" "}
        <Link className="font-semibold underline underline-offset-4" href="/learn/what-is-live-resin">live resin background guide</Link>. Always check the pack&apos;s printed composition line
        to confirm whether diamonds are part of that build.
      </>
    ),
  },
};

function SurferR44LearnBlock({ slug }: { readonly slug: string }) {
  const block = SURFER_R44_LEARN[slug];
  if (!block) return null;
  return (
    <Scene ariaLabelledBy={block.id} tone="default">
      <div className="mx-auto w-full max-w-3xl">
        <h3 className="text-2xl font-semibold leading-snug text-po-ink" id={block.id}>{block.heading}</h3>
        <p className="mt-4 text-base leading-7 text-po-body">{block.body}</p>
      </div>
    </Scene>
  );
}

// SURFER-R36: /learn/different-extracts-need-different-heat series-to-extract H3, after the CMS guide sections.
function ExtractSeriesBlock() {
  return (
    <Scene ariaLabelledBy="learn-extract-series" tone="default">
      <div className="mx-auto w-full max-w-3xl">
        <h3 className="text-2xl font-semibold leading-snug text-po-ink" id="learn-extract-series">Which extract sits in which series</h3>
        <p className="mt-4 text-base leading-7 text-po-body">
          Each Presidential series is built on one extract, so the heat question starts with the series name. Silver uses
          distillate, a refined concentrate. Gold uses live resin, made from cannabis frozen at harvest rather than dried first.
          Rose Gold uses live rosin, the solventless extract pressed with ice water, heat, and pressure. Moon Pods come in Liquid
          Diamonds, Live Resin, and Live Rosin pods, which is why a vape setting matters. For the rosin side in detail, read the{" "}
          <Link className="font-semibold underline underline-offset-4" href="/learn/what-is-live-rosin">live rosin primer</Link>. For the
          device that handles pod heat, see the <Link className="font-semibold underline underline-offset-4" href="/orbit">Orbit device page</Link>.
          Start with the label on the exact pack.
        </p>
      </div>
    </Scene>
  );
}

// SURFER-R34 + Sitebulb R34 B25-B27: /learn/infusion-science practice H2, placed after the "What kief adds" CMS section.
// Moon rock line: kief or diamonds by label; lineup concentrates by series.
function InfusionPracticeBlock() {
  return (
    <Scene ariaLabelledBy="learn-infusion-practice" tone="default">
      <div className="mx-auto w-full max-w-3xl">
        <h2 className="text-2xl font-semibold leading-snug text-po-ink" id="learn-infusion-practice">Putting infusion into practice</h2>
        <p className="mt-4 text-base leading-7 text-po-body">
          Infusion is how concentrate and flower become one product. In a Presidential moon rock, flower is carried through with
          concentrate, then finished with kief or diamonds, depending on the label. The concentrate changes by series: distillate,
          live resin, or live rosin. Each one handles heat differently, which is why the{" "}
          <Link className="font-semibold underline underline-offset-4" href="/learn/different-extracts-need-different-heat">guide to extracts and heat</Link>{" "}
          matters for how an infused product burns. For the format itself, start with{" "}
          <Link className="font-semibold underline underline-offset-4" href="/learn/what-are-moon-rocks">the moon rocks explainer</Link>, then
          read the pack&apos;s composition line.
        </p>
      </div>
    </Scene>
  );
}
