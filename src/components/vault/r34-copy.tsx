import Link from 'next/link';
import type { ReactNode } from 'react';

// SURFER-R34: server-rendered body copy for the thin Vault art rooms and pre-roll SKU pages.
const L = 'font-semibold underline underline-offset-4';

function Block({ heading, children }: { readonly heading: string; readonly children: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 pb-12 text-sm leading-6 text-white/80">
      <h2 className="mb-2 text-base font-semibold text-white">{heading}</h2>
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
  'pre-rolls/xxx': (
    <Block heading="XXX in other formats">
      XXX is a Gold Strain Series name, and the pre-roll is one 1g roll of flower, live resin, and diamonds, marked Indica on
      the pack. The same name also comes as the <Link className={L} href="/moon-rocks/xxx">XXX moon rock jar</Link>, built with live
      resin and finished with kief, and the <Link className={L} href="/blunts/xxx">XXX infused blunt</Link> puts the name in a
      hemp wrap. If you&apos;d rather have a smaller roll, the{' '}
      <Link className={L} href="/mini-pre-rolls/xxx">XXX mini pre-roll pack</Link> splits the same name into shorter rolls. Read
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
      <Link className={L} href="/mini-pre-rolls/waui">Waui mini pre-roll pack</Link> for shorter sessions. Check the label on the
      exact pack and confirm current selection with the store.
    </Block>
  ),
};

export function VaultSkuCopy({ room, slug }: { readonly room: string; readonly slug: string }) {
  return SKU_COPY[`${room}/${slug}`] ?? null;
}
