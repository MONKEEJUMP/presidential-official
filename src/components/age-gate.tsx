"use client";

import { useEffect, useState } from "react";

const ADULT_CONFIRMATION_KEY = "presidential_adult_confirmed";

type AgeGateStatus = "checking" | "accepted" | "blocked";

export function AgeGate() {
  const [status, setStatus] = useState<AgeGateStatus>("checking");

  useEffect(() => {
    const statusCheck = window.setTimeout(() => {
      if (window.localStorage.getItem(ADULT_CONFIRMATION_KEY) === "true") {
        setStatus("accepted");
      }
    }, 0);

    return () => window.clearTimeout(statusCheck);
  }, []);

  if (status === "accepted") {
    return null;
  }

  function acceptGate() {
    window.localStorage.setItem(ADULT_CONFIRMATION_KEY, "true");
    setStatus("accepted");
  }

  function declineGate() {
    window.localStorage.removeItem(ADULT_CONFIRMATION_KEY);
    setStatus("blocked");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-zinc-950/80 px-6 py-8"
      data-presidential-age-gate="overlay"
      role="presentation"
    >
      <section
        aria-describedby="presidential-age-gate-description"
        aria-labelledby="presidential-age-gate-title"
        aria-modal="true"
        className="w-full max-w-md border border-zinc-200 bg-white p-6 text-zinc-950 shadow-2xl"
        role="dialog"
      >
        <p className="text-sm font-semibold uppercase text-emerald-800">
          Official Presidential
        </p>
        <h2
          className="mt-4 text-2xl font-semibold leading-tight"
          id="presidential-age-gate-title"
        >
          Adults 21+ where legal
        </h2>
        <p
          className="mt-4 text-base leading-7 text-zinc-700"
          id="presidential-age-gate-description"
        >
          This site is intended for adults 21 or older in places where cannabis
          products are legal.
        </p>

        {status === "blocked" ? (
          <p className="mt-4 border-l-4 border-zinc-300 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-700">
            Please exit this site and return only when you meet the adult access
            requirement.
          </p>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            className="border border-emerald-900 bg-emerald-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
            onClick={acceptGate}
            type="button"
          >
            I am 21 or older
          </button>
          <button
            className="border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-800 transition-colors hover:border-zinc-500"
            onClick={declineGate}
            type="button"
          >
            Not now
          </button>
        </div>
      </section>
    </div>
  );
}
