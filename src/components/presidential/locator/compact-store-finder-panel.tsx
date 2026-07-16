"use client";

import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useId, useState } from "react";

type CompactStoreFinderPanelProps = {
  readonly className?: string;
  readonly onRoute?: () => void;
};

export function LocationPin({ className = "" }: { readonly className?: string }) {
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

export function CompactStoreFinderPanel({
  className = "",
  onRoute,
}: CompactStoreFinderPanelProps) {
  const pathname = usePathname();
  const router = useRouter();
  const inputId = useId();
  const messageId = useId();
  const [zip, setZip] = useState("");
  const [message, setMessage] = useState("");
  const [locating, setLocating] = useState(false);

  function routeToFinder(params: URLSearchParams) {
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
    <div
      aria-label="Find a Presidential store"
      className={`rounded-[16px] border border-po-brand bg-po-ink p-4 text-po-on-dark shadow-2xl ${className}`}
      role="region"
    >
      <form className="grid gap-3" noValidate onSubmit={submitZip}>
        <p className="font-display text-xs font-semibold uppercase text-po-brand">
          BUY PRESIDENTIAL @ LOCAL DISPO
        </p>
        <label className="sr-only" htmlFor={inputId}>
          ZIP code
        </label>
        <div className="flex gap-2">
          <input
            aria-describedby={messageId}
            autoComplete="postal-code"
            className="min-w-0 flex-1 rounded-[10px] border border-po-on-dark/30 bg-[#111313] px-3 py-2.5 font-display text-base text-po-on-dark outline-none placeholder:text-po-on-dark-muted focus-visible:border-po-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-brand"
            id={inputId}
            inputMode="numeric"
            maxLength={5}
            onChange={(event) => {
              setZip(event.target.value.replace(/\D/g, "").slice(0, 5));
              setMessage("");
            }}
            pattern="[0-9]{5}"
            placeholder="ENTER YOUR ZIP CODE HERE"
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
  );
}
