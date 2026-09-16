export type CatalogTierLine = "moon-rocks" | "pre-rolls" | "blunts";

export type CatalogTierSection =
  | "silver"
  | "gold"
  | "rose-gold"
  | "collabs"
  | "more";

export type CatalogTierBadge = "silver" | "gold" | "rose-gold" | null;

export type CatalogTierEntry = {
  readonly section: CatalogTierSection;
  readonly tierBadge: CatalogTierBadge;
  readonly collabPartner: string | null;
  readonly retired: boolean;
  readonly displayName: string | null;
};

export type CatalogTierResolution = {
  readonly entry: CatalogTierEntry;
  readonly source: "map" | "fallback";
};

export type TierSectionPresentation = {
  readonly eyebrowLead: string;
  readonly eyebrowDetail: string;
  readonly headline: string;
  readonly series: string | null;
  readonly description: string;
};

export const TIER_SECTION_ORDER = [
  "silver",
  "gold",
  "rose-gold",
  "collabs",
] as const satisfies readonly CatalogTierSection[];

export const TIER_SECTION_PRESENTATION: Readonly<
  Record<Exclude<CatalogTierSection, "more">, TierSectionPresentation>
> = {
  silver: {
    eyebrowLead: "SILVER",
    eyebrowDetail: "LIQUID DIAMONDS",
    headline: "THE ULTIMATE FLAVOR & POTENCY EXPERIENCE",
    series: "Flavor Series",
    description:
      "Where Flavor Meets Potency. Maximum flavor. Maximum potency. The intersection of both.",
  },
  gold: {
    eyebrowLead: "GOLD",
    eyebrowDetail: "LIVE RESIN",
    headline: "THE ULTIMATE FULL-SPECTRUM CANNABIS EXPERIENCE",
    series: "Strain Series",
    description:
      "Authentic Cannabis. Fully Expressed. Full-spectrum. Authentic strain expression. Potent. Balanced. True to the plant.",
  },
  "rose-gold": {
    eyebrowLead: "ROSE GOLD",
    eyebrowDetail: "LIVE ROSIN",
    headline: "THE ULTIMATE SOLVENTLESS CANNABIS EXPERIENCE",
    series: "Connoisseur Series",
    description:
      "Crafted for the Purest Cannabis Experience. Solventless. Crafted with precision. True cannabis flavor. Potent.",
  },
  collabs: {
    eyebrowLead: "COLLABS",
    eyebrowDetail: "PARTNER STRAINS",
    headline: "PRESIDENTIAL COLLABS",
    series: null,
    description: "Strains grown with the cultivators and brands we work with.",
  },
};

const PRODUCTS_BY_LINE = {
  "moon-rocks": {
    silver: [
      "blue-raspberry",
      "grape",
      "peach-mango",
      "pineapple",
      "strawberry",
      "tropical",
      "watermelon",
    ],
    gold: [
      "24k",
      "blue-dream",
      "cap-junky",
      "crescendo",
      "galactic-gas",
      "gorilla-goo",
      "nyc-diesel",
      "orange-push-pop",
      "papaya-punch",
      "pink-cookies",
      "presidential-og",
      "rainbow-belts",
      "sfv-og",
      "xj-13",
      "xxx",
    ],
    "rose-gold": [
      "cereal-milk",
      "cosmic-cookies",
      "gods-gift",
      "wedding-cake",
      "white-walker",
    ],
    collabs: [
      "cherry-gelato",
      "skywalker",
      "waui",
      "king-louis",
      "presidential-line-head-cheese",
      "presidential-line-garlic-cookies",
      "presidential-line-ghost-haze-train",
      "presidential-line-nino-brown",
      "presidential-line-whoa-si-whoa",
      "thc-design-blunts",
      "thc-design-moon-rocks",
      "thc-design-prerolls",
    ],
    more: [
      "presidential-line-guava-haze",
      "presidential-line-iced-lemon",
      "presidential-blunts",
      "presidential-moon-rocks",
      "presidential-prerolls",
    ],
    retired: [
      "presidential-line-apricotti",
      "presidential-line-daniel-larusso",
      "presidential-line-laura-charles",
    ],
  },
  "pre-rolls": {
    silver: [
      "blue-raspberry",
      "grape",
      "peach-mango",
      "pineapple",
      "strawberry",
    ],
    gold: [
      "blue-dream",
      "cap-junky",
      "galactic-gas",
      "gorilla-goo",
      "nyc-diesel",
      "orange-push-pop",
      "papaya-punch",
      "pink-cookies",
      "presidential-og",
      "rainbow-belts",
      "sfv-og",
    ],
    "rose-gold": ["cereal-milk-title", "cosmic-cookies", "wedding-cake-title"],
    collabs: [
      "cherry-gelato",
      "skywalker",
      "king-louis",
      "garlic-cookies",
      "ghost-haze-train",
    ],
    more: [],
    retired: [],
  },
  blunts: {
    silver: [
      "blue-raspberry",
      "grape",
      "peach-mango",
      "pineapple",
      "strawberry",
      "tropical",
      "watermelon",
    ],
    gold: [
      "blue-dream",
      "cap-junky",
      "crescendo",
      "galactic-gas",
      "gorilla-goo",
      "nyc-diesel",
      "orange-push-pop",
      "papaya-punch",
      "pink-cookies-title",
      "presidential-og",
      "rainbow-belts",
      "sfv-og",
      "xj-13",
      "xxx",
    ],
    "rose-gold": ["cereal-milk-title", "cosmic-cookies-title", "wedding-cake-title"],
    collabs: [
      "cherry-gelato",
      "skywalker",
      "waui",
      "king-louis",
      "head-cheese",
      "garlic-cookies",
      "ghost-haze-train",
      "nino-brown",
      "whoa-si-whoa",
    ],
    more: [],
    retired: ["apricotti", "daniel-larusso", "laura-charles"],
  },
} as const;

const ENTRY_OVERRIDES: Readonly<
  Record<string, Partial<Omit<CatalogTierEntry, "section" | "retired">>>
> = {
  "moon-rocks:cherry-gelato": {
    tierBadge: "gold",
    collabPartner: "Rove",
  },
  "moon-rocks:skywalker": {
    tierBadge: "gold",
    collabPartner: "Rove",
  },
  "moon-rocks:waui": {
    tierBadge: "gold",
    collabPartner: "Rove",
  },
  "moon-rocks:king-louis": {
    tierBadge: "gold",
    collabPartner: "VLADTV",
  },
  "moon-rocks:presidential-line-head-cheese": {
    tierBadge: "gold",
    collabPartner: "Polaris",
  },
  "moon-rocks:presidential-line-garlic-cookies": {
    collabPartner: "Nature's Chemistry",
  },
  "moon-rocks:presidential-line-ghost-haze-train": {
    collabPartner: "Nature's Chemistry",
    displayName: "Ghost Train Haze",
  },
  "moon-rocks:presidential-line-nino-brown": {
    collabPartner: "Ball Family Farms",
  },
  "moon-rocks:presidential-line-whoa-si-whoa": {
    collabPartner: "Top Shelf Cultivation",
  },
  "moon-rocks:thc-design-blunts": { collabPartner: "THC Design" },
  "moon-rocks:thc-design-moon-rocks": { collabPartner: "THC Design" },
  "moon-rocks:thc-design-prerolls": { collabPartner: "THC Design" },
  "pre-rolls:cherry-gelato": {
    tierBadge: "gold",
    collabPartner: "Rove",
  },
  "pre-rolls:skywalker": {
    tierBadge: "gold",
    collabPartner: "Rove",
  },
  "pre-rolls:king-louis": {
    tierBadge: "gold",
    collabPartner: "VLADTV",
  },
  "pre-rolls:garlic-cookies": {
    collabPartner: "Nature's Chemistry",
  },
  "pre-rolls:ghost-haze-train": {
    collabPartner: "Nature's Chemistry",
    displayName: "Ghost Train Haze",
  },
  "pre-rolls:presidential-og": { displayName: "Presidential OG" },
  "blunts:cherry-gelato": {
    tierBadge: "gold",
    collabPartner: "Rove",
  },
  "blunts:skywalker": {
    tierBadge: "gold",
    collabPartner: "Rove",
  },
  "blunts:waui": {
    tierBadge: "gold",
    collabPartner: "Rove",
  },
  "blunts:king-louis": {
    tierBadge: "gold",
    collabPartner: "VLADTV",
  },
  "blunts:head-cheese": {
    tierBadge: "gold",
    collabPartner: "Polaris",
  },
  "blunts:garlic-cookies": {
    collabPartner: "Nature's Chemistry",
  },
  "blunts:ghost-haze-train": {
    collabPartner: "Nature's Chemistry",
    displayName: "Ghost Train Haze",
  },
  "blunts:nino-brown": { collabPartner: "Ball Family Farms" },
  "blunts:whoa-si-whoa": {
    collabPartner: "Top Shelf Cultivation",
  },
  "blunts:presidential-og": { displayName: "Presidential OG" },
};

function defaultTierBadge(section: CatalogTierSection): CatalogTierBadge {
  if (section === "silver" || section === "gold" || section === "rose-gold") {
    return section;
  }

  return null;
}

function buildTierMap(): Readonly<Record<string, CatalogTierEntry>> {
  const entries: Record<string, CatalogTierEntry> = {};

  for (const [line, groups] of Object.entries(PRODUCTS_BY_LINE)) {
    for (const section of ["silver", "gold", "rose-gold", "collabs", "more"] as const) {
      for (const slug of groups[section]) {
        const key = `${line}:${slug}`;
        entries[key] = {
          section,
          tierBadge: defaultTierBadge(section),
          collabPartner: null,
          retired: false,
          displayName: null,
          ...ENTRY_OVERRIDES[key],
        };
      }
    }

    for (const slug of groups.retired) {
      const key = `${line}:${slug}`;
      entries[key] = {
        section: "more",
        tierBadge: null,
        collabPartner: null,
        retired: true,
        displayName: null,
        ...ENTRY_OVERRIDES[key],
      };
    }
  }

  return Object.freeze(entries);
}

export const PRODUCT_TIER_MAP = buildTierMap();

function fallbackSection(value?: string): CatalogTierSection {
  switch (value) {
    case "Silver Flavor Series":
      return "silver";
    case "Gold Strain Series":
      return "gold";
    case "Rose Gold Connoisseur Series":
      return "rose-gold";
    case "Presidential x THC Design":
      return "collabs";
    default:
      return "more";
  }
}

export function catalogTierKey(line: CatalogTierLine, slug: string): string {
  return `${line}:${slug}`;
}

export function resolveCatalogTier({
  line,
  slug,
  series,
  collection,
}: {
  readonly line: CatalogTierLine;
  readonly slug: string;
  readonly series?: string;
  readonly collection?: string;
}): CatalogTierResolution {
  const mapped = PRODUCT_TIER_MAP[catalogTierKey(line, slug)];
  if (mapped) {
    return { entry: mapped, source: "map" };
  }

  const section =
    line === "blunts" ? "more" : fallbackSection(line === "pre-rolls" ? collection : series);

  return {
    entry: {
      section,
      tierBadge: defaultTierBadge(section),
      collabPartner: null,
      retired: false,
      displayName: null,
    },
    source: "fallback",
  };
}
