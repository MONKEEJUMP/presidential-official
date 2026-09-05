import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import {
  PageFrame,
  Scene,
  SceneStack,
} from "@/components/presidential";
import { CompactStoreFinderPanel } from "@/components/presidential/locator/compact-store-finder-panel";
import {
  parseFormatChips,
  seriesMetaFor,
} from "@/components/presidential/modules/catalog-grid-shell";
import { relatedGuideForCatalogItem } from "@/lib/catalog/series-registry";
import { FindUsCtaShell } from "@/components/presidential/modules/find-us-cta-shell";
import { ProductDescription } from "@/components/presidential/modules/product-description";
import {
  readCatalogItemBySlug,
  readCatalogProductParams,
} from "@/lib/cms/catalog";
import { buildCatalogProductSeoRoute, CONCRETE_SEO_SERIES_PATHS } from "@/lib/seo/concrete-routes";
import {
  buildRouteMetadata,
  isRouteMetadataIndexable,
} from "@/lib/seo/metadata";
import {
  buildProductRouteJsonLd,
  JsonLd,
} from "@/lib/seo/schema";

const CATALOG_ROUTE = "/moon-rocks";

type CatalogDetailPageProps = {
  readonly params: Promise<{
    readonly "product-or-strain": string;
  }>;
};

export const dynamicParams = false;

const readCatalogProduct = cache((slug: string) =>
  readCatalogItemBySlug(CATALOG_ROUTE, slug, {
    next: { tags: [`sanity-catalog-item-${slug}`] },
  }),
);

function hasAssetUrl<T extends { readonly assetUrl?: string }>(
  image: T,
): image is T & { readonly assetUrl: string } {
  return Boolean(image.assetUrl?.trim());
}

export async function generateStaticParams() {
  const slugs = await readCatalogProductParams(CATALOG_ROUTE);

  return slugs.map((slug) => ({ "product-or-strain": slug }));
}

export async function generateMetadata({
  params,
}: CatalogDetailPageProps): Promise<Metadata> {
  const { "product-or-strain": slug } = await params;
  const detail = await readCatalogProduct(slug);

  if (!detail.item?.name?.trim()) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const heroImage = (detail.item.images || []).filter(hasAssetUrl)[0];

  return buildRouteMetadata({
    route: buildCatalogProductSeoRoute(detail.item as typeof detail.item & {
      readonly name: string;
    }, slug),
    ...(heroImage ? {
      socialImage: {
        url: heroImage.assetUrl,
        width: "width" in heroImage && typeof heroImage.width === "number" ? heroImage.width : 0,
        height: "height" in heroImage && typeof heroImage.height === "number" ? heroImage.height : 0,
        ...(heroImage.altText ? { alt: heroImage.altText } : {}),
      },
    } : {}),
  });
}

export default async function CatalogProductDetailPage({
  params,
}: CatalogDetailPageProps) {
  const { "product-or-strain": slug } = await params;
  const detail = await readCatalogProduct(slug);

  if (!detail.item?.name?.trim()) {
    notFound();
  }

  const item = detail.item as typeof detail.item & { readonly name: string };
  const route = buildCatalogProductSeoRoute(item, slug);
  const meta = seriesMetaFor(item.series);
  const seriesPath = CONCRETE_SEO_SERIES_PATHS.find((path) => route.linksTo.includes(path));
  const chips = parseFormatChips(item.productType);
  const relatedGuide = relatedGuideForCatalogItem(item);
  const approvedImages = (item.images || []).filter(hasAssetUrl);
  const [heroImage, ...galleryImages] = approvedImages;
  const jsonLdEntries = buildProductRouteJsonLd({
    route,
    name: item.name,
    description: route.description,
    imageUrls: heroImage ? [heroImage.assetUrl] : [],
    publicRenderable: isRouteMetadataIndexable(route),
  });

  return (
    <>
      {jsonLdEntries.map((entry) => (
        <JsonLd key={`${route.id}-${entry.id}`} data={entry.data} />
      ))}

      <PageFrame>
        <SceneStack>
        <Scene ariaLabelledBy="presidential-product-title" tone="default">
          <div className="mx-auto w-full min-w-0 max-w-7xl">
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
                  <span
                    aria-current="page"
                    className="font-semibold text-po-ink [overflow-wrap:anywhere]"
                  >
                    {item.name}
                  </span>
                </li>
              </ol>
            </nav>

            <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)] lg:items-start">
              <div
                className={`relative min-w-0 aspect-square overflow-hidden bg-gradient-to-b ${meta.canvas} to-po-canvas`}
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

              <div className="min-w-0">
                <span aria-hidden="true" className={`block h-2 w-16 ${meta.accentBar}`} />
                <p className={`mt-4 text-xs font-black uppercase ${meta.accentText}`}>
                  {seriesPath ? <Link href={seriesPath}>{item.series}</Link> : item.series}
                </p>
                <h1
                  className="mt-3 max-w-full font-display text-4xl uppercase leading-[0.92] text-po-ink [overflow-wrap:anywhere] sm:text-6xl"
                  id="presidential-product-title"
                >
                  {route.h1}
                </h1>
                <ProductDescription sourcePath={route.path} value={item.description} />

                {chips.length > 0 ? (
                  <div className="mt-8 border-t border-po-ink pt-5">
                    <p className="text-xs font-black uppercase text-po-brand-ink">
                      Formats
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold uppercase text-po-ink">
                      {chips.map((chip) => (
                        <li key={chip}>{chip}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {relatedGuide ? (
                  <div className="mt-8 border-t border-po-line pt-5">
                    <p className="text-xs font-black uppercase text-po-brand-ink">
                      Related guide
                    </p>
                    <Link
                      className="mt-3 inline-block font-semibold text-po-ink underline decoration-po-brand underline-offset-4 transition-colors hover:text-po-brand-ink focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-brand"
                      href={relatedGuide.path}
                    >
                      {relatedGuide.label}
                    </Link>
                  </div>
                ) : null}

                <CompactStoreFinderPanel
                  className="mt-10 w-full max-w-md"
                  inlineResults
                />
              </div>
            </div>

            {galleryImages.length > 0 ? (
              <div className="po-gold-thread-inlay mt-16 pt-8">
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
                        src={image.assetUrl}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Scene>

        <FindUsCtaShell
          className="po-gold-thread-inlay"
          compact
          sourcePath={route.path}
        />
        </SceneStack>
      </PageFrame>
    </>
  );
}
