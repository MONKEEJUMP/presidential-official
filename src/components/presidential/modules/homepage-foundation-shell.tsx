import type { SeoRouteRecord } from "@/lib/seo/route-types";

import { PageFrame } from "../layout/page-frame";
import { Scene } from "../layout/scene";
import { SceneStack } from "../layout/scene-stack";
import { CtaLink } from "../primitives/cta-link";
import { FindUsCtaShell } from "./find-us-cta-shell";

type HomepageFoundationShellProps = {
  readonly route: SeoRouteRecord;
};

const productPillars = [
  {
    title: "Moon Rocks",
    href: "/moon-rocks",
    body: "The flagship Presidential product platform for Moon Rocks, infused pre-rolls, blunts, education, and retail discovery.",
    label: "Flagship platform",
  },
  {
    title: "Moon Pods",
    href: "/moon-pods",
    body: "A dedicated product lane for Moon Pods information, approved visual storytelling, and connected learning paths.",
    label: "Product lane",
  },
  {
    title: "Orbit",
    href: "/orbit",
    body: "A supporting product and technology lane connected to the broader Presidential ecosystem.",
    label: "Technology lane",
  },
] as const;

const officialPath = [
  "Brand",
  "Products",
  "Learn",
  "Find Us",
  "Contact",
] as const;

const proofPoints = [
  {
    title: "Official source",
    body: "Presidential stays the parent entity across product platforms, learning, and retail discovery.",
  },
  {
    title: "Product clarity",
    body: "Each product platform has a dedicated path for official information, approved assets, and connected learning.",
  },
  {
    title: "Licensed retail path",
    body: "Retail discovery is framed around licensed retailers, verified records, and adult-use compliance language.",
  },
] as const;

const brandChapters = [
  {
    title: "Then",
    body: "Presidential built its name on Moon Rocks and a generation of cannabis culture.",
  },
  {
    title: "Now",
    body: "One official first-party home for the brand, its product platforms, and its learning path.",
  },
  {
    title: "Next",
    body: "A connected ecosystem that moves from brand story to licensed retail discovery.",
  },
] as const;

function HeroStage() {
  return (
    <div className="relative min-h-[32rem] overflow-hidden border border-po-on-dark/15 bg-po-ink p-5 shadow-2xl">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(135deg, color-mix(in srgb, var(--po-color-brand-strong) 90%, transparent), color-mix(in srgb, var(--po-color-ink) 58%, transparent)), url('/brand/banner-palms-teal.webp')",
        }}
      />
      <div className="po-hero-stage-gradient absolute inset-0" />
      <div className="relative z-10 flex h-full flex-col justify-between gap-10">
        <div className="flex items-center justify-between gap-4 border-b border-po-on-dark/15 pb-5">
          <p className="font-display text-xs uppercase tracking-normal text-po-on-dark">
            PRESIDENTIAL
          </p>
          <p className="text-xs font-semibold uppercase tracking-normal text-po-gold">
            Adults 21+ where legal
          </p>
        </div>

        <div className="grid gap-3">
          {productPillars.map((pillar, index) => (
            <div
              className="grid gap-3 border border-po-on-dark/15 bg-po-canvas/10 p-4 sm:grid-cols-[auto_1fr] sm:items-center"
              key={pillar.title}
            >
              <span className="flex h-12 w-12 items-center justify-center border border-po-gold text-sm font-black text-po-gold">
                0{index + 1}
              </span>
              <div>
                <p className="text-lg font-semibold text-po-on-dark">{pillar.title}</p>
                <p className="mt-1 text-sm leading-6 text-po-on-dark-muted">
                  {pillar.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 border border-po-brand/40 bg-po-canvas/10 p-4">
          <p className="text-sm font-semibold text-po-brand">
            Official retail path
          </p>
          <div className="grid grid-cols-5 gap-2" aria-hidden="true">
            {officialPath.map((item) => (
              <span
                className="h-2 bg-po-brand"
                key={item}
                title={item}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomepageFoundationShell({ route }: HomepageFoundationShellProps) {
  if (route.id !== "home" || route.path !== "/") {
    throw new Error("HomepageFoundationShell requires the home route record.");
  }

  return (
    <PageFrame>
      <SceneStack>
        {/* ACT 1 */}
        <Scene
          ariaLabelledBy="presidential-homepage-primary"
          className="flex min-h-[92svh] items-center overflow-hidden"
          tone="contrast"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.86fr)] lg:items-center">
            <div className="flex max-w-3xl flex-col gap-8">
              <div
                aria-label="Presidential logo"
                className="aspect-[1200/929] w-44 bg-contain bg-left bg-no-repeat sm:w-56"
                role="img"
                style={{ backgroundImage: "url('/brand/presidential-logo.webp')" }}
              />
              <div className="flex flex-col gap-6">
                <p className="font-display text-5xl uppercase leading-[0.95] text-po-on-dark sm:text-6xl lg:text-7xl">
                  Cannabis deserves{" "}
                  <span className="text-po-brand">better.</span>
                </p>
                <h1
                  className="text-lg font-semibold leading-8 text-po-brand"
                  id="presidential-homepage-primary"
                >
                  {route.h1}
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-po-on-dark-muted">
                  Cannabis deserves a clearer official source. Presidential now has a first-party digital home for the brand, product platforms, learning path, and licensed retail discovery.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <CtaLink href="/moon-rocks" variant="primary">
                  Enter Moon Rocks
                </CtaLink>
                <CtaLink href="/find-us" variant="contrast">
                  Find Presidential products
                </CtaLink>
              </div>
              <p className="max-w-xl text-sm leading-6 text-po-subtle">
                {route.description} Availability varies by licensed retailer.
              </p>
            </div>

            <HeroStage />
          </div>
        </Scene>

        {/* ACT 2 */}
        <Scene
          ariaLabelledBy="presidential-expect-more"
          className="flex min-h-[85svh] items-center"
          tone="quiet"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[minmax(280px,0.5fr)_1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-po-brand-ink">
                The Presidential standard
              </p>
              <h2
                className="mt-4 font-display text-4xl uppercase leading-[0.95] text-po-ink sm:text-5xl lg:text-6xl"
                id="presidential-expect-more"
              >
                Expect more.
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-po-body">
                One official experience carries the Presidential platforms,
                the learning path, and licensed retail discovery.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {proofPoints.map((point) => (
                <article
                  className="border-t-2 border-po-brand bg-po-canvas p-5 shadow-sm"
                  key={point.title}
                >
                  <h3 className="text-xl font-semibold leading-snug text-po-ink">
                    {point.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-po-body">
                    {point.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </Scene>

        {/* ACT 3 */}
        <Scene
          ariaLabelledBy="presidential-then-now-next"
          className="flex min-h-[85svh] items-center"
          tone="contrast"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-12">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-normal text-po-brand">
                Brand legacy
              </p>
              <h2
                className="mt-4 font-display text-4xl uppercase leading-[0.95] text-po-on-dark sm:text-5xl lg:text-6xl"
                id="presidential-then-now-next"
              >
                <span className="block text-po-brand">World&#39;s Strongest™</span>
                <span className="mt-2 block">Then. Now. Next.</span>
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {brandChapters.map((chapter, index) => (
                <article
                  className="border border-po-on-dark/15 bg-po-canvas/5 p-6"
                  key={chapter.title}
                >
                  <p className="text-xs font-black text-po-brand">0{index + 1}</p>
                  <h3 className="mt-6 font-display text-2xl uppercase text-po-on-dark">
                    {chapter.title}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-po-on-dark-muted">
                    {chapter.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </Scene>

        {/* ACT 4 */}
        <Scene
          ariaLabelledBy="presidential-act-moon-rocks"
          className="flex min-h-[85svh] items-center"
          tone="default"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.8fr)] lg:items-center">
            <div className="flex max-w-2xl flex-col gap-6">
              <p className="text-xs font-semibold uppercase tracking-normal text-po-brand-ink">
                Moon Rocks™
              </p>
              <h2
                className="font-display text-4xl uppercase leading-[0.95] text-po-ink sm:text-5xl lg:text-6xl"
                id="presidential-act-moon-rocks"
              >
                The Highest Form Of Cannabis.
              </h2>
              <p className="text-base leading-7 text-po-body">
                {productPillars[0].body}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <CtaLink href="/moon-rocks" variant="primary">
                  Explore the Moon Rocks platform
                </CtaLink>
                <CtaLink href="/learn" variant="secondary">
                  Learn about Moon Rocks
                </CtaLink>
              </div>
            </div>
            <HeroStage />
          </div>
        </Scene>

        {/* ACT 5 */}
        <Scene
          ariaLabelledBy="presidential-act-moon-pods"
          className="flex min-h-[75svh] items-center"
          tone="quiet"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(280px,0.55fr)_1fr] lg:items-center">
            <div className="flex max-w-xl flex-col gap-6">
              <p className="text-xs font-semibold uppercase tracking-normal text-po-brand-ink">
                Moon Pods™
              </p>
              <h2
                className="font-display text-4xl uppercase leading-[0.95] text-po-ink sm:text-5xl"
                id="presidential-act-moon-pods"
              >
                The Strongest Flavor Experience.
              </h2>
              <p className="text-base leading-7 text-po-body">
                {productPillars[1].body}
              </p>
              <div>
                <CtaLink href="/moon-pods" variant="secondary">
                  Explore Moon Pods
                </CtaLink>
              </div>
            </div>
            <div className="border border-po-brand-line bg-po-brand-soft p-6">
              <p className="text-sm font-semibold text-po-brand-strong">
                Official experience
              </p>
              <p className="mt-3 text-sm leading-6 text-po-body">
                Move from Presidential product platforms to education, retail
                discovery, and contact without leaving the first-party source.
              </p>
            </div>
          </div>
        </Scene>

        {/* ACT 6 */}
        <Scene
          ariaLabelledBy="presidential-act-orbit"
          className="flex min-h-[75svh] items-center"
          tone="contrast"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-normal text-po-brand">
                Orbit™
              </p>
              <h2
                className="mt-4 font-display text-4xl uppercase leading-[0.95] text-po-on-dark sm:text-5xl"
                id="presidential-act-orbit"
              >
                Designed for flavor.
              </h2>
              <p className="mt-6 text-base leading-7 text-po-on-dark-muted">
                {productPillars[2].body}
              </p>
              <div className="mt-8">
                <CtaLink href="/orbit" variant="contrast">
                  Explore Orbit
                </CtaLink>
              </div>
            </div>
          </div>
        </Scene>

        {/* ACT 7 */}
        <Scene ariaLabelledBy="presidential-official-path" tone="quiet">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-po-brand-ink">
                Official Presidential sections
              </p>
              <h2
                className="mt-4 font-display text-3xl uppercase leading-tight text-po-ink sm:text-4xl"
                id="presidential-official-path"
              >
                Find Presidential near you.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-po-body">
                One official path from the brand to licensed retail discovery.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-5">
              {officialPath.map((item, index) => (
                <div className="border border-po-line bg-po-canvas p-4" key={item}>
                  <p className="text-xs font-black text-po-brand-ink">
                    0{index + 1}
                  </p>
                  <p className="mt-8 text-base font-semibold text-po-ink">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Scene>

        <FindUsCtaShell />
      </SceneStack>
    </PageFrame>
  );
}