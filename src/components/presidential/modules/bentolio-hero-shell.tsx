import Link from "next/link";
import type { ReactNode } from "react";

import {
  catalogItemSlug,
  readDraftCatalogItems,
  readPublicRenderableCatalogItems,
  type SanityCatalogItem,
} from "@/lib/cms/catalog";
import { GEM_PRODUCTS } from "@/lib/gems/gems-manifest";
import type { SeoRouteRecord } from "@/lib/seo/route-types";

import { CrestSpinningVideo } from "../media/crest-spinning-video";
import { SiteVideo } from "../media/site-video";
import { CtaLink } from "../primitives/cta-link";
import { FindPresidentialScrollTile } from "./find-presidential-scroll-tile";
import { GemTicker } from "./gem-ticker";
import { HomepageArtworkShowcase } from './homepage-artwork-showcase';
import heroStyles from './homepage-artwork-showcase.module.css';
import {
  MoonRocksSeriesTheater,
  type MoonRocksTheaterSeries,
} from "./moon-rocks-series-theater";

// Bentolio hero — 4187-CODE (owner template order, 2026-07-11). A 1:1
// port of the Bentolio community template's bento hero (spec measured via
// the Figma MCP: sources/spud/work/hero-bentolio/bentolio-template-spec.md),
// reskinned Presidential: teal tiles on the homepage canvas with ONE black accent
// tile, Archivo Black + Inter, the crest in place of the template's flower
// and circle icons, owner product media only (no people — standing order).
// Geometry the code can't show: the lg grid locks the template's 1392×979
// canvas via aspect-ratio so the 101/479/226/101 rows hold their measured
// proportions; about+contact live in a nested two-column grid because the
// template's bottom-left tiles are an equal 448/448 split that does not
// align with the 565/330 top columns; the Find Presidential CTA runs 44px
// instead of the template's 55px because "PRESIDENTIAL" in Archivo Black
// overflows the 400px tile measure at 55px.

const THEATER_SERIES = [
  { id: "silver", label: "Silver", series: "Silver Flavor Series" },
  { id: "gold", label: "Gold", series: "Gold Strain Series" },
  {
    id: "rose-gold",
    label: "Rose Gold",
    series: "Rose Gold Connoisseur Series",
  },
] as const;

async function readHeroCatalogItems(): Promise<readonly SanityCatalogItem[]> {

  const publicCatalog = await readPublicRenderableCatalogItems("/moon-rocks", {
    next: { tags: ["sanity-catalog-moon-rocks"] },
  });
  if (publicCatalog.items.length) return publicCatalog.items;

  const draftCatalog = await readDraftCatalogItems("/moon-rocks", {
    next: { tags: ["sanity-catalog-moon-rocks-drafts"] },
  });
  return draftCatalog.ok ? draftCatalog.items : [];
}

export function HomepageSpinningCrestFold() {
  return (
    <section
      aria-label="Welcome to Presidential"
      className="po-home-canvas-surface w-full px-6 py-10 sm:px-10 lg:px-16 lg:py-8"
    >
      <div className={heroStyles.grid}>
        <div className={heroStyles.left}>
          <div className={heroStyles.welcome}>
          <p className={`${heroStyles.headline} font-display font-bold uppercase leading-[0.92] tracking-[0.035em] text-po-on-dark`}>
            Welcome to{" "}
            <span className="mt-2 block text-po-brand">Presidential</span>
          </p>
          </div>
          <HomepageArtworkShowcase />
          <div className={heroStyles.welcome}>
            <p className={`${heroStyles.headline} font-display font-bold uppercase leading-[0.92] tracking-[0.035em] text-po-on-dark`}>
              <span className="text-po-brand">World&apos;s</span>{" "}Strongest
            </p>
          </div>
        </div>
        <div className={heroStyles.right}>
            <div className={heroStyles.buttons}>
              <CtaLink
                className="min-h-[58px] w-full px-4 font-display text-[0.7rem] uppercase tracking-[0.07em]"
                href="/moon-rocks"
                variant="primary"
              >
                Explore Moon Rocks
              </CtaLink>
              <CtaLink
                className="min-h-[58px] w-full px-4 font-display text-[0.7rem] uppercase tracking-[0.07em]"
                href="/pre-rolls"
                variant="contrast"
              >
                Discover Pre-Rolls
              </CtaLink>
            </div>
        <div className="po-teal-pinstripe relative mx-auto aspect-square w-full max-w-[min(560px,calc(100svh-11rem))] overflow-hidden rounded-[20px] bg-[#0D0D0D] shadow-[0_36px_90px_rgba(0,0,0,0.55)]">
          <CrestSpinningVideo />
        </div>
          <div className={heroStyles.buttons}>
            <CtaLink
              className="min-h-[58px] w-full px-4 font-display text-[0.7rem] uppercase tracking-[0.07em]"
              href="/blunts"
              variant="contrast"
            >
              Discover Blunts
            </CtaLink>
            <CtaLink
              className="min-h-[58px] w-full px-4 font-display text-[0.7rem] uppercase tracking-[0.07em]"
              href="/find-us"
              variant="primary"
            >
              Find a retailer
            </CtaLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function toTheaterSeries(
  items: readonly SanityCatalogItem[],
): readonly MoonRocksTheaterSeries[] {
  const manifestHrefBySlug = new Map(
    GEM_PRODUCTS.map((product) => [product.slug, product.href]),
  );

  return THEATER_SERIES.map((definition) => {
    const products = items.filter((item) => item.series === definition.series);
    return {
      id: definition.id,
      label: definition.label,
      products: products.flatMap((item) => {
        const name = item.name?.trim();
        const slug = catalogItemSlug(item);
        if (!name || !slug) return [];

        return [
          {
            id: item._id,
            name,
            href: manifestHrefBySlug.get(slug) || `/moon-rocks/${slug}`,
          },
        ];
      }),
    };
  });
}

export async function BentolioHeroShell({
  afterProductCarousel,
  route,
}: {
  readonly afterProductCarousel?: ReactNode;
  readonly route: SeoRouteRecord;
}) {
  const catalogItems = await readHeroCatalogItems();
  const theaterSeries = toTheaterSeries(catalogItems);

  return (
    <>
      <GemTicker />
      <section
        aria-labelledby="presidential-homepage-primary"
        className="po-home-canvas-surface px-6 py-3"
      >
        <h1 className="sr-only" id="presidential-homepage-primary">
          {route.path === "/" ? "Presidential Moon Rocks" : route.h1}
        </h1>
        <div className="mx-auto grid w-full max-w-[1392px] grid-cols-1 gap-x-6 gap-y-3 lg:aspect-[1392/854] lg:grid-cols-[minmax(0,565fr)_minmax(0,330fr)_minmax(0,447fr)] lg:grid-rows-[101fr_354fr_226fr_101fr]">
        {/* PORTRAIT tile — product film loop */}
        <div className="overflow-hidden rounded-[20px] bg-po-ink lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <SiteVideo
            className="aspect-[330/476] w-full object-cover lg:aspect-auto lg:h-full"
            label="Presidential strain packaging film, portrait loop"
            preload="metadata"
            slug="strains-vertical"
          />
        </div>

        {/* WORK tile + selector pill — the three-series theater */}
        <MoonRocksSeriesTheater series={theaterSeries} />

        {/* ABOUT + CONTACT — the template's equal 448/448 bottom-left split */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-3 lg:grid-cols-2">
          {/* STATEMENT tile — owner-approved visible statement copy */}
          <div className="flex min-h-[240px] items-center justify-center rounded-[20px] bg-po-brand px-3 py-6 [container-type:inline-size] lg:min-h-0">
            <p
              className="w-full max-w-full text-center font-display text-[clamp(2rem,14.6cqi,3.875rem)] font-bold uppercase leading-[0.95] text-po-ink"
              id="presidential-homepage-statement"
            >
              World&#39;s Strongest
              <br />
              Cannabis!
            </p>
          </div>

          {/* CONTACT tile — the one accent tile: Find Presidential */}
          <FindPresidentialScrollTile />
        </div>

        </div>
      </section>
        {afterProductCarousel}
      <section
        aria-label="Presidential term pages"
        className="po-home-canvas-surface px-6 py-3"
      >
        <div className="po-teal-pinstripe mx-auto mt-3 w-full max-w-[1392px] overflow-hidden rounded-[20px] bg-[#0D0D0D] px-6 py-4 text-po-on-dark sm:px-10 lg:px-12">
        <h2 className="font-display text-4xl uppercase leading-none text-po-brand sm:text-5xl">
          Presidential
        </h2>
        <nav aria-label="Presidential term pages" className="mt-4">
          {[
            {
              description: "what's inside it",
              href: "/presidential-thc",
              label: "THC",
            },
            {
              description: "tobacco-free, infused",
              href: "/presidential-blunts",
              label: "BLUNTS",
            },
            {
              description: "the company, since 2012",
              href: "/presidential-cannabis",
              label: "CANNABIS",
            },
          ].map((item) => (
            <Link
              className="po-gold-thread-inlay grid gap-1 py-3 transition-colors hover:text-po-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-po-brand sm:grid-cols-[minmax(9rem,0.3fr)_1fr] sm:items-baseline sm:gap-8"
              href={item.href}
              key={item.href}
            >
              <span className="font-display text-2xl uppercase sm:text-3xl">
                {item.label}
              </span>
              <span className="text-lg text-po-on-dark-muted">
                — {item.description}
              </span>
            </Link>
          ))}
        </nav>
        </div>
      </section>
    </>
  );
}
