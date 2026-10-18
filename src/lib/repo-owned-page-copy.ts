export type RepoOwnedPagePath =
  | "/learn"
  | "/learn/what-are-moon-rocks"
  | "/learn/what-is-thc-distillate"
  | "/learn/flavor-science"
  | "/vapes"
  | "/find-us/wa"
  | "/find-us/az"
  | "/find-us/ny"
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

Those lines are not decoration and they are not marketing. They describe what is physically in the product, layer by layer, and they change from pack to pack. Two Presidential products with similar names can be built in different ways.

This guide explains what the words mean.

**What's here**

*[What Are Moon Rocks](/learn/what-are-moon-rocks)* — the format the company is named for. What a moon rock physically is, how the layers stack, and why the density changes how it burns.

*[What Is Live Resin](/learn/what-is-live-resin)* — the strain-forward concentrate, and what separates it from distillate.

*[What Is THC Distillate](/learn/what-is-thc-distillate)* — the refined, essentially neutral concentrate behind the Silver Flavor Series.

*[What Is Live Rosin](/learn/what-is-live-rosin)* — the solventless method, and how it differs from live resin.

*[What Are Liquid Diamonds](/learn/what-are-liquid-diamonds)* — the crystalline finish, and the difference between diamonds and liquid diamonds on a label.

*[Infusion Science](/learn/infusion-science)* — the Presidential Infusion System itself and its three-stage sequence.

*[Flavor Science](/learn/flavor-science)* — where flavour actually comes from in an infused product, and why the same strain name reads differently across two builds.

*[Different Extracts Need Different Heat](/learn/different-extracts-need-different-heat)* — the practical one. Why the same flame does different things to different materials.

**How to read any Presidential pack**

WORLD'S STRONGEST runs across the top. The strain type — Indica, Sativa or Hybrid — sits in script directly beneath it. The silver crown crest carries the PRESIDENTIAL banner. A unit numeral sits inside a crescent moon: a 1 on single formats, a 3 on the three-packs, a 2 G on loose Moon Rocks. Then the format line, the strain name in a lozenge, and the composition line.

Three of those change from product to product and the rest never do. The strain type, the format line and the composition line are the entire difference between one Presidential pack and another. Everything else is the house. To see the front of each pack, browse the [pack art collection](/presidential-art).

**The format ladder**

Moon Rock Blunt: one unit, 1.5 g, .053 oz. Moon Rock Preroll, [the Presidential pre-roll format](/pre-rolls): one unit, 1 g, .035 oz. Moon Rocks loose: 2 g, 0.071 oz. Moon Rock Mini Blunts: three at 0.7 g, 2.1 g total. Moon Rock Mini Prerolls: three at 0.5 g, 1.5 g total.

**The catalogue, by tier**

The Silver Flavour Series carries flavour-led releases. The Gold Strain Series carries named strains. Papaya Punch is one approved product in the Gold catalogue.

Presidential OG has its own product page within that same Gold series. SFV OG is documented separately so the product names remain distinct.

The Rose Gold Connoisseur tier leads with connoisseur names. Cosmic Cookies is one approved product in the Rose Gold catalogue.

Collaboration releases run alongside the tiers. Presidential x THC Design is a collaboration name, not a strain classification.

### From the Learn guides to the rolled lineup

The extracts explained here end up in rolled products too. Browse the [Moon Rock blunt lineup](/blunts), the [mini blunt lineup](/mini-blunts) and the [mini pre-roll lineup](/mini-pre-rolls) to see them on a pack.

### Silver, Gold and Rose Gold on a Moon Rocks jar

Each jar names its series. See the [Silver Moon Rocks series](/moon-rocks/silver), the [Gold Moon Rocks series](/moon-rocks/gold) and the [Rose Gold Moon Rocks series](/moon-rocks/rose-gold), then read the build line on the jar you pick.

### Learn guides for store buyers

Retailers who want to carry Presidential can start on [the Presidential wholesale page](/wholesale) or [get in touch with Presidential](/contact).

### Taking the Learn guides to a store

Store finder pages are sorted by state. Start with [Oklahoma store finder for Presidential](/find-us/ok), [the Nevada Presidential retailer page](/find-us/nv) or [Arizona listings for Presidential](/find-us/az).

### The Learn guides in pictures

Pack art shows the same terms these guides explain. See [artwork on the pre-roll packs](/presidential-art/pre-rolls), [artwork on the blunt packs](/presidential-art/blunts) and [packaging for the mini blunts](/presidential-art/mini-blunts).

### Learning the vape side

The extracts covered here also come as oil in [the Presidential vape range](/vapes), and [the Presidential brand history](/our-story) covers where it all started.

**Where to find Presidential**

Presidential is a wholesale brand and sells exclusively through licensed retailers. Availability varies by retailer and stock changes by store and by day. Presidential sells through licensed retailers in [select state markets](/find-us): California, Oklahoma, New York, Nevada, Michigan and Arizona, and Washington is landing soon. Use the zip search to find the nearest licensed retailer carrying Presidential. For adults 21+ where legal.`,
  },
  "/learn/what-is-thc-distillate": {
    label: "What Is THC Distillate",
    markdown: `Distillate is stripped and refined until it is essentially neutral. Silver jars such as Grape and Watermelon list flower, distillate, and kief on the label.

**A refined, neutral concentrate**

Distillate is stripped and refined until it is essentially neutral, while live resin smells like the strain it came from in a way distillate cannot. That neutrality is the difference to understand first. For the strain-forward alternative, read [What Is Live Resin](/learn/what-is-live-resin); for the solventless route, read [What Is Live Rosin](/learn/what-is-live-rosin).

**Distillate in the Presidential infusion system**

Each infused Presidential product starts with cannabis flower, adds a concentrate (distillate, live resin, or live rosin, as the label states), and closes with a kief or diamond finish. Presidential's infusion process carries distillate through the flower rather than only coating the surface, then applies the kief layer as the final step. See [What Are Moon Rocks](/learn/what-are-moon-rocks) for the three layers.

### Seeing distillate on a House Line label

Distillate is not limited to Silver jars. The self-titled House Line pack prints FLOWER · DISTILLATE · KIEF on its composition line, and the [self-titled House Line Moon Rocks jar](/moon-rocks/presidential-moon-rocks) shows that label and its two-gram pack. Because distillate is close to neutral, the flower and kief set most of the aroma in that jar. For why neutral extracts and strain-forward ones smell so different, the guide to [how aroma compounds carry flavor](/learn/flavor-science) covers the chemistry. Always read the label in hand.

**Silver jars that list distillate**

Silver jars such as Grape and Watermelon list distillate on the label. Its flavor-first, fruit-forward roster is [Blue Raspberry](/moon-rocks/blue-raspberry), [Grape](/moon-rocks/grape), [Peach Mango](/moon-rocks/peach-mango), [Pineapple](/moon-rocks/pineapple), [Strawberry](/moon-rocks/strawberry), [Tropical](/moon-rocks/tropical), and [Watermelon](/moon-rocks/watermelon). Presidential Classic, the house recipe, is also made with flower, distillate, and kief. [Presidential Moon Rocks and its series](/) shows where distillate sits in the lineup.

**Distillate and the other Presidential extracts**

Distillate is one of the concentrates in the Presidential catalog. Live resin and live rosin are the other concentrates that appear on Presidential labels. Some Gold names use distillate instead: [the Cherry Gelato jar with Rove](/moon-rocks/cherry-gelato) is flower and distillate, finished with kief. Presidential Moon Pods come in Liquid Diamonds, Live Resin, and Live Rosin families; see [What Are Liquid Diamonds](/learn/what-are-liquid-diamonds) and [Moon Pods](/moon-pods). Different extracts need different heat, so read [Different Extracts Need Different Heat](/learn/different-extracts-need-different-heat).

**Reading a distillate product**

When comparing infused products, look at what was infused, how, and with which concentrate: distillate, live resin, or live rosin each brings a different character. THC and cannabinoids are batch-specific, so read the current package label and its test results. [How to read Presidential THC label numbers](/presidential-thc) covers delta-9 THC, THCa and total THC.`,
  },
  // SURFER-R13 MR: flavor-science extract-by-series H3, from the flavor-science series answer, /learn hub, /moon-rocks/rose-gold and /about.
  "/learn/flavor-science": {
    label: "Which extract does a pack use",
    markdown: `### Which extract does a pack use?

The [Silver Flavor Series](/moon-rocks/silver) leads with flavor names. The [Gold Strain Series](/moon-rocks/gold) carries strain-led releases such as 24K. The [Rose Gold Connoisseur Series](/moon-rocks/rose-gold) is the connoisseur tier, and [different extracts need different heat](/learn/different-extracts-need-different-heat).

### Why extract type changes the aroma

Two jars with similar names can smell different because of what sits between the flower and the finish. Some extracts are refined until they are close to neutral, which leaves the flower and finish to carry the aroma. Others are made from fresh-frozen plants and hold onto more of the plant's terpene profile. The guide on [how live resin keeps strain aroma](/learn/what-is-live-resin) explains that process. If you are new to the format, start with [the layered moon rock format explained](/learn/what-are-moon-rocks). Read each pack's composition line to see which extract it uses.`,
  },
  "/learn/what-are-moon-rocks": {
    label: "What Moon Rocks are and how to read the format",
    markdown: `Moon rock weed is a layered cannabis format made from flower, concentrate, and kief or diamonds. It is a product category, not one strain and not a reference to material from the Moon. The flower provides the plant structure, concentrate adds the infused layer, and a kief or diamond finish covers the exterior.

**Flower, concentrate, and a kief or diamond finish**

Those three components explain why Moon Rocks look and handle differently from plain flower. The concentrate and kief change the surface and density, but the finished product should still be identified from its own package and batch information. A percentage reported for one ingredient is not automatically the percentage of the whole Moon Rock. Use the finished-product label and associated test record for cannabinoid information.

**A format, not a strain name**

Presidential Moon Rocks can use different named cultivars and product identities while retaining the same broad layered format. [Presidential OG](/moon-rocks/presidential-og), [SFV OG](/moon-rocks/sfv-og), [Papaya Punch](/moon-rocks/papaya-punch), [Cosmic Cookies](/moon-rocks/cosmic-cookies), [Cereal Milk](/moon-rocks/cereal-milk), and [Cherry Gelato](/moon-rocks/cherry-gelato) are product examples; their names do not redefine what the Moon Rocks category means.

The main [Presidential Moon Rocks collection](/moon-rocks) organizes the approved products and series. A product page supplies the exact name, series, packaging, visible composition language, and approved retailer path for that item. This guide supplies the definition shared across the category.

### Reading aroma before you choose a jar

Moon rocks are often chosen by name, but aroma is another guide. Fruit names lean sweet, strain names lean toward pine, fuel, or earth, and dessert names lean toward dough and cream. The guide on [how terpenes drive moon rock aroma](/learn/flavor-science) explains why those differences appear. For an example of a strain-named jar with a berry-leaning profile, look at the [berry-forward Blue Dream jar](/moon-rocks/blue-dream). Each pack prints its strain type and composition line, so read both before you decide.

**How Moon Rocks relate to other Presidential formats**

Loose Moon Rocks show the layered construction directly. [Moon Rock pre-rolls](/pre-rolls) place prepared cannabis material inside rolling paper, while Presidential Blunts use [a tobacco-free hemp-wrap format](/presidential-blunts). These products can share brand and infusion context without becoming interchangeable names for the same physical format.

For deeper technical vocabulary, the [Presidential THC guide](/presidential-thc) explains infusion, extracts, and label reading. [Presidential Cannabis](/presidential-cannabis) provides the parent-brand context. [Presidential x THC Design](/moon-rocks/presidential-x-thc-design) shows how a collaboration remains part of the same official product system.

**Where to find Presidential Moon Rocks**

Presidential operates through licensed retailers rather than direct online cannabis sales. Availability varies by market, retailer, product, and date. Use the official [Find Us](/find-us) path, then confirm the current product and package with the licensed retailer. For adults 21+ where legal.`,
  },
  "/find-us/wa": {
    label: "Presidential in Washington",
    markdown: `**Evergreen State. Presidential High.**

Presidential is landing soon in Washington.

**What that means, plainly**

Presidential sells through licensed retailers in [select state markets](/find-us): California, Oklahoma, New York, Nevada, Michigan and Arizona, and Washington is landing soon.

The retailer search on this page will show results once licensed Washington retailers carrying Presidential are confirmed.

**What arrives when it does**

Presidential builds moon rocks. Flower, coated in a concentrate, finished with kief that bonds to the coat — three stages applied in sequence, a process the company calls the Presidential Infusion System.

**The catalogue**

The Silver Flavour Series carries flavour-led releases — Grape, Pineapple, Watermelon, Peach Mango, Strawberry, Tropical, Blue Raspberry. The Gold Strain Series carries named strains — Blue Dream, King Louis, 24K, NYC Diesel, Presidential OG, Galactic Gas, Cap Junky and others. The Rose Gold Connoisseur tier leads with connoisseur names.

Running across the tiers are the collaboration releases, each carrying a partner's mark printed on the front of the pack: Ball Family Farms, Nature's Chemistry of Las Vegas, Top Shelf Cultivation, THC Design, Trendi by Planet 13, Moxie, Polaris Cannabis, ROVE, Platinum and VladTV.

**Reading a Presidential pack when it gets here**

The pack carries WORLD'S STRONGEST across the top, the strain type in script beneath it, the silver crown crest with the PRESIDENTIAL banner, a crescent-moon unit numeral, the format line, the strain name in its lozenge, and the composition line separated by pot-leaf marks.

Three of those differ from product to product: the strain type, the format line and the composition line. That last one is the description that matters. Some packs print live resin and diamonds. Some print distillate and kief. Cap Junky prints liquid live resin. They are different builds from the same process, and the pack tells you which one you have.

**How Presidential reaches shelves anywhere**

Presidential is wholesale and does not sell direct, in any state. Every product reaches you through a licensed retailer, and each shop decides independently which strains and formats to carry. That is why availability varies by store and by week.

**Check back**

This page updates automatically when Presidential reaches licensed Washington retailers. For adults 21+ where legal.`,
  },
  "/find-us/az": {
    label: "Presidential in Arizona",
    markdown: `**From the Canyon to the Cosmos — Presidential**

The retailer list on this page updates as new Arizona stores come online.

**Finding it**

Enter your zip code above. The search returns the nearest licensed Arizona retailers carrying Presidential, ordered by distance from where you are.

Presidential does not sell direct. Every product reaches you through a licensed Arizona retailer, and each of those shops decides independently what to stock. Which strains, which formats and how much depends on the store and on the day. The search tells you who carries the brand; the shop tells you what is on the shelf right now.

**What Presidential makes**

Flower, coated in a concentrate, finished with kief that bonds to the coat. Three stages, applied in sequence. That process is the Presidential Infusion System.

The composition line printed on the front of every pack tells you which three materials were used. It changes from product to product — some packs print live resin and diamonds, others distillate and kief, and Cap Junky prints liquid live resin.

**The formats**

Each format has a weight fixed across every market. The Moon Rock Blunt is a single blunt at 1.5 grams, printed as .053 oz. The Moon Rock Preroll is a single unit at 1 gram, .035 oz. Loose Moon Rocks come at 2 grams, 0.071 oz. The Mini Blunt three-pack is three at 0.7 grams each, 2.1 grams total. The Mini Preroll three-pack is three at 0.5 grams each, 1.5 grams total.

**The catalogue**

The Gold Strain Series carries named strains — Blue Dream, King Louis, 24K, Presidential OG, NYC Diesel, Galactic Gas and others. The Silver Flavour Series carries flavour-led releases. The Rose Gold Connoisseur tier leads with connoisseur names.

Alongside them run the collaboration releases, each carrying a partner's mark on the front: Ball Family Farms, Nature's Chemistry of Las Vegas, Top Shelf Cultivation, THC Design, Trendi by Planet 13, Moxie, Polaris Cannabis, ROVE, Platinum and VladTV.

**Arizona and the other Presidential states**

Arizona sits alongside California, Oklahoma, Nevada, New York and Michigan. For Washington, see the [Washington retailer finder](/find-us/wa).

Each market carries its own mix. Some collaboration releases are market-specific — the Platinum partnership packs carry Michigan regulatory markings, and Nature's Chemistry prints Las Vegas, Nevada on its packs. What reaches Arizona shelves is decided by distribution and by the retailers themselves.

**Start with the search**

Enter your zip code above to find the licensed Arizona retailers nearest you carrying Presidential. For adults 21+ where legal.`,
  },
  "/find-us/ny": {
    label: "Presidential Near Me in New York",
    markdown: `**Skyscraper High. Presidential Grade.**

The retailer list above updates as new New York stores come online.

**Finding it**

Searching for Presidential near me in New York? Enter your ZIP code above. The search returns the nearest licensed New York retailers carrying Presidential, ordered by distance.

Presidential is wholesale and does not sell direct. Every product reaches you through a licensed New York retailer, and each shop decides independently what to carry. The search finds who stocks the brand; the shop tells you what is on the shelf today.

**The strain named for the city**

NYC Diesel is in the catalogue, and its pack is the only one Presidential prints built around a landmark. A pale full moon fills the background. The Statue of Liberty stands in front of it, torch raised, flanked by the New York skyline, the whole scene rising out of rolling green-and-yellow smoke. Marked Hybrid, built on flower, live resin and diamonds.

New York is a legal market, and the strain that carries the city's name is sold there.

**The formats**

Five, with weights fixed across every market. Moon Rock Blunt: one unit, 1.5 g, .053 oz. Moon Rock Preroll: one unit, 1 g, .035 oz. Moon Rocks loose: 2 g, 0.071 oz. Mini Blunts: three at 0.7 g, 2.1 g total. Mini Prerolls: three at 0.5 g, 1.5 g total.

The crescent numeral on the front of the pack tells you which you are holding.

**How to read what you pick up**

Presidential packs share one architecture: WORLD'S STRONGEST across the top, the strain type in script beneath it, the silver crown crest and PRESIDENTIAL banner, the crescent-moon unit numeral, the format line, the strain name, and the composition line separated by pot-leaf dots.

That composition line is the one that matters. FLOWER · LIVE RESIN · DIAMONDS on Blue Dream. FLOWER · DISTILLATE · KIEF on the self-titled flagship. FLOWER · LIQUID LIVE RESIN · DIAMONDS on Cap Junky. Same house, same process, different builds — and the pack always says which.

**Where Presidential is sold**

Presidential sells through licensed retailers in California, Oklahoma, New York, Nevada, Michigan and Arizona, and Washington is landing soon. For Washington stores, use the [Washington retailer finder](/find-us/wa).

**Start with the search**

Enter your zip code above to find the licensed New York retailers nearest you carrying Presidential. For adults 21+ where legal.`,
  },
  "/moon-rocks/rose-gold": {
    label: "Rose Gold Connoisseur tier",
    markdown: `Presidential's catalogue is organised into tiers.

**The tiers**

| Tier | What it carries |
|---|---|
| Silver Flavour Series | Flavour-led releases — Grape, Pineapple, Watermelon, Peach Mango, Strawberry, Tropical, Blue Raspberry |
| Gold Strain Series | Named strains — Blue Dream, King Louis, 24K, Presidential OG, NYC Diesel, Galactic Gas and others |
| **Rose Gold Connoisseur** | Connoisseur names — Cereal Milk, Cosmic Cookies, God's Gift, Wedding Cake, White Walker |

Silver leads with a flavour idea. Gold leads with a strain name people already ask for.

**In the tier**

[Wedding Cake](/moon-rocks/wedding-cake). [God's Gift](/moon-rocks/gods-gift). [White Walker](/moon-rocks/white-walker).

Three names that arrive with weight already attached rather than describing a flavour. Where the Silver series names a taste and the Gold series names a strain, Rose Gold names things that are already spoken about.

### What makes Rose Gold different?

Where Silver names a taste and Gold names a strain, Rose Gold is the connoisseur tier. Its names include [Wedding Cake](/moon-rocks/wedding-cake), [God's Gift](/moon-rocks/gods-gift), and [White Walker](/moon-rocks/white-walker). Read [what live rosin is](/learn/what-is-live-rosin).

**How the layers work**

Presidential Moon Rocks are built in layers: flower as the base, a concentrate coat applied over it, a kief or diamond finish bonded to the coat. Three stages, in that order.

What changes across the catalogue is which materials fill the three roles, and the pack always prints it. Some carry FLOWER · LIVE RESIN · DIAMONDS. Some carry FLOWER · DISTILLATE · KIEF. Cap Junky carries FLOWER · LIQUID LIVE RESIN · DIAMONDS.

**The formats**

Moon Rock Blunt: one unit, 1.5 g, .053 oz. Moon Rock Preroll: one unit, 1 g, .035 oz. Moon Rocks loose: 2 g, 0.071 oz. Mini Blunts: three at 0.7 g, 2.1 g total. Mini Prerolls: three at 0.5 g, 1.5 g total.

A tier is not a format and a format is not a tier. Which combinations reach a given shelf is decided by distribution and by the retailer.

**How to recognise the tier on a shelf**

The pack carries WORLD'S STRONGEST across the top, the strain type in script beneath, the silver crown crest with the PRESIDENTIAL banner, the crescent-moon unit numeral, the format line, the name lozenge, and the composition line separated by pot-leaf dots.

The house does not use a different crest for a different tier. What differs is the artwork, the name and what is printed on the composition line.

**Alongside the tiers: the collaborations**

Running across the tiers are the partner releases, each carrying a second mark printed on the front: Ball Family Farms, Nature's Chemistry of Las Vegas, Top Shelf Cultivation, THC Design, Trendi by Planet 13, Moxie, Polaris Cannabis, ROVE, Platinum and VladTV.

Those releases are frequently market-specific — the Platinum packs carry Michigan regulatory markings, and the Moxie mark appears on a California variant.

### Rose Gold next to the collaboration jars

Rose Gold is the connoisseur series, but it is not the only place to find named releases with distinct pack art. The [Presidential Line collaboration jars](/moon-rocks/presidential-line) bring partner names and their own label designs, and they sit outside the Silver, Gold and Rose Gold series. Shoppers new to the format can start with the [primer on what moon rocks are](/learn/what-are-moon-rocks) before comparing names. Whether a jar is part of Rose Gold or the Presidential Line, its own label prints the composition line and batch test results, so read the pack in hand.

**Where to find Presidential**

Wholesale, through licensed retailers only. Availability varies by retailer and by market. Presidential is available in [select state markets](/find-us). Use the zip search above to find the nearest licensed retailer. For adults 21+ where legal.`,
  },
  "/moon-rocks/presidential-x-thc-design": {
    label: "Presidential x THC Design collaboration",
    markdown: `Presidential runs collaborations with cultivators, processors and platforms. Each one puts a second mark on the front of the pack. THC Design is one of them, and it appears on two releases.

**How to spot it**

The THC Design mark is a white hexagonal molecule diagram set beside the words THC DESIGN. It sits on the pack alongside the standard Presidential architecture rather than replacing any of it — the silver crown crest and PRESIDENTIAL banner stay where they always are.

**The two releases**

**Creskendo.** Sativa. Moon Rock Blunt. Built on FLOWER · LIVE RESIN · DIAMONDS. The artwork runs a teal-to-blue gradient with vivid purple, violet and mint liquid erupting upward from a plume behind the pack, and glossy three-dimensional musical notes and treble clefs floating through the frame. The pack itself is printed purple.

Worth knowing: the pack prints **CRESKENDO**, stylised with a music-note K — not "crescendo." The name is a deliberate construction, not a spelling error.

**XJ13.** Sativa. Moon Rock Blunt, Net Wt. 1.5G (.053oz), 100% TOBACCO FREE. Also built on FLOWER · LIVE RESIN · DIAMONDS. The artwork puts a frosty green cannabis bud and golden fan leaves behind the pack, with a molecular ball-and-stick diagram and a chemical structure line-drawing floating through teal and gold liquid. The pack is mint green.

Both are Sativa. Both run the same composition. Together they are the whole of the THC Design collaboration in the Presidential catalogue.

**Where the collaboration sits among the others**

Presidential's partner roster runs across three kinds of relationship. Cultivators and processors: Ball Family Farms on Nino Brown. Nature's Chemistry of Las Vegas on Garlic Cookies and Ghost Train Haze. Top Shelf Cultivation on Whoa Si Whoa. Polaris Cannabis on Head Cheese. ROVE on Cherry Gelato, Skywalker and Waui. Trendi, powered by Planet 13, on Cap Junky and Orange Push Pop. Platinum on Iced Lemon, Guava Haze and Tropicana Cookies. And one media partner: VladTV on King Louis.

THC Design sits with the cultivation and processing group, and the artwork on both its releases leans scientific — molecules on XJ13, a laboratory palette on both.

**What does not change in a collaboration**

The build. Every partner release runs through the Presidential Infusion System exactly as the core catalogue does: flower as the base, a concentrate coat, and the finish printed on the pack bonded to the coat. Creskendo and XJ13 print FLOWER · LIVE RESIN · DIAMONDS. A partner's name on the front changes the market, sometimes the strain, and often the artwork. It does not change the process.

**Formats and availability**

The collaboration appears across [Presidential x THC Design Moon Rocks](/moon-rocks/thc-design-moon-rocks), [Presidential x THC Design Prerolls](/moon-rocks/thc-design-prerolls) and [Presidential x THC Design Blunts](/moon-rocks/thc-design-blunts).

The Presidential ladder holds: Blunt 1.5 g, Preroll 1 g, loose Moon Rocks 2 g, Mini Blunts 3 × 0.7 g, Mini Prerolls 3 × 0.5 g.

Collaboration releases typically reach fewer formats and fewer markets than the core Gold Strain Series, so availability varies more than usual.

**Where to find Presidential**

Wholesale, licensed retailers only. Presidential is available in [select state markets](/find-us). Use the zip search above. For adults 21+ where legal.`,
  },
  "/vapes": {
    label: "Presidential Vapes",
    markdown: `Presidential is known for moon rocks. The vape category is where the same house approaches a different format.

**What the brand brings to it**

Presidential builds one thing: infused product, made by layering. Flower as a base, a concentrate coat over it, a kief finish bonded to the coat. That is the Presidential Infusion System, and the vocabulary printed on every moon rock pack — live resin, liquid live resin, distillate, kief, diamonds — is a vocabulary of concentrates.

Concentrates are the shared ground between a moon rock and a vape. The company works in the same materials in both categories.

**How to read a Presidential pack in any category**

The house architecture is consistent: WORLD'S STRONGEST across the top, the product type, the silver crown crest with the PRESIDENTIAL banner, the format line, the product name, and the composition line.

That composition line is the habit worth building. On the moon rock side it runs four different ways across the catalogue — FLOWER · LIVE RESIN · DIAMONDS on Blue Dream and 24K, FLOWER · DISTILLATE · KIEF on the self-titled flagship, FLOWER · LIQUID LIVE RESIN · DIAMONDS on Cap Junky. It is printed by the manufacturer and it is the only description of a product that has not passed through somebody else's page.

**Where Presidential sells**

Presidential is wholesale. It does not sell direct, to anyone, in any category. Every product reaches you through a licensed retailer, and each shop decides independently what to carry. Availability varies by retailer, by market and by day.

Presidential sells through licensed retailers in [select state markets](/find-us): California, Oklahoma, New York, Nevada, Michigan and Arizona, and Washington is landing soon.

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
