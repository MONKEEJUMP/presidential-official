import type { Metadata } from "next";
import Link from "next/link";

import { PageFrame } from "@/components/presidential/layout/page-frame";

import styles from "../wholesale.module.css";

export const metadata: Metadata = {
  title: "Application Received | Presidential Sales",
  description: "Your Presidential wholesale or partnership inquiry has been received for review by Sales.",
  alternates: { canonical: "/wholesale/thank-you" },
  robots: { index: false, follow: true },
};

export default function WholesaleThankYouPage() {
  return (
    <PageFrame className={styles.page}>
      <main className={styles.thankYou}>
        <div className={styles.thankYouInner}>
          <p className={styles.applicationEyebrow}>Presidential Sales</p>
          <h1>Application<br /><span>received.</span></h1>
          <p>Presidential Sales will review your information and respond through the business contact you submitted.</p>
          <div className={styles.thankYouActions}>
            <Link className={styles.primaryAction} href="/wholesale">Back to wholesale</Link>
            <Link className={styles.secondaryAction} href="/find-us">Find a retailer</Link>
          </div>
        </div>
      </main>
    </PageFrame>
  );
}
