"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect } from "react";

import {
  FEATURED_PRE_ROLL_ARTWORK_IDS,
  PRE_ROLL_ARTWORKS,
} from "@/lib/prerolls/catalog";
import { productDetailPath } from "@/lib/products/product-paths";
import { TIER_SECTION_ORDER, resolveCatalogTier } from "@/lib/catalog/tier-map";

import { TierBadge, TierSectionHeader } from "@/components/presidential/catalog/tier-section";

import styles from "./preroll-experience.module.css";

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

export function PreRollExperience() {
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
                      src={artwork.src}
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
            Presidential Moon Rock pre-rolls combine cannabis flower with concentrate in a finished 1g roll. From berry and tropical selections to fuel, pine, and savory strains, the lineup gives you a flavor to make your own.
          </p>
          <p>
            Explore distillate-and-kief recipes, live-resin-and-diamond infusions, and the live-rosin selections in Rose Gold. Compare ingredients and flavor profiles, then ask your licensed retailer for the pre-roll you want.
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
              <Image alt="" fill sizes="(max-width: 780px) 50vw, 28vw" src={artwork.src} />
              <span>{artwork.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="art-index-heading" className={styles.artIndex} id="collection">
        <div className={styles.indexIntro}>
          <div>
            <p>A closer look</p>
            <h2 id="art-index-heading">Meet<br />the pre-rolls.</h2>
          </div>
          <p>
            Get to know the flavor, infusion, and ingredients in each Moon Rock pre-roll. Flavor and aroma vary by batch; your retailer can confirm the current selection.
          </p>
        </div>
        <div className={styles.tierSections}>
          {TIER_SECTION_ORDER.map((section) => {
            const entries = tieredArtwork.filter(({ placement }) => placement.section === section);
            if (entries.length === 0) return null;
            return (
              <section className={styles.tierSection} key={section}>
                <TierSectionHeader section={section} />
                <div className={`${styles.artGrid} ${styles.tierGrid}`}>
                  {entries.map(({ artwork, placement }) => (
                    <article className={artwork.shape === "square" ? styles.artCardSquare : styles.artCardPortrait} key={artwork.id}>
                      <Link aria-label={`View ${artwork.name} product page`} className={styles.artCardImage} href={productDetailPath("/pre-rolls", artwork.id)}>
                        {section === "collabs" ? <TierBadge tier={placement.tierBadge} /> : null}
                        <Image alt={artwork.alt} fill sizes="(max-width: 700px) 46vw, (max-width: 1100px) 44vw, 29vw" src={artwork.src} />
                      </Link>
                      <div className={styles.artCardCopy}>
                        <p>{artwork.collection}</p>
                        <h3>{placement.displayName || artwork.name}</h3>
                        {placement.collabPartner ? <strong className={styles.collabPartner}>with {placement.collabPartner}</strong> : null}
                        <span>{artwork.edition}</span>
                        <p>{artwork.description}</p>
                      </div>
                    </article>
                  ))}
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
                    <Link aria-label={`View ${artwork.name} product page`} className={styles.artCardImage} href={productDetailPath("/pre-rolls", artwork.id)}><Image alt={artwork.alt} fill sizes="(max-width: 700px) 46vw, (max-width: 1100px) 44vw, 29vw" src={artwork.src} /></Link>
                    <div className={styles.artCardCopy}><p>{artwork.collection}</p><h3>{placement.displayName || artwork.name}</h3><span>{artwork.edition}</span><p>{artwork.description}</p></div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="find-heading" className={styles.find} id="find">
        <div>
          <p>Find your Presidential</p>
          <h2 id="find-heading">Your next stop.<br /><span>The right retailer.</span></h2>
          <p className={styles.findCopy}>Explore the official retailer locator, then check the store&apos;s current Presidential selection. Availability varies by licensed retailer.</p>
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
