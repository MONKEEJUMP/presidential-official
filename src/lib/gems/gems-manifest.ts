import { catalogItemSlug } from "@/lib/cms/catalog";

export type GemProduct = {
  readonly productKey: string;
  readonly slug: string;
  readonly name: string;
  readonly series: string;
  readonly href: string;
};

// Product identity and order follow the owner-locked catalog order.
const GEM_PRODUCT_ROWS = [
  { productKey: "silver-blue-raspberry", name: "Blue Raspberry", series: "Silver Flavor Series" },
  { productKey: "silver-grape", name: "Grape", series: "Silver Flavor Series" },
  { productKey: "silver-peach-mango", name: "Peach Mango", series: "Silver Flavor Series" },
  { productKey: "silver-pineapple", name: "Pineapple", series: "Silver Flavor Series" },
  { productKey: "silver-strawberry", name: "Strawberry", series: "Silver Flavor Series" },
  { productKey: "silver-tropical", name: "Tropical", series: "Silver Flavor Series" },
  { productKey: "silver-watermelon", name: "Watermelon", series: "Silver Flavor Series" },
  { productKey: "gold-24k", name: "24K", series: "Gold Strain Series" },
  { productKey: "gold-blue-dream", name: "Blue Dream", series: "Gold Strain Series" },
  { productKey: "gold-cap-junky", name: "Cap Junky", series: "Gold Strain Series" },
  { productKey: "gold-cherry-gelato", name: "Cherry Gelato", series: "Gold Strain Series" },
  { productKey: "gold-gorilla-goo", name: "Gorilla Goo", series: "Gold Strain Series" },
  { productKey: "gold-king-louis", name: "King Louis", series: "Gold Strain Series" },
  { productKey: "gold-nyc-diesel", name: "NYC Diesel", series: "Gold Strain Series" },
  { productKey: "gold-papaya-punch", name: "Papaya Punch", series: "Gold Strain Series" },
  { productKey: "gold-pink-cookies", name: "Pink Cookies", series: "Gold Strain Series" },
  { productKey: "gold-presidential-og", name: "Presidential OG", series: "Gold Strain Series" },
  { productKey: "gold-rainbow-belts", name: "Rainbow Belts", series: "Gold Strain Series" },
  { productKey: "gold-sfv-og", name: "SFV OG", series: "Gold Strain Series" },
  { productKey: "gold-skywalker", name: "Skywalker", series: "Gold Strain Series" },
  { productKey: "gold-waui", name: "Waui", series: "Gold Strain Series" },
  { productKey: "gold-xj-13", name: "XJ-13", series: "Gold Strain Series" },
  { productKey: "gold-xxx", name: "XXX", series: "Gold Strain Series" },
  { productKey: "presidential-line-garlic-cookies", name: "Garlic Cookies", series: "Presidential Line" },
  { productKey: "presidential-line-ghost-haze-train", name: "Ghost Haze Train", series: "Presidential Line" },
  { productKey: "presidential-line-guava-haze", name: "Guava Haze", series: "Presidential Line" },
  { productKey: "presidential-line-head-cheese", name: "Head Cheese", series: "Presidential Line" },
  { productKey: "presidential-line-iced-lemon", name: "Iced Lemon", series: "Presidential Line" },
  { productKey: "presidential-line-nino-brown", name: "Nino Brown", series: "Presidential Line" },
  { productKey: "presidential-line-whoa-si-whoa", name: "Whoa Si Whoa", series: "Presidential Line" },
] as const;

export const GEM_PRODUCTS: readonly GemProduct[] = GEM_PRODUCT_ROWS.map((gem) => {
  const slug = catalogItemSlug(gem);

  return {
    ...gem,
    slug,
    href: `/moon-rocks/${slug}`,
  };
});
