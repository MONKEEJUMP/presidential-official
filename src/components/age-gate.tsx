"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { KeyboardEvent } from "react";
import { clearAdultAccess, confirmAdultAccess } from "@/app/age-gate-actions";
import { publishAdultConfirmation } from "@/lib/browser/adult-video-playback";

const AGE_GATED_CONTENT_ID = "presidential-age-gated-content";

type AgeGateStatus = "pending" | "accepted" | "blocked";

type AgeGateProps = {
  readonly initialConfirmed?: boolean;
};

export function AgeGate({ initialConfirmed = false }: AgeGateProps) {
  const [status, setStatus] = useState<AgeGateStatus>(
    initialConfirmed ? "accepted" : "pending",
  );
  const [isPending, startTransition] = useTransition();
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const shouldFocusMainRef = useRef(false);
  const isGateActive = status !== "accepted";

  useEffect(() => {
    if (status === "pending") {
      const focusRequest = window.setTimeout(() => {
        primaryActionRef.current?.focus();
      }, 0);

      return () => window.clearTimeout(focusRequest);
    }
  }, [status]);

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
    startTransition(async () => {
      try {
        await confirmAdultAccess();
        publishAdultConfirmation(true);
        shouldFocusMainRef.current = true;
        setStatus("accepted");
      } catch {
        setStatus("pending");
        primaryActionRef.current?.focus();
      }
    });
  }

  function declineGate() {
    publishAdultConfirmation(false);
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
        className="w-full max-w-md border-t-4 border-po-brand bg-po-ink p-8 text-po-on-dark shadow-2xl"
        onKeyDown={handleDialogKeyDown}
        role="dialog"
      >
        <span
          aria-hidden="true"
          className="po-brand-mark block aspect-[1200/929] w-20 bg-contain bg-center bg-no-repeat"
        />
        <p className="mt-6 text-xs font-black uppercase tracking-wide text-po-brand">
          Official Presidential
        </p>
        <h2
          className="mt-3 font-display text-3xl uppercase leading-[0.95]"
          id="presidential-age-gate-title"
        >
          Welcome to the House.
        </h2>
        <p className="mt-2 font-display text-lg uppercase text-po-brand">
          Adults 21+ where legal
        </p>
        <p
          className="mt-4 text-base leading-7 text-po-on-dark-muted"
          id="presidential-age-gate-description"
        >
          This site is intended for adults 21 or older in places where cannabis
          products are legal.
        </p>

        {status === "blocked" ? (
          <p
            aria-live="polite"
            className="mt-4 border-l-4 border-po-brand/50 bg-po-on-dark/5 px-4 py-3 text-sm leading-6 text-po-on-dark-muted"
          >
            Please exit this site and return only when you meet the adult access
            requirement.
          </p>
        ) : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            className="border border-po-brand bg-po-brand px-4 py-3 text-sm font-black uppercase text-po-ink transition-colors hover:bg-po-brand-hover"
            disabled={isPending}
            onClick={acceptGate}
            ref={primaryActionRef}
            type="button"
          >
            {isPending ? "Confirming" : "I am 21 or older"}
          </button>
          <button
            className="border border-po-on-dark/30 px-4 py-3 text-sm font-semibold uppercase text-po-on-dark-muted transition-colors hover:border-po-on-dark/60 hover:text-po-on-dark"
            disabled={isPending}
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
