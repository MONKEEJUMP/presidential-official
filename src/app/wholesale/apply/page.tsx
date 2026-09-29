import type { Metadata } from "next";
import Link from "next/link";

import { PageFrame } from "@/components/presidential/layout/page-frame";

import styles from "../wholesale.module.css";
import { WholesaleApplicationForm } from "./wholesale-application-form";
import { SalesEmail } from "@/components/contact/sales-email";

export const metadata: Metadata = {
  title: "Apply to Partner with Presidential | Wholesale Sales",
  description: "Apply as a licensed Presidential retail, distribution, market, or wholesale ordering partner.",
  alternates: { canonical: "/wholesale/apply" },
  robots: { index: false, follow: true },
};

export default function WholesaleApplyPage() {
  return (
    <PageFrame className={styles.page}>
      <main className={styles.applicationPage}>
        <SalesEmail variant="strip" prefix="Questions before you apply? Email" />
        <section className={styles.applicationHero} aria-labelledby="application-heading">
          <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
            <Link href="/">Presidential</Link><span aria-hidden="true">/</span><Link href="/wholesale">Wholesale</Link><span aria-hidden="true">/</span><span>Apply</span>
          </nav>
          <p className={styles.applicationEyebrow}>Licensed business inquiries</p>
          <h1 id="application-heading">Start the<br /><span>conversation.</span></h1>
          <p>Tell Presidential Sales who you are, where you operate, and what you need.</p>
        </section>

        <section className={styles.formShell} aria-labelledby="form-heading">
          <div className={styles.formIntro}>
            <p className={styles.applicationEyebrow}>Sales &amp; partnerships</p>
            <h2 id="form-heading">Business application.</h2>
            <p>For licensed retailers, distributors, operators, and existing accounts requesting ordering access.</p>
            <a href="mailto:sales@presidentialmoonrocks.com">sales@presidentialmoonrocks.com</a>
          </div>
          <WholesaleApplicationForm />
        </section>
      </main>
    </PageFrame>
  );
}
