import type { SeoRouteRecord } from "@/lib/seo/route-types";

import { PageFrame } from "../layout/page-frame";
import { Scene } from "../layout/scene";
import { SceneStack } from "../layout/scene-stack";
import { SiteVideo } from "../media/site-video";
import { CtaLink } from "../primitives/cta-link";
import { BentolioHeroShell } from "./bentolio-hero-shell";
import { FindUsCtaShell } from "./find-us-cta-shell";
import { UsMapShell } from "./us-map-shell";

type HomepageFoundationShellProps = {
  readonly route: SeoRouteRecord;
};

const proofPoints = [
  {
    title: "Official source",
    body: "One first-party home for Presidential, its product platforms, and the stories behind them.",
  },
  {
    title: "Product clarity",
    body: "Dedicated paths connect Moon Rocks, Moon Pods, Orbit, and approved learning content.",
  },
  {
    title: "Licensed retail path",
    body: "Retail discovery stays grounded in verified records and adult-use availability.",
  },
] as const;

const brandChapters = [
  {
    title: "Then",
    body: "Presidential built its name on Moon Rocks and a generation of cannabis culture.",
  },
  {
    title: "Now",
    body: "The brand, product platforms, and learning path live together in one official home.",
  },
  {
    title: "Next",
    body: "A connected experience moves from product discovery to licensed retail information.",
  },
] as const;

const secondaryPlatforms = [
  {
    title: "Moon Pods",
    href: "/moon-pods",
    body: "A dedicated lane for product information, approved visual storytelling, and connected learning.",
    action: "Explore Moon Pods",
    tone: "brand",
  },
  {
    title: "Orbit",
    href: "/orbit",
    body: "A supporting product and technology lane within the broader Presidential ecosystem.",
    action: "Explore Orbit",
    tone: "silver",
  },
] as const;

export function HomepageFoundationShell({ route }: HomepageFoundationShellProps) {
  if (route.id !== "home" || route.path !== "/") {
    throw new Error("HomepageFoundationShell requires the home route record.");
  }

  return (
    <PageFrame>
      <SceneStack>
        {/* 4187-CODE (owner template order, 2026-07-11): Bentolio bento
            hero supersedes the prior homepage hero. Map section below stays. */}
        <BentolioHeroShell route={route} />

        <Scene
          ariaLabelledBy="presidential-homepage-map"
          className="py-24 lg:py-32"
          tone="contrast"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-14 lg:grid-cols-[minmax(0,0.7fr)_minmax(420px,0.8fr)] lg:items-center lg:gap-20">
            <div>
              <p className="text-xs font-black uppercase text-po-brand">
                Coast to coast
              </p>
              <h2
                className="mt-5 font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-6xl"
                id="presidential-homepage-map"
              >
                Find Presidential near you
              </h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-po-on-dark-muted">
                Eight priority markets, each with its own Presidential
                experience. Choose a state to step inside.
              </p>
              <div className="mt-8 max-w-sm overflow-hidden border border-po-on-dark/20">
                <SiteVideo
                  className="aspect-video w-full object-cover"
                  label="Presidential nationwide film loop"
                  slug="nationwide-map"
                />
              </div>
            </div>
            <UsMapShell />
          </div>
        </Scene>

        <Scene
          ariaLabelledBy="presidential-expect-more"
          className="py-24 lg:py-32"
          tone="default"
        >
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[minmax(260px,0.55fr)_1fr] lg:gap-20">
              <div>
                <h2
                  className="font-display text-4xl uppercase leading-[0.92] text-po-ink sm:text-6xl"
                  id="presidential-expect-more"
                >
                  Expect more.
                </h2>
                <p className="mt-6 max-w-md text-base leading-7 text-po-body">
                  Presidential connects the product story, the proof path, and
                  retail discovery without losing the culture that built it.
                </p>
              </div>
              <div className="grid gap-10 sm:grid-cols-3">
                {proofPoints.map((point, index) => (
                  <article className="border-t border-po-ink pt-5" key={point.title}>
                    <p className="text-xs font-black text-po-brand-ink">
                      0{index + 1}
                    </p>
                    <h3 className="mt-10 text-xl font-semibold leading-snug text-po-ink">
                      {point.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-po-body">
                      {point.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </Scene>

        <Scene
          ariaLabelledBy="presidential-then-now-next"
          className="py-24 lg:py-32"
          tone="contrast"
        >
          <div className="mx-auto w-full max-w-7xl">
            <h2
              className="max-w-5xl font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-6xl lg:text-7xl"
              id="presidential-then-now-next"
            >
              <span className="block text-po-brand">World&#39;s Strongest™</span>
              <span className="mt-2 block">Then. Now. Next.</span>
            </h2>
            <div className="mt-16 grid border-t border-po-on-dark/20 md:grid-cols-3">
              {brandChapters.map((chapter, index) => (
                <article
                  className="border-b border-po-on-dark/20 py-8 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
                  key={chapter.title}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-3xl uppercase text-po-on-dark">
                      {chapter.title}
                    </h3>
                    <span className="text-xs font-black text-po-brand">0{index + 1}</span>
                  </div>
                  <p className="mt-8 max-w-sm text-sm leading-6 text-po-on-dark-muted">
                    {chapter.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </Scene>

        <Scene
          ariaLabelledBy="presidential-act-moon-rocks"
          className="py-24 lg:py-32"
          tone="default"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[minmax(0,0.78fr)_minmax(420px,1fr)] lg:items-center lg:gap-20">
            <div className="max-w-xl">
              <p className="text-sm font-bold text-po-brand-ink">Moon Rocks™</p>
              <h2
                className="mt-5 font-display text-4xl uppercase leading-[0.92] text-po-ink sm:text-6xl"
                id="presidential-act-moon-rocks"
              >
                The Highest Form Of Cannabis.
              </h2>
              <p className="mt-6 text-base leading-7 text-po-body">
                The flagship Presidential platform for Moon Rocks, infused
                pre-rolls, blunts, education, and retail discovery.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <CtaLink href="/moon-rocks" variant="primary">
                  Explore Moon Rocks
                </CtaLink>
                <CtaLink href="/learn" variant="text">
                  Learn about Moon Rocks
                </CtaLink>
              </div>
            </div>
            <figure className="relative overflow-hidden border border-po-line bg-po-brand">
              <SiteVideo
                className="aspect-[1200/630] w-full object-cover"
                label="Presidential Moon Rocks film loop"
                slug="moon-rocks-film"
              />
            </figure>
          </div>
        </Scene>

        <section
          aria-label="Presidential product platforms"
          className="grid lg:grid-cols-2"
        >
          {secondaryPlatforms.map((platform) => (
            <article
              className={[
                "flex min-h-[28rem] flex-col justify-between gap-16 px-6 py-16 sm:px-10 lg:px-16 lg:py-20",
                platform.tone === "brand"
                  ? "bg-po-brand text-po-ink"
                  : "bg-po-silver text-po-ink",
              ].join(" ")}
              key={platform.title}
            >
              <p className="text-sm font-bold uppercase">Presidential platform</p>
              <div className="max-w-xl">
                <h2 className="font-display text-5xl uppercase leading-[0.9] sm:text-6xl">
                  {platform.title}
                </h2>
                <p className="mt-6 max-w-md text-base leading-7 text-po-body">
                  {platform.body}
                </p>
                <div className="mt-8">
                  <CtaLink
                    className="border-po-ink text-po-ink hover:border-po-ink hover:bg-po-ink hover:text-po-on-dark"
                    href={platform.href}
                    variant="secondary"
                  >
                    {platform.action}
                  </CtaLink>
                </div>
              </div>
            </article>
          ))}
        </section>

        <FindUsCtaShell />
      </SceneStack>
    </PageFrame>
  );
}
