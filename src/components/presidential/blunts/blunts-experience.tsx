"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect } from "react";

import { BLUNT_ARTWORKS } from "@/content/blunts-catalog";
import { productDetailPath } from "@/lib/products/product-paths";
import { TIER_SECTION_ORDER, resolveCatalogTier } from "@/lib/catalog/tier-map";

import { TierBadge, TierSectionHeader } from "@/components/presidential/catalog/tier-section";
import { SiteVideo } from "@/components/presidential/media/site-video";
import shared from "@/components/presidential/prerolls/preroll-experience.module.css";
import styles from "./blunts-experience.module.css";

const featuredIndexes = [8, 0, 3, 9, 21, 25] as const;

function ArrowIcon({ direction }: { readonly direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d={direction === "right" ? "M5 12h14M13 6l6 6-6 6" : "M19 12H5m6 6-6-6 6-6"} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export function BluntsExperience() {
  useLayoutEffect(() => {
    if (window.location.hash) return;
    const previousRestoration = window.history.scrollRestoration;
    const resetScroll = () => { if (!window.location.hash) window.scrollTo(0, 0); };
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

  const tieredArtwork = BLUNT_ARTWORKS.map((artwork) => ({
    artwork,
    placement: resolveCatalogTier({ line: "blunts", slug: artwork.id }).entry,
  })).filter(({ placement }) => !placement.retired);

  return (
    <div className={shared.page}>
      <section aria-labelledby="blunts-heading" className={styles.hero}>
        <div aria-hidden="true" className={styles.heroAtmosphere} />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
              <Link href="/">Presidential</Link><span aria-hidden="true">/</span><span>Blunts</span>
            </nav>
            <h1 id="blunts-heading">Blunts</h1>
            <p className={styles.heroLead}><span>Infused flower.</span><span>Full flavor.</span></p>
            <p className={styles.heroDetail}>One 1.5g Moon Rock blunt, rolled in a tobacco-free wrap.</p>
            <div className={styles.heroActions}>
              <a className={shared.primaryAction} href="#collection">Explore the blunts <ArrowIcon direction="right" /></a>
              <Link className={shared.textAction} href="/find-us">Find a retailer</Link>
            </div>
          </div>
          <figure className={styles.heroVisual}>
            <div className={styles.heroVideo}>
              <SiteVideo
                className={styles.heroVideoElement}
                label="Presidential Moon Rock Blunt product film"
                preload="metadata"
                slug="moon-rock-blunt-hero"
              />
            </div>
            <figcaption className={styles.filmCaption}><span>Presidential Moon Rock Blunts</span><span>30-second product film</span></figcaption>
          </figure>
        </div>
        <div className={styles.heroFoot}><span>Flower. Concentrate. A Presidential finish.</span><a href="#collection">{BLUNT_ARTWORKS.length} selections <span aria-hidden="true">↓</span></a></div>
      </section>

      <nav aria-label="Blunts page sections" className={shared.sectionNav}>
        <a href="#story">The collection</a><a href="#collection">Explore blunts</a><a href="#find">Find a retailer</a>
      </nav>

      <section aria-labelledby="blunts-story-heading" className={shared.story} id="story">
        <div className={shared.storyHeading}><p>The collection</p><h2 id="blunts-story-heading">Made for flavor.<br /><span>Built with flower.</span></h2></div>
        <div className={shared.storyCopy}>
          <p>A Presidential Moon Rock blunt brings cannabis flower and concentrate together in a tobacco-free wrap. Explore fruit flavors, classic gas and pine, and cultivation collaborations—each with its own recipe and character.</p>
          <p>Choose the infusion that speaks to you: distillate and kief, live resin and diamonds, or a live-rosin selection. Each single blunt contains 1.5g. Find your favorite through a licensed retailer.</p>
        </div>
        <div className={shared.featuredMosaic}>
          {featuredIndexes.map((index, position) => {
            const artwork = BLUNT_ARTWORKS[index];
            return (
              <Link aria-label={`View ${artwork.name} product page`} className={shared[`featuredArt${position + 1}`]} href={productDetailPath("/blunts", artwork.id)} key={artwork.id}>
                <Image alt="" fill sizes="(max-width: 780px) 50vw, 28vw" src={artwork.src} /><span>{artwork.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="blunts-art-index-heading" className={shared.artIndex} id="collection">
        <div className={shared.indexIntro}><div><p>A closer look</p><h2 id="blunts-art-index-heading">Meet<br />the blunts.</h2></div><p>Compare the flavor, infusion, and ingredients in each Moon Rock blunt. Flavor and aroma vary by batch; your retailer can confirm the current selection.</p></div>
        <div className={shared.tierSections}>
          {TIER_SECTION_ORDER.map((section) => {
            const entries = tieredArtwork.filter(({ placement }) => placement.section === section);
            if (entries.length === 0) return null;
            return (
              <section className={shared.tierSection} key={section}>
                <TierSectionHeader section={section} />
                <div className={`${shared.artGrid} ${shared.tierGrid}`}>
                  {entries.map(({ artwork, placement }) => (
                    <article className={artwork.shape === "square" ? shared.artCardSquare : shared.artCardPortrait} key={artwork.id}>
                      <Link aria-label={`View ${artwork.name} product page`} className={shared.artCardImage} href={productDetailPath("/blunts", artwork.id)}>
                        {section === "collabs" ? <TierBadge tier={placement.tierBadge} /> : null}
                        <Image alt={artwork.alt} fill sizes="(max-width: 700px) 46vw, (max-width: 1100px) 44vw, 29vw" src={artwork.src} />
                        <span>{String(BLUNT_ARTWORKS.findIndex((item) => item.id === artwork.id) + 1).padStart(2, "0")}</span>
                      </Link>
                      <div className={shared.artCardCopy}>
                        <p>Presidential Moon Rock Blunts</p>
                        <h3>{placement.displayName || artwork.name}</h3>
                        {placement.collabPartner ? <strong className={shared.collabPartner}>with {placement.collabPartner}</strong> : null}
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
            <section className={shared.tierSection}>
              <header className={shared.moreHeader}><h2>More from Presidential</h2></header>
              <div className={`${shared.artGrid} ${shared.tierGrid}`}>
                {tieredArtwork.filter(({ placement }) => placement.section === "more").map(({ artwork, placement }) => (
                  <article className={artwork.shape === "square" ? shared.artCardSquare : shared.artCardPortrait} key={artwork.id}>
                    <Link aria-label={`View ${artwork.name} product page`} className={shared.artCardImage} href={productDetailPath("/blunts", artwork.id)}><Image alt={artwork.alt} fill sizes="(max-width: 700px) 46vw, (max-width: 1100px) 44vw, 29vw" src={artwork.src} /></Link>
                    <div className={shared.artCardCopy}><p>Presidential Moon Rock Blunts</p><h3>{placement.displayName || artwork.name}</h3><span>{artwork.edition}</span><p>{artwork.description}</p></div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="blunts-find-heading" className={shared.find} id="find">
        <div><p>Find your Presidential</p><h2 id="blunts-find-heading">Your next stop.<br /><span>The right retailer.</span></h2><p className={shared.findCopy}>Explore the official retailer locator, then check the store&apos;s current Presidential selection. Availability varies by licensed retailer.</p><Link className={shared.primaryAction} href="/find-us">Find a licensed retailer <ArrowIcon direction="right" /></Link><small>For adults 21+ where legal.</small></div>
        <div className={shared.findMark}><span>Find your<br />Presidential.</span><Image alt="Presidential logo" height={291} src="/media/brand/presidential-crest-master.png" width={376} /></div>
      </section>

    </div>
  );
}
