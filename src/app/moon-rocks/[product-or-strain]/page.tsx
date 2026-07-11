import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  PageFrame,
  Scene,
  SceneStack,
} from "@/components/presidential";
import {
  parseFormatChips,
  seriesMetaFor,
} from "@/components/presidential/modules/catalog-grid-shell";
import { FindUsCtaShell } from "@/components/presidential/modules/find-us-cta-shell";
import { CtaLink } from "@/components/presidential/primitives/cta-link";
import {
  readCatalogItemBySlug,
  readCatalogProductParams,
} from "@/lib/cms/catalog";

const CATALOG_ROUTE = "/moon-rocks";

type CatalogDetailPageProps = {
  readonly params: Promise<{
    readonly "product-or-strain": string;
  }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await readCatalogProductParams(CATALOG_ROUTE);

  return slugs.map((slug) => ({ "product-or-strain": slug }));
}

export async function generateMetadata({
  params,
}: CatalogDetailPageProps): Promise<Metadata> {
  const { "product-or-strain": slug } = await params;
  const detail = await readCatalogItemBySlug(CATALOG_ROUTE, slug, {
    next: { tags: [`sanity-catalog-item-${slug}`] },
  });

  if (!detail.item) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${detail.item.name} | Presidential Moon Rocks`,
    description: `Approved product information for ${detail.item.name}, part of the Presidential ${detail.item.series}. Availability varies by licensed retailer.`,
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function CatalogProductDetailPage({
  params,
}: CatalogDetailPageProps) {
  const { "product-or-strain": slug } = await params;
  const detail = await readCatalogItemBySlug(CATALOG_ROUTE, slug, {
    next: { tags: [`sanity-catalog-item-${slug}`] },
  });

  if (!detail.item) {
    notFound();
  }

  const item = detail.item;
  const meta = seriesMetaFor(item.series);
  const chips = parseFormatChips(item.productType);
  const [heroImage, ...galleryImages] = item.images || [];

  return (
    <PageFrame>
      <SceneStack>
        <Scene ariaLabelledBy="presidential-product-title" tone="default">
          <div className="mx-auto w-full max-w-7xl">
            <nav aria-label="Breadcrumb" className="text-sm text-po-brand-ink">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link
                    className="font-semibold underline-offset-4 hover:underline"
                    href="/moon-rocks"
                  >
                    Moon Rocks
                  </Link>
                </li>
                <li aria-hidden="true" className="text-po-body">
                  /
                </li>
                <li>
                  <span aria-current="page" className="font-semibold text-po-ink">
                    {item.name}
                  </span>
                </li>
              </ol>
            </nav>

            {detail.mode === "preview" ? (
              <p className="mt-6 inline-block bg-po-ink px-3 py-1 text-[11px] font-black uppercase tracking-wide text-po-on-dark">
                Owner preview · gated draft · not published
              </p>
            ) : null}

            <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)] lg:items-start">
              <div
                className={`relative aspect-square overflow-hidden bg-gradient-to-b ${meta.canvas} to-po-canvas`}
              >
                {heroImage?.assetUrl ? (
                  <Image
                    alt={
                      heroImage.altText ||
                      `${item.name} — ${item.series} product photography`
                    }
                    className="object-contain p-10"
                    fill
                    priority
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    src={heroImage.assetUrl}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center border border-dashed border-po-line text-sm font-semibold uppercase text-po-body">
                    Photography in production
                  </div>
                )}
              </div>

              <div>
                <span aria-hidden="true" className={`block h-2 w-16 ${meta.accentBar}`} />
                <p className={`mt-4 text-xs font-black uppercase ${meta.accentText}`}>
                  {item.series}
                </p>
                <h1
                  className="mt-3 font-display text-4xl uppercase leading-[0.92] text-po-ink sm:text-6xl"
                  id="presidential-product-title"
                >
                  {item.name}
                </h1>
                {item.description ? (
                  <p className="mt-6 max-w-xl text-base leading-7 text-po-body">
                    {item.description}
                  </p>
                ) : null}

                {chips.length > 0 ? (
                  <div className="mt-8 border-t border-po-ink pt-5">
                    <p className="text-xs font-black uppercase text-po-brand-ink">
                      Formats
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {chips.map((chip) => (
                        <li
                          className="border border-po-ink px-3 py-1 text-xs font-semibold uppercase text-po-ink"
                          key={chip}
                        >
                          {chip}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-10 grid gap-3 sm:max-w-sm">
                  <CtaLink href="/find-us">Find Presidential near you</CtaLink>
                  <CtaLink href="/moon-rocks" variant="secondary">
                    Back to Moon Rocks
                  </CtaLink>
                </div>
                <p className="mt-6 text-xs leading-5 text-po-body">
                  Adults 21+ where legal. Product information is informational
                  only; availability varies by licensed retailer.
                </p>
              </div>
            </div>

            {galleryImages.length > 0 ? (
              <div className="mt-16 border-t border-po-ink pt-8">
                <p className="text-xs font-black uppercase text-po-brand-ink">
                  Format gallery
                </p>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {galleryImages.map((image, index) => (
                    <div
                      className={`relative aspect-square overflow-hidden bg-gradient-to-b ${meta.canvas} to-po-canvas`}
                      key={`${image.assetUrl}-${index}`}
                    >
                      <Image
                        alt={
                          image.altText ||
                          `${item.name} — ${item.series} format photography`
                        }
                        className="object-contain p-6"
                        fill
                        loading="lazy"
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        src={image.assetUrl!}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Scene>

        <FindUsCtaShell compact />
      </SceneStack>
    </PageFrame>
  );
}
