import { existsSync } from "node:fs";
import { join } from "node:path";

import type { Metadata } from "next";

import { PageFrame } from "@/components/presidential/layout/page-frame";
import { DispensariesStyleHero } from "@/components/presidential/modules/dispensaries-style-hero";

import { LoyaltyPrototype } from "./loyalty-prototype";
import styles from "./loyalty.module.css";

export const metadata: Metadata = {
  title: "Rock Club Loyalty Prototype | Presidential",
  description: "Preview the Presidential Rock Club verification and loyalty experience.",
  robots: { index: false, follow: false },
};

const HOW_IT_WORKS = [
  ["Buy", "Pick up Presidential at any licensed retailer."],
  ["Scan", "Enter the one-time code found inside the pack."],
  ["Verify", "Instantly confirm that the pack is genuine Presidential."],
  ["Ascend", "Earn points, climb tiers, and unlock new rewards."],
] as const;

// DEMO CONTENT: owner-editable tier descriptions for the pitch prototype.
const TIERS = [
  ["Silver", "Enter the club and begin building your verified scan history."],
  ["Gold", "Advance through repeat verification and unlock elevated access."],
  ["Rose Gold", "Reach the highest Rock Club tier for premier experiences."],
] as const;

const PROGRAM_DOCUMENT_PATH = "/media/docs/rock-club-program.pdf";

export default function LoyaltyPage() {
  const programDocumentAvailable = existsSync(
    join(process.cwd(), "public", "media", "docs", "rock-club-program.pdf"),
  );

  return (
    <PageFrame className="bg-po-ink text-po-on-dark">
      <DispensariesStyleHero
        ariaLabelledBy="rock-club-title"
        breadcrumbs={[
          { name: "Presidential", path: "/" },
          { name: "Loyalty", path: "/loyalty" },
        ]}
        eyebrow="Rock Club"
        supportingText={[
          "Every Presidential pack carries a one-time code. Scan it to prove it's real — and climb.",
        ]}
        title="Scan. Verify. Ascend."
      />

      <section
        aria-label="Rock Club verification console"
        className={`po-gold-thread-inlay ${styles.consoleBand}`}
      >
        <LoyaltyPrototype />
      </section>

      <section className={`po-gold-thread-inlay ${styles.programBand}`}>
        <div className={styles.sectionHeading}>
          <p>Four moves</p>
          <h2>How It Works</h2>
        </div>
        <ol className={styles.stepsGrid}>
          {HOW_IT_WORKS.map(([title, copy], index) => (
            <li key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={`po-gold-thread-inlay ${styles.programBand}`}>
        <div className={styles.sectionHeading}>
          <p>The climb</p>
          <h2>The Three Tiers</h2>
        </div>
        <div className={styles.tierGrid}>
          {TIERS.map(([title, copy]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`po-gold-thread-inlay ${styles.programBand}`}>
        <div className={styles.audienceGrid}>
          <article>
            <p>Channel One</p>
            <h2>For Budtenders</h2>
            <span>
              Budtenders enroll, earn on every consumer scan they drive, and unlock exclusive gear and early drops.
            </span>
          </article>
          <article>
            <p>Channel Two</p>
            <h2>For Retailers</h2>
            <span>
              Dispensary accounts earn volume tiers from Presidential&apos;s own order data — priority allocation on limited drops, co-op support, and display units.
            </span>
          </article>
        </div>

        <div className={styles.documentAction}>
          {programDocumentAvailable ? (
            <a href={PROGRAM_DOCUMENT_PATH} rel="noopener noreferrer" target="_blank">
              Download The Full Program Doc
            </a>
          ) : (
            <span aria-disabled="true" className={styles.documentUnavailable}>
              Download The Full Program Doc
            </span>
          )}
          {!programDocumentAvailable ? (
            <small>Program document coming soon.</small>
          ) : null}
        </div>
      </section>

      <footer className={`po-gold-thread-inlay ${styles.complianceBand}`}>
        For adults 21+ where legal. Rewards are non-cannabis merchandise and experiences. Program availability varies by state.
      </footer>
    </PageFrame>
  );
}
