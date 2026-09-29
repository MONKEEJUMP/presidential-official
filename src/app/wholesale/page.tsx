import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PageFrame } from "@/components/presidential/layout/page-frame";
import { PresidentialSrosSection } from "@/components/sros/presidential-sros-section";
import { buildStaticRouteMetadata, getStaticRouteRecord } from "@/lib/seo/route-page";
import { buildRouteShellJsonLd, JsonLd } from "@/lib/seo/schema";
import { getWholesaleDestination, WHOLESALE_MARKETS } from "@/lib/wholesale/market-ordering";

import styles from "./wholesale.module.css";
import { SalesEmail } from "@/components/contact/sales-email";

const ROUTE_PATH = "/wholesale" as const;
const SALES_EMAIL = "sales@presidentialmoonrocks.com";

export function generateMetadata(): Metadata {
  return buildStaticRouteMetadata(ROUTE_PATH);
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export default function WholesalePage() {
  const route = getStaticRouteRecord(ROUTE_PATH);
  const jsonLdEntries = buildRouteShellJsonLd(route);

  return (
    <>
      {jsonLdEntries.map((entry) => <JsonLd data={entry.data} key={`${route.id}-${entry.id}`} />)}
      <PageFrame className={styles.page}>
        <main>
          <section className={styles.hero} aria-labelledby="wholesale-heading">
            <div aria-hidden="true" className={styles.heroMural}>
              <div className={`${styles.heroMuralLayer} ${styles.heroMuralVape}`}><Image alt="" fill priority sizes="(max-width: 680px) 62vw, 45vw" src="/media/contact/collage/vape-teal-lro.webp" /></div>
              <div className={`${styles.heroMuralLayer} ${styles.heroMuralGalactic}`}><Image alt="" fill priority sizes="24vw" src="/media/contact/collage/preroll-galactic-gas.webp" /></div>
              <div className={`${styles.heroMuralLayer} ${styles.heroMuralBlueDream}`}><Image alt="" fill priority sizes="(max-width: 680px) 60vw, 25vw" src="/media/contact/collage/blunt-blue-dream.webp" /></div>
              <div className={`${styles.heroMuralLayer} ${styles.heroMuralMain}`}><Image alt="" fill priority sizes="(max-width: 680px) 100vw, 40vw" src="/media/contact/collage/moonrock-whoasiwhoa.webp" /></div>
              <div className={styles.heroMuralVeil} />
              <div className={styles.heroMuralBottomFade} />
            </div>
            <div className={styles.heroCopy}>
              <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
                <Link href="/">Presidential</Link><span aria-hidden="true">/</span><span>Wholesale</span>
              </nav>
              <h1 id="wholesale-heading">
                <span className={styles.heroTitleLine}>Bring</span>
                <span className={`${styles.heroTitleLine} ${styles.heroTitleAccent}`}>Presidential</span>
                <span className={styles.heroTitleLine}>to your</span>
                <span className={styles.heroTitleLine}>market.</span>
              </h1>
              <p className={styles.heroSupport}>Wholesale ordering and partnership applications for licensed retailers and distributors.</p>
              <div className={styles.heroActions}>
                <Link className={styles.heroPrimaryAction} href="/wholesale/apply">Apply to partner <ArrowIcon /></Link>
                <a className={styles.heroEmailAction} href={`mailto:${SALES_EMAIL}`}>Email sales</a>
              </div>
              <SalesEmail variant="strip" />
              <p className={styles.heroExistingCue}>Existing customer? Choose your market below.</p>
            </div>
            <div className={styles.heroRail} aria-label="Presidential wholesale markets">
              <span className={styles.heroRailCount}>7 licensed markets</span>
              <span className={styles.heroRailStates}>AZ <i>·</i> CA <i>·</i> MI <i>·</i> NV <i>·</i> NY <i>·</i> OK <i>·</i> WA</span>
              <span className={styles.heroRailPlatform}>LeafLink + Distru</span>
            </div>
          </section>

          <section className={styles.marketSection} aria-labelledby="market-heading">
            <header className={styles.sectionHeader}>
              <div><span>Seven licensed markets</span><h2 id="market-heading">Choose your state.</h2></div>
              <p>Enter the ordering platform used for your Presidential market.</p>
            </header>
            <div className={styles.marketGrid}>
              {WHOLESALE_MARKETS.map((market, index) => {
                const destination = getWholesaleDestination(market);
                const content = (
                  <>
                    <span className={styles.marketNumber}>{String(index + 1).padStart(2, "0")}</span>
                    <span className={styles.marketName}>{market.name}</span>
                    <span className={styles.marketPlatform}>{market.platform === "leaflink" ? "LeafLink" : "Distru"}</span>
                    <span className={styles.marketCta}>{destination.cta}<ArrowIcon /></span>
                  </>
                );
                return destination.external ? (
                  <a className={styles.marketCard} href={destination.href} key={market.code} rel="noopener noreferrer" target="_blank">{content}</a>
                ) : (
                  <Link className={styles.marketCard} href={destination.href} key={market.code}>{content}</Link>
                );
              })}
            </div>
          </section>

          <SalesEmail variant="band" copy="partner" />
          <PresidentialSrosSection />

          <section className={styles.nextSteps} aria-label="Other Presidential paths">
            <div><span>Not approved yet?</span><h2>Become a Presidential partner.</h2><Link className={styles.primaryAction} href="/wholesale/apply">Apply to become a partner <ArrowIcon /></Link><SalesEmail variant="strip" prefix="Or email" /></div>
            <div><span>Shopping for yourself?</span><h2>Find Presidential near you.</h2><Link className={styles.secondaryAction} href="/find-us">Find a retailer <ArrowIcon /></Link></div>
          </section>
        </main>
      </PageFrame>
    </>
  );
}
