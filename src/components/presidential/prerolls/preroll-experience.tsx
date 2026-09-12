"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  FEATURED_PRE_ROLL_ARTWORK_IDS,
  PRE_ROLL_ARTWORKS,
} from "@/lib/prerolls/catalog";

import styles from "./preroll-experience.module.css";

const featuredArtwork = FEATURED_PRE_ROLL_ARTWORK_IDS.map((id) => {
  const artwork = PRE_ROLL_ARTWORKS.find((candidate) => candidate.id === id);
  if (!artwork) throw new Error(`Missing featured pre-roll artwork: ${id}`);
  return artwork;
});

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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const selected = PRE_ROLL_ARTWORKS[selectedIndex];

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

  const selectRelative = (offset: number) => {
    setSelectedIndex((current) =>
      (current + offset + PRE_ROLL_ARTWORKS.length) % PRE_ROLL_ARTWORKS.length,
    );
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (dialogRef.current?.open) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      if (event.key === "ArrowLeft") selectRelative(-1);
      if (event.key === "ArrowRight") selectRelative(1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
            {[24, 18, 0, 2, 23].map((index, stackIndex) => {
              const artwork = PRE_ROLL_ARTWORKS[index];
              return (
                <div className={styles[`heroArt${stackIndex + 1}`]} key={artwork.id}>
                  <Image
                    alt={artwork.alt}
                    fill
                    priority={stackIndex === 2}
                    sizes={stackIndex === 2 ? "(max-width: 780px) 58vw, 29vw" : "(max-width: 780px) 32vw, 18vw"}
                    src={artwork.src}
                  />
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
        <a href="#art-index">Product details</a>
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
            <button
              aria-label={`Explore ${artwork.name}, ${artwork.edition}`}
              className={styles[`featuredArt${index + 1}`]}
              key={artwork.id}
              onClick={() => {
                setSelectedIndex(PRE_ROLL_ARTWORKS.findIndex((candidate) => candidate.id === artwork.id));
                document.querySelector("#collection")?.scrollIntoView({ behavior: "smooth" });
              }}
              type="button"
            >
              <Image alt="" fill sizes="(max-width: 780px) 50vw, 28vw" src={artwork.src} />
              <span>{artwork.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="collection-heading" className={styles.collection} id="collection">
        <div className={styles.collectionTitleRow}>
          <h2 id="collection-heading">The complete <span>collection</span></h2>
          <p>Explore the recipes.<br />Find your flavor.</p>
        </div>

        <div className={styles.explorer}>
          <div className={styles.selectedFrame}>
            <Image
              alt={selected.alt}
              fill
              key={selected.src}
              priority
              sizes="(max-width: 900px) 92vw, 44vw"
              src={selected.src}
            />
          </div>
          <div aria-live="polite" className={styles.selectedCopy}>
            <div className={styles.counterRow}>
              <span>Selection <strong>{String(selectedIndex + 1).padStart(2, "0")}</strong> of 27</span>
              <div className={styles.arrowControls}>
                <button aria-label="Previous product" onClick={() => selectRelative(-1)} type="button"><ArrowIcon direction="left" /></button>
                <button aria-label="Next product" onClick={() => selectRelative(1)} type="button"><ArrowIcon direction="right" /></button>
              </div>
            </div>
            <p className={styles.collectionName}>{selected.collection}</p>
            <h3>{selected.name}</h3>
            <p className={styles.edition}>{selected.edition}</p>
            <div className={styles.goldRule} />
            <p className={styles.description}>{selected.description}</p>
            <button className={styles.fullSizeButton} onClick={() => dialogRef.current?.showModal()} type="button">
              View product <ArrowIcon direction="right" />
            </button>
          </div>
        </div>

        <div aria-label="Choose a pre-roll" className={styles.filmstrip} role="list">
          {PRE_ROLL_ARTWORKS.map((artwork, index) => (
            <button
              aria-current={index === selectedIndex ? "true" : undefined}
              aria-label={`${String(index + 1).padStart(2, "0")}: ${artwork.name}, ${artwork.edition}`}
              className={index === selectedIndex ? styles.thumbnailSelected : styles.thumbnail}
              key={artwork.id}
              onClick={() => setSelectedIndex(index)}
              role="listitem"
              type="button"
            >
              <span className={styles.thumbnailImage}>
                <Image alt="" fill sizes="92px" src={artwork.src} />
              </span>
              <span>{String(index + 1).padStart(2, "0")}</span>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="art-index-heading" className={styles.artIndex} id="art-index">
        <div className={styles.indexIntro}>
          <div>
            <p>A closer look</p>
            <h2 id="art-index-heading">Meet<br />the pre-rolls.</h2>
          </div>
          <p>
            Get to know the flavor, infusion, and ingredients in each Moon Rock pre-roll. Flavor and aroma vary by batch; your retailer can confirm the current selection.
          </p>
        </div>
        <div className={styles.artGrid}>
          {PRE_ROLL_ARTWORKS.map((artwork, index) => (
            <article className={artwork.shape === "square" ? styles.artCardSquare : styles.artCardPortrait} key={artwork.id}>
              <button
                aria-label={`Open ${artwork.name} in the collection explorer`}
                className={styles.artCardImage}
                onClick={() => {
                  setSelectedIndex(index);
                  document.querySelector("#collection")?.scrollIntoView({ behavior: "smooth" });
                }}
                type="button"
              >
                <Image alt={artwork.alt} fill sizes="(max-width: 700px) 92vw, (max-width: 1100px) 44vw, 29vw" src={artwork.src} />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </button>
              <div className={styles.artCardCopy}>
                <p>{artwork.collection}</p>
                <h3>{artwork.name}</h3>
                <span>{artwork.edition}</span>
                <p>{artwork.description}</p>
              </div>
            </article>
          ))}
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

      <dialog className={styles.dialog} ref={dialogRef}>
        <button aria-label="Close product image" className={styles.dialogClose} onClick={() => dialogRef.current?.close()} type="button">Close</button>
        <div className={styles.dialogImage}>
          <Image alt={selected.alt} fill sizes="92vw" src={selected.src} />
        </div>
        <p>{selected.name} · {selected.edition}</p>
      </dialog>
    </div>
  );
}
