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

function HeroStage() {
  return (
    <div className="relative min-h-[32rem] overflow-hidden border border-white/15 bg-zinc-900 p-5 shadow-2xl">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,185,129,0.22),transparent_42%),linear-gradient(315deg,rgba(251,191,36,0.22),transparent_38%)]" />
      <div className="relative z-10 flex h-full flex-col justify-between gap-10">
        <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-5">
          <p className="text-xs font-black uppercase tracking-normal text-white">
            PRESIDENTIAL
          </p>
          <p className="text-xs font-semibold uppercase tracking-normal text-amber-200">
            Adults 21+ where legal
          </p>
        </div>

        <div className="grid gap-3">
          {productPillars.map((pillar, index) => (
            <div
              className="grid gap-3 border border-white/15 bg-white/10 p-4 sm:grid-cols-[auto_1fr] sm:items-center"
              key={pillar.title}
            >
              <span className="flex h-12 w-12 items-center justify-center border border-amber-200/70 text-sm font-black text-amber-200">
                0{index + 1}
              </span>
              <div>
                <p className="text-lg font-semibold text-white">{pillar.title}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-300">
                  {pillar.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 border border-emerald-300/40 bg-emerald-300/10 p-4">
          <p className="text-sm font-semibold text-white">
            Official retail path
          </p>
          <div className="grid grid-cols-5 gap-2" aria-hidden="true">
            {officialPath.map((item) => (
              <span
                className="h-2 bg-amber-200"
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
        <Scene
          ariaLabelledBy="presidential-homepage-primary"
          className="overflow-hidden px-6 py-16 sm:px-10 lg:px-16"
          tone="contrast"
        >
          <div className="mx-auto grid min-h-[42rem] w-full max-w-7xl gap-12 lg:min-h-[48rem] lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.86fr)] lg:items-center">
            <div className="flex max-w-3xl flex-col gap-8">
              <div className="flex flex-col gap-6">
                <h1
                  className="text-5xl font-semibold leading-[0.96] text-white sm:text-6xl lg:text-7xl"
                  id="presidential-homepage-primary"
                >
                  {route.h1}
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-zinc-300">
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
              <p className="max-w-xl text-sm leading-6 text-zinc-400">
                {route.description} Availability varies by licensed retailer.
              </p>
            </div>

            <HeroStage />
          </div>
        </Scene>

        <Scene ariaLabelledBy="presidential-platforms" tone="default">
          <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(280px,0.38fr)_1fr]">
            <div className="max-w-md">
              <h2
                className="text-3xl font-semibold leading-tight text-zinc-950 sm:text-4xl"
                id="presidential-platforms"
              >
                Presidential platforms inside one official experience.
              </h2>
              <p className="mt-5 text-base leading-7 text-zinc-700">
                Moon Rocks, Moon Pods, and Orbit move as distinct lanes while
                staying connected to one first-party brand source.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {productPillars.map((pillar) => (
                <article
                  className="flex min-h-80 flex-col justify-between border border-zinc-200 bg-white p-5 shadow-sm"
                  key={pillar.title}
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-normal text-emerald-800">
                      {pillar.label}
                    </p>
                    <h3 className="mt-4 text-2xl font-semibold leading-tight text-zinc-950">
                      {pillar.title}
                    </h3>
                    <p className="mt-4 text-sm leading-6 text-zinc-700">
                      {pillar.body}
                    </p>
                  </div>
                  <div className="mt-8">
                    <CtaLink href={pillar.href} variant="secondary">
                      Explore {pillar.title}
                    </CtaLink>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Scene>

        <Scene ariaLabelledBy="presidential-official-path" tone="quiet">
          <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[1fr_minmax(320px,0.42fr)] lg:items-start">
            <div>
              <h2
                className="text-3xl font-semibold leading-tight text-zinc-950 sm:text-4xl"
                id="presidential-official-path"
              >
                Official Presidential sections
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-700">
                One official path from the brand to licensed retail discovery.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-5">
                {officialPath.map((item, index) => (
                  <div className="border border-zinc-200 bg-white p-4" key={item}>
                    <p className="text-xs font-black text-emerald-800">
                      0{index + 1}
                    </p>
                    <p className="mt-8 text-base font-semibold text-zinc-950">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-zinc-950">
                Official experience
              </p>
              <p className="mt-3 text-sm leading-6 text-zinc-700">
                Move from Presidential product platforms to education, retail
                discovery, and contact without leaving the first-party source.
              </p>
            </div>
          </div>
        </Scene>

        <Scene ariaLabelledBy="presidential-source-proof" tone="default">
          <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(320px,0.45fr)_1fr] lg:items-start">
            <div>
              <h2
                className="text-3xl font-semibold leading-tight text-zinc-950 sm:text-4xl"
                id="presidential-source-proof"
              >
                Built around official source clarity.
              </h2>
              <p className="mt-5 text-base leading-7 text-zinc-700">
                Each section connects brand context, product platforms,
                learning, and licensed retail discovery without unsupported
                claims.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {proofPoints.map((point) => (
                <article
                  className="border border-zinc-200 bg-zinc-50 p-5"
                  key={point.title}
                >
                  <h3 className="text-xl font-semibold leading-snug text-zinc-950">
                    {point.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-700">
                    {point.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </Scene>

        <FindUsCtaShell />
      </SceneStack>
    </PageFrame>
  );
}
