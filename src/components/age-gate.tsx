"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const AGE_GATE_STORAGE_KEY = "presidential-age-gate-approved";

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 10000,
  display: "grid",
  placeItems: "center",
  padding: "24px",
  background: "rgba(2, 9, 8, 0.98)",
  color: "#f7f8f7",
};

const panelStyle: CSSProperties = {
  width: "min(100%, 34rem)",
  border: "1px solid rgba(88, 195, 182, 0.72)",
  background: "#06100f",
  boxShadow: "0 28px 80px rgba(0, 0, 0, 0.5)",
  padding: "clamp(2rem, 6vw, 4rem)",
  textAlign: "center",
};

export function AgeGate({
  children,
  siteName,
}: Readonly<{
  children: React.ReactNode;
  siteName: string;
}>) {
  const [approved, setApproved] = useState(false);
  const [declined, setDeclined] = useState(false);
  const approveButtonRef = useRef<HTMLButtonElement>(null);
  const returnButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      setApproved(window.localStorage.getItem(AGE_GATE_STORAGE_KEY) === "approved");
    } catch {
      // Private browsing or restrictive storage settings should still allow entry.
    }
  }, []);

  useEffect(() => {
    if (approved) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [approved]);

  useEffect(() => {
    if (approved) return;

    const focusTarget = declined ? returnButtonRef.current : approveButtonRef.current;
    focusTarget?.focus();
  }, [approved, declined]);

  const approve = () => {
    try {
      window.localStorage.setItem(AGE_GATE_STORAGE_KEY, "approved");
    } catch {
      // Entry remains available even when storage is unavailable.
    }
    setApproved(true);
  };

  return (
    <>
      {children}
      {!approved ? (
        <div
          aria-labelledby="age-gate-title"
          aria-modal="true"
          role="dialog"
          style={overlayStyle}
        >
          <section style={panelStyle}>
            <p
              style={{
                margin: 0,
                color: "#58c3b6",
                fontFamily: "var(--font-clash-display, Arial, sans-serif)",
                fontSize: "0.78rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              {siteName}
            </p>
            <h2
              id="age-gate-title"
              style={{
                margin: "18px 0 0",
                fontFamily: "var(--font-clash-display, Arial, sans-serif)",
                fontSize: "clamp(2.25rem, 8vw, 4.5rem)",
                fontWeight: 700,
                letterSpacing: "0.015em",
                lineHeight: 0.9,
                textTransform: "uppercase",
              }}
            >
              ARE YOU 21 OR OLDER?
            </h2>
            <p
              aria-live="polite"
              style={{
                margin: "24px auto 0",
                maxWidth: "31rem",
                color: "#c9d8d3",
                fontSize: "1rem",
                lineHeight: 1.6,
              }}
            >
              {declined
                ? "You must be 21 or older to enter this website."
                : "This website contains cannabis-related information intended for adults 21+ where legal."}
            </p>
            {!declined ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "12px",
                  marginTop: "30px",
                }}
              >
                <button
                  onClick={approve}
                  ref={approveButtonRef}
                  style={{
                    minHeight: "54px",
                    border: "1px solid #58c3b6",
                    background: "#58c3b6",
                    color: "#06100f",
                    cursor: "pointer",
                    fontFamily: "var(--font-clash-display, Arial, sans-serif)",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                  }}
                  type="button"
                >
                  Yes, enter
                </button>
                <button
                  onClick={() => setDeclined(true)}
                  style={{
                    minHeight: "54px",
                    border: "1px solid rgba(247, 248, 247, 0.5)",
                    background: "transparent",
                    color: "#f7f8f7",
                    cursor: "pointer",
                    fontFamily: "var(--font-clash-display, Arial, sans-serif)",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                  }}
                  type="button"
                >
                  No, exit
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeclined(false)}
                ref={returnButtonRef}
                style={{
                  minHeight: "48px",
                  marginTop: "30px",
                  border: "1px solid #58c3b6",
                  background: "transparent",
                  color: "#58c3b6",
                  cursor: "pointer",
                  fontFamily: "var(--font-clash-display, Arial, sans-serif)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  padding: "0 22px",
                  textTransform: "uppercase",
                }}
                type="button"
              >
                Go back
              </button>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
