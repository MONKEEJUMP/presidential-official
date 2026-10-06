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
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/flavor-science",
      anchor: "terpene",
      context: "recombined with their terpene sauce",
    },
  ],
  "/learn/what-are-moon-rocks": [
    {
      href: "/moon-rocks/24k",
      anchor: "flower",
      context: "The flower is infused with THC distillate",
    },
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/infusion-science",
      anchor: "infusion process",
      context: "Presidential uses an infusion process that carries distillate",
    },
    {
      href: "/moon-rocks/silver",
      anchor: "Silver",
      context: "Silver is the flavor lane",
    },
    {
      href: "/moon-rocks/rose-gold",
      anchor: "Rose Gold",
      context: "Rose Gold is the connoisseur lane",
    },
  ],
  "/learn/what-is-live-resin": [
    {
      href: "/moon-rocks/gold",
      anchor: "Gold Strain Series",
      context: "live resin defines the Gold Strain Series",
    },
    { href: "/", anchor: "retailer", context: "Availability varies by licensed retailer" },
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/flavor-science",
      anchor: "Terpenes",
      context: "Terpenes are volatile",
    },
  ],
  "/learn/what-is-live-rosin": [
    {
      href: "/moon-rocks/rose-gold",
      anchor: "Rose Gold Connoisseur Series",
      context: "Live rosin defines the Rose Gold Connoisseur Series",
    },
    { href: "/", anchor: "retailer", context: "Availability varies by licensed retailer" },
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/flavor-science",
      anchor: "terpenes",
      context: "Push above 200°F and terpenes begin to degrade",
    },
  ],
  "/learn/infusion-science": [
    {
      href: "/moon-rocks/presidential-house-line",
      anchor: "Moon Rocks, infused prerolls, and infused blunts",
      context: "Presidential builds its Moon Rocks, infused prerolls, and infused blunts around deep infusion",
    },
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/what-is-live-resin",
      anchor: "live resin",
      context: "distillate, live resin, or live rosin each brings",
    },
    {
      href: "/learn/what-is-live-rosin",
      anchor: "live rosin",
      context: "or live rosin each brings a different character",
    },
    {
      href: "/pre-rolls",
      anchor: "infused prerolls",
      context: "When comparing infused prerolls or blunts",
    },
  ],
  "/learn/flavor-science": [
    {
      href: "/moon-rocks/silver",
      anchor: "Silver strains",
      context: "fruit-forward Silver strains like Blue Raspberry and Watermelon",
    },
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/different-extracts-need-different-heat",
      anchor: "Heat",
      context: "Heat is the fastest",
    },
    {
      href: "/moon-rocks/blue-raspberry",
      anchor: "Blue Raspberry",
      context: "like Blue Raspberry and Watermelon",
    },
    {
      href: "/moon-rocks/watermelon",
      anchor: "Watermelon",
      context: "and Watermelon",
    },
  ],
  "/learn/different-extracts-need-different-heat": [
    {
      href: "/orbit",
      anchor: "Orbit",
      context: "Orbit, the Presidential technology platform",
    },
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/what-is-live-rosin",
      anchor: "Live rosin",
      context: "Live rosin is the most heat-sensitive of the three",
    },
    {
      href: "/learn/what-is-live-resin",
      anchor: "Live resin",
      context: "Live resin sits in the middle",
    },
    {
      href: "/learn/what-are-liquid-diamonds",
      anchor: "Liquid diamonds",
      context: "Liquid diamonds run highest",
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
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/what-is-live-resin",
      anchor: "Live resin",
      context: "Live resin as the coat",
    },
    {
      href: "/learn/infusion-science",
      anchor: "Presidential Infusion System",
      context: "three-part Presidential Infusion System build",
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
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/infusion-science",
      anchor: "Presidential Infusion System",
      context: "That three-part build is what the Presidential Infusion System",
    },
    {
      href: "/moon-rocks/gold",
      anchor: "Gold Strain Series",
      context: "Gold Strain Series takes the opposite position",
    },
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
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/what-is-live-resin",
      anchor: "Live resin",
      context: "Live resin coating it",
    },
    {
      href: "/learn/infusion-science",
      anchor: "Presidential Infusion System",
      context: "Three stages through the Presidential Infusion System",
    },
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
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/moon-rocks/silver",
      anchor: "Silver Flavour Series",
      context: "The Silver Flavour Series leads with a flavour",
    },
    {
      href: "/moon-rocks/gold",
      anchor: "Gold Strain Series",
      context: "The Gold Strain Series leads with a strain name",
    },
    {
      href: "/learn/infusion-science",
      anchor: "Presidential Infusion System",
      context: "That sequence is the Presidential Infusion System and it has not changed",
    },
  ],
  "/moon-rocks/king-louis": [
    {
      href: "/",
      anchor: "shop",
      context: "what a given shop carries varies more than usual",
    },
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/what-is-live-resin",
      anchor: "Live resin",
      context: "Live resin coats it",
    },
    {
      href: "/learn/infusion-science",
      anchor: "Presidential Infusion System",
      context: "through the Presidential Infusion System the company has run since",
    },
  ],
  "/moon-rocks/nyc-diesel": [
    { href: "/about", anchor: "brand", context: "when the brand started" },
    {
      href: "/",
      anchor: "retailer",
      context: "verified licensed retailer information",
    },
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/what-is-live-resin",
      anchor: "Live resin",
      context: "Live resin as the coat",
    },
    {
      href: "/learn/infusion-science",
      anchor: "Presidential Infusion System",
      context: "applied in sequence, through the Presidential Infusion System",
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
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/what-is-live-resin",
      anchor: "Live resin",
      context: "Live resin coats it",
    },
    {
      href: "/learn/infusion-science",
      anchor: "Presidential Infusion System",
      context: "The Presidential Infusion System has run on this sequence",
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
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/what-is-live-resin",
      anchor: "live resin",
      context: "live resin coats it",
    },
    {
      href: "/learn/infusion-science",
      anchor: "Presidential Infusion System",
      context: "three-stage Presidential Infusion System, applied here",
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
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/what-is-live-resin",
      anchor: "live resin",
      context: "live resin as the coat",
    },
    {
      href: "/learn/infusion-science",
      anchor: "Presidential Infusion System",
      context: "The Presidential Infusion System build, unchanged from",
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
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/infusion-science",
      anchor: "Presidential Infusion System",
      context: "That process is the Presidential Infusion System, and it has been",
    },
  ],
  "/moon-rocks/presidential-og": [
    { href: "/moon-rocks/24k", anchor: "flower", context: "flower as the body" },
    { href: "/", anchor: "retailer", context: "a retailer chooses to stock" },
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/what-is-live-resin",
      anchor: "Live resin",
      context: "Live resin and diamonds is the heavier construction",
    },
    {
      href: "/learn/infusion-science",
      anchor: "Presidential Infusion System",
      context: "through the same Presidential Infusion System, which",
    },
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
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/what-is-live-resin",
      anchor: "live resin",
      context: "Flower, live resin, diamonds. The same three-stage",
    },
    {
      href: "/learn/infusion-science",
      anchor: "Presidential Infusion System",
      context: "and the Presidential Infusion System does not have a lighter setting",
    },
  ],
  "/moon-rocks/wedding-cake": [
    { href: "/moon-rocks/24k", anchor: "Flower", context: "Flower as the base" },
    {
      href: "/",
      anchor: "retailers",
      context: "licensed retailers nearest you carrying Presidential",
    },
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/what-is-live-resin",
      anchor: "live resin",
      context: "Some carry live resin and diamonds",
    },
    {
      href: "/learn/infusion-science",
      anchor: "Presidential Infusion System",
      context: "through the Presidential Infusion System the company has run since",
    },
  ],
  "/moon-rocks/white-walker": [
    { href: "/moon-rocks/24k", anchor: "Flower", context: "Flower as the base" },
    { href: "/", anchor: "retailer", context: "a retailer chooses to stock" },
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/what-is-live-resin",
      anchor: "Live resin",
      context: "Live resin and diamonds on most of the Gold Strain Series",
    },
    {
      href: "/moon-rocks/gold",
      anchor: "Gold Strain Series",
      context: "most of the Gold Strain Series",
    },
    {
      href: "/learn/infusion-science",
      anchor: "Presidential Infusion System",
      context: "That sequence is the Presidential Infusion System and it has run unchanged",
    },
  ],
  "/our-story": [
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/moon-pods",
      anchor: "Moon Pods",
      context: "Moon Pods, and Orbit — each engineered",
    },
    {
      href: "/orbit",
      anchor: "Orbit",
      context: "and Orbit — each engineered",
    },
  ],
  "/moon-rocks/rose-gold": [
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/moon-rocks/silver",
      anchor: "Silver Flavour Series",
      context: "a Silver Flavour Series pack goes through",
    },
    {
      href: "/moon-rocks/gold",
      anchor: "Gold series",
      context: "the Gold series names a strain",
    },
    {
      href: "/moon-rocks/presidential-x-thc-design",
      anchor: "THC Design",
      context: "Top Shelf Cultivation, THC Design, Trendi",
    },
  ],
  "/moon-rocks/cap-junky": [
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/moon-rocks/gold",
      anchor: "Gold Strain Series",
      context: "Every other blunt in the Gold Strain Series prints",
    },
    {
      href: "/learn/what-is-live-resin",
      anchor: "live resin",
      context: "live resin on Blue Dream and 24K",
    },
  ],
  "/moon-rocks/presidential-prerolls": [
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/infusion-science",
      anchor: "Presidential Infusion System",
      context: "That is the Presidential Infusion System, unchanged since",
    },
  ],
  "/moon-rocks/xxx": [
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/moon-rocks/gold",
      anchor: "Gold Strain Series",
      context: "XXX is the Gold Strain Series at its most direct",
    },
    {
      href: "/learn/what-is-live-resin",
      anchor: "Live resin",
      context: "Live resin coats it",
    },
    {
      href: "/learn/infusion-science",
      anchor: "Presidential Infusion System",
      context: "That sequence is the Presidential Infusion System, and it has run",
    },
  ],
  "/moon-rocks/presidential-blunts": [
    // FIX-10 item 8: one owner page for "presidential blunts" (/presidential-blunts).
    {
      href: "/presidential-blunts",
      anchor: "Presidential Blunt",
      context: "A Presidential Blunt is the house method in its most complete form",
    },
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
