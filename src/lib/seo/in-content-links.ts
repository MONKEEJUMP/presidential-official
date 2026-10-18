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
    { href: "/about", anchor: "real brand", context: "the real brand, straight" },
    {
      href: "/moon-rocks/24k",
      anchor: "flower",
      context: "flower coated with concentrate or resin and kief",
    },
  ],
  "/about": [
    // MR-TOP50 A11: the bare "flower" -> /moon-rocks/24k link was removed; /moon-rocks owns "presidential flower".
    {
      href: "/",
      anchor: "licensed retailers",
      context: "licensed retailers carrying authentic product",
    },
  ],
  "/learn": [
    { href: "/about", anchor: "wholesale brand", context: "Presidential is a wholesale brand" },
    {
      href: "/learn/what-are-moon-rocks",
      anchor: "FLOWER · DISTILLATE · KIEF",
      context: "FLOWER · DISTILLATE · KIEF on another",
    },
    { href: "/", anchor: "the retail path", context: "the retail path" },
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
    { href: "/", anchor: "retailer", context: "Availability varies by licensed retailer" },
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/flavor-science",
      anchor: "terpene",
      context: "recombined with their terpene sauce",
    },
  ],
  "/learn/what-are-moon-rocks": [
    // SURFER-R13: THC distillate guide.
    { href: "/learn/what-is-thc-distillate", anchor: "distillate", context: "carries distillate through the flower" },
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
    // SURFER-R13: THC distillate guide.
    { href: "/learn/what-is-thc-distillate", anchor: "distillate", context: "distillate is stripped and refined" },
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
    // SURFER-R13: THC distillate guide.
    { href: "/learn/what-is-thc-distillate", anchor: "Distillate", context: "Distillate is the extract identified with the Silver Flavor Series" },
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
  // MR-TOP50 A11: the bare "flower" -> /moon-rocks/24k rule for /moon-rocks was removed.
  "/moon-rocks/24k": [
    { href: "/about", anchor: "wholesale brand", context: "Presidential is a wholesale brand" },
    { href: "/find-us", anchor: "select state markets", context: "currently active across select state markets" },
    {
      href: "/",
      anchor: "licensed retailer",
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
    {
      href: "/about",
      anchor: "brand started in Los Angeles in 2012",
      context: "since the brand started in Los Angeles in 2012",
    },
    {
      href: "/learn/what-are-moon-rocks",
      anchor: "flower with something sprayed on it",
      context: "flower with something sprayed on it",
    },
    { href: "/", anchor: "shop's decision", context: "the shop's decision" },
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
      anchor: "licensed retailer",
      context: "verified licensed retailer information",
    },
  ],
  "/moon-rocks/cosmic-cookies": [
    {
      href: "/",
      anchor: "licensed retailer",
      context: "verified licensed retailer information",
    },
  ],
  "/moon-rocks/galactic-gas": [
    {
      href: "/about",
      anchor: "brand is called what it is called",
      context: "reason the brand is called what it is called",
    },
    { href: "/", anchor: "licensed retailers", context: "licensed retailers only" },
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
      href: "/learn/what-are-moon-rocks",
      anchor: "FLOWER · DISTILLATE · KIEF",
      context: "FLOWER · DISTILLATE · KIEF on the self-titled flagship",
    },
    {
      href: "/",
      anchor: "licensed retailer",
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
  "/partners": [
    { href: "/find-us", anchor: "select state markets", context: "doors across select state markets" },
  ],
  "/moon-rocks/king-louis": [
    { href: "/find-us", anchor: "select state markets", context: "currently active in select state markets" },
    {
      href: "/",
      anchor: "shop carries",
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
    { href: "/about", anchor: "brand started in Los Angeles", context: "when the brand started in Los Angeles" },
    {
      href: "/",
      anchor: "licensed retailer",
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
      href: "/learn/what-are-moon-rocks",
      anchor: "FLOWER · LIVE RESIN · DIAMONDS",
      context: "FLOWER · LIVE RESIN · DIAMONDS",
    },
    {
      href: "/",
      anchor: "licensed retailer",
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
      anchor: "licensed retailer",
      context: "verified licensed retailer information",
    },
  ],
  "/moon-rocks/presidential-line": [
    {
      href: "/",
      anchor: "licensed retailer",
      context: "verified licensed retailer information",
    },
  ],
  "/moon-rocks/presidential-line-guava-haze": [
    {
      href: "/",
      anchor: "licensed retailer",
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
      anchor: "licensed retailer",
      context: "verified licensed retailer information",
    },
  ],
  "/moon-rocks/presidential-line-iced-lemon": [
    {
      href: "/about",
      anchor: "wholesale brand",
      context: "wholesale brand operating across",
    },
    {
      href: "/",
      anchor: "licensed retailer",
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
      href: "/learn/what-are-moon-rocks",
      anchor: "FLOWER · DISTILLATE · KIEF",
      context: "FLOWER · DISTILLATE · KIEF",
    },
    {
      href: "/",
      anchor: "licensed retailer",
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
    { href: "/learn/what-are-moon-rocks", anchor: "flower as the body", context: "flower as the body" },
    { href: "/", anchor: "retailer chooses to stock", context: "a retailer chooses to stock" },
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
    { href: "/", anchor: "licensed retailers", context: "licensed retailers only" },
  ],
  "/moon-rocks/rainbow-belts": [
    { href: "/learn/what-are-moon-rocks", anchor: "flower as the body", context: "flower as the body" },
    { href: "/", anchor: "retailer chooses to stock", context: "a retailer chooses to stock" },
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
    { href: "/learn/what-are-moon-rocks", anchor: "Flower as the base", context: "Flower as the base" },
    {
      href: "/",
      anchor: "licensed retailers",
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
    { href: "/learn/what-are-moon-rocks", anchor: "Flower as the base", context: "Flower as the base" },
    { href: "/", anchor: "retailer chooses to stock", context: "a retailer chooses to stock" },
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
  // InLinks pid 50409 export 2026-10-06 (INLK-0001 follow-up).
  "/find-us/az": [
    { href: "/about", anchor: "carries the brand", context: "who carries the brand" },
  ],
  "/find-us/ny": [
    { href: "/about", anchor: "stocks the brand", context: "who stocks the brand" },
  ],
} as const satisfies Record<string, readonly HardcodedInContentLinkRule[]>;

export const HARDCODED_IN_CONTENT_LINK_COUNT = Object.values(
  HARDCODED_IN_CONTENT_LINKS,
).reduce((total, rules) => total + rules.length, 0);

// Chief ruling (Oct 16): no state-market count on /moon-rocks/24k or /moon-rocks/king-louis; CMS sentence rewritten here (no Sanity write access).
const IN_CONTENT_TEXT_OVERRIDES: Readonly<Record<string, readonly (readonly [string, string])[]>> = {
  "/moon-rocks/24k": [
    ["Diamonds as the crystalline finish on the outside.", "Finished with diamonds on the outside."],
    [
      "Presidential is currently active across six state markets with two more opening.",
      "Presidential is currently active across select state markets.",
    ],
  ],
  "/moon-rocks/king-louis": [
    // Sitebulb R38 A14: no unsourced superlative in the pack heading.
    ["The pack, and why it is the best-designed in the line", "The King Louis pack design"],
    [
      "Presidential is currently active in six state markets with two more opening.",
      "Presidential is currently active in select state markets.",
    ],
  ],
  // Sitebulb R29 A6/A8: no flower THC range, no "potent" in body copy.
  // Chief R29 ruling (b): pack labels decide the moon rock finish; (c) no unsourced percentages; (d) no catalog count.
  "/moon-rocks/blue-dream": [
    // Sitebulb R33 A5: no unsourced "most requested" / "most recognisable" claims.
    ["Blue Dream is the most requested name in cannabis, and that is exactly the problem", "Blue Dream is a familiar name in cannabis, and that is exactly the problem"],
    ["It is that method applied to the most recognisable name in the room.", "It is that method applied to a name everyone already knows."],
    [
      "Diamonds are the finish — the concentrated crystalline form that gives the outside of a Presidential Moon Rock its texture and its weight in the hand.",
      "It is finished with diamonds, which give the outside of a Presidential Moon Rock its texture and its weight in the hand.",
    ],
    ["The same flower, the same live resin coat, the same diamond finish.", "The same flower, the same live resin coat, finished with diamonds."],
  ],
  // Sitebulb R33 A6: no unsourced market-size claim.
  "/moon-rocks/cap-junky": [
    ["Planet 13 is one of the larger operators in the Nevada market, and Nevada is one of Presidential's active states.", "Planet 13 is a Nevada operator, and Nevada is one of Presidential's active states."],
    // Sitebulb R38 B5.
    // Sitebulb R39 A5: grammar fixed, no count.
    ["Trendi is the Planet 13 line, and Cap Junky and Orange Push Pop are the two releases that carry it.", "Trendi is the Planet 13 line, carried by Cap Junky and [Orange Push Pop, the other Trendi jar](/moon-rocks/orange-push-pop)."],
  ],
  // Sitebulb R34 A2: mini pre-rolls are smaller, so drop the "smallest single unit" claim.
  "/moon-rocks/thc-design-prerolls": [["One gram. The smallest single unit Presidential rolls.", "One gram, one roll."]],
  "/moon-rocks/gods-gift": [
    ["A dry material is bonded to the coat as a finish.", "Kief is bonded to the coat as a finish."],
    // Sitebulb R38 B7.
    ["SFV OG carries a place and a lineage in four letters.", "[SFV OG, the San Fernando Valley jar](/moon-rocks/sfv-og), carries a place and a lineage in four letters."],
  ],
  // Chief R38 ruling: Ghost Train Haze is the pack-art spelling.
  "/moon-rocks/presidential-line-ghost-haze-train": [["Ghost Haze Train", "Ghost Train Haze"]],
  // Sitebulb R38 A12: the jar page shows the blunt pack, so describe the pack, not the page.
  "/moon-rocks/presidential-og": [
    ["This page is the Moon Rock Blunt. One blunt,", "The pack shown is the Moon Rock Blunt: one blunt,"],
    // Chief R38 ruling: the OG blunt art marks Hybrid, so the conflicting Type row is cut.
    ["| Type | Indica | Indica |\n", ""],
    ["| Type | Indica | Indica |", ""],
  ],
  "/moon-rocks/presidential-prerolls": [
    ["A dry material is bonded to the coat as a finish.", "Kief is bonded to the coat as a finish."],
    // Sitebulb R35 A6: unsourced consumer-behavior claim.
    ["It is the entry point to the line, and it is the format most people meet first.", "It is the entry point to the line."],
  ],
  "/moon-rocks/presidential-moon-rocks": [
    // Sitebulb R35 A6: unsourced consumer-behavior claim.
    ["It is the single most useful thing to read on a Presidential label and most people never look at it.", "It is the most useful thing to read on a Presidential label."],
  ],
  // Sitebulb R35 B12: Head Cheese inlink to Garlic Cookies after the tasting line.
  "/moon-rocks/presidential-line-head-cheese": [
    ["Never claimed to be a beginner's flavor.", "Never claimed to be a beginner's flavor. For another pungent Presidential Line jar, see [Garlic Cookies with Nature's Chemistry](/moon-rocks/presidential-line-garlic-cookies)."],
    ["Never claimed to be a beginner’s flavor.", "Never claimed to be a beginner’s flavor. For another pungent Presidential Line jar, see [Garlic Cookies with Nature's Chemistry](/moon-rocks/presidential-line-garlic-cookies)."],
  ],
  // Chief R30 ruling: THC Design copy states the printed build (Creskendo and XJ13: flower, live resin, diamonds).
  "/moon-rocks/thc-design-blunts": [
    ["a dry material bonded to the coat as the finish.", "a diamond finish bonded to the coat, as the pack prints."],
    ["Both are Sativa, both built on FLOWER · DISTILLATE · KIEF.", "Both are Sativa, both built on FLOWER · LIVE RESIN · DIAMONDS."],
  ],
  // Chief R30 ruling + Sitebulb R31 A1: THC Design moon rocks match the hub and repo build (flower, live resin, diamonds); no Creskendo/XJ13 jar claims.
  "/moon-rocks/thc-design-moon-rocks": [
  // Chief R31 ruling: collaboration page, no loose-jar specs (keep URL, no redirect).
    ["Two grams, loose, nothing rolled.", "Presidential x THC Design, built on live resin."],
    ["This is the only Presidential \u00d7 THC Design format that arrives unfinished, and that changes what it is.", "The Presidential x THC Design collaboration is flower, live resin and diamonds, released as the Creskendo and XJ13 Moon Rock blunts. The [Presidential x THC Design collection](/moon-rocks/presidential-x-thc-design) lists both releases."],
    ["This is the only Presidential x THC Design format that arrives unfinished, and that changes what it is.", "The Presidential x THC Design collaboration is flower, live resin and diamonds, released as the Creskendo and XJ13 Moon Rock blunts. The [Presidential x THC Design collection](/moon-rocks/presidential-x-thc-design) lists both releases."],
    ["**Loose is a different decision**", ""],
    ["Every other format in the catalogue makes the choice for you. The Blunt is one object at 1.5 grams. The Preroll is one at 1 gram. The Mini three-packs are three at 0.7 or 0.5 grams. Each of those is a finished thing you take out and use.", ""],
    ["Loose Moon Rocks are 2 grams, printed as 0.071 oz, and the crescent on the front of the pack reads **2 G** instead of a unit count—because there is no unit. What happens next is yours: a bowl, a joint you roll yourself, a blunt broken down and rebuilt.", ""],
    ["Loose Moon Rocks are 2 grams, printed as 0.071 oz, and the crescent on the front of the pack reads **2 G** instead of a unit count — because there is no unit. What happens next is yours: a bowl, a joint you roll yourself, a blunt broken down and rebuilt.", ""],
    ["Loose Moon Rocks are 2 grams, printed as 0.071 oz, and the crescent on the front of the pack reads **2 G** instead of a unit count - because there is no unit. What happens next is yours: a bowl, a joint you roll yourself, a blunt broken down and rebuilt.", ""],
    ["Loose Moon Rocks are 2 grams, printed as 0.071 oz, and the crescent on the front of the pack reads 2 G instead of a unit count—because there is no unit. What happens next is yours: a bowl, a joint you roll yourself, a blunt broken down and rebuilt.", ""],
    ["Loose Moon Rocks are 2 grams, printed as 0.071 oz, and the crescent on the front of the pack reads 2 G instead of a unit count — because there is no unit. What happens next is yours: a bowl, a joint you roll yourself, a blunt broken down and rebuilt.", ""],
    ["Loose Moon Rocks are 2 grams, printed as 0.071 oz, and the crescent on the front of the pack reads 2 G instead of a unit count - because there is no unit. What happens next is yours: a bowl, a joint you roll yourself, a blunt broken down and rebuilt.", ""],
    ["It is also the format where you can actually see what a moon rock is. Rolled into a blunt, the construction is hidden inside a wrap. Loose in the hand, the layers are visible", "In a Creskendo or XJ13 blunt, the build sits inside the wrap"],
    ["No tobacco-free marking on this format", "Tobacco-free wraps"],
    ["Loose Moon Rocks have no wrap at all, so there is nothing to mark. It is a small thing, and it is the kind of detail that tells you the packaging is describing the actual product rather than repeating a template.", "Creskendo and XJ13 are rolled in tobacco-free wraps."],
    ["retailer — loose formats in particular are not carried everywhere.", "retailer."],
    ["retailer—loose formats in particular are not carried everywhere.", "retailer."],
    ["retailer - loose formats in particular are not carried everywhere.", "retailer."],
    ["Flower as the body. Distillate as the coat. Kief as the finish. That is the older, heavier Presidential build — the same construction the self-titled flagship pack carries — and it is distinct from the live-resin builds that run across most of the Gold Strain Series.", ""],
    ["Flower as the body. Distillate as the coat. Kief as the finish. That is the older, heavier Presidential build—the same construction the self-titled flagship pack carries—and it is distinct from the live-resin builds that run across most of the Gold Strain Series.", ""],
    ["Flower as the body. Distillate as the coat. Kief as the finish. That is the older, heavier Presidential build - the same construction the self-titled flagship pack carries - and it is distinct from the live-resin builds that run across most of the Gold Strain Series.", ""],
    ["Held loose, kief is the layer you notice. It is dry rather than crystalline, powdery rather than glinting, and it comes off on your fingers in a way diamonds do not.", ""],
    ["Both THC Design releases are built on FLOWER · DISTILLATE · KIEF.", "THC Design releases are built on FLOWER · LIVE RESIN · DIAMONDS: flower as the body, live resin carried through it, and diamonds as the finish."],
    ["the flower underneath, the concentrate coat over it, the dry finish bonded to the outside.", "the flower underneath, the live resin through it, and the diamond finish on the outside."],
    ["the flower underneath, the concentrate coat over it, the kief finish bonded to the outside.", "the flower underneath, the live resin through it, and the diamond finish on the outside."],
    [" It appears on two releases: **Creskendo**, a Sativa on a purple pack with musical notes floating through erupting liquid, and **XJ13**, a Sativa on a mint-green pack with a molecular diagram and a chemical structure drawing threaded through gold and teal.", ""],
    [" It appears on two releases: Creskendo, a Sativa on a purple pack with musical notes floating through erupting liquid, and XJ13, a Sativa on a mint-green pack with a molecular diagram and a chemical structure drawing threaded through gold and teal.", ""],
    ["Both leaning scientific in their artwork is not accidental. Of Presidential's ten collaboration partners, THC Design sits with the cultivation and processing group, and both its packs look the part.", ""],
  ],
  "/moon-rocks/wedding-cake": [["A dry finishing material bonded to the coat.", "A kief finish bonded to the coat."]],
  "/moon-rocks/white-walker": [["A dry material bonded to the coat as the finish.", "Kief bonded to the coat as the finish."]],
  "/moon-rocks/xxx": [
    ["under a dry finish rather than a crystalline one.", "under a kief finish rather than a crystalline one."],
    // Sitebulb R39 B15: the sentence left out the mini blunt pack.
    ["the Mini Preroll three-pack at 3 x 0.5 grams.", "the Mini Preroll three-pack at 3 x 0.5 grams, and the Mini Blunt three-pack at 3 x 0.7 grams."],
    ["the Mini Preroll three-pack at 3 \u00d7 0.5 grams.", "the Mini Preroll three-pack at 3 \u00d7 0.5 grams, and the Mini Blunt three-pack at 3 \u00d7 0.7 grams."],
  ],
  "/moon-rocks/blue-raspberry": [["where it sits at thumbnail size next to forty other products and needs", "where it sits at thumbnail size and needs"]],
  "/learn/what-are-liquid-diamonds": [
    ["THCa is about 87.7% THC and 12.3% CO₂ by mass.", "THCa keeps about 0.877 of its mass as THC; the rest leaves as CO₂."],
    [
      "So a concentrate testing at 99% THCa carries a theoretical maximum of about 87% THC after complete conversion.",
      "So a THCa reading multiplied by 0.877 gives the theoretical maximum THC after complete conversion.",
    ],
    [
      "Most cannabis concentrates land somewhere below 90% cannabinoid content. THCa diamonds reach as high as 99% and above — the highest purity anything in cannabis achieves.",
      "THCa diamonds are among the purest forms a cannabis concentrate takes; the batch label gives the tested figure.",
    ],
    [" — finishing above 90% total cannabinoid content while retaining the strain's aromatic profile.", ", while retaining the strain's aromatic profile."],
  ],
  "/learn/what-are-moon-rocks": [
    ["The coating alone can run as high as 90% THC, depending on the concentrate used. ", ""],
    ["Standard cannabis flower generally tests between 15% and 25% THC.", "THC in cannabis flower varies by batch, so read the tested label."],
    ["the densest flower, the most potent coating, the finest kief.", "the densest flower, the richest coating, the finest kief."],
    // Sitebulb R31 B2: intro inlink to the home page.
    [
      "Presidential builds its catalog around this layered approach.",
      "Presidential builds its catalog around this layered approach. See how [Presidential flower becomes a Moon Rocks jar](/) on the home page.",
    ],
  ],
  // Sitebulb R29 A7: no unsourced multiplier.
  "/learn/what-is-live-resin": [
    [
      "Within that, the two resin styles land in slightly different places. Cured resin reaches as high as 90%. Live resin reaches as high as 85%.",
      "Within that, cured resin and live resin test in slightly different places.",
    ],
    [
      "Cannabis concentrates as a category reach as high as 90% cannabinoid content — several times what any flower can carry.",
      "Cannabis concentrates as a category carry far more cannabinoids by weight than flower; the batch label gives the tested figure.",
    ],
  ],
  // Sitebulb R27 (chief ruling 1): the lineup line reads "kief or diamond finish".
  "/learn/infusion-science": [
    ["around deep infusion, finished with a kief coating.", "around deep infusion, closed with a kief or diamond finish."],
  ],
  // Chief ruling (Sitebulb R26): lines describing the blunts or the whole lineup read "kief or diamond finish".
  "/moon-rocks/presidential-blunts": [
    [
      "flower, concentrate, and kief brought together in a single wrap",
      "flower, concentrate, and a kief or diamond finish brought together in a single wrap",
    ],
  ],
};

// Standing no-state-counts rule: every /moon-rocks/* CMS body drops the market count, and the
// first "select state markets" in each text links to the store finder.
const MOON_ROCKS_MARKET_SWAPS: readonly (readonly [string, string])[] = [
  ["Six state markets are active with two more opening.", "Presidential is active in select state markets."],
  ["six state markets with two more opening", "select state markets"],
];
const SELECT_STATE_MARKETS = "select state markets";
const SELECT_STATE_MARKETS_LINK = `[${SELECT_STATE_MARKETS}](/find-us)`;

function linkSelectStateMarkets(sourcePath: string, value: string): string {
  if (!sourcePath.startsWith("/moon-rocks/") || value.includes(SELECT_STATE_MARKETS_LINK)) return value;
  const index = value.indexOf(SELECT_STATE_MARKETS);
  if (index < 0) return value;
  return `${value.slice(0, index)}${SELECT_STATE_MARKETS_LINK}${value.slice(index + SELECT_STATE_MARKETS.length)}`;
}

export function hardcodeInContentLinks(sourcePath: string, rawValue: string): string {
  const swaps = [
    ...(IN_CONTENT_TEXT_OVERRIDES[sourcePath] ?? []),
    ...(sourcePath.startsWith("/moon-rocks/") ? MOON_ROCKS_MARKET_SWAPS : []),
  ];
  const value = swaps.reduce((text, [from, to]) => text.split(from).join(to), rawValue);
  const rules = HARDCODED_IN_CONTENT_LINKS[sourcePath as keyof typeof HARDCODED_IN_CONTENT_LINKS];
  if (!rules?.length) {
    return linkSelectStateMarkets(sourcePath, value);
  }

  return linkSelectStateMarkets(sourcePath, rules.reduce((output, rule) => {
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
  }, value));
}
