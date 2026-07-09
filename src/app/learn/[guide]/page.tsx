import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  PageFrame,
  Scene,
  SceneStack,
} from "@/components/presidential";
import { CtaLink } from "@/components/presidential/primitives/cta-link";
import { SectionHeading } from "@/components/presidential/primitives/section-heading";
import { readPublicRenderableLearnGuide } from "@/lib/cms";
import { readDraftLearnGuide } from "@/lib/cms/learn-guide-drafts";

import { LearnGuideCmsBody } from "./learn-guide-cms-body";

type LearnGuidePageProps = {
  readonly params: Promise<{
    readonly guide: string;
  }>;
};

type LearnGuideFallback = {
  readonly slug: string;
  readonly title: string;
  readonly topic: string;
  readonly intro: string;
};

const LEARN_GUIDE_DRAFT_RENDER_ENABLE_ENV = "PRESIDENTIAL_LEARN_GUIDE_DRAFT_RENDERING_ENABLED";

const learnGuideFallbacks: readonly LearnGuideFallback[] = [
  {
    slug: "what-are-moon-rocks",
    title: "What Are Moon Rocks",
    topic: "Moon Rocks",
    intro: "A source-backed education path for Moon Rocks terminology, product context, and future approved copy.",
  },
  {
    slug: "what-is-live-resin",
    title: "What Is Live Resin",
    topic: "Live Resin",
    intro: "A neutral guide shell for extract terminology and future source-backed explainer copy.",
  },
  {
    slug: "what-is-live-rosin",
    title: "What Is Live Rosin",
    topic: "Live Rosin",
    intro: "A neutral guide shell for extract terminology and future source-backed explainer copy.",
  },
  {
    slug: "what-are-liquid-diamonds",
    title: "What Are Liquid Diamonds",
    topic: "Liquid Diamonds",
    intro: "A neutral guide shell for extract terminology and future source-backed explainer copy.",
  },
  {
    slug: "flavor-science",
    title: "Flavor Science",
    topic: "Flavor Science",
    intro: "A source-linked education path for flavor-system context connected to Moon Pods planning.",
  },
  {
    slug: "infusion-science",
    title: "Infusion Science",
    topic: "Infusion Science",
    intro: "A source-linked guide shell for infusion terminology and Presidential product context.",
  },
  {
    slug: "different-extracts-need-different-heat",
    title: "Different Extracts Need Different Heat",
    topic: "Extract Heat",
    intro: "A neutral education shell for extract handling concepts and future reviewed guidance.",
  },
] as const;

function getFallbackGuide(slug: string): LearnGuideFallback | null {
  return learnGuideFallbacks.find((guide) => guide.slug === slug) || null;
}

function isLearnGuideDraftRenderingEnabled(): boolean {
  return process.env[LEARN_GUIDE_DRAFT_RENDER_ENABLE_ENV] === "true";
}

export const dynamicParams = false;

export function generateStaticParams() {
  return learnGuideFallbacks.map((guide) => ({ guide: guide.slug }));
}

export async function generateMetadata({ params }: LearnGuidePageProps): Promise<Metadata> {
  const { guide: slug } = await params;
  const fallback = getFallbackGuide(slug);

  if (!fallback) {
    return {};
  }

  const guide = await readPublicRenderableLearnGuide(slug, {
    next: { tags: [`sanity-learn-guide-${slug}`] },
  });
  const title = guide.record?.title || fallback.title;
  const description = guide.record?.intro || fallback.intro;

  return {
    title: `${title} | Presidential Learn`,
    description,
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function LearnGuidePage({ params }: LearnGuidePageProps) {
  const { guide: slug } = await params;
  const fallback = getFallbackGuide(slug);

  if (!fallback) {
    notFound();
  }

  const draftGuide = isLearnGuideDraftRenderingEnabled()
    ? await readDraftLearnGuide(slug, {
        next: { tags: [`sanity-draft-learn-guide-${slug}`] },
      })
    : null;
  const guide = draftGuide?.ok && draftGuide.result
    ? {
        enabled: true,
        record: draftGuide.result,
        modules: draftGuide.result.bodyModules || [],
      }
    : await readPublicRenderableLearnGuide(slug, {
        next: { tags: [`sanity-learn-guide-${slug}`] },
      });
  const renderedTitle = guide.record?.title || fallback.title;
  const renderedIntro = guide.record?.intro || fallback.intro;
  const modules = guide.modules;

  return (
    <PageFrame>
      <SceneStack>
        <Scene ariaLabelledBy="presidential-learn-guide-title" tone="default">
          <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.5fr)] lg:items-start">
            <div className="grid gap-6">
              <SectionHeading
                as="h1"
                description={renderedIntro}
                id="presidential-learn-guide-title"
                kicker="Presidential Learn"
                title={renderedTitle}
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
              <p className="text-xs font-semibold uppercase tracking-normal text-po-brand">
                Topic
              </p>
              <p className="mt-3 text-xl font-semibold text-po-ink">
                {guide.record?.guideTopic || fallback.topic}
              </p>
              <p className="mt-4 text-sm leading-6 text-po-body">
                Adults 21+ where legal. Guide content is informational.
              </p>
            </aside>
          </div>
        </Scene>

        {modules.length ? (
          <LearnGuideCmsBody modules={modules} />
        ) : (
          <Scene ariaLabelledBy="presidential-learn-guide-foundation" tone="quiet">
            <div className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-2">
              <article className="border border-po-line bg-po-canvas p-5">
                <h2 className="text-2xl font-semibold text-po-ink" id="presidential-learn-guide-foundation">
                  Guide foundation
                </h2>
                <p className="mt-4 text-sm leading-6 text-po-body">
                  This guide route is ready for CMS body modules once the Sanity
                  guide record is promoted into the render path.
                </p>
              </article>
              <article className="border border-po-line bg-po-canvas p-5">
                <h2 className="text-2xl font-semibold text-po-ink">
                  Source path
                </h2>
                <p className="mt-4 text-sm leading-6 text-po-body">
                  Each guide can connect source records, claim review, related
                  products, and final metadata without changing the route shape.
                </p>
              </article>
            </div>
          </Scene>
        )}
      </SceneStack>
    </PageFrame>
  );
}
