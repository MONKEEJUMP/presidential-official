export type HardcodedInContentLinkRule = {
  readonly href: string;
  readonly anchor: string;
  readonly context: string;
};

// InLinks pid 50409, hardcoded as first-party links. Context keeps repeated
// words such as "retailer" attached to the exact sentence approved for each
// route instead of turning every matching word on a page into a link.
export const HARDCODED_IN_CONTENT_LINKS = {
  "/": [
    { href: "/about", anchor: "brand", context: "the real brand, straight" },
    {
      href: "/moon-rocks/24k",
      anchor: "flower",
      context: "flower coated with concentrate or resin and kief",
    },
  ],
  "/about": [
    {
      href: "/moon-rocks/24k",
      anchor: "flower",
      context: "flower with something dusted on top",
    },
    {
      href: "/",
      anchor: "retailers",
      context: "licensed retailers carrying authentic product",
    },
  ],
  "/learn": [
    { href: "/about", anchor: "brand", context: "Presidential is a wholesale brand" },
    {
      href: "/moon-rocks/24k",
      anchor: "FLOWER",
      context: "FLOWER · LIQUID LIVE RESIN · DIAMONDS on a third",
    },
    { href: "/", anchor: "retail", context: "the retail path" },
    {
      href: "/moon-rocks/presidential-x-thc-design",
      anchor: "Presidential x THC Design",
      context: "Presidential x THC Design is a collaboration name, not a strain classification",
    },
    {
      href: "/moon-rocks/papaya-punch",
      anchor: "Papaya Punch",
      context: "Papaya Punch is one approved product in the Gold catalogue",
    },
    {
      href: "/moon-rocks/cosmic-cookies",
      anchor: "Cosmic Cookies",
      context: "Cosmic Cookies is one approved product in the Rose Gold catalogue",
    },
    {
      href: "/moon-rocks/presidential-og",
      anchor: "Presidential OG",
      context: "Presidential OG has its own product page within that same Gold series",
    },
    {
      href: "/moon-rocks/sfv-og",
      anchor: "SFV OG",
      context: "SFV OG is documented separately so the product names remain distinct",
    },
  ],
  "/learn/what-are-liquid-diamonds": [
    {
      href: "/moon-rocks/silver",
      anchor: "Silver lane",
      context: "Liquid diamonds anchor the Silver lane of the Presidential catalog",
    },
    { href: "/", anchor: "retailer", context: "Availability varies by licensed retailer" },
  ],
  "/learn/what-are-moon-rocks": [
    {
      href: "/moon-rocks/24k",
      anchor: "flower",
      context: "The flower is infused with THC distillate",
    },
  ],
  "/learn/what-is-live-resin": [
    {
      href: "/moon-rocks/gold",
      anchor: "Gold Strain Series",
      context: "live resin defines the Gold Strain Series",
    },
    { href: "/", anchor: "retailer", context: "Availability varies by licensed retailer" },
  ],
  "/learn/what-is-live-rosin": [
    {
      href: "/moon-rocks/rose-gold",
      anchor: "Rose Gold Connoisseur Series",
      context: "Live rosin defines the Rose Gold Connoisseur Series",
    },
    { href: "/", anchor: "retailer", context: "Availability varies by licensed retailer" },
  ],
  "/learn/infusion-science": [
    {
      href: "/moon-rocks/presidential-house-line",
      anchor: "Moon Rocks, infused prerolls, and infused blunts",
      context: "Presidential builds its Moon Rocks, infused prerolls, and infused blunts around deep infusion",
    },
  ],
  "/learn/flavor-science": [
    {
      href: "/moon-rocks/silver",
      anchor: "Silver strains",
      context: "fruit-forward Silver strains like Blue Raspberry and Watermelon",
    },
  ],
  "/learn/different-extracts-need-different-heat": [
    {
      href: "/orbit",
      anchor: "Orbit",
      context: "Orbit, the Presidential technology platform",
    },
  ],
  "/moon-rocks": [
    {
      href: "/moon-rocks/24k",
      anchor: "flower",
      context: "flower, concentrate, and kief working together",
    },
  ],
  "/moon-rocks/24k": [
    { href: "/about", anchor: "brand", context: "Presidential is a wholesale brand" },
    {
      href: "/",
      anchor: "retailer",
      context: "verified licensed retailer information",
    },
  ],
  "/moon-rocks/blue-dream": [
    { href: "/about", anchor: "brand", context: "since the brand started" },
    {
      href: "/moon-rocks/24k",
      anchor: "flower",
      context: "flower with something sprayed on it",
    },
    { href: "/", anchor: "shop", context: "the shop's decision" },
  ],
  "/moon-rocks/cereal-milk": [
    {
      href: "/",
      anchor: "retailer",
      context: "verified licensed retailer information",
    },
  ],
  "/moon-rocks/cosmic-cookies": [
    {
      href: "/",
      anchor: "retailer",
      context: "verified licensed retailer information",
    },
  ],
  "/moon-rocks/galactic-gas": [
    {
      href: "/about",
      anchor: "brand",
      context: "reason the brand is called what it is called",
    },
    { href: "/", anchor: "retailers", context: "licensed retailers only" },
  ],
  "/moon-rocks/gods-gift": [
    {
      href: "/moon-rocks/24k",
      anchor: "FLOWER",
      context: "FLOWER · LIQUID LIVE RESIN · DIAMONDS on Cap Junky",
    },
    {
      href: "/",
      anchor: "retailer",
      context: "licensed retailer carrying Presidential",
    },
  ],
  "/moon-rocks/king-louis": [
    {
      href: "/",
      anchor: "shop",
      context: "what a given shop carries varies more than usual",
    },
  ],
  "/moon-rocks/nyc-diesel": [
    { href: "/about", anchor: "brand", context: "when the brand started" },
    {
      href: "/",
      anchor: "retailer",
      context: "verified licensed retailer information",
    },
  ],
  "/moon-rocks/papaya-punch": [
    {
      href: "/moon-rocks/24k",
      anchor: "FLOWER",
      context: "FLOWER · LIVE RESIN · DIAMONDS",
    },
    {
      href: "/",
      anchor: "retailer",
      context: "licensed retailer carrying Presidential",
    },
  ],
  "/moon-rocks/presidential-house-line": [
    {
      href: "/",
      anchor: "retailer",
      context: "verified licensed retailer information",
    },
  ],
  "/moon-rocks/presidential-line": [
    {
      href: "/",
      anchor: "retailer",
      context: "verified licensed retailer information",
    },
  ],
  "/moon-rocks/presidential-line-guava-haze": [
    {
      href: "/",
      anchor: "retailer",
      context: "verified licensed retailer information",
    },
  ],
  "/moon-rocks/presidential-line-head-cheese": [
    {
      href: "/",
      anchor: "retailer",
      context: "verified licensed retailer information",
    },
  ],
  "/moon-rocks/presidential-line-iced-lemon": [
    {
      href: "/about",
      anchor: "brand",
      context: "wholesale brand operating across six state markets",
    },
    {
      href: "/",
      anchor: "retailer",
      context: "verified licensed retailer information",
    },
  ],
  "/moon-rocks/presidential-moon-rocks": [
    {
      href: "/moon-rocks/24k",
      anchor: "FLOWER",
      context: "FLOWER · DISTILLATE · KIEF",
    },
    {
      href: "/",
      anchor: "retailer",
      context: "verified licensed retailer information",
    },
  ],
  "/moon-rocks/presidential-og": [
    { href: "/moon-rocks/24k", anchor: "flower", context: "flower as the body" },
    { href: "/", anchor: "retailer", context: "a retailer chooses to stock" },
  ],
  "/moon-rocks/presidential-x-thc-design": [
    {
      href: "/moon-rocks/24k",
      anchor: "FLOWER",
      context: "Built on FLOWER · DISTILLATE · KIEF",
    },
    { href: "/", anchor: "retailers", context: "licensed retailers only" },
  ],
  "/moon-rocks/rainbow-belts": [
    { href: "/moon-rocks/24k", anchor: "flower", context: "flower as the body" },
    { href: "/", anchor: "retailer", context: "a retailer chooses to stock" },
  ],
  "/moon-rocks/wedding-cake": [
    { href: "/moon-rocks/24k", anchor: "Flower", context: "Flower as the base" },
    {
      href: "/",
      anchor: "retailers",
      context: "licensed retailers nearest you carrying Presidential",
    },
  ],
  "/moon-rocks/white-walker": [
    { href: "/moon-rocks/24k", anchor: "Flower", context: "Flower as the base" },
    { href: "/", anchor: "retailer", context: "a retailer chooses to stock" },
  ],
} as const satisfies Record<string, readonly HardcodedInContentLinkRule[]>;

export const HARDCODED_IN_CONTENT_LINK_COUNT = Object.values(
  HARDCODED_IN_CONTENT_LINKS,
).reduce((total, rules) => total + rules.length, 0);

export function hardcodeInContentLinks(sourcePath: string, value: string): string {
  const rules = HARDCODED_IN_CONTENT_LINKS[sourcePath as keyof typeof HARDCODED_IN_CONTENT_LINKS];
  if (!rules?.length) {
    return value;
  }

  return rules.reduce((output, rule) => {
    const marker = `[${rule.anchor}](${rule.href})`;
    if (output.includes(marker)) {
      return output;
    }

    const contextStart = output.indexOf(rule.context);
    if (contextStart < 0) {
      return output;
    }

    const anchorStart = output.indexOf(
      rule.anchor,
      contextStart,
    );
    const contextEnd = contextStart + rule.context.length;
    if (anchorStart < contextStart || anchorStart + rule.anchor.length > contextEnd) {
      return output;
    }

    return `${output.slice(0, anchorStart)}${marker}${output.slice(anchorStart + rule.anchor.length)}`;
  }, value);
}
