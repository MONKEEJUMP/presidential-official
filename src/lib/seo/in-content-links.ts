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
      context: "interest with licensed retailer information",
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
      context: "interest with licensed retailer information",
    },
  ],
  "/moon-rocks/cosmic-cookies": [
    {
      href: "/",
      anchor: "licensed retailer",
      context: "interest with licensed retailer information",
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
      context: "That sequence is the Presidential Infusion System.",
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
      context: "in that order, through the Presidential Infusion System.",
    },
  ],
  "/moon-rocks/nyc-diesel": [
    { href: "/about", anchor: "brand started in Los Angeles", context: "when the brand started in Los Angeles" },
    {
      href: "/",
      anchor: "licensed retailer",
      context: "interest with licensed retailer information",
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
      context: "The Presidential Infusion System runs on this sequence",
    },
  ],
  "/moon-rocks/presidential-house-line": [
    {
      href: "/",
      anchor: "licensed retailer",
      context: "interest with licensed retailer information",
    },
  ],
  "/moon-rocks/presidential-line": [
    {
      href: "/",
      anchor: "licensed retailer",
      context: "interest with licensed retailer information",
    },
  ],
  "/moon-rocks/presidential-line-guava-haze": [
    {
      href: "/",
      anchor: "licensed retailer",
      context: "interest with licensed retailer information",
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
      context: "interest with licensed retailer information",
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
      context: "interest with licensed retailer information",
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
      context: "interest with licensed retailer information",
    },
    // InLinks pid 50409 contextual same-site links (1006-PRES-INLK-0001).
    {
      href: "/learn/infusion-science",
      anchor: "Presidential Infusion System",
      context: "That process is the Presidential Infusion System, and it is",
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
      context: "Flower, live resin, diamonds. On this pack",
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
      context: "in that order, through the Presidential Infusion System.",
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
      context: "That sequence is the Presidential Infusion System.",
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
      context: "That is the Presidential Infusion System, and it is the reason",
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
      context: "That sequence is the Presidential Infusion System. What varies",
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
    // R40 chief ruling: no format counts.
    ["Presidential runs five formats and the weights are fixed across the entire catalogue.", "Presidential fixes the weight of every format across the entire catalogue."],
    // Sitebulb R33 A5: no unsourced "most requested" / "most recognisable" claims.
    ["Blue Dream is the most requested name in cannabis, and that is exactly the problem", "Blue Dream is a familiar name in cannabis, and that is exactly the problem"],
    ["It is that method applied to the most recognisable name in the room.", "It is that method applied to a name everyone already knows."],
    [
      "Diamonds are the finish — the concentrated crystalline form that gives the outside of a Presidential Moon Rock its texture and its weight in the hand.",
      "It is finished with diamonds, which give the outside of a Presidential Moon Rock its texture and its weight in the hand.",
    ],
    ["The same flower, the same live resin coat, the same diamond finish.", "The same flower, the same live resin coat, finished with diamonds."],
    // Chief R42 ruling (d): blunt-only line cut from the jar page.
    ["This page is the Moon Rock Blunt: one blunt, 1.5 grams net weight, printed on the pack as .053 oz, whole and hand-finished.", ""],
  ],
  // Sitebulb R33 A6: no unsourced market-size claim.
  "/moon-rocks/cap-junky": [
    // Sitebulb R40 A9: no composition count.
    ["Across the catalogue the middle ingredient runs four ways", "Across the catalogue the middle ingredient varies"],
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
    // R40 chief ruling: no format counts.
    ["Five formats, one build, five different occasions.", "Every format, one build, a different occasion for each."],
    // Sitebulb R40 A8.
    ["Across the catalogue that line runs four ways:", "Across the catalogue that line varies:"],
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
    ["Two grams, loose, nothing rolled.", "Presidential x THC Design."],
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
  "/moon-rocks/wedding-cake": [
    // Sitebulb R41 A20: Wedding Cake itself is diamonds, so the general line reads "kief or diamond".
    ["A dry finishing material bonded to the coat.", "A kief or diamond finish bonded to the coat."],
    ["A kief finish bonded to the coat.", "A kief or diamond finish bonded to the coat."],
    [" Gorilla Goo carries four ingredients rather than three.", ""],
    ["Gorilla Goo carries four ingredients rather than three.", ""],
    // Sitebulb R41 A21: builds differ by format on some names, and no catalogue-wide scope.
    [
      "The build is identical across all five. Only the size and the count change, and the crescent numeral on the front of the pack tells you which you are holding.",
      "Each format prints its own build, and the crescent numeral on the front of the pack tells you which you are holding.",
    ],
    ["The rest is the house, identical on every pack in the catalogue.", "The rest is the house design."],
    // Sitebulb R41 B15.
    ["What does not change", "How the build works"],
    // SURFER-R41 H2 after "The sweet side" (Sitebulb R41 placement).
    ["**How the build works**", "**Wedding Cake among the Rose Gold jars**\n\nWedding Cake is a Rose Gold Connoisseur Series jar. Its aroma sits at the dessert end of the catalog. Rose Gold is the solventless tier, and its names differ on aroma. For another sweet, dough-led name, see [Cosmic Cookies in Rose Gold](/moon-rocks/cosmic-cookies). For a cereal-sweet profile, look at [the lactic Cereal Milk jar in Rose Gold](/moon-rocks/cereal-milk). Read the package label for its build and batch test results, and confirm with the store which Wedding Cake formats it carries. For a name that leans on reverence, see [the God's Gift connoisseur jar](/moon-rocks/gods-gift).\n\n**How the build works**"],
  ],
  // Sitebulb R41 A14-A16: no catalogue counts or scope, blunt-only lines cut from the jar page.
  "/moon-rocks/presidential-line-guava-haze": [
    ["are two of the three Platinum collaborations in the Presidential catalogue,", "are Platinum collaborations,"],
    [
      "appears on three Presidential packs: Guava Haze, Iced Lemon and Tropicana Cookies.",
      "appears on the Guava Haze, Iced Lemon and Tropicana Cookies packs.",
    ],
    [" and to every Gold Strain Series release", ""],
    ["Every format", "Formats"],
    // SURFER-R41 H2 after "The collaboration and the market" (Sitebulb R41 placement).
    ["**Formats**", "**Guava Haze in the Presidential Line**\n\nGuava Haze is a Presidential Line jar. Its aroma runs warm and tropical, with guava at the front. Each Presidential Line name prints its own label design, so shoppers can compare them on aroma and art. For a savory contrast from the same line, look at [Garlic Cookies, a pungent Presidential Line jar](/moon-rocks/presidential-line-garlic-cookies). For how the layers are applied, read [how a moon rock is put together](/learn/what-are-moon-rocks). Read the current package label for the build and batch test results, and confirm stock with the store.\n\n**Formats**"],
    ["This page is the Moon Rock Blunt: one blunt, Net Wt. 1.5G (.053oz), printed legibly on the flat label.", ""],
    // Chief R42 ruling (b): no Guava Haze jar art, so the "What is inside" copy names no build.
    ["FLOWER · LIVE RESIN · DIAMONDS.", ""],
    [
      "Flower forms the body, live resin coats it, diamonds finish the outside. The three-stage Presidential Infusion System, applied here",
      "Guava Haze goes through the three-stage Presidential Infusion System, applied here",
    ],
    ["The wider ladder holds constant across the catalogue.", "Each format has a fixed weight."],
    ["100% TOBACCO FREE at the base — the wrap carries no tobacco, stated on the front of the pack rather than buried on the back.", ""],
  ],
  // Sitebulb R41 A17-A19.
  "/moon-rocks/galactic-gas": [
    ["Every format", "Formats"],
    // SURFER-R41 H2 after "What is inside" (Sitebulb R41 placement).
    ["**Formats**", "**Galactic Gas beside a resinous Gold jar**\n\nGalactic Gas is a Gold Strain Series jar. The name pairs a space theme with a gassy aroma. Shoppers who like heavier, resinous Gold profiles can compare it with [Gorilla Goo, a sticky Gold jar](/moon-rocks/gorilla-goo). For a refresher on how the layers come together, read [the layers inside a moon rock](/learn/what-are-moon-rocks). Each pack prints its own build, so check the label and its test results, and confirm stock with the store.\n\n**Formats**"],
    ["This page is the Moon Rock Blunt: one blunt, hand-finished.", ""],
    // Chief R42 rulings (b) and (c): no Galactic Gas jar art, and no Gold-wide build claim.
    ["FLOWER · LIVE RESIN · DIAMONDS.", ""],
    ["Flower as the body. Live resin coating it. Diamonds — the crystalline concentrate — as the outer finish. ", ""],
    [
      "Three stages through the Presidential Infusion System, the same sequence applied to every Gold Strain Series release regardless of how the pack is decorated.",
      "Three stages through the Presidential Infusion System. The jar label prints the materials.",
    ],
    ["on every single pack in the catalogue.", "on the pack."],
    ["Most of the line puts a moon behind the product.", "Many packs put a moon behind the product."],
    ["is constant across the entire catalogue.", "is the house design."],
    ["The 100% Tobacco Free marking appears on this pack, partly covered by the artwork. The wrap carries no tobacco.", ""],
  ],
  "/moon-rocks/white-walker": [
    ["A dry material bonded to the coat as the finish.", "Kief bonded to the coat as the finish."],
    // Sitebulb R40 A10.
    ["Across the catalogue those lines run four ways.", "Across the catalogue those lines vary."],
  ],
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
    // Sitebulb R40 A13: no series counts.
    ["organizes Moon Rocks into three series,", "organizes Moon Rocks into series,"],
    ["Beyond the three series sit", "Beyond the Silver, Gold, and Rose Gold series sit"],
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

// Sitebulb R42 MR Part A/B and Surfer R42 placement: applied after IN_CONTENT_TEXT_OVERRIDES, on the swapped text.
const SB = (heading: string, body: string) => `**${heading}**\n\n${body}\n\n`;
const R42_WHITE_WALKER = SB(
  "White Walker beside other Rose Gold names",
  "White Walker sits in the Rose Gold Connoisseur Series, and Presidential packs mark it as Sativa. Rose Gold is the solventless tier, so shoppers often compare its names on aroma and art. For a dessert-leaning name from the same tier, see [Wedding Cake from the same Rose Gold tier](/moon-rocks/wedding-cake). For a sweeter, dough-led option, look at the [cookie-sweet Cosmic Cookies jar](/moon-rocks/cosmic-cookies). Each jar prints its own build on the label, so read the pack in hand for batch test results.",
);
const R42_BLUE_RASPBERRY = SB(
  "Blue Raspberry among the Silver fruit jars",
  "Blue Raspberry is a Silver Flavor Series jar with a bright, candied berry aroma. Silver is the flavor-first tier, so its fruit names are easy to compare side by side before choosing. For a darker fruit profile from the same series, look at [dark-fruit Grape moon rocks](/moon-rocks/grape). For something lighter and juicier, the [summery Watermelon moon rocks](/moon-rocks/watermelon) lean sweet and fresh. Blue Raspberry also comes as a pre-roll and a blunt, and each format prints its own composition line, so read the label on the pack you pick up for its build and batch test results.",
);
const R42_CAP_JUNKY = SB(
  "Cap Junky next to other Gold names",
  "Cap Junky carries the Gold Strain Series name, and its pack prints its own composition line, which is worth reading closely before you buy. Gold groups strain-led names, so shoppers often compare them on aroma and pack art. For a space-themed name in the same tier, look at [Galactic Gas, a space-named Gold jar](/moon-rocks/galactic-gas). For a heavier, stickier profile, see the [heavy, sticky Gorilla Goo jar](/moon-rocks/gorilla-goo). Each jar prints its build on its own label, so check the pack in hand for the composition line and batch test results rather than assuming jars match.",
);
const R42_RAINBOW_BELTS = SB(
  "Rainbow Belts and other sweet Gold names",
  "Rainbow Belts carries the Gold Strain Series name and is marked Indica on Presidential packs. Shoppers drawn to sweet profiles can compare it with the [dessert-style Cherry Gelato jar](/moon-rocks/cherry-gelato), which pairs dark cherry with something creamy. For a fruit-forward option instead of candy, see the [tropical Papaya Punch moon rocks](/moon-rocks/papaya-punch). Each jar prints its own build on the label, so read the pack for the composition line and batch test results before you choose.",
);
const R42_PAPAYA_PUNCH = SB(
  "Papaya Punch beside other fruit-led jars",
  "Papaya Punch carries the Gold Strain Series name, with pack art built around tropical fruit. Its aroma follows the art: papaya at the front with citrus around it. Shoppers who like sweet, bright profiles can compare it with the [candy-sweet Rainbow Belts jar](/moon-rocks/rainbow-belts) from the same tier. For a fruit blend from the flavor-first Silver tier, look at the [mixed-fruit Tropical moon rocks in Silver](/moon-rocks/tropical). Each jar prints its own composition line, so read the label on the pack in hand for the build and batch test results.",
);
const R42_ICED_LEMON = SB(
  "Iced Lemon within the Presidential Line",
  "Iced Lemon is a Presidential Line jar made with Platinum, and its pale-blue, ice-textured label signals the cold, citrus-forward aroma inside. The Presidential Line groups collaboration names, each with its own label design. For a savory contrast from the same line, look at the [savory Garlic Cookies collaboration jar](/moon-rocks/presidential-line-garlic-cookies). New to the format? The [primer on how moon rocks are built](/learn/what-are-moon-rocks) explains the layers in plain terms. Each jar prints its own build, so read the current package label for the composition line and batch test results.",
);
const R42_TEXT_OVERRIDES: Readonly<Record<string, readonly (readonly [string, string])[]>> = {
  "/moon-rocks/24k": [
    // A2 (no 24K art of any kind): no jar build words.
    ["FLOWER · LIVE RESIN · DIAMONDS.", ""],
    ["Flower as the base. Live resin as the coat. Finished with diamonds on the outside. ", ""],
    // B13.
    ["Rainbow Belts has candy coiled around a moon.", "[Rainbow Belts, the candy-belt Gold pack](/moon-rocks/rainbow-belts), has candy coiled around a moon."],
  ],
  "/moon-rocks/blue-dream": [
    // A3.
    [" Everything else in the catalogue — every strain, every flavour, every format — runs through the same method.", ""],
    ["Presidential fixes the weight of every format across the entire catalogue. ", ""],
    ["What does not change between them is the build. The same flower, the same live resin coat, finished with diamonds. A Mini Blunt is a smaller version of the same object, not a cheaper one. ", ""],
    ["Every format, and what changes between them", "Blue Dream formats"],
  ],
  "/moon-rocks/blue-raspberry": [
    // A4.
    ["Every format", "Blue Raspberry formats"],
    ["This page is the Moon Rock Blunt: one blunt, 1.5 grams, .053 oz on the flat label.", ""],
    ["is the only description worth trusting.", "is the description to read."],
    // B6: Surfer R42 H2 after "Two designs, two jobs".
    ["**Where to find it**", `${R42_BLUE_RASPBERRY}**Where to find it**`],
  ],
  "/moon-rocks/cap-junky": [
    // A5.
    ["Every other blunt in the Gold Strain Series prints LIVE RESIN. ", ""],
    [
      "Across the catalogue the middle ingredient varies — distillate on the flagship and Blue Raspberry, live resin on Blue Dream and 24K, liquid live resin here, and on Gorilla Goo a four-ingredient line that carries both live resin and distillate. ",
      "",
    ],
    // B20.
    ["Platinum on Iced Lemon, Guava Haze and Tropicana Cookies.", "Platinum on [the ice-textured Iced Lemon jar](/moon-rocks/presidential-line-iced-lemon), Guava Haze and Tropicana Cookies."],
    // B9: Surfer R42 H2 after "The pack".
    ["**Where to find it**", `${R42_CAP_JUNKY}**Where to find it**`],
  ],
  "/moon-rocks/gods-gift": [
    // A10.
    ["Kief is bonded to the coat as a finish.", "A kief or diamond finish is bonded to the coat."],
    ["FLOWER · LIVE RESIN · DIAMONDS on Blue Dream and 24K.", "FLOWER · LIVE RESIN · DIAMONDS on Blue Dream."],
    [" Four ingredients on Gorilla Goo.", ""],
  ],
  "/moon-rocks/gorilla-goo": [
    // A39.
    ["named with complete honesty", "named honestly"],
  ],
  "/moon-rocks/king-louis": [
    // B16.
    ["fruit for Papaya Punch, planets for Galactic Gas", "fruit for [the tropical Papaya Punch pack](/moon-rocks/papaya-punch), planets for Galactic Gas"],
  ],
  "/moon-rocks/nyc-diesel": [
    // A12.
    ["Every format", "NYC Diesel formats"],
    [
      "The build does not change between them — only the size and the number in the pack, which the crescent numeral on the front tells you at a glance.",
      "The crescent numeral on the front tells you the size and the number in the pack at a glance.",
    ],
    ["This page is the Moon Rock Blunt: one blunt, 1.5 grams net weight, .053 oz.", ""],
    // B11.
    [
      "Trendi, the partner on Cap Junky and Orange Push Pop, is powered by Planet 13.",
      "Trendi, the partner on [Cap Junky, its gassy Gold collaboration](/moon-rocks/cap-junky), and Orange Push Pop, is powered by Planet 13.",
    ],
  ],
  "/moon-rocks/papaya-punch": [
    // A14.
    [
      "For all the colour on the outside, the construction is the same one the house applies to everything: FLOWER · LIVE RESIN · DIAMONDS.",
      "The blunt pack prints FLOWER · LIVE RESIN · DIAMONDS.",
    ],
    ["Every format, with the numbers", "Papaya Punch formats"],
    [
      "The build does not change between them. Only the size, the count and the crescent numeral on the front of the pack",
      "Each format shows its size and count in the crescent numeral on the front of the pack",
    ],
    ["This page is the Moon Rock Blunt: one blunt, 1.5 grams, .053 oz on the pack.", ""],
    ["The build underneath the fruit", "The blunt pack's composition line"],
    // B15: Surfer R42 H2 after "Flavour-forward, by design".
    ["**The blunt pack's composition line**", `${R42_PAPAYA_PUNCH}**The blunt pack's composition line**`],
  ],
  "/moon-rocks/presidential-line-iced-lemon": [
    // A18 (no Iced Lemon art of any kind): no jar build words.
    ["FLOWER · LIVE RESIN · DIAMONDS.", ""],
    ["Flower as the body, live resin as the coat, diamonds as the crystalline finish. ", ""],
    ["Iced Lemon is one of three Presidential releases built with Platinum", "Iced Lemon is a Presidential release built with Platinum"],
    ["Every format", "Iced Lemon formats"],
    [
      "This page is the Moon Rock Blunt: one blunt, Net Wt. 1.5G (.053oz), printed clearly — the flat-label designs carry legible weights where the illustrated packs often obscure them behind artwork.",
      "",
    ],
    // B18: Surfer R42 H2 after "The collaboration, and where it is made".
    ["**What is inside**", `${R42_ICED_LEMON}**What is inside**`],
  ],
  "/moon-rocks/presidential-og": [
    // A19.
    [", which has run on the same sequence since Los Angeles in 2012:", ":"],
  ],
  "/moon-rocks/presidential-moon-rocks": [
    // A32.
    [" Every Gold Strain Series pack, every Silver Flavour Series pack, every collaboration release runs through it.", ""],
    ["Cap Junky carries LIQUID LIVE RESIN, a fourth variant.", "Cap Junky carries LIQUID LIVE RESIN."],
    [" Gorilla Goo runs four ingredients rather than three.", ""],
  ],
  "/moon-rocks/presidential-prerolls": [
    // A35, A36.
    ["Every format, one build, a different occasion for each.", "Each format prints its own build, with a different occasion for each."],
    ["flower with live resin and diamonds across most of the Gold Strain Series,", "flower with live resin and diamonds on Blue Dream,"],
  ],
  "/moon-rocks/presidential-blunts": [
    // A39.
    ["the house method in its most complete form", "the house method in rolled form"],
  ],
  "/moon-rocks/rainbow-belts": [
    // A20.
    [
      "The composition line reads LIVE RESIN · DIAMONDS, with the leading word covered by the artwork on this pack. Across the Gold Strain Series that leading word is FLOWER.",
      "The composition line reads FLOWER · LIVE RESIN · DIAMONDS.",
    ],
    ["The same three-stage construction as every other Gold Series release — ", "On this pack that means "],
    ["Every format", "Rainbow Belts formats"],
    ["Candy on the outside, house build underneath", "Candy on the outside"],
    ["This page is the Moon Rock Blunt: one blunt, hand-finished.", ""],
    // B7.
    ["Blue Raspberry has raspberries and a helix of red and blue liquid chrome.", "[Blue Raspberry's berry-and-chrome pack](/moon-rocks/blue-raspberry) has raspberries and a helix of red and blue liquid chrome."],
    // B12: Surfer R42 H2 after "The sweet end of the catalogue".
    ["**Rainbow Belts formats**", `${R42_RAINBOW_BELTS}**Rainbow Belts formats**`],
  ],
  "/moon-rocks/pink-cookies": [
    // A38.
    ["The Gold Series' most indulgent handshake.", "A sweet Gold Series handshake."],
  ],
  "/moon-rocks/presidential-x-thc-design": [
    // B10.
    ["Trendi, powered by Planet 13, on Cap Junky and Orange Push Pop.", "Trendi, powered by Planet 13, on [the Trendi Cap Junky release](/moon-rocks/cap-junky) and Orange Push Pop."],
  ],
  "/moon-rocks/wedding-cake": [
    // A23.
    [", and the group has a rule: the packaging goes loud and the product does not change.", "."],
    ["Every Presidential moon rock is built the same way.", "Presidential Moon Rocks are built in layers."],
    // B14.
    ["Rainbow Belts puts sugared candy belts around a cratered grey moon", "[The sugared Rainbow Belts pack](/moon-rocks/rainbow-belts) puts candy belts around a cratered grey moon"],
  ],
  "/moon-rocks/white-walker": [
    // A24.
    ["**Skywalker**, a ROVE collaboration that runs across every format in the line.", "**Skywalker**, a ROVE collaboration."],
    ["The build, which does not vary by name", "How Moon Rocks are layered"],
    ["Kief bonded to the coat as the finish.", "A kief or diamond finish bonded to the coat."],
    ["That sequence is the Presidential Infusion System and it has run unchanged since Los Angeles in 2012.", "That sequence is the Presidential Infusion System."],
    [" Live resin and diamonds on most of the Gold Strain Series.", ""],
    // B4, B8.
    ["First, the one that gets confused with it.", "White Walker and Skywalker"],
    ["Blue Raspberry runs a frosty silver-blue cannabis leaf", "[The frosty Blue Raspberry label](/moon-rocks/blue-raspberry) runs a frosty silver-blue cannabis leaf"],
    // B3: Surfer R42 H2 after "The cold end of the catalogue".
    ["**How Moon Rocks are layered**", `${R42_WHITE_WALKER}**How Moon Rocks are layered**`],
  ],
  "/moon-rocks/xxx": [
    // A25: the blunt art prints FLOWER · LIVE RESIN · DIAMONDS.
    ["The pack reads FLOWER · LIVE RESIN · KIEF.", "The pack reads FLOWER · LIVE RESIN · DIAMONDS."],
    [
      "Kief finishes the outside — the dry, powdery layer that bonds to the resin and gives the rock its matte surface and its weight in the hand.",
      "Diamonds finish the outside.",
    ],
    [
      "XXX runs live resin and kief — a combination that puts a resin coat under a kief finish rather than a crystalline one.",
      "XXX runs live resin and diamonds.",
    ],
  ],
};

const SB43 = (heading: string, body: string, next = "Where to find it") => `**${heading}**\n\n${body}\n\n**${next}**`;
// SURFER-R43: MR jar H2s. Sitebulb R43 B10/B14/B18/B22: each block goes before the named CMS heading.
const R43_TEXT_OVERRIDES: Readonly<Record<string, readonly (readonly [string, string])[]>> = {
  "/moon-rocks/presidential-prerolls": [
    [
      "**The series this format spans**",
      SB43(
        "Choosing between the one-gram roll and the minis",
        "The Presidential Preroll is a single one-gram roll under the House Line name. Shoppers who want smaller servings in one pack can look at the [three-pack mini pre-roll range](/mini-pre-rolls). Anyone who prefers to work with loose pieces can start from the [loose House Line Moon Rocks jar](/moon-rocks/presidential-moon-rocks), a two-gram pack under the same name. Each product prints its own composition line, so check the pack you are holding for the build and batch test results before you buy.", "The series this format spans",
      ),
    ],
  ],
  "/moon-rocks/presidential-moon-rocks": [
    [
      "**The format, and why loose is a different decision**",
      SB43(
        "What distillate means on this label",
        "On this jar, distillate is the middle layer. Distillate is refined until it is close to neutral, which leaves the flower and kief to carry most of the aroma. The [plain-language distillate explainer](/learn/what-is-thc-distillate) covers how it is made and how it differs from resin and rosin. For jars where a fruit name leads instead, browse the [fruit-led Silver Flavor jars](/moon-rocks/silver). Check the label in hand for batch details.", "The format, and why loose is a different decision",
      ),
    ],
  ],
  "/moon-rocks/gods-gift": [
    [
      "**What is actually in a Presidential moon rock**",
      SB43(
        "God's Gift among the connoisseur names",
        "God's Gift sits in the Rose Gold Connoisseur Series, and its name leans on reverence rather than flavor. Shoppers comparing it with other names in that tier can look at [Cereal Milk from the connoisseur tier](/moon-rocks/cereal-milk), which takes a breakfast-table theme, or the [dessert-named Wedding Cake jar](/moon-rocks/wedding-cake). Each jar prints its own composition line and batch test results, so read the label on the pack in hand before deciding.", "What is actually in a Presidential moon rock",
      ),
    ],
  ],
  "/moon-rocks/nyc-diesel": [
    [
      "**The build**",
      SB43(
        "NYC Diesel beside other place-named jars",
        "NYC Diesel takes its name from a city, and its aroma leans fuel-forward rather than sweet. Shoppers who like names tied to a place can compare it with [SFV OG, the Los Angeles valley jar](/moon-rocks/sfv-og), which carries a regional name of its own. For a softer, berry-leaning option from the same strain-led series, look at the [berry-leaning Blue Dream jar](/moon-rocks/blue-dream). Each jar prints its own composition line, so read the label on the pack you pick up for its build and batch test results rather than assuming any two jars match.", "The build",
      ),
    ],
  ],
};

// Sitebulb R43 MR: CMS copy swaps (A1, A5, A7-A15, A17; A16 WA launch rows dropped per chief ruling, "When it lands" kept).
const R43_SB_OVERRIDES: Readonly<Record<string, readonly (readonly [string, string])[]>> = {
  "/moon-rocks/blue-raspberry": [
    [" — as distinct from the live-resin construction used on Blue Dream, 24K, Presidential OG, King Louis and most of the Gold Strain Series.", " — and it differs from other jars; each label prints its own build."],
  ],
  "/moon-rocks/presidential-moon-rocks": [
    ["Presidential OG — despite sharing the house name with this pack — is built on live resin and diamonds, not distillate and kief.", "Presidential OG — despite sharing the house name with this pack — prints its own composition line."],
    ["Cap Junky carries LIQUID LIVE RESIN.", "Cap Junky's blunt carries LIQUID LIVE RESIN."],
    [" It is the most useful thing to read on a Presidential label.", ""],
    ["It is the most Los Angeles piece of artwork in the entire catalogue, and", "The flagship's artwork is pure Los Angeles, and"],
    ["The self-titled pack, the flagship, and the format that gave every other product in the catalogue its architecture.", "The self-titled pack and the flagship."],
  ],
  "/moon-rocks/nyc-diesel": [
    ["Flower as the base. Live resin as the coat. Diamonds as the finish — the crystalline outer layer that gives a Presidential Moon Rock its density. Three stages, applied in sequence, through the Presidential Infusion System.", ""],
    ["FLOWER · LIVE RESIN · DIAMONDS.", "The NYC Diesel blunt pack reads FLOWER · LIVE RESIN · DIAMONDS. Read the jar's own label for its build."],
    ["The Presidential ladder is fixed across the catalogue. ", ""],
    [" It is the most monumental pack Presidential prints and the only one built around a landmark.", ""],
    ["NYC Diesel is the largest-feeling of them. It is the only pack that uses a monument rather than an object, and at that scale", "At that scale"],
  ],
  "/moon-rocks/xxx": [
    ["with FLOWER · LIVE RESIN · KIEF beneath it", "with FLOWER · LIVE RESIN · DIAMONDS beneath it"],
    [", and it has run unchanged since the company started in Los Angeles in 2012.", "."],
  ],
  "/moon-rocks/presidential-prerolls": [
    [", unchanged since Los Angeles in 2012, and it is the reason", ", and it is the reason"],
    ["The house name on the smallest single format in the catalogue.", "The house name in a one-gram roll."],
    ["Not because it is lesser — the build is identical to everything else Presidential rolls — but because", "Not because it is lesser, but because"],
    ["Kief is bonded to the coat as a finish.", "A kief or diamond finish is bonded to the coat."],
    ["Prerolls run across the whole catalogue rather than belonging to one part of it.", "Prerolls appear across the series."],
    ["The Rose Gold Connoisseur tier sits above both.", "The Rose Gold Connoisseur tier leads with connoisseur names."],
  ],
  "/moon-rocks/24k": [
    [", unchanged since the company started in Los Angeles in 2012 and applied identically across the catalogue whether the pack is illustrated or flat.", "."],
  ],
  "/moon-rocks/gods-gift": [
    [" and it has not changed since the company started in Los Angeles in 2012.", "."],
    ["The architecture is constant across the catalogue: the WORLD'S STRONGEST tagline,", "The pack carries the WORLD'S STRONGEST tagline,"],
    ["Five, with fixed weights across every market.", "Pack weights:"],
    ["There is a naming tradition in cannabis that reaches for reverence, and Presidential has more of it than most catalogues.", "There is a naming tradition in cannabis that reaches for reverence."],
    ["The Rose Gold Connoisseur tier sits above both.", "The Rose Gold Connoisseur tier leads with connoisseur names."],
  ],
  "/moon-rocks/papaya-punch": [
    ["Every Presidential pack carries the same architecture: WORLD'S STRONGEST", "The pack carries WORLD'S STRONGEST"],
  ],
  "/moon-rocks/thc-design-prerolls": [
    ["Every Presidential pack carries the same architecture: WORLD'S STRONGEST", "The pack carries WORLD'S STRONGEST"],
  ],
  "/moon-rocks/white-walker": [
    ["— is identical across the entire catalogue.", "— follow the house layout."],
  ],
  "/moon-rocks/rainbow-belts": [
    ["The build is identical in all five. ", ""],
  ],
  "/moon-rocks/king-louis": [
    ["This page is the Moon Rock Blunt: one blunt, hand-finished, 1.5 grams net weight, .053 oz.", "The Moon Rock Blunt is one blunt, hand-finished, 1.5 grams net weight, .053 oz."],
    ["a city skyline for NYC Diesel", "a city skyline for [the Statue of Liberty NYC Diesel pack](/moon-rocks/nyc-diesel)"],
  ],
};

// Chief R44 rulings (3) and (4) (PR #232) + Sitebulb R44 A7/A8/B9: no "sits above both" ranking line; no "since 2012" on product pages.
const IS_2012 = ["the Presidential Infusion System the company has run since Los Angeles in 2012.", "the Presidential Infusion System."] as const;
const R44_RULING_OVERRIDES: Readonly<Record<string, readonly (readonly [string, string])[]>> = {
  "/moon-rocks/24k": [
    ["The Rose Gold Connoisseur tier sits above both.", "The Rose Gold Connoisseur tier leads with connoisseur names. [Blue Dream, another strain-named Gold jar](/moon-rocks/blue-dream), sits in the same series as 24K."],
  ],
  "/moon-rocks/papaya-punch": [
    ["The Rose Gold Connoisseur tier sits above both.", "The Rose Gold Connoisseur tier leads with connoisseur names."],
    [" has run on this sequence since 2012, and a flavour-forward name", " runs on this sequence, and a flavour-forward name"],
  ],
  "/moon-rocks/blue-dream": [
    ["and the Rose Gold Connoisseur tier sits above both.", "and the Rose Gold Connoisseur tier leads with connoisseur names."],
    [" has been refined around since the brand started in Los Angeles in 2012.", " is built around."],
    [" and the one people recognise from across a shelf.", "."],
  ],
  "/moon-rocks/galactic-gas": [
    ["The company has been building that language since Los Angeles, 2012, and it is the reason", "That language is the reason"],
  ],
  "/moon-rocks/king-louis": [IS_2012],
  "/moon-rocks/wedding-cake": [IS_2012],
  "/moon-rocks/nyc-diesel": [["when the brand started in Los Angeles in 2012,", "when the brand started in Los Angeles,"]],
  "/moon-rocks/presidential-line-guava-haze": [
    ["The process has not changed since Los Angeles in 2012 — what changes from pack to pack", "What changes from pack to pack"],
  ],
  "/moon-rocks/presidential-line-iced-lemon": [
    [" build, unchanged from Los Angeles in 2012 and applied identically whether the pack carries", " build, the same whether the pack carries"],
  ],
  "/moon-rocks/presidential-moon-rocks": [
    [", and it has been the company's whole argument since Los Angeles, 2012.", ", and it is the company's whole argument."],
  ],
  "/moon-rocks/rainbow-belts": [
    ["runs through the same process the company has used since 2012, and", "runs through the same process, and"],
  ],
  "/moon-rocks/thc-design-prerolls": [[", which has run on that sequence since Los Angeles in 2012.", "."]],
};

// SURFER-R44: MR jar H2s, placed before "Where to find it" in the CMS body.
const R44_SURFER_OVERRIDES: Readonly<Record<string, readonly (readonly [string, string])[]>> = {
  "/moon-rocks/presidential-og": [
    [
      "**Where to find it**",
      SB43(
        "Comparing Presidential OG with other named jars",
        "Shoppers weighing Presidential OG often compare it with other names that arrive with their own identity. The [Cap Junky collaboration jar](/moon-rocks/cap-junky) carries a partner's logo on the front, while the [familiar Blue Dream strain jar](/moon-rocks/blue-dream) leans on a well-known strain name. Aroma is one way to compare them: OG names tend toward pine and earth, while Blue Dream leans toward berry. Each jar prints its own composition line, so read the label on the pack in hand for its build and batch details.",
      ),
    ],
  ],
  "/moon-rocks/blue-dream": [
    [
      "**Where to find it**",
      SB43(
        "Blue Dream next to darker strain names",
        "Blue Dream's aroma leans toward sweet berry, which sets it apart from heavier names on the same shelf. For a fuel-forward contrast, look at the [fuel-forward NYC Diesel jar](/moon-rocks/nyc-diesel), named for a city rather than a fruit. For a name that carries the brand's own crest instead of a strain reputation, see the [crest-only Presidential OG jar](/moon-rocks/presidential-og). Aroma and pack art help you choose. Each jar prints its own composition line, so read the label in hand for its build and batch details.",
      ),
    ],
  ],
};

export function hardcodeInContentLinks(sourcePath: string, rawValue: string): string {
  const swaps = [
    ...(IN_CONTENT_TEXT_OVERRIDES[sourcePath] ?? []),
    ...(R42_TEXT_OVERRIDES[sourcePath] ?? []),
    ...(R43_TEXT_OVERRIDES[sourcePath] ?? []),
    ...(R43_SB_OVERRIDES[sourcePath] ?? []),
    ...(R44_RULING_OVERRIDES[sourcePath] ?? []),
    ...(R44_SURFER_OVERRIDES[sourcePath] ?? []),
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
