import Link from 'next/link';
import type { ReactNode } from 'react';

// SURFER-R34: server-rendered body copy for the thin Vault art rooms and pre-roll SKU pages.
const L = 'font-semibold underline underline-offset-4';

// sitebulb-R37 B4-B10: an optional parent H2 puts the block heading under it as an H3.
function Block({ heading, parent, children }: { readonly heading: string; readonly parent?: string; readonly children: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 pb-12 text-sm leading-6 text-white/80">
      {parent ? (
        <>
          <h2 className="mb-2 text-lg font-semibold text-white">{parent}</h2>
          <h3 className="mb-2 text-base font-semibold text-white">{heading}</h3>
        </>
      ) : (
        <h2 className="mb-2 text-base font-semibold text-white">{heading}</h2>
      )}
      <p>{children}</p>
    </section>
  );
}

export function VaultEntranceCopy() {
  return (
    <Block heading="What the Presidential Vault holds">
      The Vault is where Presidential keeps its pack art: the illustrations that front Moon Rock blunts, pre-rolls, and minis,
      grouped by format. Each work shows the product name and its build on the label, such as flower, live resin, and diamonds,
      or flower, live rosin, and diamonds. To track a pack down, use the ZIP search and confirm with the store. For the products
      behind the art, see the <Link className={L} href="/blunts">infused blunt range</Link> or the{' '}
      <Link className={L} href="/moon-rocks">full Moon Rocks collection</Link>.
    </Block>
  );
}

const ROOM_COPY: Readonly<Record<string, ReactNode>> = {
  // SURFER-R35: mini blunt art room (every mini blunt pack: flower, live resin, diamonds; markings include Sativa).
  'mini-blunts': (
    <Block heading="The art behind each mini blunt pack">
      Each work in this room fronts a Presidential Moon Rock mini blunt pack: the same illustrated identity as the full-size
      blunt, scaled to a smaller roll. Shoppers searching for Presidential mini blunts often meet the art first, so it helps to
      know what sits behind it. The label build is flower, live resin, and diamonds in a tobacco-free wrap, and each pack carries
      the strain name and an Indica, Hybrid, or Sativa marking under the art. To read one pack in detail, open its card below. To see the art for every format, go
      back to the <Link className={L} href="/presidential-art">Vault front room</Link>. When a pack catches your eye, use the ZIP
      search and confirm with the store.
    </Block>
  ),
  'pre-rolls': (
    <Block heading="The art on Presidential pre-roll packs">
      Every Presidential Moon Rock pre-roll pack carries its own illustration above the product name. That art is how shoppers
      spot the series on a crowded shelf. Across the pre-roll lineup, each roll pairs flower and concentrate with a kief or
      diamond finish, and the series sets the concentrate: distillate for Silver, live resin for Gold, live rosin for Rose Gold.
      The art helps you recognize a pack. The label tells you exactly what&apos;s inside. Compare the products in the{' '}
      <Link className={L} href="/pre-rolls">Moon Rock pre-roll lineup</Link>, or step back to the{' '}
      <Link className={L} href="/presidential-art">main Vault room</Link>.
    </Block>
  ),
  blunts: (
    <Block heading="Pack art for Presidential Moon Rock blunts">
      Presidential Moon Rock blunts carry the same illustrated identity as the rest of the lineup. Each one is a tobacco-free
      hemp wrap around flower, concentrate, and a kief or diamond finish. Silver blunts use distillate, Gold blunts use live resin
      and Rose Gold blunts use live rosin, and the art and series color make each one easy to spot. Read the label for the exact build, then search
      nearby stores and confirm with the store. Browse the <Link className={L} href="/blunts">Moon Rock blunt catalog</Link> for
      every name, or the smaller <Link className={L} href="/mini-blunts">mini blunt packs</Link>.
    </Block>
  ),
  'mini-pre-rolls': (
    <Block heading="From the mini pre-roll art to the pack">
      Each work in this room fronts a Presidential Moon Rock mini pre-roll pack, the shorter version of the full pre-roll. The
      rolls are made with flower, live resin, and diamonds, and the pack shows the strain name under the art. To compare the
      products themselves, open the <Link className={L} href="/mini-pre-rolls">mini pre-roll packs</Link>. For the rest of the
      collection, return to the <Link className={L} href="/presidential-art">Vault entrance</Link>.
    </Block>
  ),
};

export function VaultRoomCopy({ room }: { readonly room: string }) {
  return ROOM_COPY[room] ?? null;
}

const SKU_COPY: Readonly<Record<string, ReactNode>> = {
  // SURFER-R37: pre-roll and mini pre-roll SKU blocks (builds from each SKU's description and pack).
  'pre-rolls/crescendo': (
    <Block heading="Crescendo as a jar and as a roll">
      The Crescendo name runs across more than one Presidential format. The pre-roll puts flower, live resin, and diamonds into
      one finished 1g roll, marked Sativa on the pack. Shoppers who would rather break up their own can look at the{' '}
      <Link className={L} href="/moon-rocks/crescendo">Crescendo moon rock jar</Link>, which carries the same strain name. Both
      sit in the Gold Strain Series, so both are built on live resin. To compare Crescendo with other
      strains built the same way, browse the <Link className={L} href="/moon-rocks/gold">live resin Gold lineup</Link>. Ask the
      store which formats are on hand, and read the pack label for batch details before you buy.
    </Block>
  ),
  'pre-rolls/gods-gift': (
    <Block parent="How God's Gift is built" heading="Where live rosin fits in God's Gift">
      God&apos;s Gift belongs to the Rose Gold Connoisseur Series, the solventless tier of the Presidential catalog. Each 1g
      pre-roll is flower, live rosin, and diamonds, marked Indica on the pack. Live rosin is pressed from fresh material with ice
      water, heat, and pressure, and no solvents are used along the way. The{' '}
      <Link className={L} href="/learn/what-is-live-rosin">solventless rosin explainer</Link> covers that process step by step.
      Shoppers who prefer a jar can find the same name as a{' '}
      <Link className={L} href="/moon-rocks/gods-gift">God&apos;s Gift moon rock jar</Link>. Availability depends on the
      retailer, so confirm the current selection with the store and check the label on each pack for batch information.
    </Block>
  ),
  'mini-pre-rolls/waui': (
    <Block parent="How Waui is built" heading="Waui in mini and full-size form">
      Waui is a ROVE collaboration in the Gold Strain Series, and the mini pack splits it into three 0.5g rolls. The loose build is{' '}
      <Link className={L} href="/moon-rocks/waui">Waui moon rocks in the jar</Link>. Each one is
      flower, live resin, and diamonds, marked Sativa, with a pineapple-led tropical aroma. The minis suit a shorter session or
      sharing a pack among friends. Shoppers who want one larger roll can pick the{' '}
      <Link className={L} href="/pre-rolls/waui">full-size Waui roll</Link>, which carries the same strain name. Another name
      from the same partnership is <Link className={L} href="/moon-rocks/skywalker">Skywalker, another ROVE name</Link>, offered
      as a jar. Retail stock varies from store to store, so confirm the format you want before the trip and read the pack label
      for batch details. For the same three-roll idea in hemp, see{' '}
      <Link className={L} href="/mini-blunts/waui">the Waui mini blunt three-pack</Link>.
    </Block>
  ),
  'mini-pre-rolls/xj-13': (
    <Block parent="How XJ-13 is built" heading="Other ways to buy XJ-13">
      XJ-13 lists Jack Herer and G13 Haze on the pack as its parentage, and the mini pack holds three 0.5g rolls of flower, live
      resin, and diamonds, marked Sativa. Its aroma leans citrus and clean. The same strain also appears in larger and
      hemp-wrapped formats. For a single larger roll, the <Link className={L} href="/pre-rolls/xj-13">full 1g XJ-13 roll</Link>{' '}
      keeps the same build in one piece. For a tobacco-free option, look at{' '}
      <Link className={L} href="/mini-blunts/xj-13">XJ-13 in a hemp mini wrap</Link>. Each format has its own label, so read the
      pack for its build and batch details, and ask the store which XJ-13 formats it has in stock.
    </Block>
  ),
  'mini-pre-rolls/xxx': (
    <Block parent="How XXX is built" heading="XXX beyond the mini pack">
      XXX comes from the Gold Strain Series, and the mini pack holds three 0.5g rolls, each one flower, live resin, and diamonds,
      marked Indica. The aroma reads woodsy with a citrus edge. Some shoppers like the minis for a short session; others want a
      single roll or a hemp wrap. The <Link className={L} href="/pre-rolls/xxx">single XXX roll</Link> offers the strain as one
      1g pre-roll, and the <Link className={L} href="/mini-blunts/xxx">XXX mini blunt pack</Link> moves it into a tobacco-free
      hemp wrap. Each format prints its own build on the label, so read the pack before buying, and confirm with the store which
      XXX formats it currently has on hand.
    </Block>
  ),
  // SURFER-R36: Gorilla Goo mini blunts and the 24K blunt (single SKUs follow their labels).
  'mini-blunts/gorilla-goo': (
    <Block heading="Gorilla Goo at a smaller scale">
      Gorilla Goo is a Gold Strain Series name with reported sour fuel, pine, and chocolate notes. The mini blunt label reads
      flower, live resin, and diamonds in a tobacco-free wrap, and the pack is marked Hybrid. Shoppers searching for Presidential
      mini blunts by strain often want this sticky, resinous profile in a size that spreads across several occasions. The same
      name comes as a moon rock jar that follows its own label, listed in the{' '}
      <Link className={L} href="/moon-rocks/gold">Gold strain lineup</Link>. If you prefer paper, see the{' '}
      <Link className={L} href="/mini-pre-rolls/gorilla-goo">Gorilla Goo paper mini rolls</Link>. Read the label on the exact
      pack, then use the store finder and confirm with the store.
    </Block>
  ),
  'blunts/24k': (
    <Block heading="24K as a jar and a mini">
      The 24K Moon Rock blunt is a single 1.5g roll of flower, live resin, and diamonds in a tobacco-free wrap, marked Indica,
      with no partner mark and no flavor name. For anyone searching for a moonrock blunt by name, 24K shows how the label reads
      on a Gold Strain Series release. Live resin comes from plants frozen at harvest, which keeps more of the aromatic
      compounds that shape how a strain smells. The same name comes as the{' '}
      <Link className={L} href="/moon-rocks/24k">24K moon rock jar</Link>, finished with diamonds on its own label, and as the{' '}
      <Link className={L} href="/mini-blunts/24k">24K mini blunt three-pack</Link>. Use the store finder and confirm with the
      store.
    </Block>
  ),
  // SURFER-R35: mini and pre-roll SKU blocks (single SKUs follow their labels; jar builds follow the jar's own label).
  'mini-pre-rolls/presidential-og': (
    <Block heading="The house name in other sizes">
      Presidential OG carries the brand&apos;s own name, with the crest and no partner mark. The mini
      pre-rolls are flower, live resin, and diamonds in paper, marked Hybrid on the pack. If you searched for Presidential
      prerolls and want the house name in particular, this is the smallest paper version. The same name comes as a jar: the{' '}
      <Link className={L} href="/moon-rocks/presidential-og">Presidential OG moon rock jar</Link> holds the build without paper,
      and its own label sets its composition. For a hemp wrap instead of paper, see{' '}
      <Link className={L} href="/mini-blunts/presidential-og">Presidential OG in a hemp wrap</Link>. Read the label on the exact
      pack, then use the store finder and confirm current selection with the store.
    </Block>
  ),
  'mini-blunts/pink-cookies': (
    <Block heading="Pink Cookies across formats">
      Pink Cookies keeps its sweet vanilla character, balanced by earth and citrus, whether it comes as a jar, a full blunt, or
      this mini three-pack. It&apos;s a Gold Strain Series name. The mini blunts are flower, live resin, and diamonds in
      tobacco-free wraps, marked Indica on the pack. For shoppers searching for Presidential mini blunts, the three-pack is the
      shareable size of the same cookie profile. To compare, open the{' '}
      <Link className={L} href="/moon-rocks/pink-cookies">Pink Cookies moon rock jar</Link>, or choose paper with the{' '}
      <Link className={L} href="/mini-pre-rolls/pink-cookies">Pink Cookies paper minis</Link>. Each format follows its own label,
      so check the label on the exact pack and confirm with the store before you go.
    </Block>
  ),
  'mini-blunts/presidential-og': (
    <Block heading="Presidential OG, wrapped small">
      The Presidential OG mini blunts put the house name in a tobacco-free wrap: flower, live resin, and diamonds, marked Hybrid,
      with the crest on the front and no partner name. Anyone searching for Presidential mini blunts with the house name in mind
      can start here. The three-pack splits the build into smaller rolls that suit a shorter session or a shared one. If
      you&apos;d rather have paper, the{' '}
      <Link className={L} href="/mini-pre-rolls/presidential-og">Presidential OG paper minis</Link> carry the same name in a
      different wrap. For the unrolled version, see the{' '}
      <Link className={L} href="/moon-rocks/presidential-og">OG jar of moon rocks</Link>, which follows its own label. Read
      the label on the exact pack and confirm current selection with the store.
    </Block>
  ),
  'pre-rolls/24k': (
    <Block heading="24K beyond the single roll">
      The 24K pre-roll is one 1g roll of flower, live resin, and diamonds in the Gold Strain Series, marked Indica. Like every 24K
      release, it carries no flavor name and no partner mark. Shoppers searching for a Presidential moon rock pre-roll by name can
      use 24K as a clear example of how the label reads. The name also comes as the{' '}
      <Link className={L} href="/moon-rocks/24k">24K jar of moon rocks</Link>, which follows its own label and is finished with
      diamonds. For a smaller roll, the <Link className={L} href="/mini-pre-rolls/24k">24K paper minis</Link> carry the same
      build, and <Link className={L} href="/mini-blunts/24k">24K as a three-roll mini blunt pack</Link> puts it in three hemp-wrapped rolls. Check the label on the exact pack, then use the store finder and confirm current selection with the store.
    </Block>
  ),
  'pre-rolls/xxx': (
    <Block heading="XXX in other formats">
      XXX is a Gold Strain Series name, and the pre-roll is one 1g roll of flower, live resin, and diamonds, marked Indica on
      the pack. The same name also comes as the <Link className={L} href="/moon-rocks/xxx">XXX moon rock jar</Link>, built with live
      resin and finished with kief, and the <Link className={L} href="/blunts/xxx">XXX infused blunt</Link> puts the name in a
      hemp wrap. If you&apos;d rather have a smaller roll, the{' '}
      <Link className={L} href="/mini-pre-rolls/xxx">XXX mini pre-roll pack</Link> splits the same name into shorter rolls, and{' '}
      <Link className={L} href="/mini-blunts/xxx">XXX mini blunts in a hemp wrap</Link> do the same in hemp. Read
      the label on the exact pack and confirm current selection with the store.
    </Block>
  ),
  'pre-rolls/white-walker': (
    <Block heading="White Walker within the Rose Gold series">
      White Walker sits in the Rose Gold Connoisseur Series, the solventless side of Presidential. The pre-roll is flower, live
      rosin, and diamonds in one 1g roll. The{' '}
      <Link className={L} href="/learn/what-is-live-rosin">guide to live rosin</Link> covers how it&apos;s made. To compare White
      Walker with its series neighbors, browse the <Link className={L} href="/moon-rocks/rose-gold">Rose Gold collection</Link>,
      then confirm current selection with the store.
    </Block>
  ),
  'pre-rolls/waui': (
    <Block heading="Waui beyond the single pre-roll">
      Waui is a Gold Strain Series name from the Presidential and ROVE collaboration. The pre-roll is one 1g roll of flower, live
      resin, and diamonds, marked Sativa on the pack. The same name also comes as the{' '}
      <Link className={L} href="/moon-rocks/waui">Waui moon rock jar</Link>, and as the{' '}
      <Link className={L} href="/mini-pre-rolls/waui">Waui mini pre-roll pack</Link> for shorter sessions, and as{' '}
      <Link className={L} href="/mini-blunts/waui">Waui in three 0.7g mini blunts</Link>. Check the label on the
      exact pack and confirm current selection with the store.
    </Block>
  ),
  // SURFER-R39: mini blunt SKU blocks (24K anchors reworded: already used on the site).
  'mini-blunts/skywalker': (
    <Block heading="Skywalker in full-size formats">
      Skywalker is a ROVE collaboration in the Gold Strain Series. The Skywalker mini blunt pack carries the ROVE collaboration in a smaller size: flower, live resin, and diamonds in a tobacco-free wrap, marked Indica, with a blueberry, tropical, and earthy aroma. Shoppers who would rather have one longer roll can look at the <Link className={L} href="/blunts/skywalker">full-size Skywalker blunt</Link>, which lists the same flower, live resin, and diamonds. For a paper-rolled option, the <Link className={L} href="/pre-rolls/skywalker">Skywalker infused pre-roll</Link> uses the same build. Picking between them comes down to size and wrap, since the label shows the same ingredients on each. Read the pack for batch details, and confirm with the store which Skywalker formats it carries.
    </Block>
  ),
  'mini-blunts/waui': (
    <Block heading="Waui from mini to full-size blunt">
      Waui mini blunts carry the ROVE collaboration&apos;s pineapple-led tropical aroma, with flower, live resin, and diamonds in a tobacco-free wrap, marked Sativa. The same name also comes as a single longer roll: the <Link className={L} href="/blunts/waui">Waui hemp blunt in full size</Link> lists flower, live resin, and diamonds too. Live resin is made from plants frozen at harvest instead of dried first, and the <Link className={L} href="/learn/what-is-live-resin">frozen-harvest live resin primer</Link> explains why that step matters for aroma. The minis suit shorter sessions or sharing, while the full-size blunt is one longer roll. Read the pack for batch details and ask the store what is in stock.
    </Block>
  ),
  'mini-blunts/xj-13': (
    <Block heading="XJ-13 as a full-size blunt or pre-roll">
      The XJ-13 mini blunt pack prints Jack Herer and G13 Haze as the strain&apos;s parentage, and each roll is flower, live resin, and diamonds in a tobacco-free wrap, marked Sativa. The aroma runs citrus, lemon, and pine. The same name comes in larger formats with the same listed build. For one longer hemp-wrapped roll, see the <Link className={L} href="/blunts/xj-13">XJ-13 blunt at full size</Link>. For paper instead of hemp, the <Link className={L} href="/pre-rolls/xj-13">1g XJ-13 pre-roll</Link> is the option. Each format prints its own label, so read it before buying, and confirm with the store which XJ-13 formats are on hand.
    </Block>
  ),
  'mini-blunts/xxx': (
    <Block heading="XXX in a jar or a single roll">
      XXX mini blunts are flower, live resin, and diamonds in a tobacco-free wrap, marked Indica, with a woodsy citrus aroma. The same name appears across other Presidential formats, and shoppers can move between them by size and wrap. To break up your own, look at <Link className={L} href="/moon-rocks/xxx">XXX loose in a moon rock jar</Link>, which prints flower, live resin, and kief. For a paper-rolled single, the <Link className={L} href="/pre-rolls/xxx">XXX 1g pre-roll</Link> lists flower, live resin, and diamonds. Builds can differ between formats, so read each pack&apos;s label rather than assuming they match. Confirm with the store which XXX formats it carries, and check batch details on the label.
    </Block>
  ),
  'mini-blunts/cherry-gelato': (
    <Block heading="Cherry Gelato mini blunt or mini pre-roll">
      Cherry Gelato mini blunts carry the ROVE collaboration&apos;s sweet cherry and creamy aroma, with flower, live resin, and diamonds in a tobacco-free wrap, marked Hybrid. The closest sibling is the <Link className={L} href="/mini-pre-rolls/cherry-gelato">Cherry Gelato mini pre-roll pack</Link>, which lists the same flower, live resin, and diamonds in paper instead of hemp. The choice comes down to wrap. Cherry Gelato is also sold loose as the <Link className={L} href="/moon-rocks/cherry-gelato">Cherry Gelato moon rock jar</Link>, which prints its own build on the label. Read the pack before buying, since formats under one name are not always built the same, and confirm stock with the store.
    </Block>
  ),
  'mini-blunts/24k': (
    <Block heading="24K across jar and pre-roll">
      The 24K mini blunt pack holds flower, live resin, and diamonds in a tobacco-free wrap, marked Indica. The same name runs through other Presidential formats, which helps when a store has one size and not another. <Link className={L} href="/pre-rolls/24k">24K in a 1g paper roll</Link> lists flower, live resin, and diamonds. For something to break up yourself, <Link className={L} href="/moon-rocks/24k">24K loose in the jar</Link> carries the name. Each format prints its own label, so check the build and batch details on the pack in hand. Ask the store which 24K formats are on the shelf before you make the trip.
    </Block>
  ),
};

export function VaultSkuCopy({ room, slug }: { readonly room: string; readonly slug: string }) {
  return SKU_COPY[`${room}/${slug}`] ?? null;
}
