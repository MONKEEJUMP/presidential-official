"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect } from "react";

import { BLUNT_ARTWORKS } from "@/content/blunts-catalog";
import { productDetailPath } from "@/lib/products/product-paths";

import shared from "@/components/presidential/prerolls/preroll-experience.module.css";
import styles from "./blunts-experience.module.css";

const heroProductIds = ["blue-dream", "papaya-punch"] as const;
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
            <div className={styles.heroImage}>
              <Image
                alt="Presidential Blue Dream and Papaya Punch Moon Rock blunt packages with a tobacco-free blunt"
                fill
                priority
                sizes="(max-width: 900px) 100vw, min(58vw, 820px)"
                src="/media/blunts/hero-studio-v2.webp"
              />
            </div>
            <figcaption className={styles.productRail}>
              {heroProductIds.map((id, position) => {
                const artwork = BLUNT_ARTWORKS.find((candidate) => candidate.id === id);
                if (!artwork) return null;
                return (
                  <Link href={productDetailPath("/blunts", artwork.id)} key={artwork.id}>
                    <span>{String(position + 1).padStart(2, "0")}</span>
                    <strong>{artwork.name}</strong>
                    <ArrowIcon direction="right" />
                  </Link>
                );
              })}
            </figcaption>
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
        <div className={shared.artGrid}>
          {BLUNT_ARTWORKS.map((artwork, index) => (
            <article className={artwork.shape === "square" ? shared.artCardSquare : shared.artCardPortrait} key={artwork.id}>
              <Link aria-label={`View ${artwork.name} product page`} className={shared.artCardImage} href={productDetailPath("/blunts", artwork.id)}><Image alt={artwork.alt} fill sizes="(max-width: 700px) 92vw, (max-width: 1100px) 44vw, 29vw" src={artwork.src} /><span>{String(index + 1).padStart(2, "0")}</span></Link>
              <div className={shared.artCardCopy}><p>Presidential Moon Rock Blunts</p><h3>{artwork.name}</h3><span>{artwork.edition}</span><p>{artwork.description}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="blunts-find-heading" className={shared.find} id="find">
        <div><p>Find your Presidential</p><h2 id="blunts-find-heading">Your next stop.<br /><span>The right retailer.</span></h2><p className={shared.findCopy}>Explore the official retailer locator, then check the store&apos;s current Presidential selection. Availability varies by licensed retailer.</p><Link className={shared.primaryAction} href="/find-us">Find a licensed retailer <ArrowIcon direction="right" /></Link><small>For adults 21+ where legal.</small></div>
        <div className={shared.findMark}><span>Find your<br />Presidential.</span><Image alt="Presidential logo" height={291} src="/media/brand/presidential-crest-master.png" width={376} /></div>
      </section>

    </div>
  );
}
