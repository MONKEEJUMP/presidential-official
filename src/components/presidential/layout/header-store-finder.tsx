"use client";

import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useId, useRef, useState } from "react";

type HeaderStoreFinderProps = {
  readonly onRoute?: () => void;
};

const HOVER_INTENT_MS = 150;
const HOVER_CLOSE_DELAY_MS = 180;

function LocationPin({ className = "" }: { readonly className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 21s6-5.15 6-11a6 6 0 1 0-12 0c0 5.85 6 11 6 11Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.25"
      />
      <circle cx="12" cy="10" r="2.25" stroke="currentColor" strokeWidth="2.25" />
    </svg>
  );
}

export function HeaderStoreFinder({ onRoute }: HeaderStoreFinderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const panelId = useId();
  const messageId = useId();
  const rootRef = useRef<HTMLLIElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focusInputOnOpenRef = useRef(false);
  const panelOwnsFocusRef = useRef(false);
  const hoverOpenTimer = useRef<number | null>(null);
  const hoverCloseTimer = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [zip, setZip] = useState("");
  const [message, setMessage] = useState("");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!open) return;

    const focusFrame = focusInputOnOpenRef.current
      ? window.requestAnimationFrame(() => inputRef.current?.focus())
      : null;
    const dismissOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        panelOwnsFocusRef.current = false;
        setOpen(false);
      }
    };
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      panelOwnsFocusRef.current = false;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", dismissOutside);
    window.addEventListener("keydown", dismissOnEscape);
    return () => {
      if (focusFrame !== null) window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("pointerdown", dismissOutside);
      window.removeEventListener("keydown", dismissOnEscape);
    };
  }, [open]);

  useEffect(
    () => () => {
      if (hoverOpenTimer.current) window.clearTimeout(hoverOpenTimer.current);
      if (hoverCloseTimer.current) window.clearTimeout(hoverCloseTimer.current);
    },
    [],
  );

  function canHover() {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }

  function keepHoverOpen() {
    if (hoverCloseTimer.current) {
      window.clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = null;
    }
  }

  function scheduleHoverOpen() {
    if (!canHover()) return;
    keepHoverOpen();
    if (hoverOpenTimer.current) window.clearTimeout(hoverOpenTimer.current);
    hoverOpenTimer.current = window.setTimeout(() => {
      hoverOpenTimer.current = null;
      focusInputOnOpenRef.current = false;
      setMessage("");
      setOpen(true);
    }, HOVER_INTENT_MS);
  }

  function scheduleHoverClose() {
    if (!canHover()) return;
    if (panelOwnsFocusRef.current) return;
    if (hoverOpenTimer.current) {
      window.clearTimeout(hoverOpenTimer.current);
      hoverOpenTimer.current = null;
    }
    if (hoverCloseTimer.current) window.clearTimeout(hoverCloseTimer.current);
    hoverCloseTimer.current = window.setTimeout(() => {
      hoverCloseTimer.current = null;
      if (panelOwnsFocusRef.current) return;
      setOpen(false);
    }, HOVER_CLOSE_DELAY_MS);
  }

  function routeToFinder(params: URLSearchParams) {
    panelOwnsFocusRef.current = false;
    setOpen(false);
    setMessage("");
    onRoute?.();
    const destination =
      pathname === "/"
        ? `/?${params.toString()}#presidential-homepage-locator`
        : `/find-us?${params.toString()}#presidential-locator-console`;
    router.push(destination);
  }

  function submitZip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{5}$/.test(zip)) {
      setMessage("Enter a valid five-digit ZIP code.");
      return;
    }

    routeToFinder(new URLSearchParams({ zip }));
  }

  function useLocation() {
    setMessage("");
    if (!("geolocation" in navigator)) {
      setMessage("Location is unavailable. Enter a ZIP code instead.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        routeToFinder(
          new URLSearchParams({
            latitude: coords.latitude.toFixed(6),
            longitude: coords.longitude.toFixed(6),
          }),
        );
      },
      () => {
        setLocating(false);
        setMessage("Location permission was not available. Enter a ZIP code instead.");
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    );
  }

  return (
    <li
      className="po-primary-nav-item relative z-30 lg:mr-6"
      onMouseEnter={keepHoverOpen}
      onMouseLeave={scheduleHoverClose}
      ref={rootRef}
    >
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-po-brand px-3 py-2 font-display text-[0.75rem] font-semibold uppercase text-[#04342c] transition-colors hover:bg-po-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-brand lg:h-[2.3125rem] lg:w-auto lg:px-[clamp(0.65rem,0.8vw,0.85rem)] lg:py-0"
        onMouseEnter={scheduleHoverOpen}
        onClick={() => {
          if (hoverOpenTimer.current) {
            window.clearTimeout(hoverOpenTimer.current);
            hoverOpenTimer.current = null;
          }
          keepHoverOpen();
          panelOwnsFocusRef.current = false;
          focusInputOnOpenRef.current = !open;
          setMessage("");
          setOpen((current) => !current);
        }}
        ref={triggerRef}
        type="button"
      >
        <LocationPin className="h-4 w-4 shrink-0" />
        Find a Store
      </button>

      {open ? (
        <div
          aria-label="Find a Presidential store"
          className="absolute inset-x-0 top-[calc(100%+0.25rem)] z-50 rounded-[16px] border border-po-brand bg-po-ink p-4 text-po-on-dark shadow-2xl before:absolute before:-top-1 before:inset-x-0 before:h-1 before:content-[''] lg:left-auto lg:right-0 lg:w-96"
          id={panelId}
          onMouseEnter={keepHoverOpen}
          role="dialog"
        >
          <form className="grid gap-3" noValidate onSubmit={submitZip}>
            <p className="font-display text-xs font-semibold uppercase text-po-brand">
              BUY PRESIDENTIAL @ LOCAL DISPO
            </p>
            <label className="sr-only" htmlFor={`${panelId}-zip`}>
              ZIP code
            </label>
            <div className="flex gap-2">
              <input
                aria-describedby={messageId}
                autoComplete="postal-code"
                className="min-w-0 flex-1 rounded-[10px] border border-po-on-dark/30 bg-[#111313] px-3 py-2.5 font-display text-base text-po-on-dark outline-none placeholder:text-po-on-dark-muted focus-visible:border-po-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-brand"
                id={`${panelId}-zip`}
                inputMode="numeric"
                maxLength={5}
                onChange={(event) => {
                  setZip(event.target.value.replace(/\D/g, "").slice(0, 5));
                  setMessage("");
                }}
                onFocus={() => {
                  panelOwnsFocusRef.current = true;
                  keepHoverOpen();
                }}
                pattern="[0-9]{5}"
                placeholder="ENTER YOUR ZIP CODE HERE"
                ref={inputRef}
                type="text"
                value={zip}
              />
              <button
                className="shrink-0 rounded-[10px] bg-po-brand px-4 py-2.5 font-display text-sm font-semibold uppercase text-[#04342c] hover:bg-po-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-brand"
                type="submit"
              >
                GO
              </button>
            </div>
          </form>

          <button
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] border border-po-brand px-3 py-2.5 font-display text-xs font-semibold uppercase text-po-brand transition-colors hover:bg-po-brand hover:text-po-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-brand disabled:cursor-wait disabled:opacity-70"
            disabled={locating}
            onClick={useLocation}
            type="button"
          >
            <LocationPin className="h-4 w-4 shrink-0" />
            {locating ? "Locating..." : "Use My Location"}
          </button>

          <p
            aria-live="polite"
            className="mt-2 min-h-5 text-xs leading-5 text-po-on-dark-muted"
            id={messageId}
          >
            {message}
          </p>
        </div>
      ) : null}
    </li>
  );
}
