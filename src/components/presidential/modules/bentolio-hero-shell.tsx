import Image from "next/image";
import Link from "next/link";

import {
  readDraftCatalogItems,
  readPublicRenderableCatalogItems,
  type SanityCatalogItem,
} from "@/lib/cms/catalog";
import type { SeoRouteRecord } from "@/lib/seo/route-types";

import { SiteVideo } from "../media/site-video";

// Bentolio hero — 4187-CODE (owner template order, 2026-07-11). A 1:1
// port of the Bentolio community template's bento hero (spec measured via
// the Figma MCP: sources/spud/work/hero-bentolio/bentolio-template-spec.md),
// reskinned Presidential: teal tiles on a white page with ONE black accent
// tile, Archivo Black + Inter, the crest in place of the template's flower
// and circle icons, owner product media only (no people — standing order).
// Geometry the code can't show: the lg grid locks the template's 1392×979
// canvas via aspect-ratio so the 101/479/226/101 rows hold their measured
// proportions; about+contact live in a nested two-column grid because the
// template's bottom-left tiles are an equal 448/448 split that does not
// align with the 565/330 top columns; the Find Presidential CTA runs 44px
// instead of the template's 55px because "PRESIDENTIAL" in Archivo Black
// overflows the 400px tile measure at 55px.

const SERIES_ROWS = [
  { href: "/moon-rocks/silver", label: "Silver Moon Rocks" },
  { href: "/moon-rocks/gold", label: "Gold Moon Rocks" },
  { href: "/moon-rocks/rose-gold", label: "Rose Gold Moon Rocks" },
] as const;

async function readHeroProductImage(): Promise<{
  readonly assetUrl: string | null;
  readonly alt: string;
}> {
  const fallback = { assetUrl: null, alt: "" };
  const pickImage = (items: readonly SanityCatalogItem[]) => {
    for (const item of items) {
      const image = (item.images || [])[0];
      if (image?.assetUrl) {
        return {
          assetUrl: image.assetUrl,
          alt:
            image.altText ||
            [item.name, item.series, "product photography"]
              .filter(Boolean)
              .join(" — "),
        };
      }
    }
    return null;
  };

  const publicCatalog = await readPublicRenderableCatalogItems("/moon-rocks", {
    next: { tags: ["sanity-catalog-moon-rocks"] },
  });
  const publicPick = pickImage(publicCatalog.items);
  if (publicPick) {
    return publicPick;
  }

  const draftCatalog = await readDraftCatalogItems("/moon-rocks", {
    next: { tags: ["sanity-catalog-moon-rocks-drafts"] },
  });
  if (draftCatalog.ok) {
    return pickImage(draftCatalog.items) || fallback;
  }

  return fallback;
}

export async function BentolioHeroShell({
  route,
}: {
  readonly route: SeoRouteRecord;
}) {
  const productImage = await readHeroProductImage();

  return (
    <section
      aria-labelledby="presidential-homepage-primary"
      className="bg-po-canvas p-6"
    >
      <div className="mx-auto grid w-full max-w-[1392px] grid-cols-1 gap-6 lg:aspect-[1392/979] lg:grid-cols-[minmax(0,565fr)_minmax(0,330fr)_minmax(0,447fr)] lg:grid-rows-[101fr_479fr_226fr_101fr]">
        {/* HEADER tile */}
        <div className="flex items-center justify-between rounded-[20px] bg-po-brand px-6 py-6 text-po-ink lg:col-span-3 lg:py-0">
          <p className="flex items-center gap-3 text-[25px] uppercase leading-none">
            <span
              aria-hidden="true"
              className="po-brand-mark block aspect-[1200/929] w-10 bg-contain bg-center bg-no-repeat"
            />
            <span className="font-display">Presidential</span>
          </p>
          <nav
            aria-label="Hero navigation"
            className="hidden gap-10 text-base uppercase sm:flex"
          >
            <Link className="transition-colors hover:text-po-canvas" href="/moon-rocks">
              Moon Rocks
            </Link>
            <Link className="transition-colors hover:text-po-canvas" href="/find-us">
              Find Presidential
            </Link>
            <Link className="transition-colors hover:text-po-canvas" href="/contact">
              Contact
            </Link>
          </nav>
        </div>

        {/* SLOGAN tile */}
        <div className="relative flex min-h-[320px] items-center overflow-hidden rounded-[20px] bg-po-brand p-6 lg:col-start-1 lg:row-start-2 lg:min-h-0">
          <span
            aria-hidden="true"
            className="po-brand-mark absolute right-6 top-8 block aspect-[1200/929] w-[119px] bg-contain bg-center bg-no-repeat"
          />
          <h1
            className="max-w-[475px] font-display text-4xl uppercase leading-none text-po-ink sm:text-[56px]"
            id="presidential-homepage-primary"
          >
            <span className="sr-only">{route.h1} — </span>
            The Highest Form Of Cannabis.
          </h1>
        </div>

        {/* PORTRAIT tile — product film loop */}
        <div className="overflow-hidden rounded-[20px] bg-po-ink lg:col-start-2 lg:row-start-2">
          <SiteVideo
            className="aspect-[330/476] w-full object-cover lg:aspect-auto lg:h-full"
            label="Presidential strain packaging film, portrait loop"
            preload="metadata"
            slug="strains-vertical"
          />
        </div>

        {/* WORK tile — the catalog */}
        <div className="flex flex-col rounded-[20px] bg-po-brand p-6 text-po-ink lg:col-start-3 lg:row-span-2 lg:row-start-2">
          <div className="flex items-start justify-between">
            <Link
              className="font-display text-[25px] uppercase leading-none transition-colors hover:text-po-canvas"
              href="/moon-rocks"
            >
              Moon Rocks
            </Link>
            <span aria-hidden="true" className="text-[26px] leading-none">
              ↗
            </span>
          </div>
          <div className="relative mt-5 aspect-[399/269] overflow-hidden rounded-[16px] bg-po-canvas">
            {productImage.assetUrl ? (
              <Image
                alt={productImage.alt}
                className="object-contain p-4"
                fill
                sizes="(min-width: 1024px) 30vw, 100vw"
                src={productImage.assetUrl}
              />
            ) : (
              <Image
                alt="Presidential crest on a teal field"
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 30vw, 100vw"
                src="/brand/og-social-share-image.webp"
              />
            )}
          </div>
          <ul className="mt-4 flex flex-1 flex-col justify-end">
            {SERIES_ROWS.map((row) => (
              <li
                className="border-t border-po-ink/15 first:border-t-0"
                key={row.href}
              >
                <Link
                  className="block py-[15px] font-display text-[25px] uppercase leading-none transition-colors hover:text-po-canvas"
                  href={row.href}
                >
                  {row.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ABOUT + CONTACT — the template's equal 448/448 bottom-left split */}
        <div className="grid grid-cols-1 gap-6 lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-3 lg:grid-cols-2">
          {/* ABOUT tile */}
          <div className="relative flex min-h-[240px] items-end rounded-[20px] bg-po-brand p-6 lg:min-h-0">
            <span
              aria-hidden="true"
              className="po-brand-mark absolute left-6 top-6 block aspect-[1200/929] w-10 bg-contain bg-center bg-no-repeat"
            />
            <p className="max-w-[296px] text-xl leading-[25px] text-po-ink">
              Presidential is the official home of Moon Rocks — flower,
              concentrate, and kief working together in one layered cannabis
              experience, through licensed retailers.
            </p>
          </div>

          {/* CONTACT tile — the one accent tile: Find Presidential */}
          <div className="flex min-h-[240px] flex-col justify-between rounded-[20px] bg-po-ink p-6 text-po-on-dark lg:min-h-0">
            <div className="flex items-start justify-between">
              <p className="text-[15px] leading-5 text-po-on-dark-muted">
                Eight states
                <br />
                and growing
              </p>
              <span
                aria-hidden="true"
                className="text-[38px] leading-none text-po-brand"
              >
                ↗
              </span>
            </div>
            <Link
              className="font-display text-3xl uppercase leading-none text-po-brand transition-colors hover:text-po-on-dark sm:text-[44px]"
              href="/find-us"
            >
              Find Presidential
            </Link>
          </div>
        </div>

        {/* SOCIALS tile — compliance strip */}
        <div className="flex items-center rounded-[20px] bg-po-brand px-6 py-6 lg:col-start-3 lg:row-start-4 lg:py-0">
          <p className="flex w-full flex-wrap items-center justify-between gap-2 text-xs font-black uppercase text-po-ink">
            <span>Official Presidential</span>
            <span>Adults 21+ where legal</span>
            <span>Licensed retailers</span>
          </p>
        </div>
      </div>
    </section>
  );
}
