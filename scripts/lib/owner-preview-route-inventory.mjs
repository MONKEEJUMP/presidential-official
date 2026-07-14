const series = (
  slug,
  name,
  products,
) => ({
  slug,
  path: `/moon-rocks/${slug}`,
  label: `series-${slug}`,
  name,
  expectedProductCount: products.length,
  products: products.map(([productSlug, productName]) => ({
    slug: productSlug,
    path: `/moon-rocks/${productSlug}`,
    label: `product-${productSlug}`,
    name: productName,
    seriesPath: `/moon-rocks/${slug}`,
    seriesName: name,
  })),
});

export const OWNER_PREVIEW_SERIES_ROUTES = [
  series("silver", "Silver Flavor Series", [
    ["blue-raspberry", "Blue Raspberry"],
    ["grape", "Grape"],
    ["peach-mango", "Peach Mango"],
    ["pineapple", "Pineapple"],
    ["strawberry", "Strawberry"],
    ["tropical", "Tropical"],
    ["watermelon", "Watermelon"],
  ]),
  series("gold", "Gold Strain Series", [
    ["24k", "24K"],
    ["blue-dream", "Blue Dream"],
    ["cap-junky", "Cap Junky"],
    ["cherry-gelato", "Cherry Gelato"],
    ["crescendo", "Crescendo"],
    ["galactic-gas", "Galactic Gas"],
    ["gorilla-goo", "Gorilla Goo"],
    ["king-louis", "King Louis"],
    ["nyc-diesel", "NYC Diesel"],
    ["orange-push-pop", "Orange Push Pop"],
    ["papaya-punch", "Papaya Punch"],
    ["pink-cookies", "Pink Cookies"],
    ["presidential-og", "Presidential OG"],
    ["rainbow-belts", "Rainbow Belts"],
    ["sfv-og", "SFV OG"],
    ["skywalker", "Skywalker"],
    ["waui", "Waui"],
    ["xj-13", "XJ-13"],
    ["xxx", "XXX"],
  ]),
  series("rose-gold", "Rose Gold Connoisseur Series", [
    ["cereal-milk", "Cereal Milk"],
    ["cosmic-cookies", "Cosmic Cookies"],
    ["gods-gift", "God's Gift"],
    ["wedding-cake", "Wedding Cake"],
    ["white-walker", "White Walker"],
  ]),
  series("presidential-line", "Presidential Line", [
    ["presidential-line-apricotti", "Apricotti"],
    ["presidential-line-daniel-larusso", "Daniel LaRusso"],
    ["presidential-line-garlic-cookies", "Garlic Cookies"],
    ["presidential-line-ghost-haze-train", "Ghost Haze Train"],
    ["presidential-line-guava-haze", "Guava Haze"],
    ["presidential-line-head-cheese", "Head Cheese"],
    ["presidential-line-iced-lemon", "Iced Lemon"],
    ["presidential-line-laura-charles", "Laura Charles"],
    ["presidential-line-nino-brown", "Nino Brown"],
    ["presidential-line-whoa-si-whoa", "Whoa Si Whoa"],
  ]),
  series("presidential-house-line", "Presidential House Line", [
    ["presidential-blunts", "Presidential Blunts"],
    ["presidential-moon-rocks", "Presidential Moon Rocks"],
    ["presidential-prerolls", "Presidential Prerolls"],
  ]),
  series("presidential-x-thc-design", "Presidential x THC Design", [
    ["thc-design-blunts", "Presidential x THC Design Blunts"],
    ["thc-design-moon-rocks", "Presidential x THC Design Moon Rocks"],
    ["thc-design-prerolls", "Presidential x THC Design Prerolls"],
  ]),
];

export const OWNER_PREVIEW_PRODUCT_ROUTES = OWNER_PREVIEW_SERIES_ROUTES.flatMap(
  (entry) => entry.products,
);

export const LANE_H_CORE_ROUTES = [
  {
    path: "/moon-rocks",
    label: "moonRocks",
    expectedText: ["Presidential Moon Rocks"],
  },
  {
    path: "/loyalty",
    label: "loyalty",
    expectedText: ["Scan. Verify. Ascend."],
  },
  {
    path: "/find-us",
    label: "findUs",
    expectedText: ["Find Presidential Near You"],
  },
  {
    path: "/dispensaries",
    label: "dispensaries",
    expectedText: ["Drop Your Coordinates."],
  },
];

const allPaths = [
  ...OWNER_PREVIEW_SERIES_ROUTES.map((entry) => entry.path),
  ...OWNER_PREVIEW_PRODUCT_ROUTES.map((entry) => entry.path),
];

if (OWNER_PREVIEW_SERIES_ROUTES.length !== 6) {
  throw new Error("Lane H route inventory must contain exactly 6 catalog series.");
}

if (OWNER_PREVIEW_PRODUCT_ROUTES.length !== 47) {
  throw new Error("Lane H route inventory must contain exactly 47 catalog products.");
}

if (new Set(allPaths).size !== allPaths.length) {
  throw new Error("Lane H route inventory contains duplicate series or product URLs.");
}
