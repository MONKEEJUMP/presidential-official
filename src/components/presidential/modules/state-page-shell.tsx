import Image from "next/image";
import Link from "next/link";

import {
  readDraftCatalogItems,
  readPublicRenderableCatalogItems,
  type SanityCatalogItem,
} from "@/lib/cms/catalog";
import { stateFontClass } from "@/lib/find-us/state-fonts";
import {
  PRESIDENTIAL_STATES,
  type PresidentialState,
  type PresidentialStateTheme,
} from "@/lib/find-us/states";
import { readLocatorStateCount } from "@/lib/locator/state-counts";
import { isLocatorStateCode } from "@/lib/locator/types";

import { PageFrame } from "../layout/page-frame";
import { StateLocatorSection } from "../locator/state-locator-section";
import { Scene } from "../layout/scene";
import { SceneStack } from "../layout/scene-stack";
import { CtaLink } from "../primitives/cta-link";
import { SeriesSelectorShell } from "./catalog-grid-shell";
import { FindUsCtaShell } from "./find-us-cta-shell";
import { RepoOwnedPageCopy } from "./repo-owned-page-copy";

type ThemeAtmosphere = {
  readonly base: string;
  readonly layers: readonly string[];
  readonly nameCase: "upper" | "natural";
  readonly nameClass: string;
};

// Crafted CSS atmospheres — 9083-CODE P4.3 (owner themes, 2026-07-11).
// Layered gradients only: no stock photos, no invented imagery. Every world
// sits on the Presidential dark-teal luxury canvas.
const THEME_ATMOSPHERES: Record<PresidentialStateTheme, ThemeAtmosphere> = {
  "golden-coast": {
    base: "bg-[linear-gradient(180deg,#0b1f1d_0%,#134e4a_38%,#b45309_78%,#fbbf24_100%)]",
    layers: [
      "absolute inset-x-0 bottom-0 h-1/3 bg-[radial-gradient(ellipse_at_50%_100%,rgba(251,191,36,0.55),transparent_65%)]",
      "absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(88,195,182,0.35))]",
    ],
    nameCase: "natural",
    nameClass: "text-po-canvas drop-shadow-[0_4px_24px_rgba(251,191,36,0.45)]",
  },
  "desert-canyon": {
    base: "bg-[linear-gradient(180deg,#160a1e_0%,#7c2d12_55%,#ea580c_82%,#fdba74_100%)]",
    layers: [
      "absolute inset-x-0 bottom-0 h-2/5 bg-[radial-gradient(ellipse_at_20%_100%,rgba(23,10,8,0.9),transparent_60%)]",
      "absolute inset-x-0 bottom-0 h-1/3 bg-[radial-gradient(ellipse_at_75%_100%,rgba(23,10,8,0.8),transparent_55%)]",
    ],
    nameCase: "upper",
    nameClass: "text-po-canvas drop-shadow-[0_4px_24px_rgba(234,88,12,0.5)]",
  },
  "neon-nights": {
    base: "bg-[linear-gradient(180deg,#020204_0%,#0a0a14_60%,#141428_100%)]",
    layers: [
      "absolute left-1/4 top-1/3 h-64 w-64 -translate-x-1/2 bg-[radial-gradient(circle,rgba(56,222,203,0.35),transparent_70%)]",
      "absolute right-1/5 top-1/2 h-72 w-72 bg-[radial-gradient(circle,rgba(217,70,239,0.25),transparent_70%)]",
    ],
    nameCase: "upper",
    nameClass:
      "text-po-brand drop-shadow-[0_0_18px_rgba(56,222,203,0.8)]",
  },
  "wild-west": {
    base: "bg-[linear-gradient(180deg,#1c0f08_0%,#78350f_58%,#b45309_100%)]",
    layers: [
      "absolute inset-x-0 bottom-0 h-1/4 bg-[linear-gradient(180deg,transparent,rgba(28,15,8,0.85))]",
      "absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,191,36,0.18),transparent_55%)]",
    ],
    nameCase: "upper",
    nameClass: "text-[#fde68a] drop-shadow-[0_4px_16px_rgba(120,53,15,0.9)]",
  },
  "great-lakes": {
    base: "bg-[linear-gradient(180deg,#082f49_0%,#0e7490_55%,#58c3b6_100%)]",
    layers: [
      "absolute inset-x-0 bottom-0 h-1/3 bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,255,255,0.28),transparent_60%)]",
      "absolute inset-x-0 top-0 h-1/4 bg-[linear-gradient(180deg,rgba(2,6,23,0.6),transparent)]",
    ],
    nameCase: "natural",
    nameClass: "text-po-canvas drop-shadow-[0_4px_20px_rgba(14,116,144,0.7)]",
  },
  "empire-skyline": {
    base: "bg-[linear-gradient(180deg,#020617_0%,#0f172a_65%,#1e293b_100%)]",
    layers: [
      "absolute inset-x-0 bottom-0 h-1/2 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_26px,rgba(251,191,36,0.14)_26px,rgba(251,191,36,0.14)_30px)]",
      "absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.9))]",
      "absolute inset-0 bg-[radial-gradient(ellipse_at_50%_15%,rgba(88,195,182,0.16),transparent_55%)]",
    ],
    nameCase: "upper",
    nameClass: "text-po-canvas drop-shadow-[0_4px_24px_rgba(88,195,182,0.5)]",
  },
  evergreen: {
    base: "bg-[linear-gradient(180deg,#04140d_0%,#052e16_55%,#14532d_100%)]",
    layers: [
      "absolute inset-x-0 top-1/3 h-24 bg-[linear-gradient(180deg,transparent,rgba(226,232,240,0.14),transparent)]",
      "absolute inset-x-0 bottom-0 h-1/3 bg-[radial-gradient(ellipse_at_50%_100%,rgba(88,195,182,0.22),transparent_60%)]",
    ],
    nameCase: "upper",
    nameClass: "text-[#bbf7d0] drop-shadow-[0_4px_20px_rgba(5,46,22,0.9)]",
  },
};

async function readCatalogForState(): Promise<{
  readonly items: readonly SanityCatalogItem[];
}> {
  const publicCatalog = await readPublicRenderableCatalogItems("/moon-rocks", {
    next: { tags: ["sanity-catalog-moon-rocks"] },
  });
  if (publicCatalog.items.length > 0) {
    return { items: publicCatalog.items };
  }

  const draftCatalog = await readDraftCatalogItems("/moon-rocks", {
    next: { tags: ["sanity-catalog-moon-rocks-drafts"] },
  });

  return { items: draftCatalog.ok ? draftCatalog.items : [] };
}

// Owner-approved state hero imagery. Type sits in each image's reserved
// clean sky band: top scrim for all states except
// Washington, whose clean band is the left third.
const STATE_HERO_IMAGES: Record<
  string,
  { readonly src: string; readonly position: string; readonly scrim: "left" | "top" }
> = {
  wa: { src: "/media/states/wa-hero.webp", position: "object-[75%_center]", scrim: "left" },
  nv: { src: "/media/states/nv-hero.webp", position: "object-center", scrim: "top" },
  ca: { src: "/media/states/ca-hero.webp", position: "object-center", scrim: "top" },
  az: { src: "/media/states/az-hero.webp", position: "object-center", scrim: "top" },
  ok: { src: "/media/states/ok-hero.webp", position: "object-center", scrim: "top" },
  mi: { src: "/media/states/mi-hero.webp", position: "object-center", scrim: "top" },
  ny: { src: "/media/states/ny-hero.webp", position: "object-center", scrim: "top" },
};

export async function StatePageShell({ state }: { readonly state: PresidentialState }) {
  const atmosphere = THEME_ATMOSPHERES[state.theme];
  const heroImage = STATE_HERO_IMAGES[state.slug];
  const displayName =
    atmosphere.nameCase === "upper" ? state.name.toUpperCase() : state.name;
  const isNewYork = state.slug === "ny";
  const otherStates = PRESIDENTIAL_STATES
    .filter((candidate) => candidate.slug !== state.slug)
    .toSorted((left, right) => left.name.localeCompare(right.name));
  const stateCode = isLocatorStateCode(state.code) ? state.code : null;
  const [catalog, doorCount] = await Promise.all([
    readCatalogForState(),
    stateCode ? readLocatorStateCount(stateCode) : Promise.resolve(null),
  ]);
  const hasVerifiedDoors = doorCount !== null && doorCount > 0;
  const repoCopyPath =
    state.slug === "wa"
      ? "/find-us/wa"
      : state.slug === "az"
        ? "/find-us/az"
        : state.slug === "ny"
          ? "/find-us/ny"
          : null;

  return (
    <PageFrame>
      <SceneStack>
        <section
          aria-labelledby="presidential-state-title"
          className={`relative isolate flex min-h-[78svh] overflow-hidden ${state.slug === "wa" ? "bg-po-ink" : atmosphere.base}`}
        >
          {heroImage ? (
            <>
              <Image
                alt=""
                aria-hidden="true"
                className={`absolute inset-0 h-full w-full object-cover ${heroImage.position}`}
                fetchPriority="high"
                fill
                loading="eager"
                sizes="100vw"
                src={heroImage.src}
              />
              {heroImage.scrim === "left" ? (
                <>
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.55)_33%,rgba(0,0,0,0.25)_100%)]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(0deg,rgba(0,0,0,0.55),transparent)]"
                  />
                </>
              ) : (
                <>
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-3/5 bg-[linear-gradient(180deg,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0.35)_45%,transparent_100%)]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(0deg,rgba(0,0,0,0.35),transparent)]"
                  />
                </>
              )}
            </>
          ) : (
            atmosphere.layers.map((layer, index) => (
              <div aria-hidden="true" className={layer} key={index} />
            ))
          )}
          <div className="relative mx-auto flex w-full max-w-7xl flex-col justify-start gap-10 px-6 py-8 sm:px-10 lg:px-16">
            <div className="my-auto pb-4">
              <p className="text-xs font-black uppercase tracking-wide text-po-canvas/90">
                {isNewYork ? "Official New York retailer guide" : "Presidential in"}
              </p>
              <h1
                className={`mt-4 leading-none ${isNewYork ? "max-w-5xl font-display text-5xl sm:text-7xl lg:text-8xl" : `text-6xl sm:text-8xl lg:text-9xl ${stateFontClass(state.slug)}`} ${atmosphere.nameClass}`}
                id="presidential-state-title"
              >
                {isNewYork ? (
                  <>Presidential Near Me in <span className={`block ${stateFontClass(state.slug)}`}>New York</span></>
                ) : displayName}
              </h1>
              <p className="mt-6 max-w-2xl font-display text-2xl uppercase leading-tight text-po-canvas sm:text-3xl">
                {state.tagline}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:max-w-md sm:flex-row">
                <CtaLink className="!text-po-canvas hover:!text-po-canvas" href="/moon-rocks">Explore Moon Rocks</CtaLink>
                <CtaLink
                  className="border-po-canvas/60 !text-po-canvas hover:border-po-canvas hover:!text-po-canvas"
                  href="/find-us"
                  variant="secondary"
                >
                  All Presidential states
                </CtaLink>
              </div>
            </div>
          </div>
          <nav
            aria-label="Jump to another Presidential state"
            className="absolute bottom-[clamp(0.75rem,2.5vw,2rem)] right-[clamp(0.75rem,3vw,3rem)] z-20"
          >
            <ul className="flex flex-col items-end gap-1 text-right sm:gap-2">
              {otherStates.map((otherState) => (
                <li key={otherState.slug}>
                  <Link
                    className="block cursor-pointer font-display text-[clamp(0.8rem,1.6vw,1.5rem)] font-black uppercase leading-[1.1] text-po-brand [-webkit-text-stroke:1px_#000] [paint-order:stroke_fill] [text-shadow:1px_0_#000,-1px_0_#000,0_1px_#000,0_-1px_#000,1px_1px_#000,-1px_1px_#000,1px_-1px_#000,-1px_-1px_#000] transition-transform duration-150 hover:scale-105 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:[-webkit-text-stroke:1.5px_#000]"
                    href={`/find-us/${otherState.slug}`}
                  >
                    {otherState.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </section>

        {stateCode ? (
          <StateLocatorSection
            doorCount={doorCount}
            stateCode={stateCode}
            stateName={state.name}
            stateSiteLink={state.siteLink}
          />
        ) : null}

        {repoCopyPath ? (
          <RepoOwnedPageCopy path={repoCopyPath} />
        ) : (
          <Scene
            ariaLabelledBy="presidential-state-official"
            className="po-gold-thread-inlay py-20 lg:py-28"
            tone="default"
          >
            <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.5fr)]">
              <div>
                <p className="text-xs font-black uppercase text-po-brand-ink">
                  Official Presidential site
                </p>
                <h2
                  className="mt-5 font-display text-3xl uppercase leading-[0.95] text-po-ink sm:text-5xl"
                  id="presidential-state-official"
                >
                  Presidential in {state.name}
                </h2>
                <p className="mt-6 max-w-2xl text-base leading-7 text-po-body">
                  {state.seoLine}
                </p>
              </div>
              <aside className="border border-po-line bg-po-soft p-5">
                <p className="text-xs font-semibold uppercase text-po-brand-ink">
                  Licensed retail
                </p>
                <p className="mt-3 text-sm leading-6 text-po-body">
                  {hasVerifiedDoors ? (
                    <>
                      The locator above currently includes{" "}
                      {doorCount.toLocaleString("en-US")} verified licensed
                      retailer {doorCount === 1 ? "door" : "doors"} in{" "}
                      {state.name}. Search by ZIP or location for the current
                      results. Availability varies by retailer. Adults 21+ where
                      legal.
                    </>
                  ) : (
                    <>
                      Licensed retailer listings for {state.name} publish here
                      once a verified retailer source is confirmed. No
                      unverified listings are ever shown. Adults 21+ where legal.
                    </>
                  )}
                </p>
              </aside>
            </div>
          </Scene>
        )}

        {catalog.items.length > 0 ? (
          <Scene
            ariaLabelledBy="presidential-state-catalog"
            className="po-gold-thread-inlay py-20 lg:py-28"
            tone="default"
          >
            <div className="mx-auto w-full max-w-7xl">
              <div className="mb-12 max-w-3xl">
                <p className="text-xs font-black uppercase text-po-brand-ink">
                  The catalog
                </p>
                <h2
                  className="mt-5 font-display text-3xl uppercase leading-[0.95] text-po-ink sm:text-5xl"
                  id="presidential-state-catalog"
                >
                  The same catalog, coast to coast
                </h2>
              </div>
              <SeriesSelectorShell items={catalog.items} />
            </div>
          </Scene>
        ) : null}

        <FindUsCtaShell className="po-gold-thread-inlay" compact />
      </SceneStack>
    </PageFrame>
  );
}
