"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { BLUNT_ARTWORKS } from "@/content/blunts-catalog";

import shared from "@/components/presidential/prerolls/preroll-experience.module.css";
import styles from "./blunts-experience.module.css";

const heroIndexes = [18, 25, 8, 16, 0, 3, 21, 26] as const;
const featuredIndexes = [8, 0, 3, 9, 21, 25] as const;

function ArrowIcon({ direction }: { readonly direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d={direction === "right" ? "M5 12h14M13 6l6 6-6 6" : "M19 12H5m6 6-6-6 6-6"} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export function BluntsExperience() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const selected = BLUNT_ARTWORKS[selectedIndex];

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

  const selectRelative = (offset: number) => {
    setSelectedIndex((current) => (current + offset + BLUNT_ARTWORKS.length) % BLUNT_ARTWORKS.length);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (dialogRef.current?.open) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === "ArrowLeft") setSelectedIndex((current) => (current - 1 + BLUNT_ARTWORKS.length) % BLUNT_ARTWORKS.length);
      if (event.key === "ArrowRight") setSelectedIndex((current) => (current + 1) % BLUNT_ARTWORKS.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openInExplorer = (index: number) => {
    setSelectedIndex(index);
    document.querySelector("#collection")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={shared.page}>
      <section aria-labelledby="blunts-heading" className={`${shared.hero} ${styles.hero}`}>
        <div className={shared.heroAtmosphere} />
        <div className={`${shared.heroInner} ${styles.heroInner}`}>
          <div className={`${shared.heroCopy} ${styles.heroCopy}`}>
            <nav aria-label="Breadcrumb" className={shared.breadcrumbs}>
              <Link href="/">Presidential</Link><span aria-hidden="true">/</span><span>Blunts</span>
            </nav>
            <h1 id="blunts-heading">Blunts</h1>
            <p className={shared.heroLead}>The complete Presidential blunt art collection.</p>
            <div className={shared.heroActions}>
              <a className={shared.primaryAction} href="#collection">Explore all 36 graphics <ArrowIcon direction="right" /></a>
              <Link className={shared.textAction} href="/find-us">Find a retailer</Link>
            </div>
          </div>
          <div aria-label="Featured Presidential blunt graphics" className={styles.tunnel}>
            {heroIndexes.map((index, panelIndex) => {
              const artwork = BLUNT_ARTWORKS[index];
              return (
                <div className={styles[`tunnelPanel${panelIndex + 1}`]} key={artwork.id}>
                  <Image alt={artwork.alt} fill priority={panelIndex < 6} sizes="(max-width: 780px) 38vw, 20vw" src={artwork.src} />
                </div>
              );
            })}
          </div>
        </div>
        <div className={shared.heroFoot}><span>One gallery. Every perspective.</span><a href="#collection">Explore the graphics <span aria-hidden="true">↓</span></a></div>
      </section>

      <nav aria-label="Blunts page sections" className={shared.sectionNav}>
        <a href="#story">The collection</a><a href="#collection">Explore all 36</a><a href="#art-index">Read the art</a><a href="#find">Find a retailer</a>
      </nav>

      <section aria-labelledby="blunts-story-heading" className={shared.story} id="story">
        <div className={shared.storyHeading}><p>The collection</p><h2 id="blunts-story-heading">Every graphic.<br /><span>Its own world.</span></h2></div>
        <div className={shared.storyCopy}>
          <p>Presidential blunt artwork moves through fruit, city skylines, music, metallic sculpture, tropical scenes, and deep space. The package stays central while every surrounding world changes.</p>
          <p>Forty-two supplied files resolve to 36 distinct product graphics after duplicate treatments are removed. Availability varies by licensed retailer.</p>
        </div>
        <div className={shared.featuredMosaic}>
          {featuredIndexes.map((index, position) => {
            const artwork = BLUNT_ARTWORKS[index];
            return (
              <button aria-label={`Explore ${artwork.name}, ${artwork.edition}`} className={shared[`featuredArt${position + 1}`]} key={artwork.id} onClick={() => openInExplorer(index)} type="button">
                <Image alt="" fill sizes="(max-width: 780px) 50vw, 28vw" src={artwork.src} /><span>{artwork.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="blunts-collection-heading" className={shared.collection} id="collection">
        <div className={shared.collectionTitleRow}><h2 id="blunts-collection-heading">The complete <span>collection</span></h2><p>36 product artworks.<br />One visual archive.</p></div>
        <div className={shared.explorer}>
          <div className={shared.selectedFrame}><Image alt={selected.alt} fill key={selected.src} priority sizes="(max-width: 900px) 92vw, 44vw" src={selected.src} /></div>
          <div aria-live="polite" className={shared.selectedCopy}>
            <div className={shared.counterRow}><span>Artwork <strong>{String(selectedIndex + 1).padStart(2, "0")}</strong> of 36</span><div className={shared.arrowControls}><button aria-label="Previous artwork" onClick={() => selectRelative(-1)} type="button"><ArrowIcon direction="left" /></button><button aria-label="Next artwork" onClick={() => selectRelative(1)} type="button"><ArrowIcon direction="right" /></button></div></div>
            <p className={shared.collectionName}>Presidential Moon Rock Blunts</p><h3>{selected.name}</h3><p className={shared.edition}>{selected.edition}</p><div className={shared.goldRule} /><p className={shared.description}>{selected.description}</p>
            <button className={shared.fullSizeButton} onClick={() => dialogRef.current?.showModal()} type="button">View full size <ArrowIcon direction="right" /></button>
          </div>
        </div>
        <div aria-label="Choose a blunt artwork" className={shared.filmstrip} role="list">
          {BLUNT_ARTWORKS.map((artwork, index) => (
            <button aria-current={index === selectedIndex ? "true" : undefined} aria-label={`${String(index + 1).padStart(2, "0")}: ${artwork.name}, ${artwork.edition}`} className={index === selectedIndex ? shared.thumbnailSelected : shared.thumbnail} key={artwork.id} onClick={() => setSelectedIndex(index)} role="listitem" type="button"><span className={shared.thumbnailImage}><Image alt="" fill sizes="92px" src={artwork.src} /></span><span>{String(index + 1).padStart(2, "0")}</span></button>
          ))}
        </div>
      </section>

      <section aria-labelledby="blunts-art-index-heading" className={shared.artIndex} id="art-index">
        <div className={shared.indexIntro}><div><p>A closer look</p><h2 id="blunts-art-index-heading">Read<br />the art.</h2></div><p>Every distinct product graphic appears below with its own visual description. Select any artwork to bring it into the full collection explorer.</p></div>
        <div className={shared.artGrid}>
          {BLUNT_ARTWORKS.map((artwork, index) => (
            <article className={artwork.shape === "square" ? shared.artCardSquare : shared.artCardPortrait} key={artwork.id}>
              <button aria-label={`Open ${artwork.name} in the collection explorer`} className={shared.artCardImage} onClick={() => openInExplorer(index)} type="button"><Image alt={artwork.alt} fill sizes="(max-width: 700px) 92vw, (max-width: 1100px) 44vw, 29vw" src={artwork.src} /><span>{String(index + 1).padStart(2, "0")}</span></button>
              <div className={shared.artCardCopy}><p>Presidential Moon Rock Blunts</p><h3>{artwork.name}</h3><span>{artwork.edition}</span><p>{artwork.description}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="blunts-find-heading" className={shared.find} id="find">
        <div><p>Find your Presidential</p><h2 id="blunts-find-heading">Your next stop.<br /><span>The right retailer.</span></h2><p className={shared.findCopy}>Explore the official retailer locator, then check the store&apos;s current Presidential selection. Availability varies by licensed retailer.</p><Link className={shared.primaryAction} href="/find-us">Find a licensed retailer <ArrowIcon direction="right" /></Link><small>For adults 21+ where legal.</small></div>
        <div className={shared.findMark}><span>Find your<br />Presidential.</span><Image alt="Presidential logo" height={291} src="/media/brand/presidential-crest-master.png" width={376} /></div>
      </section>

      <dialog className={shared.dialog} ref={dialogRef}><button aria-label="Close full-size artwork" className={shared.dialogClose} onClick={() => dialogRef.current?.close()} type="button">Close</button><div className={shared.dialogImage}><Image alt={selected.alt} fill sizes="92vw" src={selected.src} /></div><p>{selected.name} · {selected.edition}</p></dialog>
    </div>
  );
}
