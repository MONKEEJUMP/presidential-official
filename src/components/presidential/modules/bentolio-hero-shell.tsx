import Image from "next/image";

import {
  catalogItemSlug,
  readDraftCatalogItems,
  readPublicRenderableCatalogItems,
  type SanityCatalogItem,
} from "@/lib/cms/catalog";
import { GEM_PRODUCTS } from "@/lib/gems/gems-manifest";
import type { SeoRouteRecord } from "@/lib/seo/route-types";

import { SiteVideo } from "../media/site-video";
import { FindPresidentialScrollTile } from "./find-presidential-scroll-tile";
import { GemTicker } from "./gem-ticker";
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

const CREST_SPINNING_POSTER = "/media/posters/crest-spinning.jpg";

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

function toGemTickerProducts(items: readonly SanityCatalogItem[]) {
  const itemByProductKey = new Map(
    items.flatMap((item) =>
      item.productKey ? ([[item.productKey, item]] as const) : [],
    ),
  );

  return GEM_PRODUCTS.map((product) => {
    const item = itemByProductKey.get(product.productKey);
    const heroImage = item?.images?.[0];
    const name = item?.name?.trim() || product.name;

    return {
      ...product,
      name,
      imageAlt:
        heroImage?.altText?.trim() ||
        (heroImage?.assetUrl ? `${name} product packaging` : undefined),
      imageUrl: heroImage?.assetUrl,
    };
  });
}

export async function BentolioHeroShell({
  route,
}: {
  readonly route: SeoRouteRecord;
}) {
  const catalogItems = await readHeroCatalogItems();
  const theaterSeries = toTheaterSeries(catalogItems);
  const gemTickerProducts = toGemTickerProducts(catalogItems);

  return (
    <>
    <GemTicker products={gemTickerProducts} />
    <section
      aria-labelledby="presidential-homepage-primary"
      className="po-home-canvas-surface p-6"
    >
      <div className="mx-auto grid w-full max-w-[1392px] grid-cols-1 gap-6 lg:aspect-[1392/854] lg:grid-cols-[minmax(0,565fr)_minmax(0,330fr)_minmax(0,447fr)] lg:grid-rows-[101fr_354fr_226fr_101fr]">
        {/* CREST tile — owner-supplied spinning crest film, nothing else. */}
        <div className="po-teal-pinstripe relative min-h-[320px] overflow-hidden rounded-[20px] bg-[#0D0D0D] lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:min-h-0">
          <Image
            alt=""
            aria-hidden="true"
            className="object-cover"
            fill
            priority
            sizes="(min-width: 1024px) 41vw, 100vw"
            src={CREST_SPINNING_POSTER}
          />
          <video
            aria-hidden="true"
            autoPlay
            className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
            loop
            muted
            playsInline
            poster={CREST_SPINNING_POSTER}
            preload="metadata"
          >
            <source
              media="(prefers-reduced-motion: no-preference)"
              src="/media/backdrops/crest-spinning.webm"
              type="video/webm"
            />
            <source
              media="(prefers-reduced-motion: no-preference)"
              src="/media/backdrops/crest-spinning.mp4"
              type="video/mp4"
            />
          </video>
          <h1 className="sr-only" id="presidential-homepage-primary">
            {route.h1}
          </h1>
        </div>

        {/* PORTRAIT tile — product film loop */}
        <div className="overflow-hidden rounded-[20px] bg-po-ink lg:col-start-2 lg:row-span-2 lg:row-start-1">
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
        <div className="grid grid-cols-1 gap-6 lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-3 lg:grid-cols-2">
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
    </>
  );
}
