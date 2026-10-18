import Image from 'next/image';
import { buildSocialMetadata } from '@/lib/seo/metadata';
import Link from 'next/link';
import type { Metadata } from 'next';
import shared from '@/components/presidential/prerolls/preroll-experience.module.css';
import { productsInRoom, type VaultRoom } from '@/content/vault/catalog';
import { canonicalUrl } from '@/lib/seo/schema/constants';
import { buildBreadcrumbSchema, buildOrganizationSchema, buildWebPageSchema, JsonLd } from '@/lib/seo/schema';
import { AnswerSections } from '@/components/presidential/modules/answer-sections';
import { MINI_BLUNT_ANSWERS } from '@/components/presidential/modules/top50-content';
import { VaultFormatCard } from './format-cards';

function hubLabel(room: VaultRoom): string {
  return room.name.replace('Pre-rolls', 'Pre-Rolls');
}

export function vaultFormatHubMetadata(room: VaultRoom): Metadata {
  const label = hubLabel(room);
  const names = productsInRoom(room.slug).map((p) => p.strain);
  const title = `Presidential ${label} | Infused ${label}`;
  // Sitebulb oct06d #5: kept at 155 characters or fewer.
  const description = `Presidential Moon Rock ${label}: ${names.join(', ')}. At licensed retailers.`;
  const canonical = canonicalUrl(`/${room.slug}`);
  return { title, description, alternates: { canonical }, robots: { index: true, follow: true }, ...buildSocialMetadata({ title, description, url: canonical }) };
}

// MR-TOP50: the mini hubs had no JSON-LD. Same pattern as the /blunts and /pre-rolls
// route shells: Organization, WebPage and BreadcrumbList (Presidential > hub).
function vaultFormatHubJsonLd(room: VaultRoom) {
  const meta = vaultFormatHubMetadata(room);
  const name = `Presidential ${hubLabel(room)}`;
  const path = `/${room.slug}`;
  return [
    buildOrganizationSchema(),
    buildWebPageSchema({ path, name, description: String(meta.description) }),
    buildBreadcrumbSchema([{ name: 'Presidential', path: '/' }, { name, path }]),
  ];
}

export function VaultFormatHub({ room }: { room: VaultRoom }) {
  const products = productsInRoom(room.slug);
  const label = hubLabel(room);
  return (
    <>
    {vaultFormatHubJsonLd(room).map((data, index) => <JsonLd data={data} key={`${room.slug}-jsonld-${index}`} />)}
    <div className={shared.page}>
      <section aria-labelledby={`${room.slug}-heading`} className={shared.hero}>
        <div className={shared.heroAtmosphere} />
        <div className={shared.heroInner}>
          <div className={shared.heroCopy}>
            <nav aria-label="Breadcrumb" className={shared.breadcrumbs}>
              <Link href="/">Presidential</Link>
              <span aria-hidden="true">/</span>
              <span>{label}</span>
            </nav>
            <h1 id={`${room.slug}-heading`}>{`Presidential ${label}`}</h1>
            <p className={shared.heroLead}>Flower. Concentrate. A Presidential finish.</p>
            <div className={shared.heroActions}>
              <a className={shared.primaryAction} href="#collection">{`Explore the ${label.toLowerCase()}`}</a>
              <Link className={shared.textAction} href="/find-us">Find a retailer</Link>
            </div>
          </div>
        </div>
      </section>

      <section aria-label={`Presidential ${label}`} className={shared.artIndex} id="collection">
        {/* INLINKS-COPY-R15: /mini-blunts H3s (copy as written; /blunts anchor reworded to avoid a "Presidential Blunts" anchor). */}
        {room.slug === 'mini-blunts' ? (
          <div className={shared.indexIntro}>
            <h3>What&apos;s in a Presidential mini blunt pack</h3>
            <p>
              Every mini blunt pack holds three 0.7g Moon Rock mini blunts, 2.1g in total. Each one has the same build as the{' '}
              <Link href="/blunts">full-size Moon Rock blunts</Link>: flower coated in live resin with a kief or diamond finish, rolled
              in a 100% tobacco-free hemp wrap. Only the size and the count change. A mini blunt is a smaller version of the same
              object, not a cheaper one. For the paper version, see{' '}
              <Link href="/mini-pre-rolls">Presidential mini pre-rolls</Link> or the full-size{' '}
              <Link href="/pre-rolls">Presidential infused pre-rolls</Link>.
            </p>
            <h3>Why a three-pack instead of one full blunt</h3>
            <p>
              The three-pack suits a customer who wants a strain spread across several occasions, or shared among three people. Each
              pack is marked Indica or Hybrid on the front. Cherry Gelato carries the ROVE collaboration name. Gorilla Goo is the pick
              for its reported sour fuel, pine and chocolate notes. You can compare packs on the{' '}
              <Link href="/mini-blunts/24k">24K mini blunts</Link>,{' '}
              <Link href="/mini-blunts/cherry-gelato">Cherry Gelato mini blunts</Link> and{' '}
              <Link href="/mini-blunts/gorilla-goo">Gorilla Goo mini blunts</Link> pages.
            </p>
            <h3>THC, cannabinoids and the label</h3>
            <p>
              THC and other cannabinoid figures belong to the individual pack and its batch test record, so read the label on the
              pack in your hand, not a strain name. The result in the wrap comes from the flower, the live resin and the diamonds
              working together. <Link href="/learn/what-are-liquid-diamonds">What are liquid diamonds</Link> and{' '}
              <Link href="/learn/what-is-live-resin">what is live resin</Link> explain each layer. Packs are sold through licensed
              retailers only, and the <Link href="/find-us">Presidential store finder</Link> shows the nearest ones. If you want
              paper in place of a hemp wrap, see <Link href="/mini-pre-rolls">Mini Pre-Rolls</Link>.
            </p>
            {/* INLINKS-COPY-R18: /mini-blunts strain-name and pack-art H3s (copy as written). */}
            <h3>Choosing a mini blunt by strain name</h3>
            <p>
              Each mini blunt pack takes its name from the full-size line, so a familiar strain carries over. Compare{' '}
              <Link href="/mini-blunts/presidential-og">Presidential OG mini blunts</Link>,{' '}
              <Link href="/mini-blunts/skywalker">Skywalker mini blunts</Link> and{' '}
              <Link href="/mini-blunts/xj-13">XJ-13 mini blunts</Link>. Then check whether the pack is marked Indica, Hybrid, or Sativa.
            </p>
            <h3>The craft on the outside of the pack</h3>
            <p>
              Every pack carries its own artwork, and the{' '}
              <Link href="/presidential-art/mini-blunts">mini blunt art collection</Link> shows the illustration behind each name.
              Choose <Link href="/mini-blunts/pink-cookies">Pink Cookies mini blunts</Link>,{' '}
              <Link href="/mini-blunts/waui">Waui mini blunts</Link> or <Link href="/mini-blunts/xxx">XXX mini blunts</Link> by
              name, then find the pack at a licensed store through the{' '}
              <Link href="/find-us">Presidential store finder</Link>.
              More of the artwork behind every Presidential format sits in the{' '}
              <Link href="/presidential-art">full Vault of pack art</Link>.
            </p>
            {/* INLINKS-COPY-R26: /mini-blunts finding H3 (copy as written). Its "beside the full-size blunts" H3 repeated the pack-build answer above, so its paper-version links were merged there. */}
            <h3>Finding a mini blunt pack near you</h3>
            <p>
              Mini blunt packs are sold through licensed retailers only, and mini availability depends on the strain. Bring the exact
              strain name from the pack to <Link href="/find-us">the Presidential retailer finder</Link>, and check{' '}
              <Link href="/presidential-art/mini-blunts">the mini blunt pack art</Link> so you know the package on the shelf.
            </p>
            {/* INLINKS-COPY-R37: /mini-blunts H3s (mini blunts follow their diamond label; reused anchors reworded). */}
            <h3>From Moon Rock to mini blunt</h3>
            <p>
              A Presidential mini blunt starts from the same idea as a Moon Rock: flower coated in live resin, finished with diamonds
              as the mini blunt labels print. <Link href="/learn/what-are-moon-rocks">The layered moon rock format</Link> covers that
              build, and <Link href="/learn/infusion-science">how infusion science works</Link> explains how the concentrate is carried
              through the flower.
            </p>
            <h3>The same strain names as mini pre-rolls</h3>
            <p>
              Several mini blunt names also come in paper as mini pre-rolls. Compare{' '}
              <Link href="/mini-pre-rolls/24k">24K mini pre-rolls</Link>,{' '}
              <Link href="/mini-pre-rolls/skywalker">Skywalker mini pre-rolls</Link> and{' '}
              <Link href="/mini-pre-rolls/pink-cookies">Pink Cookies mini pre-rolls</Link>, and see the{' '}
              <Link href="/presidential-art/mini-pre-rolls">mini pre-roll art room</Link> to tell the two packs apart.
            </p>
            <h3>A full-size 24K beside the mini</h3>
            <p>
              The 24K mini blunt shares its name and build with the{' '}
              <Link href="/blunts/24k">full-size 24K Moon Rock blunt</Link>. Only the size and the count change.
            </p>
          </div>
        ) : null}
        {room.slug === 'mini-pre-rolls' ? (
          <div className={shared.indexIntro}>
            <p>
              Each pack holds three 0.5g Moon Rock mini pre-rolls, 1.5g in total. The full-size{' '}
              <Link href="/pre-rolls">presidential pre rolls</Link> are a single 1g roll. The loose format is on{' '}
              <Link href="/moon-rocks">the Moon Rocks platform</Link>. Packs include{' '}
              <Link href="/mini-pre-rolls/24k">24K</Link> and <Link href="/mini-pre-rolls/cherry-gelato">Cherry Gelato</Link>.
            </p>
            {/* INLINKS-COPY-R40: /mini-pre-rolls H3s (reused anchors reworded). */}
            <h3>The extract terms on a mini pre-roll pack</h3>
            <p>
              Mini pre-roll packs list flower, live resin and diamonds. Read{' '}
              <Link href="/learn/what-is-live-resin">the live resin definition</Link> and{' '}
              <Link href="/learn/infusion-science">Presidential infusion science</Link> to understand those terms before you buy.
            </p>
            <h3>Mini pre-roll or mini blunt</h3>
            <p>
              The same names also come in a tobacco-free hemp wrap. Compare the{' '}
              <Link href="/mini-blunts">Presidential mini blunt packs</Link>, and see the{' '}
              <Link href="/presidential-art/mini-pre-rolls">mini pre-roll pack artwork</Link> for each name.
            </p>
          </div>
        ) : null}
        <div className={shared.tierSections}>
          <section className={shared.tierSection}>
            <div className={`${shared.artGrid} ${shared.tierGrid}`}>
              {products.map((product) => <VaultFormatCard key={product.slug} product={product} />)}
            </div>
          </section>
        </div>
      </section>

      {room.slug === 'mini-blunts' ? <AnswerSections eyebrow="Mini blunt questions" id="mini-blunts-answers" items={MINI_BLUNT_ANSWERS} /> : null}

      <section aria-labelledby={`${room.slug}-find-heading`} className={shared.find} id="find">
        <div>
          <p>Find your Presidential</p>
          <h2 id={`${room.slug}-find-heading`}>Your next stop.<br /><span>The right retailer.</span></h2>
          <p className={shared.findCopy}>Explore the official retailer locator, then check the store&apos;s current Presidential selection. Availability varies by licensed retailer.</p>
          <Link className={shared.primaryAction} href="/find-us">Find a licensed retailer</Link>
          <small>For adults 21+ where legal.</small>
        </div>
        <div className={shared.findMark}>
          <span>Find your<br />Presidential.</span>
          <Image alt="Presidential logo" height={291} src="/media/brand/presidential-crest-master.png" width={376} />
        </div>
      </section>
    </div>
    </>
  );
}
