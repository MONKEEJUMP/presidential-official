import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  PageFrame,
  Scene,
  SceneStack,
} from "@/components/presidential";
import { RepoOwnedPageCopy } from "@/components/presidential/modules/repo-owned-page-copy";
import { CtaLink } from "@/components/presidential/primitives/cta-link";
import { SectionHeading } from "@/components/presidential/primitives/section-heading";
import {
  readPublicRenderableLearnGuide,
  readPublicRenderableLearnGuideSlugs,
} from "@/lib/cms";
import { buildLearnGuideSeoRoute } from "@/lib/seo/concrete-routes";
import { buildRouteMetadata } from "@/lib/seo/metadata";
import { buildRouteShellJsonLd, JsonLd } from "@/lib/seo/schema";

import { LearnGuideCmsBody } from "./learn-guide-cms-body";

type LearnGuidePageProps = {
  readonly params: Promise<{
    readonly guide: string;
  }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await readPublicRenderableLearnGuideSlugs({
    next: { tags: ["sanity-learn-guide-slugs"] },
  });

  return slugs.map((guide) => ({ guide }));
}

export async function generateMetadata({ params }: LearnGuidePageProps): Promise<Metadata> {
  const { guide: slug } = await params;
  const guide = await readPublicRenderableLearnGuide(slug, {
    next: { tags: [`sanity-learn-guide-${slug}`] },
  });

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

  if (!guide.record || !guide.modules.length) {
    notFound();
  }

  const route = buildLearnGuideSeoRoute(
    { title: guide.record.title!, intro: guide.record.intro! },
    slug,
  );
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
              <p className="mt-4 text-sm leading-6 text-po-body">
                Adults 21+ where legal. Guide content is informational.
              </p>
            </aside>
          </div>
        </Scene>

        <LearnGuideCmsBody
          modules={guide.modules}
          sourcePath={`/learn/${slug}`}
        />
        {slug === "what-are-moon-rocks" ? (
          <RepoOwnedPageCopy path="/learn/what-are-moon-rocks" />
        ) : null}
      </SceneStack>
    </PageFrame>
  );
}
