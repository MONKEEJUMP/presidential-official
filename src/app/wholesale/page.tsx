import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PageFrame } from "@/components/presidential/layout/page-frame";
import { buildStaticRouteMetadata, getStaticRouteRecord } from "@/lib/seo/route-page";
import { buildRouteShellJsonLd, JsonLd } from "@/lib/seo/schema";
import { getWholesaleDestination, WHOLESALE_MARKETS } from "@/lib/wholesale/market-ordering";

import styles from "./wholesale.module.css";

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
            <div className={styles.heroCopy}>
              <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
                <Link href="/">Presidential</Link><span aria-hidden="true">/</span><span>Wholesale</span>
              </nav>
              <h1 id="wholesale-heading">Wholesale<br /><span>ordering.</span></h1>
              <p>For approved licensed Presidential wholesale customers.</p>
              <a className={styles.emailLink} href={`mailto:${SALES_EMAIL}`}>{SALES_EMAIL}</a>
            </div>
            <div aria-hidden="true" className={styles.heroArt}>
              <div className={styles.heroArtWide}><Image alt="" fill priority sizes="(max-width: 800px) 92vw, 46vw" src="/media/contact/collage/vape-teal-lro.webp" /></div>
              <div className={styles.heroArtTall}><Image alt="" fill priority sizes="(max-width: 800px) 48vw, 22vw" src="/media/contact/collage/blunt-cosmic-cookie.webp" /></div>
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

          <section className={styles.nextSteps} aria-label="Other Presidential paths">
            <div><span>Not approved yet?</span><h2>Become a Presidential partner.</h2><Link className={styles.primaryAction} href="/wholesale/apply">Apply to become a partner <ArrowIcon /></Link></div>
            <div><span>Shopping for yourself?</span><h2>Find Presidential near you.</h2><Link className={styles.secondaryAction} href="/find-us">Find a retailer <ArrowIcon /></Link></div>
          </section>
        </main>
      </PageFrame>
    </>
  );
}
