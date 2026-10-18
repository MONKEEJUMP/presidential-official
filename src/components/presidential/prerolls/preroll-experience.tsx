"use client";

import Image from "next/image";
import Link from "next/link";
import { ProductNameLink, ProductMentions } from "@/components/presidential/products/product-mention";
import { useLayoutEffect, type ReactNode } from "react";

import {
  FEATURED_PRE_ROLL_ARTWORK_IDS,
  PRE_ROLL_ARTWORKS,
} from "@/lib/prerolls/catalog";
import { productDetailPath } from "@/lib/products/product-paths";
import { TIER_SECTION_ORDER, resolveCatalogTier } from "@/lib/catalog/tier-map";

import { TierBadge, TierSectionHeader } from "@/components/presidential/catalog/tier-section";

import styles from "./preroll-experience.module.css";
import { sanityImage } from "@/lib/cms/sanity-image";

function getArtwork(id: string) {
  const artwork = PRE_ROLL_ARTWORKS.find((candidate) => candidate.id === id);
  if (!artwork) throw new Error(`Missing featured pre-roll artwork: ${id}`);
  return artwork;
}

const featuredArtwork = FEATURED_PRE_ROLL_ARTWORK_IDS.map(getArtwork);
const heroArtwork = [
  "cosmic-cookies",
  "pink-cookies",
  "cereal-milk-title",
  "blue-dream",
  "strawberry",
].map(getArtwork);

function ArrowIcon({ direction }: { readonly direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d={direction === "right" ? "M5 12h14M13 6l6 6-6 6" : "M19 12H5m6 6-6-6 6-6"}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function PreRollExperience({
  afterCollection,
  afterStory,
  vaultCards,
}: {
  readonly afterCollection?: ReactNode;
  readonly afterStory?: ReactNode;
  readonly vaultCards?: Partial<Record<string, ReactNode>>;
}) {
  useLayoutEffect(() => {
    if (window.location.hash) return;

    const previousRestoration = window.history.scrollRestoration;
    const resetScroll = () => {
      if (!window.location.hash) window.scrollTo(0, 0);
    };

    window.history.scrollRestoration = "manual";
    resetScroll();
    const frame = window.requestAnimationFrame(resetScroll);
    window.addEventListener("pageshow", resetScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pageshow", resetScroll);
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  const tieredArtwork = PRE_ROLL_ARTWORKS.map((artwork) => ({
    artwork,
    placement: resolveCatalogTier({
      collection: artwork.collection,
      line: "pre-rolls",
      slug: artwork.id,
    }).entry,
  })).filter(({ placement }) => !placement.retired);

  return (
    <div className={styles.page}>
      <section aria-labelledby="prerolls-heading" className={styles.hero}>
        <div className={styles.heroAtmosphere} />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
              <Link href="/">Presidential</Link>
              <span aria-hidden="true">/</span>
              <span>Pre-Rolls</span>
            </nav>
            <h1 id="prerolls-heading">Pre-Rolls</h1>
            <p className={styles.heroLead}>Infused flower. Distinct flavor. Ready rolled.</p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="#collection">
                Explore the pre-rolls <ArrowIcon direction="right" />
              </a>
              <Link className={styles.textAction} href="/find-us">
                Find a retailer
              </Link>
            </div>
          </div>

          <div aria-label="Featured Presidential Moon Rock pre-rolls" className={styles.heroStack}>
            {heroArtwork.map((artwork, stackIndex) => {
              return (
                <div className={styles[`heroArt${stackIndex + 1}`]} key={artwork.id}>
                  <Link
                    aria-label={`View ${artwork.name} product page`}
                    className={styles.heroArtLink}
                    href={productDetailPath("/pre-rolls", artwork.id)}
                  >
                    <Image
                      alt={artwork.alt}
                      fill
                      priority={stackIndex === 2}
                      sizes={stackIndex === 2 ? "(max-width: 780px) 58vw, 29vw" : "(max-width: 780px) 32vw, 18vw"}
                      {...sanityImage(artwork.src)}
                    />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.heroFoot}>
          <span>Flower. Concentrate. A Presidential finish.</span>
          <a href="#collection">Explore the lineup <span aria-hidden="true">↓</span></a>
        </div>
      </section>

      <nav aria-label="Pre-roll page sections" className={styles.sectionNav}>
        <a href="#story">The collection</a>
        <a href="#collection">Explore pre-rolls</a>
        <a href="#find">Find a retailer</a>
      </nav>

      <section aria-labelledby="story-heading" className={styles.story} id="story">
        <div className={styles.storyHeading}>
          <p>The collection</p>
          <h2 id="story-heading">More in the roll.<br /><span>More to discover.</span></h2>
        </div>
        <div className={styles.storyCopy}>
          <p>
            Presidential pre-rolls, sold as infused Moon Rock pre-rolls, combine cannabis flower with concentrate in a finished 1g roll. From berry and tropical selections to fuel, pine, and savory strains, the lineup gives you a flavor to make your own. For a smaller format, <Link href="/mini-pre-rolls">Presidential Mini Pre-Rolls</Link> come as three 0.5g Moon Rock mini pre-rolls, 1.5g in total.
          </p>
          <p>
            Explore distillate recipes coated in kief, live-resin-and-diamond infusions, and the live-rosin selections in Rose Gold. Compare ingredients and flavor profiles, then ask your licensed retailer for the pre-roll you want.
          </p>
          <p>
            Where to buy: Presidential pre-rolls are sold through licensed retailers. Enter your zip code in the <Link href="/find-us">Presidential store finder</Link> to see the nearest licensed retailers carrying Presidential, ranked by distance.
          </p>
        </div>
        <div className={styles.featuredMosaic}>
          {featuredArtwork.map((artwork, index) => (
            <Link
              aria-label={`Explore ${artwork.name}, ${artwork.edition}`}
              className={styles[`featuredArt${index + 1}`]}
              href={productDetailPath("/pre-rolls", artwork.id)}
              key={artwork.id}
            >
              <Image alt="" fill sizes="(max-width: 780px) 50vw, 28vw" {...sanityImage(artwork.src)} />
              <span>{artwork.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {afterStory}

      <section aria-labelledby="art-index-heading" className={styles.artIndex} id="collection">
        <div className={styles.indexIntro}>
          <div>
            <p>A closer look</p>
            <h2 id="art-index-heading">Meet<br />the pre-rolls.</h2>
          </div>
          <p>
            These are Moon Rock Prerolls™, the moonrock pre-rolls built with Moon Rocks inside: infused moonrock prerolls of cannabis flower and concentrate. Presidential rolls come in two sizes: the 1g pre-rolls on this page and <Link href="/mini-pre-rolls">Mini Pre-Rolls</Link>, three 0.5g rolls per pack. Get to know the flavor, infusion, and ingredients in each Moon Rock pre-roll from the Presidential brand. Flavor and aroma vary by batch; your retailer can confirm the current selection. The 1g pre-rolls come in the Silver Flavor Series, the Gold Strain Series and the Rose Gold Connoisseur Series, and each pack prints its own build.
          </p>
        </div>
        {/* INLINKS-COPY-R13: /pre-rolls build H3 (facts from this page, the series pages and the learn guides). */}
        <div>
          <h3>What goes into a Moon Rock pre-roll?</h3>
          <p>
            A Moon Rock pre-roll is a 1g joint with the Moon Rock construction inside. It&apos;s cannabis flower carried through with
            concentrate. In the Silver Flavor Series, that concentrate is THC distillate, and the roll is finished with a kief coating.
            Gold builds on live resin, and Rose Gold builds on solventless live rosin. Each guide explains its extract:{" "}
            <Link href="/learn/what-is-thc-distillate">what is THC distillate</Link>,{" "}
            <Link href="/learn/what-is-live-resin">what is live resin</Link> and{" "}
            <Link href="/learn/what-is-live-rosin">what is live rosin</Link>.{" "}
            <Link href="/learn/flavor-science">How terpenes shape flavor</Link> covers why two strains in the same series smell and
            taste different.
          </p>
          <p>
            The THC numbers and batch details belong to the package and its test record, so check the label for the exact figures on
            the roll in your hand; <Link href="/presidential-thc">the Presidential THC guide to infusion and extracts</Link> explains each one. Flavor and aroma vary by batch, and your retailer can confirm the current lineup. For a smaller
            session, <Link href="/mini-pre-rolls">Mini Pre-Rolls</Link> come as three 0.5g rolls. Retailers set the price, so it
            varies from store to store. Use the <Link href="/find-us">store finder</Link> to see the nearest licensed retailers
            carrying Presidential.
          </p>
        </div>
        {/* SURFER-R20: /pre-rolls pack-reading H3 (facts from /moon-rocks/rose-gold and the pre-roll product cards). */}
        <div>
          <h3>How do you read a Moon Rock pre-roll pack?</h3>
          <p>
            The pack carries the silver crown crest with the PRESIDENTIAL banner, the strain type in script,
            the product name, and the format and weight. The pack also prints the build. Silver rolls read Flower · Distillate · Kief,
            Gold rolls read Flower · Live resin · Diamonds (some Gold builds add distillate), and Rose Gold rolls read Flower · Live
            rosin · Diamonds. Start with{" "}
            <Link href="/learn/what-is-live-rosin">what live rosin is</Link> or{" "}
            <Link href="/learn/what-is-thc-distillate">what THC distillate is</Link> to know what each build means, and compare{" "}
            <Link href="/mini-pre-rolls">Presidential mini pre-rolls</Link> for a smaller format. Collaboration releases carry a
            second name on the front, such as Rove or Nature&apos;s Chemistry.
          </p>
        </div>
        {/* INLINKS-COPY-R20: /pre-rolls recipe H3, trimmed to lines that don't repeat the Surfer R20 pack-reading H3. */}
        <div>
          <h3>Choosing a pre-roll by its recipe</h3>
          <p>
            Each Moon Rock pre-roll is 1g of flower and concentrate, and the recipe tells you what kind of concentrate it uses. For the
            live-resin-and-diamond infusions, read{" "}
            <Link href="/learn/what-is-live-resin">what live resin is</Link>, then see how each recipe is dressed in the{" "}
            <Link href="/presidential-art/pre-rolls">pre-roll package art</Link>.
          </p>
        </div>
        {/* INLINKS-COPY-R34: /pre-rolls extract and retail-buyer H3s (liquid diamonds link dropped: that extract is the vape side, not the pre-roll build). */}
        <div>
          <h3>The extract behind each pre-roll series</h3>
          <p>
            Each series is defined by its concentrate: distillate for Silver, live resin for Gold and live rosin for Rose Gold. Read{" "}
            <Link href="/learn/different-extracts-need-different-heat">why different extracts need different heat</Link> before you
            choose between a Silver, Gold or Rose Gold roll.
          </p>
        </div>
        <div>
          <h3>Pre-rolls for retail buyers</h3>
          <p>
            Stores that want to carry Moon Rock pre-rolls can start with <Link href="/wholesale">Presidential wholesale</Link> or{" "}
            <Link href="/partners">the Presidential partners page</Link>.
          </p>
        </div>
        {/* INLINKS-COPY-R38: /pre-rolls Silver and format H3s (distillate guide already linked twice on this page, so that link is dropped; reused anchors reworded). */}
        <div>
          <h3>Silver pre-rolls and THC distillate</h3>
          <p>
            Silver is the distillate series, named by fruit. Blue Raspberry, Grape, Peach Mango, Pineapple and Strawberry pre-rolls
            carry that series.
          </p>
        </div>
        <div>
          <h3>The same infused idea in a hemp wrap or a cartridge</h3>
          <p>
            For a smaller hemp-wrap roll, see <Link href="/mini-blunts">infused mini blunt packs</Link> and the{" "}
            <Link href="/presidential-art/mini-blunts">pack art for the mini blunts</Link>. For an extract in cartridge form, browse
            the <Link href="/vapes">vape cartridge lineup</Link>.
          </p>
        </div>
        {/* INLINKS-COPY-R42: /pre-rolls series and state H3s (copy as written). */}
        <div>
          <h3>Pre-roll names beside their Moon Rocks series</h3>
          <p>
            Pre-roll names follow the same series as the jars. Compare{" "}
            <Link href="/moon-rocks/silver">the Silver Moon Rocks series</Link>,{" "}
            <Link href="/moon-rocks/gold">the Gold Moon Rocks series</Link> and{" "}
            <Link href="/moon-rocks/rose-gold">the Rose Gold Moon Rocks series</Link>, then read each pre-roll pack for its own
            build line.
          </p>
        </div>
        <div>
          <h3>Looking for pre-rolls by state</h3>
          <p>
            Presidential store listings are sorted by state, including <Link href="/find-us/az">Arizona store listings</Link>,{" "}
            <Link href="/find-us/nv">Nevada store listings</Link> and <Link href="/find-us/ok">Oklahoma store listings</Link>.
            Questions can go through <Link href="/contact">the Presidential team&apos;s contact page</Link>.
          </p>
        </div>
        <div className={styles.tierSections}>
          {TIER_SECTION_ORDER.map((section) => {
            const entries = tieredArtwork.filter(({ placement }) => placement.section === section);
            if (entries.length === 0 && !vaultCards?.[section]) return null;
            return (
              <section className={styles.tierSection} key={section}>
                <TierSectionHeader descriptionSuffix={section === "collabs" ? " On the pre-roll menu, those partners include Rove, Nature’s Chemistry, Trendi, and VLADTV." : undefined} section={section} />
                <div className={`${styles.artGrid} ${styles.tierGrid}`}>
                  {entries.map(({ artwork, placement }) => (
                    <article className={artwork.shape === "square" ? styles.artCardSquare : styles.artCardPortrait} key={artwork.id}>
                      <Link aria-label={`View ${artwork.name} product page`} className={styles.artCardImage} href={productDetailPath("/pre-rolls", artwork.id)}>
                        {section === "collabs" ? <TierBadge tier={placement.tierBadge} /> : null}
                        <Image alt={artwork.alt} fill sizes="(max-width: 700px) 46vw, (max-width: 1100px) 44vw, 29vw" {...sanityImage(artwork.src)} />
                      </Link>
                      <div className={styles.artCardCopy}>
                        <p>{artwork.collection}</p>
                        <h3><ProductNameLink name={artwork.name} format="Pre-roll" className="text-inherit no-underline">{placement.displayName || artwork.name}</ProductNameLink></h3>
                        {placement.collabPartner ? <strong className={styles.collabPartner}>with {placement.collabPartner}</strong> : null}
                        <span>{artwork.edition}</span>
                        <p><ProductMentions format="Pre-roll">{artwork.description}</ProductMentions></p>
                      </div>
                    </article>
                  ))}
                  {vaultCards?.[section]}
                </div>
              </section>
            );
          })}
          {tieredArtwork.some(({ placement }) => placement.section === "more") ? (
            <section className={styles.tierSection}>
              <header className={styles.moreHeader}><h2>More from Presidential</h2></header>
              <div className={`${styles.artGrid} ${styles.tierGrid}`}>
                {tieredArtwork.filter(({ placement }) => placement.section === "more").map(({ artwork, placement }) => (
                  <article className={artwork.shape === "square" ? styles.artCardSquare : styles.artCardPortrait} key={artwork.id}>
                    <Link aria-label={`View ${artwork.name} product page`} className={styles.artCardImage} href={productDetailPath("/pre-rolls", artwork.id)}><Image alt={artwork.alt} fill sizes="(max-width: 700px) 46vw, (max-width: 1100px) 44vw, 29vw" {...sanityImage(artwork.src)} /></Link>
                    <div className={styles.artCardCopy}><p>{artwork.collection}</p><h3><ProductNameLink name={artwork.name} format="Pre-roll" className="text-inherit no-underline">{placement.displayName || artwork.name}</ProductNameLink></h3><span>{artwork.edition}</span><p><ProductMentions format="Pre-roll">{artwork.description}</ProductMentions></p></div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>

      {afterCollection}

      <section aria-labelledby="find-heading" className={styles.find} id="find">
        <div>
          <p>Find your Presidential</p>
          <h2 id="find-heading">Your next stop.<br /><span>The right retailer.</span></h2>
          <p className={styles.findCopy}>Explore the official retailer locator, then confirm the store&apos;s current Presidential selection. Availability varies by licensed retailer. For adults 21 or older where cannabis is legal.</p>
          <p className={styles.findCopy}>Every location in the <Link href="/find-us">store finder</Link> is an official, licensed Presidential retailer. Stock shifts by store and by day, so check with the store for the pre-roll you want before you go.</p>
          <Link className={styles.primaryAction} href="/find-us">Find a licensed retailer <ArrowIcon direction="right" /></Link>
          <small>For adults 21+ where legal.</small>
        </div>
        <div className={styles.findMark}>
          <span>Find your<br />Presidential.</span>
          <Image alt="Presidential logo" height={291} src="/media/brand/presidential-crest-master.png" width={376} />
        </div>
      </section>

    </div>
  );
}
