"use client";

import Link from "next/link";

import styles from "./global-error.module.css";

type GlobalErrorProps = {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
};

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <head>
        <title>Presidential | Page Error</title>
        <meta content="noindex, follow" name="robots" />
      </head>
      <body className={styles.body}>
        <main className={styles.main}>
          <section aria-labelledby="presidential-global-error-title" className={styles.section}>
            <p className={styles.eyebrow}>Official Presidential</p>
            <h1 className={styles.heading} id="presidential-global-error-title">
              This page could not load
            </h1>
            <p className={styles.message}>
              The official Presidential experience is still protected. Try again
              or return to the official home.
            </p>
            <div className={styles.actions}>
              <button
                className={styles.primary}
                onClick={() => reset()}
                type="button"
              >
                Try again
              </button>
              <Link className={styles.secondary} href="/">
                Return home
              </Link>
            </div>
            <p className={styles.footnote}>For adults 21+ where legal.</p>
          </section>
        </main>
      </body>
    </html>
  );
}
