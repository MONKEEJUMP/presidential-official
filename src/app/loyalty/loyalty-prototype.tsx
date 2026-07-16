"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import styles from "./loyalty.module.css";

type DemoOutcome = "valid" | "claimed" | "unverified";

type DemoCode = {
  readonly code: string;
  readonly label: string;
  readonly outcome: DemoOutcome | "invalid";
};

// DEMO DATA: hardcoded pitch fixtures only. Replace with an approved loyalty provider later.
const DEMO_CODES: readonly DemoCode[] = [
  { code: "PRES-BR01", label: "Valid", outcome: "valid" },
  { code: "PRES-USED", label: "Claimed", outcome: "claimed" },
  { code: "NONE-0000", label: "Unverified", outcome: "unverified" },
  { code: "BAD", label: "Invalid", outcome: "invalid" },
];

// DEMO DATA: owner-editable non-cannabis reward placeholders.
const REWARDS = [
  ["Crest Pin Set", "650 PT"],
  ["Rock Club Cap", "900 PT"],
  ["Flight Jacket", "2,400 PT"],
  ["Exclusive Merch Drop", "3,000 PT"],
  ["VIP Event Entry", "5,000 PT"],
] as const;

// DEMO DATA: pitch-only member activity.
const SCAN_HISTORY = [
  ["Blue Raspberry", "+250 PT", "Jul 12, 2026"],
  ["Peach Rings", "+250 PT", "Jun 28, 2026"],
  ["Presidential OG", "+250 PT", "Jun 09, 2026"],
] as const;

const STARTING_POINTS = 1250;
const VERIFIED_POINTS = STARTING_POINTS + 250;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function delay(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export function LoyaltyPrototype() {
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [outcome, setOutcome] = useState<DemoOutcome | null>(null);
  const [message, setMessage] = useState("");
  const [points, setPoints] = useState(STARTING_POINTS);
  const [progress, setProgress] = useState(48);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia(REDUCED_MOTION_QUERY).matches,
  );
  const scanButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    const update = (event: MediaQueryListEvent) =>
      setReducedMotion(event.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!scannerOpen) return;
    const dialog = dialogRef.current;
    const opener = scanButtonRef.current;

    if (!dialog) return;
    dialog.showModal();
    closeButtonRef.current?.focus();

    return () => {
      if (dialog.open) dialog.close();
      window.requestAnimationFrame(() => {
        if (opener?.isConnected && !dialog.open) opener.focus();
      });
    };
  }, [scannerOpen]);

  useEffect(() => {
    if (outcome !== "valid") return;

    const startedAt = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const ratio = reducedMotion
        ? 1
        : Math.min(1, (now - startedAt) / 650);
      const eased = 1 - Math.pow(1 - ratio, 3);
      setPoints(
        Math.round(
          STARTING_POINTS + (VERIFIED_POINTS - STARTING_POINTS) * eased,
        ),
      );
      setProgress(48 + 15 * eased);
      if (ratio < 1) frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [outcome, reducedMotion]);

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    setCode(normalized);
    setMessage("");
    setOutcome(null);
    setPoints(STARTING_POINTS);
    setProgress(48);

    if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalized)) {
      setMessage("Enter a code in the format XXXX-XXXX.");
      return;
    }

    const fixture = DEMO_CODES.find((entry) => entry.code === normalized);
    setScanning(true);
    await (reducedMotion ? Promise.resolve() : delay(800));
    setScanning(false);
    setOutcome(
      fixture?.outcome === "valid" || fixture?.outcome === "claimed"
        ? fixture.outcome
        : "unverified",
    );
  }

  return (
    <div className={styles.prototypeGrid}>
      <div className={styles.verifyColumn}>
        <div className={styles.console}>
          <form className={styles.codeForm} onSubmit={verifyCode}>
            <label htmlFor="rock-club-code">Pack verification code</label>
            <div className={styles.codeRow}>
              <input
                aria-describedby="rock-club-message"
                autoCapitalize="characters"
                autoComplete="off"
                id="rock-club-code"
                maxLength={12}
                onChange={(event) => {
                  setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""));
                  setMessage("");
                }}
                placeholder="XXXX-XXXX"
                spellCheck={false}
                type="text"
                value={code}
              />
              <button disabled={scanning} type="submit">Claim</button>
            </div>
          </form>

          <button
            className={styles.scanButton}
            onClick={() => setScannerOpen(true)}
            ref={scanButtonRef}
            type="button"
          >
            Scan QR Code
          </button>

          <p aria-live="polite" className={styles.formMessage} id="rock-club-message">
            {message}
          </p>

          <div className={styles.demoCodes}>
            <p>Demo Codes</p>
            <div>
              {DEMO_CODES.map((fixture) => (
                <button
                  key={fixture.code}
                  onClick={() => {
                    setCode(fixture.code);
                    setMessage("");
                    setOutcome(null);
                  }}
                  type="button"
                >
                  <span>{fixture.label}</span>
                  {fixture.code}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div aria-live="polite" className={styles.resultStage}>
          {scanning ? (
            <div aria-label="Verifying Presidential code" className={styles.radar} role="status">
              <span className={styles.radarBeam} />
              <span className={styles.radarPing} />
            </div>
          ) : null}

          {!scanning && outcome === "valid" ? (
            <article className={`${styles.resultCard} ${styles.resultValid}`}>
              <p><span aria-hidden="true">{"\u2713"}</span> Presidential Verified</p>
              <h2>Silver Flavor Series — Blue Raspberry</h2>
              <strong>+250 Points</strong>
            </article>
          ) : null}

          {!scanning && outcome === "claimed" ? (
            <article className={`${styles.resultCard} ${styles.resultClaimed}`}>
              <p><span aria-hidden="true">{"\u26A0"}</span> Code Already Claimed</p>
              <h2>Claimed on June 28, 2026</h2>
            </article>
          ) : null}

          {!scanning && outcome === "unverified" ? (
            <article className={`${styles.resultCard} ${styles.resultUnverified}`}>
              <h2>CODE NOT RECOGNIZED</h2>
              <p>This code isn&apos;t in our system. Contact Presidential to verify your product.</p>
            </article>
          ) : null}

          {!scanning && !outcome ? (
            <div className={styles.standby}>
              <span>Awaiting Signal</span>
              <p>Enter a pack code to run the Rock Club verification demo.</p>
            </div>
          ) : null}
        </div>
      </div>

      <aside className={styles.memberPanel}>
        <div className={styles.memberHeading}>
          <p>Demo Member</p>
          <span>Silver Tier</span>
        </div>
        <strong className={styles.pointsBalance}>{points.toLocaleString()} PT</strong>
        <div className={styles.tierProgress}>
          <div><span>Silver</span><span>Gold</span><span>Rose Gold</span></div>
          <progress
            aria-label={`${Math.round(progress)} percent toward Rose Gold`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Math.round(progress)}
            className={styles.tierProgressBar}
            max={100}
            role="progressbar"
            value={progress}
          />
        </div>

        <section className={styles.rewards}>
          <h2>Rewards</h2>
          <div>
            {REWARDS.map(([name, cost]) => (
              <article key={name}>
                <h3>{name}</h3>
                <span>{cost}</span>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.history}>
          <h2>Scan History</h2>
          <ol>
            {SCAN_HISTORY.map(([name, amount, date]) => (
              <li key={`${name}-${date}`}>
                <div><strong>{name}</strong><span>{date}</span></div>
                <b>{amount}</b>
              </li>
            ))}
          </ol>
        </section>
      </aside>

      {scannerOpen ? (
        <dialog
          aria-labelledby="scanner-title"
          aria-modal="true"
          className={styles.modalBackdrop}
          onCancel={(event) => {
            event.preventDefault();
            setScannerOpen(false);
          }}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setScannerOpen(false);
          }}
          ref={dialogRef}
        >
          <div className={styles.modal}>
            <p>Rock Club Prototype</p>
            <h2 id="scanner-title">QR Camera Preview</h2>
            <span>
              Camera scanning is not connected in this prototype. Choose a demo code to preview each verification outcome.
            </span>
            <button ref={closeButtonRef} onClick={() => setScannerOpen(false)} type="button">
              Close
            </button>
          </div>
        </dialog>
      ) : null}
    </div>
  );
}
