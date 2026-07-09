"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

type GlobalErrorProps = {
  readonly error: Error & { digest?: string };
  readonly unstable_retry: () => void;
};

const styles: Record<string, CSSProperties> = {
  body: {
    margin: 0,
    minHeight: "100vh",
    background: "var(--po-color-soft)",
    color: "var(--po-color-ink)",
    fontFamily: "var(--po-font-body)",
  },
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    boxSizing: "border-box",
  },
  section: {
    width: "100%",
    maxWidth: "720px",
    border: "1px solid var(--po-color-line)",
    background: "var(--po-color-canvas)",
    padding: "32px",
    boxSizing: "border-box",
  },
  eyebrow: {
    margin: "0 0 24px 0",
    color: "var(--po-color-brand)",
    fontSize: "14px",
    fontWeight: 700,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  h1: {
    margin: 0,
    color: "var(--po-color-ink)",
    fontSize: "36px",
    lineHeight: 1.12,
    fontWeight: 700,
    letterSpacing: 0,
  },
  p: {
    margin: "16px 0 0 0",
    color: "var(--po-color-body)",
    fontSize: "16px",
    lineHeight: 1.7,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "28px",
  },
  primary: {
    border: "1px solid var(--po-color-brand)",
    background: "var(--po-color-brand)",
    color: "var(--po-color-canvas)",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondary: {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid var(--po-color-subtle)",
    color: "var(--po-color-body)",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 700,
    textDecoration: "none",
  },
  footnote: {
    marginTop: "28px",
    color: "var(--po-color-muted)",
    fontSize: "14px",
    fontWeight: 600,
  },
};

export default function GlobalError({ unstable_retry }: GlobalErrorProps) {
  return (
    <html lang="en">
      <head>
        <title>Presidential | Page Error</title>
        <meta content="noindex, follow" name="robots" />
      </head>
      <body style={styles.body}>
        <main style={styles.main}>
          <section aria-labelledby="presidential-global-error-title" style={styles.section}>
            <p style={styles.eyebrow}>Official Presidential</p>
            <h1 id="presidential-global-error-title" style={styles.h1}>
              This page could not load
            </h1>
            <p style={styles.p}>
              The official Presidential experience is still protected. Try again
              or return to the official home.
            </p>
            <div style={styles.actions}>
              <button
                onClick={() => unstable_retry()}
                style={styles.primary}
                type="button"
              >
                Try again
              </button>
              <Link href="/" style={styles.secondary}>
                Return home
              </Link>
            </div>
            <p style={styles.footnote}>For adults 21+ where legal.</p>
          </section>
        </main>
      </body>
    </html>
  );
}
