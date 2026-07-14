import type { Metadata } from "next";
import Link from "next/link";

import { PageFrame } from "@/components/presidential/layout/page-frame";
import { LocatorConsole } from "@/components/presidential/locator/locator-console";

import styles from "./dispensary-locator.module.css";

export const metadata: Metadata = {
  title: "Dispensary Locator | Presidential",
  description: "Find licensed retailers carrying Presidential products near you.",
  robots: { index: false, follow: false },
};

export default function DispensariesPage() {
  return (
    <PageFrame className="bg-po-ink text-po-on-dark">
      <div className={styles.stage}>
        <header className={styles.hero}>
          <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
            <Link href="/">Presidential</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Dispensaries</span>
          </nav>
          <p className={styles.eyebrow}>Mission Control</p>
          <h1>Drop Your Coordinates.</h1>
          <p className={styles.supportingCopy}>
            Find licensed retailers carrying Presidential products in your orbit.
          </p>
        </header>

        <section aria-label="Retailer locator" className={`po-gold-thread-inlay ${styles.controlBand}`}>
          <LocatorConsole />
        </section>

        <footer className={`po-gold-thread-inlay ${styles.ageBand}`}>
          <span>Official Presidential licensed retailers</span>
          <span>Adults 21+ where legal</span>
        </footer>
      </div>
    </PageFrame>
  );
}
