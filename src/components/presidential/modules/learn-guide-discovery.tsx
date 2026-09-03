import Link from "next/link";

import {
  readPublicRenderableLearnGuideSummaries,
  type SanityLearnGuideSummaryRecord,
} from "@/lib/cms/learn-guide";
import { hardcodeInContentLinks } from "@/lib/seo/in-content-links";

import { Scene } from "../layout/scene";
import { InContentText } from "../primitives/in-content-text";

const PARENT_GUIDE_SLUGS = {
  "/moon-rocks": "what-are-moon-rocks",
  "/moon-rocks/gold": "what-is-live-resin",
  "/moon-rocks/rose-gold": "what-is-live-rosin",
  "/moon-rocks/silver": "what-are-liquid-diamonds",
  "/about": "infusion-science",
  "/vapes": "flavor-science",
  "/orbit": "different-extracts-need-different-heat",
} as const;

function GuideCard({
  guide,
  sourcePath,
}: {
  readonly guide: SanityLearnGuideSummaryRecord;
  readonly sourcePath?: string;
}) {
  const hasApprovedIntroLink = Boolean(
    sourcePath && hardcodeInContentLinks(sourcePath, guide.intro) !== guide.intro,
  );
  const cardClassName =
    "po-teal-pinstripe group block rounded-md bg-po-ink p-7 transition-transform duration-200 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-brand motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:focus-visible:transform-none sm:p-9";

  if (hasApprovedIntroLink && sourcePath) {
    return (
      <article className={cardClassName}>
        <Link
          className="block focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-brand"
          href={`/learn/${guide.slug}`}
        >
          <h2 className="font-display text-3xl uppercase leading-[0.92] text-po-on-dark transition-colors group-hover:text-po-brand sm:text-4xl">
            {guide.title}
          </h2>
        </Link>
        <p className="mt-5 text-base leading-7 text-po-on-dark-muted">
          <InContentText sourcePath={sourcePath} value={guide.intro} />
        </p>
      </article>
    );
  }

  return (
    <Link
      className={cardClassName}
      href={`/learn/${guide.slug}`}
    >
      <h2 className="font-display text-3xl uppercase leading-[0.92] text-po-on-dark transition-colors group-hover:text-po-brand sm:text-4xl">
        {guide.title}
      </h2>
      <p className="mt-5 text-base leading-7 text-po-on-dark-muted">
        {guide.intro}
      </p>
    </Link>
  );
}

async function readGuideSummaries(): Promise<readonly SanityLearnGuideSummaryRecord[]> {
  return readPublicRenderableLearnGuideSummaries({
    next: { tags: ["sanity-learn-guide-summaries"] },
  });
}

export async function LearnGuideIndex() {
  const guides = await readGuideSummaries();

  if (!guides.length) {
    return null;
  }

  return (
    <Scene
      ariaLabel="Presidential Learn guides"
      className="po-gold-thread-inlay py-24 lg:py-32"
      tone="default"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-6 md:grid-cols-2 xl:grid-cols-3">
        {guides.map((guide) => (
          <GuideCard guide={guide} key={guide.slug} />
        ))}
      </div>
    </Scene>
  );
}

export async function ParentLearnGuideLink({
  parentPath,
}: {
  readonly parentPath: string;
}) {
  const guideSlug = PARENT_GUIDE_SLUGS[parentPath as keyof typeof PARENT_GUIDE_SLUGS];

  if (!guideSlug) {
    return null;
  }

  const guides = await readGuideSummaries();
  const guide = guides.find((candidate) => candidate.slug === guideSlug);

  if (!guide) {
    return null;
  }

  return (
    <Scene
      ariaLabel={guide.title}
      className="po-gold-thread-inlay py-20 lg:py-24"
      tone="contrast"
    >
      <div className="mx-auto w-full max-w-7xl">
        <GuideCard guide={guide} sourcePath={parentPath} />
      </div>
    </Scene>
  );
}
