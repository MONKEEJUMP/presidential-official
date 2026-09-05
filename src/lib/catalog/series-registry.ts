import type { SanityCatalogItem } from "@/lib/cms/catalog";
import type { SeoRoutePath } from "@/lib/seo/route-types";

export type CatalogSeriesDefinition = {
  readonly slug:
    | "silver"
    | "gold"
    | "rose-gold"
    | "presidential-line"
    | "presidential-house-line"
    | "presidential-x-thc-design";
  readonly path: SeoRoutePath;
  readonly title: string;
  readonly cardEyebrow: string;
  readonly description: string;
  readonly buttonLabel: string;
  readonly expectedProductCount: number;
  readonly productFilter: {
    readonly series: string;
  };
  readonly accentBar: string;
  readonly accentText: string;
};

export type CatalogRelatedGuide = {
  readonly path: SeoRoutePath;
  readonly label: string;
};

const FORMAT_GUIDE_BY_PRODUCT_NAME: Readonly<
  Record<string, CatalogRelatedGuide>
> = {
  "Presidential Blunts": {
    path: "/learn/infusion-science",
    label: "Infusion Science",
  },
  "Presidential Moon Rocks": {
    path: "/learn/what-are-moon-rocks",
    label: "What Are Moon Rocks",
  },
  "Presidential Prerolls": {
    path: "/learn/infusion-science",
    label: "Infusion Science",
  },
  "Presidential x THC Design Blunts": {
    path: "/learn/infusion-science",
    label: "Infusion Science",
  },
  "Presidential x THC Design Moon Rocks": {
    path: "/learn/what-are-moon-rocks",
    label: "What Are Moon Rocks",
  },
  "Presidential x THC Design Prerolls": {
    path: "/learn/infusion-science",
    label: "Infusion Science",
  },
};

const FLAVOR_SCIENCE_SERIES = new Set([
  "Silver Flavor Series",
  "Gold Strain Series",
  "Presidential Line",
]);

export function relatedGuideForCatalogItem(
  item: Pick<SanityCatalogItem, "name" | "series" | "productType">,
): CatalogRelatedGuide | null {
  const productType = item.productType?.trim().toLowerCase();

  if (productType === "moon rocks") {
    return {
      path: "/learn/what-are-moon-rocks",
      label: "What Are Moon Rocks",
    };
  }

  if (productType === "blunts" || productType === "prerolls") {
    return {
      path: "/learn/infusion-science",
      label: "Infusion Science",
    };
  }

  const namedFormatGuide = item.name
    ? FORMAT_GUIDE_BY_PRODUCT_NAME[item.name]
    : undefined;
  if (namedFormatGuide) {
    return namedFormatGuide;
  }

  if (item.series === "Rose Gold Connoisseur Series") {
    return {
      path: "/learn/what-is-live-rosin",
      label: "What Is Live Rosin",
    };
  }

  if (item.series && FLAVOR_SCIENCE_SERIES.has(item.series)) {
    return {
      path: "/learn/flavor-science",
      label: "Flavor Science",
    };
  }

  return null;
}

export const CATALOG_SERIES_REGISTRY = [
  {
    slug: "silver",
    path: "/moon-rocks/silver",
    title: "Silver Flavor Series",
    cardEyebrow: "Silver",
    description: "Flavor-first. Fruit-forward. Vibrant. Bold.",
    buttonLabel: "Explore Silver Moon Rocks",
    expectedProductCount: 7,
    productFilter: { series: "Silver Flavor Series" },
    accentBar: "bg-po-silver",
    accentText: "text-po-body",
  },
  {
    slug: "gold",
    path: "/moon-rocks/gold",
    title: "Gold Strain Series",
    cardEyebrow: "Gold",
    description: "Cannabis-first. Balanced. Authentic. Full-spectrum.",
    buttonLabel: "Explore Gold Moon Rocks",
    expectedProductCount: 19,
    productFilter: { series: "Gold Strain Series" },
    accentBar: "bg-po-gold",
    accentText: "text-po-gold-ink",
  },
  {
    slug: "rose-gold",
    path: "/moon-rocks/rose-gold",
    title: "Rose Gold Connoisseur Series",
    cardEyebrow: "Rose Gold",
    description: "Refined. Intentional. Solventless. Craftsmanship.",
    buttonLabel: "Explore Rose Gold Moon Rocks",
    expectedProductCount: 5,
    productFilter: { series: "Rose Gold Connoisseur Series" },
    accentBar: "bg-po-rose-gold",
    accentText: "text-po-body",
  },
  {
    slug: "presidential-line",
    path: "/moon-rocks/presidential-line",
    title: "Presidential Line",
    cardEyebrow: "New",
    description: "The newest Presidential strains.",
    buttonLabel: "Explore Presidential Line",
    expectedProductCount: 10,
    productFilter: { series: "Presidential Line" },
    accentBar: "bg-po-brand",
    accentText: "text-po-brand-ink",
  },
  {
    slug: "presidential-house-line",
    path: "/moon-rocks/presidential-house-line",
    title: "Presidential House Line",
    cardEyebrow: "House",
    description:
      "The original Presidential formats — blunts, prerolls, and Moon Rocks.",
    buttonLabel: "Explore the House Line",
    expectedProductCount: 3,
    productFilter: { series: "Presidential House Line" },
    accentBar: "bg-po-brand",
    accentText: "text-po-brand-ink",
  },
  {
    slug: "presidential-x-thc-design",
    path: "/moon-rocks/presidential-x-thc-design",
    title: "Presidential x THC Design",
    cardEyebrow: "Collaboration",
    description: "A Presidential collaboration with THC Design.",
    buttonLabel: "Explore the Collaboration",
    expectedProductCount: 3,
    productFilter: { series: "Presidential x THC Design" },
    accentBar: "bg-po-brand",
    accentText: "text-po-brand-ink",
  },
] as const satisfies readonly CatalogSeriesDefinition[];

export type CatalogSeriesSlug = (typeof CATALOG_SERIES_REGISTRY)[number]["slug"];

export function getCatalogSeriesBySlug(
  slug: CatalogSeriesSlug,
): CatalogSeriesDefinition {
  const definition = CATALOG_SERIES_REGISTRY.find((item) => item.slug === slug);

  if (!definition) {
    throw new Error(`Unknown catalog series slug: ${slug}`);
  }

  return definition;
}

export function filterCatalogSeriesProducts(
  definition: CatalogSeriesDefinition,
  items: readonly SanityCatalogItem[],
): readonly SanityCatalogItem[] {
  return items.filter(
    (item) => (item.series || "") === definition.productFilter.series,
  );
}
