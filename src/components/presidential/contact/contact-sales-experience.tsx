import Image from "next/image";
import Link from "next/link";

import styles from "./contact-sales-experience.module.css";

export const PRESIDENTIAL_SALES_EMAIL = "sales@presidentialmoonrocks.com" as const;

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function salesMailto(subject: string, body: string): string {
  return `mailto:${PRESIDENTIAL_SALES_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

const wholesaleMailto = salesMailto(
  "Presidential wholesale order inquiry",
  "Business name:\nContact name:\nState / market:\nLicense type and number:\nProducts of interest:\nEstimated quantities:\nPreferred timeline:\n\nHow can the Presidential Sales team help?",
);

const partnershipMailto = salesMailto(
  "Become a Presidential retail partner",
  "Business name:\nContact name:\nState / market:\nLicense type and number:\nCurrent locations or distribution footprint:\nProducts of interest:\n\nTell us about the opportunity:",
);

const paths = [
  {
    number: "01",
    title: "Find Presidential",
    body: "Shopping for yourself? Find a licensed retailer carrying Presidential near you.",
    href: "/find-us",
    cta: "Find a retailer",
    external: false,
  },
  {
    number: "02",
    title: "Wholesale orders",
    body: "Licensed retailer or distributor? Talk product selection, quantities, and next steps with Sales.",
    href: wholesaleMailto,
    cta: "Email Sales",
    external: true,
  },
  {
    number: "03",
    title: "Become a Presidential partner",
    body: "Bring Presidential to your market, shelves, and customers.",
    href: partnershipMailto,
    cta: "Start the conversation",
    external: true,
  },
] as const;

export function ContactSalesExperience() {
  return (
    <div className={styles.page}>
      <section aria-labelledby="contact-sales-heading" className={styles.hero}>
        <div aria-hidden="true" className={styles.heroAtmosphere} />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
              <Link href="/">Presidential</Link><span aria-hidden="true">/</span><span>Sales &amp; Partnerships</span>
            </nav>
            <h1 id="contact-sales-heading">Let&apos;s talk <span>sales.</span></h1>
            <p className={styles.heroLead}>Wholesale orders. Retail partnerships.<br />The official line to Presidential.</p>
            <a className={styles.emailLink} href={`mailto:${PRESIDENTIAL_SALES_EMAIL}`}>{PRESIDENTIAL_SALES_EMAIL}</a>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href={wholesaleMailto}>Start a wholesale order <ArrowIcon /></a>
              <Link className={styles.textAction} href="/find-us">Find a retailer</Link>
            </div>
          </div>

          <div className={styles.heroMedia}>
            <Image
              alt="Presidential Blue Dream and Papaya Punch Moon Rock blunt packages"
              fill
              priority
              sizes="(max-width: 900px) 100vw, min(54vw, 820px)"
              src="/media/blunts/hero-studio-v2.webp"
            />
            <div className={styles.heroMediaCaption}><span>Official sales</span><span>Retail · Wholesale · Partnerships</span></div>
          </div>
        </div>
        <a className={styles.heroFoot} href="#sales-paths"><span>Choose your path</span><span aria-hidden="true">↓</span></a>
      </section>

      <section aria-labelledby="sales-paths-heading" className={styles.paths} id="sales-paths">
        <header className={styles.pathsHeader}>
          <h2 id="sales-paths-heading">Choose your path.</h2>
          <p>One official line.<br />The right next step.</p>
        </header>

        <div className={styles.pathRows}>
          {paths.map((path) => (
            <article className={styles.pathRow} key={path.number}>
              <span className={styles.pathNumber}>{path.number}</span>
              <div><h3>{path.title}</h3><p>{path.body}</p></div>
              {path.external ? (
                <a href={path.href}>{path.cta}<ArrowIcon /></a>
              ) : (
                <Link href={path.href}>{path.cta}<ArrowIcon /></Link>
              )}
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="partner-heading" className={styles.partner} id="partner">
        <div aria-hidden="true" className={styles.partnerAtmosphere} />
        <div className={styles.partnerCopy}>
          <p>Partner with a higher standard</p>
          <h2 id="partner-heading">Put Presidential <span>on your shelves.</span></h2>
          <p className={styles.partnerLead}>Tell us your business name, state, license type, products of interest, and estimated quantities.</p>
          <a className={styles.partnerEmail} href={`mailto:${PRESIDENTIAL_SALES_EMAIL}`}>{PRESIDENTIAL_SALES_EMAIL}</a>
          <div className={styles.partnerDetails}>
            <span>Retailers</span><span>Distributors</span><span>Market partners</span>
          </div>
          <a className={styles.primaryAction} href={partnershipMailto}>Become a Presidential partner <ArrowIcon /></a>
        </div>

        <div aria-label="Presidential product families" className={styles.productStage}>
          <div className={styles.productPreRoll}>
            <Image alt="Presidential Cereal Milk Moon Rock pre-roll" fill sizes="(max-width: 800px) 42vw, 19vw" src="/media/pre-rolls/cereal-milk-title.webp" />
          </div>
          <div className={styles.productBlunt}>
            <Image alt="Presidential Blue Dream Moon Rock blunt" fill sizes="(max-width: 800px) 42vw, 19vw" src="/media/blunts/blue-dream.webp" />
          </div>
          <div className={styles.productMoonRocks}>
            <Image alt="Presidential classic Moon Rocks product graphic" fill sizes="(max-width: 800px) 42vw, 19vw" src="/media/moonrock-presidential.jpg" />
          </div>
          <div className={styles.productLegend}><span>Pre-Rolls</span><span>Blunts</span><span>Moon Rocks</span></div>
        </div>
      </section>
    </div>
  );
}
