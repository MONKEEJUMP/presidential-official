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
    background: "#fafafa",
    color: "#09090b",
    fontFamily: "Arial, Helvetica, sans-serif",
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
    border: "1px solid #e4e4e7",
    background: "#ffffff",
    padding: "32px",
    boxSizing: "border-box",
  },
  eyebrow: {
    margin: "0 0 24px 0",
    color: "#065f46",
    fontSize: "14px",
    fontWeight: 700,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  h1: {
    margin: 0,
    color: "#09090b",
    fontSize: "36px",
    lineHeight: 1.12,
    fontWeight: 700,
    letterSpacing: 0,
  },
  p: {
    margin: "16px 0 0 0",
    color: "#3f3f46",
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
    border: "1px solid #064e3b",
    background: "#064e3b",
    color: "#ffffff",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondary: {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid #d4d4d8",
    color: "#27272a",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 700,
    textDecoration: "none",
  },
  footnote: {
    marginTop: "28px",
    color: "#52525b",
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
