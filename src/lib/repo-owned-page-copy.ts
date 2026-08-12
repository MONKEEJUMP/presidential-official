export type RepoOwnedPagePath =
  | "/learn"
  | "/vapes"
  | "/find-us/wa"
  | "/find-us/az"
  | "/find-us/ny"
  | "/find-us/fl"
  | "/moon-rocks/rose-gold"
  | "/moon-rocks/presidential-x-thc-design";

export type RepoOwnedPageCopy = {
  readonly label: string;
  readonly markdown: string;
};

export const REPO_OWNED_PAGE_COPY: Readonly<
  Record<RepoOwnedPagePath, RepoOwnedPageCopy>
> = {
  "/learn": {
    label: "Presidential Learn hub",
    markdown: `Most cannabis education online is written to fill a page. This section is written to answer the questions people actually ask when they turn a Presidential pack over and read the small type.

**Why this section exists**

Every Presidential pack carries a composition line — three or four ingredients separated by small pot-leaf dots. FLOWER · LIVE RESIN · DIAMONDS on one. FLOWER · DISTILLATE · KIEF on another. FLOWER · LIQUID LIVE RESIN · DIAMONDS on a third.

Those lines are not decoration and they are not marketing. They describe what is physically in the product, layer by layer, and they change from pack to pack. Two Presidential products with similar names can be built four different ways.

Most people never read them, because nobody has explained what the words mean. That is what this section is for.

**What's here**

*[What Are Moon Rocks](/learn/what-are-moon-rocks)* — the format the company is named for. What a moon rock physically is, how the layers stack, and why the density changes how it burns.

*[What Is Live Resin](/learn/what-is-live-resin)* — the coat that appears across most of the Gold Strain Series, and what separates it from distillate.

*[What Is Live Rosin](/learn/what-is-live-rosin)* — the solventless method, and how it differs from live resin.

*[What Are Liquid Diamonds](/learn/what-are-liquid-diamonds)* — the crystalline finish, and the difference between diamonds and liquid diamonds on a label.

*[Infusion Science](/learn/infusion-science)* — the Presidential Infusion System itself, the three-stage sequence the company has run since Los Angeles in 2012.

*[Flavor Science](/learn/flavor-science)* — where flavour actually comes from in an infused product, and why the same strain name reads differently across two builds.

*[Different Extracts Need Different Heat](/learn/different-extracts-need-different-heat)* — the practical one. Why the same flame does different things to different materials.

**How to read any Presidential pack**

The architecture is identical across the entire catalogue. WORLD'S STRONGEST runs across the top. The strain type — Indica, Sativa or Hybrid — sits in script directly beneath it. The silver crown crest carries the PRESIDENTIAL banner. A unit numeral sits inside a crescent moon: a 1 on single formats, a 3 on the three-packs, a 2 G on loose Moon Rocks. Then the format line, the strain name in a lozenge, and the composition line.

Three of those change from product to product and the rest never do. The strain type, the format line and the composition line are the entire difference between one Presidential pack and another. Everything else is the house.

**The format ladder**

Moon Rock Blunt: one unit, 1.5 g, .053 oz. Moon Rock Preroll: one unit, 1 g, .035 oz. Moon Rocks loose: 2 g, 0.071 oz. Moon Rock Mini Blunts: three at 0.7 g, 2.1 g total. Moon Rock Mini Prerolls: three at 0.5 g, 1.5 g total.

The build does not change between them. Only the size and the count.

**The catalogue, in three tiers**

The Silver Flavour Series carries flavour-led releases. The Gold Strain Series carries named strains. The Rose Gold Connoisseur tier sits above both. Running across all three are the collaboration releases, each carrying a partner's mark printed on the front of the pack.

**Where to find Presidential**

Presidential is a wholesale brand and sells exclusively through licensed retailers. Availability varies by retailer and stock changes by store and by day. Presidential is currently active across six state markets with two more opening. Use the zip search to find the nearest licensed retailer carrying Presidential. For adults 21+ where legal.`,
  },
  "/find-us/wa": {
    label: "Presidential in Washington",
    markdown: `**Evergreen State. Presidential High.**

Presidential is landing soon in Washington.

**What that means, plainly**

Presidential is currently active across six state markets — California, Oklahoma, Nevada, New York, Michigan and Arizona — with two more opening. Washington is one of the two.

The retailer search on this page goes live the moment verified licensed Washington retailers carrying Presidential are in the locator database. Until then this page says so rather than showing an empty list.

**What arrives when it does**

Presidential builds moon rocks. Flower, coated in a concentrate, finished in a dry material that bonds to the coat — three stages applied in sequence, a process the company has run under the name the Presidential Infusion System since Los Angeles in 2012.

Five formats, with weights fixed in every market. The Moon Rock Blunt is one unit at 1.5 grams, .053 oz. The Moon Rock Preroll is one at 1 gram, .035 oz. Loose Moon Rocks come at 2 grams, 0.071 oz. Mini Blunts are three at 0.7 grams for 2.1 grams total. Mini Prerolls are three at 0.5 grams for 1.5 grams total.

The build does not change between them. Only the size and the count, and the crescent numeral on the front of each pack tells you which you are holding at a glance.

**The catalogue**

Three tiers. The Silver Flavour Series carries flavour-led releases — Grape, Pineapple, Watermelon, Peach Mango, Strawberry, Tropical, Blue Raspberry. The Gold Strain Series carries named strains — Blue Dream, King Louis, 24K, NYC Diesel, Presidential OG, Galactic Gas, Cap Junky and others. The Rose Gold Connoisseur tier sits above both, defined by live rosin — the solventless method, made without butane, propane, CO2 or ethanol at any stage.

Running across all three are the collaboration releases, each carrying a partner's mark printed on the front of the pack: Ball Family Farms, Nature's Chemistry of Las Vegas, Top Shelf Cultivation, THC Design, Trendi by Planet 13, Moxie, Polaris Cannabis, ROVE, Platinum and VladTV.

**Reading a Presidential pack when it gets here**

Every pack carries the same architecture — WORLD'S STRONGEST across the top, the strain type in script beneath it, the silver crown crest with the PRESIDENTIAL banner, a crescent-moon unit numeral, the format line, the strain name in its lozenge, and the composition line separated by pot-leaf marks.

Three of those differ from product to product: the strain type, the format line and the composition line. That last one is the description that matters. Some packs print live resin and diamonds. Some print distillate and kief. Cap Junky prints liquid live resin. They are different builds from the same process, and the pack tells you which one you have.

**How Presidential reaches shelves anywhere**

Presidential is wholesale and does not sell direct, in any state. Every product reaches you through a licensed retailer, and each shop decides independently which strains and formats to carry. That is why availability varies by store and by week, and why this page will point you at retailers rather than at a checkout.

**Check back**

This page updates automatically when Presidential reaches licensed Washington retailers. For adults 21+ where legal.`,
  },
  "/find-us/az": {
    label: "Presidential in Arizona",
    markdown: `**From the Canyon to the Cosmos — Presidential**

The retailer count on this page is live. It comes from the locator database and updates as new Arizona doors come online — no number in this copy, because the page already shows you the current one.

**Finding it**

Enter your zip code above. The search returns the nearest licensed Arizona retailers carrying Presidential, ordered by distance from where you are.

Presidential does not sell direct. Every product reaches you through a licensed Arizona retailer, and each of those shops decides independently what to stock. Which strains, which formats and how much depends on the store and on the day. The search tells you who carries the brand; the shop tells you what is on the shelf right now.

**What Presidential makes**

Flower, coated in a concentrate, finished in a dry material that bonds to the coat. Three stages, applied in sequence. That process is the Presidential Infusion System and the company has run on it since Los Angeles in 2012.

The composition line printed on the front of every pack tells you which three materials were used. It changes from product to product — some packs print live resin and diamonds, others distillate and kief, and Cap Junky prints liquid live resin. It is the most useful thing to read on a Presidential label and most people never look at it.

**The formats**

Five, with weights fixed across every market. The Moon Rock Blunt is a single blunt at 1.5 grams, printed as .053 oz. The Moon Rock Preroll is a single unit at 1 gram, .035 oz. Loose Moon Rocks come at 2 grams, 0.071 oz. The Mini Blunt three-pack is three at 0.7 grams each, 2.1 grams total. The Mini Preroll three-pack is three at 0.5 grams each, 1.5 grams total.

**The catalogue**

The Gold Strain Series carries named strains — Blue Dream, King Louis, 24K, Presidential OG, NYC Diesel, Galactic Gas and others. The Silver Flavour Series carries flavour-led releases. The Rose Gold Connoisseur tier sits above both.

Alongside them run the collaboration releases, each carrying a partner's mark on the front: Ball Family Farms, Nature's Chemistry of Las Vegas, Top Shelf Cultivation, THC Design, Trendi by Planet 13, Moxie, Polaris Cannabis, ROVE, Platinum and VladTV.

**Arizona in the wider footprint**

Presidential is currently active across six state markets with two more opening. Arizona sits in that group alongside California, Oklahoma, Nevada, New York and Michigan.

Each market carries its own mix. Some collaboration releases are market-specific — the Platinum partnership packs carry Michigan regulatory markings, and Nature's Chemistry prints Las Vegas, Nevada on its packs. What reaches Arizona shelves is decided by distribution and by the retailers themselves.

**Start with the search**

Enter your zip code above to find the licensed Arizona retailers nearest you carrying Presidential. For adults 21+ where legal.`,
  },
  "/find-us/ny": {
    label: "Presidential in New York",
    markdown: `**Skyscraper High. Presidential Grade.**

The retailer count above is live, pulled from the locator database and updated as new doors come online.

**Finding it**

Enter your zip code. The search returns the nearest licensed New York retailers carrying Presidential, ordered by distance.

Presidential is wholesale and does not sell direct. Every product reaches you through a licensed New York retailer, and each shop decides independently what to carry. The search finds who stocks the brand; the shop tells you what is on the shelf today.

**The strain named for the city**

NYC Diesel is in the catalogue, and its pack is the only one Presidential prints built around a landmark. A pale full moon fills the background. The Statue of Liberty stands in front of it, torch raised, flanked by the New York skyline, the whole scene rising out of rolling green-and-yellow smoke. Marked Hybrid, built on flower, live resin and diamonds.

When the company started in Los Angeles in 2012, New York was not a legal market. It is now one of the largest in the footprint, and the strain that carries the city's name is sold in it.

**The formats**

Five, with weights fixed across every market. Moon Rock Blunt: one unit, 1.5 g, .053 oz. Moon Rock Preroll: one unit, 1 g, .035 oz. Moon Rocks loose: 2 g, 0.071 oz. Mini Blunts: three at 0.7 g, 2.1 g total. Mini Prerolls: three at 0.5 g, 1.5 g total.

The build is identical in all five. Only the size and the count change, and the crescent numeral on the front of the pack tells you which you are holding.

**How to read what you pick up**

Every Presidential pack carries the same architecture: WORLD'S STRONGEST across the top, the strain type in script beneath it, the silver crown crest and PRESIDENTIAL banner, the crescent-moon unit numeral, the format line, the strain name, and the composition line separated by pot-leaf dots.

That composition line is the one that matters. FLOWER · LIVE RESIN · DIAMONDS on Blue Dream and 24K. FLOWER · DISTILLATE · KIEF on the self-titled flagship. FLOWER · LIQUID LIVE RESIN · DIAMONDS on Cap Junky. Same house, same process, different builds — and the pack always says which.

**The footprint**

Presidential is currently active across six state markets with two more opening, running from California through Oklahoma, Nevada, Arizona, Michigan and New York.

**Start with the search**

Enter your zip code above to find the licensed New York retailers nearest you carrying Presidential. For adults 21+ where legal.`,
  },
  "/find-us/fl": {
    label: "Presidential in Florida",
    markdown: `**Moon Rockets to the Moon with a Sunshine State of Mind**

Presidential is landing soon in Florida.

**What that means**

Presidential is currently active across six state markets — California, Oklahoma, Nevada, New York, Michigan and Arizona — with two more opening. Florida is one of the two.

The retailer search on this page goes live the moment verified licensed Florida retailers carrying Presidential are in the locator database. Until then this page says so plainly rather than showing an empty list or a placeholder.

**What will be here**

Presidential builds moon rocks. Flower, coated in a concentrate, finished in a dry material that bonds to the coat — three stages applied in sequence, a process the company has run under the name the Presidential Infusion System since Los Angeles in 2012.

Five formats, with weights fixed across every market. The Moon Rock Blunt is one unit at 1.5 grams, .053 oz. The Moon Rock Preroll is one unit at 1 gram, .035 oz. Loose Moon Rocks come at 2 grams, 0.071 oz. Mini Blunts are three at 0.7 grams for 2.1 grams total. Mini Prerolls are three at 0.5 grams for 1.5 grams total.

**The catalogue**

Three tiers. The Silver Flavour Series carries flavour-led releases including Grape, Pineapple, Watermelon and Peach Mango. The Gold Strain Series carries named strains — Blue Dream, King Louis, 24K, NYC Diesel, Presidential OG, Galactic Gas, Cap Junky and others. The Rose Gold Connoisseur tier sits above both.

Alongside those run the collaboration releases, each carrying a partner's mark printed on the front of the pack — Ball Family Farms, Nature's Chemistry, Top Shelf Cultivation, THC Design, Trendi by Planet 13, Moxie, Polaris Cannabis, ROVE, Platinum and VladTV.

**Reading a Presidential pack when it gets here**

Every pack carries the same architecture, and three things differ from product to product: the strain type in script beneath the tagline, the format line, and the composition line with its pot-leaf dots.

That composition line is the description that matters. Some packs print live resin and diamonds. Some print distillate and kief. Cap Junky prints liquid live resin. They are different builds from the same process, and the pack tells you which one you have.

**Check back**

This page updates automatically when Presidential reaches licensed Florida retailers. For adults 21+ where legal.`,
  },
  "/moon-rocks/rose-gold": {
    label: "Rose Gold Connoisseur tier",
    markdown: `Presidential's catalogue is organised into three tiers, and Rose Gold sits at the top of them.

**The three tiers**

| Tier | What it carries |
|---|---|
| Silver Flavour Series | Flavour-led releases — Grape, Pineapple, Watermelon, Peach Mango, Strawberry, Tropical, Blue Raspberry |
| Gold Strain Series | Named strains — Blue Dream, King Louis, 24K, Presidential OG, NYC Diesel, Galactic Gas and others |
| **Rose Gold Connoisseur** | The tier above both |

Silver leads with a flavour idea. Gold leads with a strain name people already ask for. Rose Gold is where the house puts its most selective work.

**In the tier**

[Wedding Cake](/moon-rocks/wedding-cake). [God's Gift](/moon-rocks/gods-gift). [White Walker](/moon-rocks/white-walker).

Three names that arrive with weight already attached rather than describing a flavour — which is the pattern across the tier. Where the Silver series names a taste and the Gold series names a strain, Rose Gold names things that are already spoken about.

Live rosin defines the Rose Gold Connoisseur Series — the solventless method, made without butane, propane, CO2 or ethanol at any stage. What that means in practice is covered in full on the [Live Rosin guide](/learn/what-is-live-rosin).

**What every tier shares**

The process does not change between them.

Every Presidential moon rock is built the same way: flower as the base, a concentrate coat applied over it, a dry finishing material bonded to the coat. Three stages, in that order. The Presidential Infusion System has run on that sequence since Los Angeles in 2012, and a Silver Flavour Series pack goes through exactly what a Rose Gold pack goes through.

What changes across the catalogue is which materials fill the three roles, and the pack always prints it. Some carry FLOWER · LIVE RESIN · DIAMONDS. Some carry FLOWER · DISTILLATE · KIEF. Cap Junky carries FLOWER · LIQUID LIVE RESIN · DIAMONDS. Gorilla Goo carries four ingredients rather than three.

**The formats, identical across all three tiers**

Moon Rock Blunt: one unit, 1.5 g, .053 oz. Moon Rock Preroll: one unit, 1 g, .035 oz. Moon Rocks loose: 2 g, 0.071 oz, sold in the self-titled flagship pack. Mini Blunts: three at 0.7 g, 2.1 g total. Mini Prerolls: three at 0.5 g, 1.5 g total.

A tier is not a format and a format is not a tier. Which combinations reach a given shelf is decided by distribution and by the retailer.

**How to recognise the tier on a shelf**

Every Presidential pack carries the same architecture regardless of tier — WORLD'S STRONGEST across the top, the strain type in script beneath, the silver crown crest with the PRESIDENTIAL banner, the crescent-moon unit numeral, the format line, the name lozenge, and the composition line separated by pot-leaf dots.

The house does not use a different crest for a different tier. What differs is the artwork, the name and what is printed on the composition line.

**Alongside the tiers: the collaborations**

Running across all three are the partner releases, each carrying a second mark printed on the front: Ball Family Farms, Nature's Chemistry of Las Vegas, Top Shelf Cultivation, THC Design, Trendi by Planet 13, Moxie, Polaris Cannabis, ROVE, Platinum and VladTV.

Those releases are frequently market-specific — the Platinum packs carry Michigan regulatory markings, and the Moxie mark appears on a California variant.

**Where to find Presidential**

Wholesale, through licensed retailers only. Availability varies by retailer and by market. Six state markets active with two more opening. Use the zip search above to find the nearest licensed retailer. For adults 21+ where legal.`,
  },
  "/moon-rocks/presidential-x-thc-design": {
    label: "Presidential x THC Design collaboration",
    markdown: `Presidential runs collaborations with cultivators, processors and platforms. Each one puts a second mark on the front of the pack. THC Design is one of them, and it appears on two releases.

**How to spot it**

The THC Design mark is a white hexagonal molecule diagram set beside the words THC DESIGN. It sits on the pack alongside the standard Presidential architecture rather than replacing any of it — the silver crown crest and PRESIDENTIAL banner stay where they always are.

**The two releases**

**Creskendo.** Sativa. Moon Rock Blunt. Built on FLOWER · DISTILLATE · KIEF. The artwork runs a teal-to-blue gradient with vivid purple, violet and mint liquid erupting upward from a plume behind the pack, and glossy three-dimensional musical notes and treble clefs floating through the frame. The pack itself is printed purple.

Worth knowing: the pack prints **CRESKENDO**, stylised with a music-note K — not "crescendo." The name is a deliberate construction, not a spelling error.

**XJ13.** Sativa. Moon Rock Blunt, Net Wt. 1.5G (.053oz), 100% TOBACCO FREE. Also built on FLOWER · DISTILLATE · KIEF. The artwork puts a frosty green cannabis bud and golden fan leaves behind the pack, with a molecular ball-and-stick diagram and a chemical structure line-drawing floating through teal and gold liquid. The pack is mint green.

Both are Sativa. Both run the same composition. Together they are the whole of the THC Design collaboration in the Presidential catalogue.

**Where the collaboration sits among the others**

Presidential's partner roster runs across three kinds of relationship. Cultivators and processors: Ball Family Farms on Daniel Larusso, Laura Charles and Nino Brown. Nature's Chemistry of Las Vegas on Garlic Cookies and Ghost Train Haze. Top Shelf Cultivation on Whoa Si Whoa. Moxie on Apriscotti. Polaris Cannabis on Head Cheese. ROVE on Cherry Gelato, Skywalker and Waui. Trendi, powered by Planet 13, on Cap Junky and Orange Push Pop. Platinum on Iced Lemon, Guava Haze and Tropicana Cookies. And one media partner: VladTV on King Louis.

THC Design sits with the cultivation and processing group, and the artwork on both its releases leans scientific — molecules on XJ13, a laboratory palette on both.

**What does not change in a collaboration**

The build. Every partner release runs through the Presidential Infusion System exactly as the core catalogue does: flower as the base, a concentrate coat, a dry finish bonded to the coat. A partner's name on the front changes the market, sometimes the strain, and often the artwork. It does not change the process.

**Formats and availability**

The Presidential ladder holds: Blunt 1.5 g, Preroll 1 g, loose Moon Rocks 2 g, Mini Blunts 3 × 0.7 g, Mini Prerolls 3 × 0.5 g.

Collaboration releases typically reach fewer formats and fewer markets than the core Gold Strain Series, so availability varies more than usual.

**Where to find Presidential**

Wholesale, licensed retailers only. Six state markets active with two more opening. Use the zip search above. For adults 21+ where legal.`,
  },
  "/vapes": {
    label: "Presidential Vapes",
    markdown: `Presidential is known for moon rocks. The vape category is where the same house approaches a different format.

**What the brand brings to it**

Presidential has built one thing since Los Angeles in 2012: infused product, made by layering. Flower as a base, a concentrate coat over it, a dry finishing material bonded to the coat. That is the Presidential Infusion System, and the vocabulary printed on every moon rock pack — live resin, liquid live resin, distillate, kief, diamonds — is a vocabulary of concentrates.

Concentrates are the shared ground between a moon rock and a vape. The company works in the same materials in both categories.

**How to read a Presidential pack in any category**

The house architecture is consistent: WORLD'S STRONGEST across the top, the product type, the silver crown crest with the PRESIDENTIAL banner, the format line, the product name, and the composition line.

That composition line is the habit worth building. On the moon rock side it runs four different ways across the catalogue — FLOWER · LIVE RESIN · DIAMONDS on Blue Dream and 24K, FLOWER · DISTILLATE · KIEF on the self-titled flagship, FLOWER · LIQUID LIVE RESIN · DIAMONDS on Cap Junky. It is printed by the manufacturer and it is the only description of a product that has not passed through somebody else's page.

**Where Presidential sells**

Presidential is wholesale. It does not sell direct, to anyone, in any category. Every product reaches you through a licensed retailer, and each shop decides independently what to carry. Availability varies by retailer, by market and by day.

The brand is currently active across six state markets with two more opening — California, Oklahoma, Nevada, New York, Michigan and Arizona.

**Collaborations run across the line**

Presidential works with cultivators, processors and platforms, and each partnership puts a second mark on the front of the pack: Ball Family Farms, Nature's Chemistry of Las Vegas, Top Shelf Cultivation, THC Design, Trendi by Planet 13, Moxie, Polaris Cannabis, ROVE, Platinum and VladTV.

Several of those partnerships are market-specific. The Platinum releases carry Michigan regulatory markings. The Moxie mark appears on a California variant.

**Find a licensed retailer**

Enter your zip code above to find the licensed retailers nearest you carrying Presidential. The search returns shops by distance from where you are. What each one has on the shelf is the shop's decision. For adults 21+ where legal.`,
  },
};

export function getRepoOwnedPageCopy(
  path: string,
): RepoOwnedPageCopy | null {
  return REPO_OWNED_PAGE_COPY[path as RepoOwnedPagePath] ?? null;
}
