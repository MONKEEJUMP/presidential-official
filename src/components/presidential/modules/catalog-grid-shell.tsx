import Image from "next/image";
import Link from "next/link";

import {
  catalogItemSlug,
  type SanityCatalogItem,
} from "@/lib/cms/catalog";
import {
  CATALOG_SERIES_REGISTRY,
  filterCatalogSeriesProducts,
} from "@/lib/catalog/series-registry";

type CatalogRenderMode = "public" | "preview";

function shouldShowCatalogPreviewBadge(mode: CatalogRenderMode): boolean {
  return mode === "preview" && process.env.VERCEL_ENV !== "production";
}

type SeriesMeta = {
  readonly anchor: string;
  readonly eyebrow: string;
  readonly positioning: string;
  readonly accentBar: string;
  readonly accentText: string;
  readonly canvas: string;
};

const SERIES_META = new Map<string, SeriesMeta>([
  [
    "Silver Flavor Series",
    {
      anchor: "silver-flavor-series",
      eyebrow: "Silver",
      positioning: "Flavor-first. Fruit-forward. Vibrant. Bold.",
      accentBar: "bg-po-silver",
      accentText: "text-po-body",
      canvas: "from-po-silver/40",
    },
  ],
  [
    "Gold Strain Series",
    {
      anchor: "gold-strain-series",
      eyebrow: "Gold",
      positioning: "Cannabis-first. Balanced. Authentic. Full-spectrum.",
      accentBar: "bg-po-gold",
      accentText: "text-po-gold-ink",
      canvas: "from-po-gold-soft",
    },
  ],
  [
    "Rose Gold Connoisseur Series",
    {
      anchor: "rose-gold-connoisseur-series",
      eyebrow: "Rose Gold",
      positioning: "Refined. Intentional. Solventless. Craftsmanship.",
      accentBar: "bg-po-rose-gold",
      accentText: "text-po-body",
      canvas: "from-po-rose-gold/40",
    },
  ],
  [
    "Presidential House Line",
    {
      anchor: "presidential-house-line",
      eyebrow: "Heritage",
      positioning: "The formats that built the Presidential name.",
      accentBar: "bg-po-brand",
      accentText: "text-po-brand-ink",
      canvas: "from-po-brand/20",
    },
  ],
  [
    "Presidential x THC Design",
    {
      anchor: "thc-design-collaboration",
      eyebrow: "Collaboration",
      positioning: "Estate-grown flower cultivated by THC Design.",
      accentBar: "bg-po-brand",
      accentText: "text-po-brand-ink",
      canvas: "from-po-brand/20",
    },
  ],
  [
    "Presidential Line",
    {
      anchor: "presidential-line",
      eyebrow: "Presidential",
      positioning: "Presidential strains awaiting series placement.",
      accentBar: "bg-po-brand",
      accentText: "text-po-brand-ink",
      canvas: "from-po-brand/20",
    },
  ],
]);

const FALLBACK_SERIES_META: SeriesMeta = {
  anchor: "presidential-products",
  eyebrow: "Presidential",
  positioning: "Official Presidential products.",
  accentBar: "bg-po-brand",
  accentText: "text-po-brand-ink",
  canvas: "from-po-brand/20",
};

function seriesAnchorSlug(series?: string): string {
  return (series || "presidential-products")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function seriesMetaFor(series?: string): SeriesMeta {
  const known = SERIES_META.get(series || "");
  if (known) {
    return known;
  }

  // Unknown series still get a unique anchor derived from their own name so
  // repeated fallbacks can never produce duplicate DOM ids.
  return { ...FALLBACK_SERIES_META, anchor: seriesAnchorSlug(series) };
}

export function parseFormatChips(productType?: string): readonly string[] {
  if (productType?.toLowerCase().includes("reviewernotes")) {
    return [];
  }

  const inParens = productType?.match(/\(([^)]+)\)/)?.[1];
  if (!inParens) {
    return [];
  }

  return inParens
    .split("/")
    .map((chip) => chip.trim())
    .filter(Boolean);
}

function catalogImageAlt(item: SanityCatalogItem, altText?: string): string {
  return (
    altText ||
    [item.name, item.series, "product photography"].filter(Boolean).join(" — ")
  );
}

function CatalogProductCard({
  item,
  mode,
}: {
  readonly item: SanityCatalogItem;
  readonly mode: CatalogRenderMode;
}) {
  const meta = seriesMetaFor(item.series);
  const chips = parseFormatChips(item.productType);
  const [primaryImage, secondaryImage] = item.images || [];
  const cardBody = (
    <>
      <div
        className={`relative aspect-square overflow-hidden bg-gradient-to-b ${meta.canvas} to-po-canvas`}
      >
        {primaryImage?.assetUrl ? (
          <>
            <Image
              alt={catalogImageAlt(item, primaryImage.altText)}
              className={`object-contain p-6 transition-opacity duration-300 ${
                secondaryImage?.assetUrl ? "group-hover:opacity-0" : ""
              }`}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              src={primaryImage.assetUrl}
            />
            {secondaryImage?.assetUrl ? (
              <Image
                alt={`${catalogImageAlt(item, secondaryImage.altText)} (alternate view)`}
                aria-hidden="true"
                className="object-contain p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                src={secondaryImage.assetUrl}
              />
            ) : null}
          </>
        ) : (
          <div className="flex h-full items-center justify-center border border-dashed border-po-line text-xs font-semibold uppercase text-po-body">
            Photography in production
          </div>
        )}
        {shouldShowCatalogPreviewBadge(mode) ? (
          <p className="absolute left-3 top-3 bg-po-ink px-2 py-1 text-[10px] font-black uppercase tracking-wide text-po-on-dark">
            Owner preview · gated draft
          </p>
        ) : null}
      </div>
      <div className="border-t border-po-ink pt-4">
        <p className={`text-[11px] font-black uppercase ${meta.accentText}`}>
          {meta.eyebrow}
        </p>
        <h3 className="mt-2 font-display text-xl uppercase leading-tight text-po-ink">
          {item.name}
        </h3>
        {chips.length > 0 ? (
          <p className="mt-3 text-xs font-semibold uppercase text-po-body">
            {chips.join(" · ")}
          </p>
        ) : null}
      </div>
    </>
  );

  return (
    <Link
      className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-brand"
      href={`/moon-rocks/${catalogItemSlug(item)}`}
    >
      {cardBody}
    </Link>
  );
}

export function SeriesCatalogSection({
  series,
  items,
  mode,
  headingLevel = "h3",
  heading = series,
}: {
  readonly series: string;
  readonly items: readonly SanityCatalogItem[];
  readonly mode: CatalogRenderMode;
  readonly headingLevel?: "h2" | "h3";
  readonly heading?: string;
}) {
  const meta = seriesMetaFor(series);
  const Heading = headingLevel;

  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={`catalog-${meta.anchor}`} id={meta.anchor}>
      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-po-ink pt-5">
        <div>
          <span
            aria-hidden="true"
            className={`block h-2 w-16 ${meta.accentBar}`}
          />
          <Heading
            className="mt-4 font-display text-3xl uppercase leading-none text-po-ink sm:text-5xl"
            id={`catalog-${meta.anchor}`}
          >
            {heading}
          </Heading>
          <p className="mt-3 max-w-xl text-sm leading-6 text-po-body">
            {meta.positioning}
          </p>
        </div>
        <p className="text-xs font-black uppercase text-po-brand-ink">
          {items.length} {items.length === 1 ? "product" : "products"}
        </p>
      </div>
      <div className="mt-10 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <CatalogProductCard item={item} key={item._id} mode={mode} />
        ))}
      </div>
    </section>
  );
}

const SERIES_PAGE_PATHS = new Map<string, string>([
  ["Silver Flavor Series", "/moon-rocks/silver"],
  ["Gold Strain Series", "/moon-rocks/gold"],
  ["Rose Gold Connoisseur Series", "/moon-rocks/rose-gold"],
]);

// Blueprint Interaction 1 (Series Selector): the Moon Rocks hub presents the
// series as a selection moment; full product grids live on the series pages.
// The three Blueprint series are static law — with no readable catalog
// (flags off / nothing published) the selector still renders them, without
// counts, so series navigation never depends on CMS availability.
export function SeriesSelectorShell({
  items,
  completeCatalog = false,
}: {
  readonly items: readonly SanityCatalogItem[];
  readonly completeCatalog?: boolean;
}) {
  const seriesNames =
    items.length > 0
      ? [...new Set(items.map((item) => item.series || ""))]
      : [...SERIES_PAGE_PATHS.keys()];
  const grouped = completeCatalog
    ? CATALOG_SERIES_REGISTRY.map((definition) => ({
        key: definition.slug,
        title: definition.title,
        eyebrow: definition.cardEyebrow,
        description: definition.description,
        accentBar: definition.accentBar,
        accentText: definition.accentText,
        count:
          items.length > 0
            ? filterCatalogSeriesProducts(definition, items).length
            : definition.expectedProductCount,
        href: definition.path,
        buttonLabel: definition.buttonLabel,
      }))
    : seriesNames.map((series) => {
        const meta = seriesMetaFor(series);

        return {
          key: series,
          title: series || "Presidential",
          eyebrow: meta.eyebrow,
          description: meta.positioning,
          accentBar: meta.accentBar,
          accentText: meta.accentText,
          count:
            items.length > 0
              ? items.filter((item) => (item.series || "") === series).length
              : null,
          href: SERIES_PAGE_PATHS.get(series),
          buttonLabel: `Explore ${meta.eyebrow} Moon Rocks`,
        };
      });

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {grouped.map(
        ({
          key,
          title,
          eyebrow,
          description,
          accentBar,
          accentText,
          count,
          href,
          buttonLabel,
        }) => {
        const panelBody = (
          <>
            <span aria-hidden="true" className={`block h-2 w-16 ${accentBar}`} />
            <p className={`mt-5 text-xs font-black uppercase ${accentText}`}>
              {eyebrow}
            </p>
            <h2 className="mt-2 font-display text-2xl uppercase leading-tight text-po-ink sm:text-3xl">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-po-body">{description}</p>
            {count !== null ? (
              <p className="mt-6 text-xs font-black uppercase text-po-brand-ink">
                {count} {count === 1 ? "product" : "products"}
              </p>
            ) : null}
          </>
        );

        return (
          <article
            className={`border p-6 ${href ? "border-po-ink" : "border-po-line"}`}
            key={key}
          >
            {panelBody}
            {href ? (
              <Link
                className="mt-5 inline-block border border-po-ink px-4 py-2 text-xs font-black uppercase text-po-ink transition-colors hover:bg-po-ink hover:text-po-on-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-brand"
                href={href}
              >
                {buttonLabel}
              </Link>
            ) : null}
          </article>
        );
      },
      )}
    </div>
  );
}
