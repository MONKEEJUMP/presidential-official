"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { KeyboardEvent } from "react";
import { clearAdultAccess, confirmAdultAccess } from "@/app/age-gate-actions";

const ADULT_CONFIRMATION_KEY = "presidential_adult_confirmed";
const AGE_GATED_CONTENT_ID = "presidential-age-gated-content";

type AgeGateStatus = "checking" | "pending" | "accepted" | "blocked";

function readAdultConfirmation() {
  try {
    return window.localStorage.getItem(ADULT_CONFIRMATION_KEY) === "true";
  } catch {
    return false;
  }
}

function writeAdultConfirmation() {
  try {
    window.localStorage.setItem(ADULT_CONFIRMATION_KEY, "true");
  } catch {
    // Storage can fail in private or restricted browsing modes.
  }
}

function clearAdultConfirmation() {
  try {
    window.localStorage.removeItem(ADULT_CONFIRMATION_KEY);
  } catch {
    // Storage can fail in private or restricted browsing modes.
  }
}

type AgeGateProps = {
  readonly initialConfirmed?: boolean;
};

export function AgeGate({ initialConfirmed = false }: AgeGateProps) {
  const [status, setStatus] = useState<AgeGateStatus>(
    initialConfirmed ? "accepted" : "checking",
  );
  const [, startTransition] = useTransition();
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const shouldFocusMainRef = useRef(false);
  const isGateActive = status !== "accepted";

  useEffect(() => {
    const statusCheck = window.setTimeout(() => {
      if (readAdultConfirmation()) {
        setStatus("accepted");
        return;
      }

      setStatus("pending");
      primaryActionRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(statusCheck);
  }, []);

  useEffect(() => {
    const gatedContent = document.getElementById(AGE_GATED_CONTENT_ID);

    if (gatedContent) {
      if (isGateActive) {
        gatedContent.setAttribute("aria-hidden", "true");
        gatedContent.setAttribute("inert", "");
      } else {
        gatedContent.removeAttribute("aria-hidden");
        gatedContent.removeAttribute("inert");
      }
    }

    if (!isGateActive) {
      if (shouldFocusMainRef.current) {
        shouldFocusMainRef.current = false;
        window.queueMicrotask(() => {
          document.getElementById("presidential-main")?.focus();
        });
      }
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isGateActive]);

  function acceptGate() {
    shouldFocusMainRef.current = true;
    writeAdultConfirmation();
    setStatus("accepted");
    startTransition(() => {
      void confirmAdultAccess();
    });
  }

  function declineGate() {
    clearAdultConfirmation();
    setStatus("blocked");
    startTransition(() => {
      void clearAdultAccess();
    });
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") {
      return;
    }

    const focusableControls = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>("button"),
    );
    const firstControl = focusableControls.at(0);
    const lastControl = focusableControls.at(-1);

    if (!firstControl || !lastControl) {
      return;
    }

    if (event.shiftKey && document.activeElement === firstControl) {
      event.preventDefault();
      lastControl.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastControl) {
      event.preventDefault();
      firstControl.focus();
    }
  }

  if (status === "accepted") {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-po-ink/80 px-6 py-8"
      role="presentation"
    >
      <section
        aria-describedby="presidential-age-gate-description"
        aria-labelledby="presidential-age-gate-title"
        aria-modal="true"
        className="w-full max-w-md border border-po-line bg-po-canvas p-6 text-po-ink shadow-2xl"
        onKeyDown={handleDialogKeyDown}
        role="dialog"
      >
        <p className="text-sm font-semibold uppercase text-po-brand">
          Official Presidential
        </p>
        <h2
          className="mt-4 text-2xl font-semibold leading-tight"
          id="presidential-age-gate-title"
        >
          Adults 21+ where legal
        </h2>
        <p
          className="mt-4 text-base leading-7 text-po-body"
          id="presidential-age-gate-description"
        >
          This site is intended for adults 21 or older in places where cannabis
          products are legal.
        </p>

        {status === "blocked" ? (
          <p
            aria-live="polite"
            className="mt-4 border-l-4 border-po-subtle bg-po-soft px-4 py-3 text-sm leading-6 text-po-body"
          >
            Please exit this site and return only when you meet the adult access
            requirement.
          </p>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            className="border border-po-brand bg-po-brand px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-po-brand-hover"
            onClick={acceptGate}
            ref={primaryActionRef}
            type="button"
          >
            I am 21 or older
          </button>
          <button
            className="border border-po-subtle px-4 py-3 text-sm font-semibold text-po-body transition-colors hover:border-po-muted"
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
