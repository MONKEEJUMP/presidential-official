import { PRESIDENTIAL_STATES } from "../find-us/states";
import { PARTNER_ROUTES } from './partners-routes';

import {
  buildCatalogProductSeoRoute,
  buildLearnGuideSeoRoute,
  buildStateSeoRoute,
  buildTermSeoRoute,
  getConcreteSeriesSeoRoutes,
  type ConcreteTermPage,
} from "./concrete-routes";
import { getRouteById } from "./route-helpers";
import type { SeoRouteRecord } from "./route-types";
import { PRODUCT_METADATA_BY_SLUG } from "./pw7404-1019-product-metadata";

const APPROVED_PUBLIC_STATIC_ROUTE_IDS = [
  "home",
  "moon-rocks",
  "moon-pods",
  "orbit",
  "vapes",
  "pre-rolls",
  "blunts",
  "our-story",
  "about",
  "learn",
  "find-us",
  "contact",
  "pop-up",
] as const;

const APPROVED_PRODUCT_ROUTE_ROWS = [
  { slug: "blue-raspberry", name: "Blue Raspberry", series: "Silver Flavor Series" },
  { slug: "grape", name: "Grape", series: "Silver Flavor Series" },
  { slug: "peach-mango", name: "Peach Mango", series: "Silver Flavor Series" },
  { slug: "pineapple", name: "Pineapple", series: "Silver Flavor Series" },
  { slug: "strawberry", name: "Strawberry", series: "Silver Flavor Series" },
  { slug: "tropical", name: "Tropical", series: "Silver Flavor Series" },
  { slug: "watermelon", name: "Watermelon", series: "Silver Flavor Series" },
  { slug: "24k", name: "24K", series: "Gold Strain Series" },
  { slug: "blue-dream", name: "Blue Dream", series: "Gold Strain Series" },
  { slug: "cap-junky", name: "Cap Junky", series: "Gold Strain Series" },
  { slug: "cherry-gelato", name: "Cherry Gelato", series: "Gold Strain Series" },
  { slug: "crescendo", name: "Crescendo", series: "Gold Strain Series" },
  { slug: "galactic-gas", name: "Galactic Gas", series: "Gold Strain Series" },
  { slug: "gorilla-goo", name: "Gorilla Goo", series: "Gold Strain Series" },
  { slug: "king-louis", name: "King Louis", series: "Gold Strain Series" },
  { slug: "nyc-diesel", name: "NYC Diesel", series: "Gold Strain Series" },
  { slug: "orange-push-pop", name: "Orange Push Pop", series: "Gold Strain Series" },
  { slug: "papaya-punch", name: "Papaya Punch", series: "Gold Strain Series" },
  { slug: "pink-cookies", name: "Pink Cookies", series: "Gold Strain Series" },
  { slug: "presidential-og", name: "Presidential OG", series: "Gold Strain Series" },
  { slug: "rainbow-belts", name: "Rainbow Belts", series: "Gold Strain Series" },
  { slug: "sfv-og", name: "SFV OG", series: "Gold Strain Series" },
  { slug: "skywalker", name: "Skywalker", series: "Gold Strain Series" },
  { slug: "waui", name: "Waui", series: "Gold Strain Series" },
  { slug: "xj-13", name: "XJ-13", series: "Gold Strain Series" },
  { slug: "xxx", name: "XXX", series: "Gold Strain Series" },
  { slug: "cereal-milk", name: "Cereal Milk", series: "Rose Gold Connoisseur Series" },
  { slug: "cosmic-cookies", name: "Cosmic Cookies", series: "Rose Gold Connoisseur Series" },
  { slug: "gods-gift", name: "God's Gift", series: "Rose Gold Connoisseur Series" },
  { slug: "wedding-cake", name: "Wedding Cake", series: "Rose Gold Connoisseur Series" },
  { slug: "white-walker", name: "White Walker", series: "Rose Gold Connoisseur Series" },
  { slug: "presidential-line-apricotti", name: "Apricotti", series: "Presidential Line" },
  { slug: "presidential-line-daniel-larusso", name: "Daniel LaRusso", series: "Presidential Line" },
  { slug: "presidential-line-garlic-cookies", name: "Garlic Cookies", series: "Presidential Line" },
  { slug: "presidential-line-ghost-haze-train", name: "Ghost Haze Train", series: "Presidential Line" },
  { slug: "presidential-line-guava-haze", name: "Guava Haze", series: "Presidential Line" },
  { slug: "presidential-line-head-cheese", name: "Head Cheese", series: "Presidential Line" },
  { slug: "presidential-line-iced-lemon", name: "Iced Lemon", series: "Presidential Line" },
  { slug: "presidential-line-laura-charles", name: "Laura Charles", series: "Presidential Line" },
  { slug: "presidential-line-nino-brown", name: "Nino Brown", series: "Presidential Line" },
  { slug: "presidential-line-whoa-si-whoa", name: "Whoa Si Whoa", series: "Presidential Line" },
  { slug: "presidential-blunts", name: "Presidential Blunts", series: "Presidential House Line" },
  { slug: "presidential-moon-rocks", name: "Presidential Moon Rocks", series: "Presidential House Line" },
  { slug: "presidential-prerolls", name: "Presidential Prerolls", series: "Presidential House Line" },
  { slug: "thc-design-blunts", name: "Presidential x THC Design Blunts", series: "Presidential x THC Design" },
  { slug: "thc-design-moon-rocks", name: "Presidential x THC Design Moon Rocks", series: "Presidential x THC Design" },
  { slug: "thc-design-prerolls", name: "Presidential x THC Design Prerolls", series: "Presidential x THC Design" },
] as const;

const APPROVED_LEARN_GUIDE_ROUTE_ROWS = [
  {
    slug: "what-are-moon-rocks",
    title: "What Are Moon Rocks",
    intro:
      "Moon Rocks are a layered cannabis format: flower, concentrate, and kief working together in one product.",
  },
  {
    slug: "what-is-live-resin",
    title: "What Is Live Resin",
    intro:
      "Live resin is a cannabis extract made from plants that are frozen at harvest instead of dried and cured.",
  },
  {
    slug: "what-is-live-rosin",
    title: "What Is Live Rosin",
    intro:
      "Live rosin is a solventless cannabis concentrate made with ice water, heat, and pressure — no chemical solvents.",
  },
  {
    slug: "what-are-liquid-diamonds",
    title: "What Are Liquid Diamonds",
    intro:
      "Liquid diamonds combine THCa crystals with the terpene-rich sauce they formed in, gently warmed into a liquid.",
  },
  {
    slug: "infusion-science",
    title: "Infusion Science",
    intro:
      "Infusion is how concentrate and flower become one product instead of two ingredients sitting side by side.",
  },
  {
    slug: "flavor-science",
    title: "Flavor Science",
    intro:
      "Cannabis flavor comes from terpenes — aromatic compounds that vary strain to strain and fade when mishandled.",
  },
  {
    slug: "different-extracts-need-different-heat",
    title: "Different Extracts Need Different Heat",
    intro:
      "Live rosin, live resin, and liquid diamonds each perform at their own temperature — one heat setting cannot serve all three.",
  },
] as const;

export const APPROVED_TERM_ROUTE_ROWS = [
  {
    slug: "presidential-thc",
    title: "Presidential THC | Official Infusion and Label Guide",
    description:
      "Official Presidential THC guide to infusion, flower, kief, distillate, live resin, live rosin, and reading total THC on a cannabis label. Adults 21+.",
    h1: "Presidential THC: Infusion, Potency & Extract Science",
    keywords: [
      "Presidential THC",
      "infused cannabis science",
      "THC potency",
      "cannabis extract science",
    ],
    linksTo: [
      "/presidential-blunts",
      "/presidential-cannabis",
      "/moon-rocks",
      "/learn",
    ],
  },
  {
    slug: "presidential-blunts",
    title: "Presidential Blunts Guide | Formats, Sizes & Construction",
    description:
      "Infused blunts and minis rolled in tobacco-free hemp. Sizes, strains, how they burn, and how to smoke one properly. Through licensed retailers, adults 21+.",
    h1: "Presidential Blunts",
    keywords: [
      "Presidential blunts",
      "tobacco-free hemp wraps",
      "infused blunts",
      "mini blunts",
    ],
    linksTo: [
      "/presidential-thc",
      "/presidential-cannabis",
      "/moon-rocks",
      "/find-us",
    ],
  },
  {
    slug: "presidential-cannabis",
    title: "Presidential Cannabis | Official Company Overview",
    description:
      "Meet Presidential Cannabis, the official brand behind Moon Rocks, infused pre-rolls, tobacco-free blunts and minis. Find licensed retailers.",
    h1: "Presidential Cannabis",
    keywords: [
      "Presidential cannabis",
      "Presidential company",
      "Los Angeles cannabis brand",
      "licensed Presidential retailers",
    ],
    linksTo: [
      "/presidential-thc",
      "/presidential-blunts",
      "/about",
      "/find-us",
    ],
  },
] as const satisfies readonly ConcreteTermPage[];

function getRequiredApprovedStaticRoute(id: string): SeoRouteRecord {
  const route = getRouteById(id);

  if (!route) {
    throw new Error(`Missing approved public Presidential route: ${id}`);
  }

  return route;
}

function assertApprovedProductInventory(): void {
  const routeSlugs = APPROVED_PRODUCT_ROUTE_ROWS.map((row) => row.slug).sort();
  const metadataSlugs = Object.keys(PRODUCT_METADATA_BY_SLUG).sort();

  if (routeSlugs.length !== 47 || routeSlugs.join("|") !== metadataSlugs.join("|")) {
    throw new Error(
      "Approved product route inventory must exactly match all 47 PW7404-1019 metadata records.",
    );
  }
}

assertApprovedProductInventory();

export const APPROVED_PUBLIC_STATIC_ROUTES = APPROVED_PUBLIC_STATIC_ROUTE_IDS.map(
  getRequiredApprovedStaticRoute,
);

export const APPROVED_PUBLIC_PRODUCT_ROUTES = APPROVED_PRODUCT_ROUTE_ROWS.map(
  (row) =>
    buildCatalogProductSeoRoute(
      {
        _id: `owner-approved-product-${row.slug}`,
        name: row.name,
        series: row.series,
        sourceArtifact:
          `PW7404-1019 product evidence/copy record:${row.slug}; 7734-SPUD owner publication approval`,
      },
      row.slug,
    ),
);

export const APPROVED_PUBLIC_LEARN_GUIDE_ROUTES =
  APPROVED_LEARN_GUIDE_ROUTE_ROWS.map((row) =>
    buildLearnGuideSeoRoute(
      {
        title: row.title,
        intro: row.intro,
      },
      row.slug,
    ),
  );

export const APPROVED_PUBLIC_TERM_ROUTES = APPROVED_TERM_ROUTE_ROWS.map(
  buildTermSeoRoute,
);

export function getApprovedTermSeoRoute(
  slug: ConcreteTermPage["slug"],
): SeoRouteRecord {
  const route = APPROVED_PUBLIC_TERM_ROUTES.find(
    (candidate) => candidate.path === `/${slug}`,
  );

  if (!route) {
    throw new Error(`Missing approved Presidential term route: ${slug}`);
  }

  return route;
}

export const APPROVED_PUBLIC_STATE_ROUTES = PRESIDENTIAL_STATES.map(
  buildStateSeoRoute,
);

export const APPROVED_PUBLIC_SEO_ROUTES = [
  ...PARTNER_ROUTES,
  ...APPROVED_PUBLIC_STATIC_ROUTES,
  ...getConcreteSeriesSeoRoutes(),
  ...APPROVED_PUBLIC_PRODUCT_ROUTES,
  ...APPROVED_PUBLIC_LEARN_GUIDE_ROUTES,
  ...APPROVED_PUBLIC_TERM_ROUTES,
  ...APPROVED_PUBLIC_STATE_ROUTES,
] as const satisfies readonly SeoRouteRecord[];

export const APPROVED_PUBLIC_SEO_ROUTE_COUNT = 91 as const;

if (APPROVED_PUBLIC_SEO_ROUTES.length !== APPROVED_PUBLIC_SEO_ROUTE_COUNT) {
  throw new Error(
    `Approved public SEO route count mismatch: ${APPROVED_PUBLIC_SEO_ROUTES.length}`,
  );
}
