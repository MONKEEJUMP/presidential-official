"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";

import type {
  LocatorApiError,
  LocatorApiResponse,
  LocatorResult,
  LocatorStateCode,
} from "@/lib/locator/types";
import type { LocatorInitialSearch } from "@/lib/locator/inbound-search";

import styles from "./locator-console.module.css";

type SearchPayload =
  | { zip: string }
  | { latitude: number; longitude: number };

type LocatorConsoleProps = {
  readonly className?: string;
  readonly displayMode?: "full" | "results-only";
  readonly heading?: string;
  readonly initialSearch?: LocatorInitialSearch;
  readonly missionControlIntro?: boolean;
  readonly state?: LocatorStateCode;
};

type LocatorReadoutProps = {
  readonly compact?: boolean;
  readonly results: readonly LocatorResult[];
  readonly searching: boolean;
};

function delay(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isNullablePhone(value: unknown): value is string | null {
  return (
    value === null ||
    (typeof value === "string" && /^\+?[0-9().\s-]{7,24}$/.test(value))
  );
}

function isLocatorResult(value: unknown): value is LocatorResult {
  if (!isRecord(value)) return false;

  return (
    Number.isSafeInteger(value.id) &&
    Number(value.id) > 0 &&
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.address) &&
    isNonEmptyString(value.city) &&
    isNonEmptyString(value.state) &&
    typeof value.zip === "string" &&
    /^\d{5}$/.test(value.zip) &&
    isNullablePhone(value.phone) &&
    (value.website === null || isNonEmptyString(value.website)) &&
    typeof value.distance_miles === "number" &&
    Number.isFinite(value.distance_miles) &&
    value.distance_miles >= 0
  );
}

function parseLocatorApiPayload(
  value: unknown,
  expectedState?: LocatorStateCode,
): LocatorApiResponse | LocatorApiError | undefined {
  if (!isRecord(value)) return undefined;

  if (typeof value.error === "string" && value.error.trim().length > 0) {
    return { error: value.error };
  }

  if (
    Array.isArray(value.results) &&
    value.results.length <= 25 &&
    value.results.every(
      (result) =>
        isLocatorResult(result) &&
        (expectedState === undefined || result.state === expectedState),
    )
  ) {
    return { results: value.results };
  }

  return undefined;
}

function LocatorReadout({
  compact = false,
  results,
  searching,
}: LocatorReadoutProps) {
  return (
    <div
      className={`${styles.readout} ${compact ? styles.inlineReadout : ""}`}
    >
      {searching ? (
        <div
          aria-label="Scanning for nearby retailers"
          className={styles.radar}
          role="status"
        >
          <span className={styles.radarBeam} />
          <span className={styles.radarPing} />
        </div>
      ) : null}

      {!searching && results.length > 0 ? (
        <div className={styles.resultsRegion}>
          <div className={styles.resultsHeading}>
            <p>Signal acquired</p>
            <span>{results.length} locations</span>
          </div>
          <ol className={styles.resultsList}>
            {results.map((result) => (
              <li className={styles.resultCard} key={result.id}>
                <div>
                  <h2>{result.name}</h2>
                  <address>
                    {result.address}
                    <br />
                    {result.city}, {result.state} {result.zip}
                  </address>
                  {result.phone ? (
                    <a href={`tel:${result.phone}`}>{result.phone}</a>
                  ) : null}
                </div>
                <span className={styles.distance}>
                  {result.distance_miles.toFixed(1)} MI
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}

export function LocatorConsole({
  className = "",
  displayMode = "full",
  heading,
  initialSearch,
  missionControlIntro = false,
  state,
}: LocatorConsoleProps) {
  const zipInputId = useId();
  const messageId = useId();
  const [zip, setZip] = useState(() =>
    initialSearch && "zip" in initialSearch ? initialSearch.zip : "",
  );
  const [results, setResults] = useState<readonly LocatorResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);
  const autoSearchKey = useRef("");
  const inboundSearchKey = useRef("");
  const requestNumber = useRef(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  async function locate(payload: SearchPayload) {
    const currentRequest = ++requestNumber.current;
    setSearching(true);
    setMessage("");
    const request = fetch("/api/dispensaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state ? { ...payload, state } : payload),
    });

    try {
      const [response] = await Promise.all([
        request,
        reducedMotion ? Promise.resolve() : delay(800),
      ]);
      const data = parseLocatorApiPayload(await response.json(), state);
      if (currentRequest !== requestNumber.current) return;
      if (!data) {
        setResults([]);
        setMessage("Locator service is temporarily unavailable.");
      } else if (!response.ok || "error" in data) {
        setResults([]);
        setMessage(
          "error" in data
            ? data.error
            : "Locator service is temporarily unavailable.",
        );
      } else if (data.results.length === 0) {
        setResults([]);
        setMessage("Nearest retailers are unavailable for this location.");
      } else {
        setResults(data.results);
      }
    } catch {
      if (currentRequest === requestNumber.current) {
        setResults([]);
        setMessage("Locator service is temporarily unavailable.");
      }
    } finally {
      if (currentRequest === requestNumber.current) setSearching(false);
    }
  }

  useEffect(() => {
    if (!initialSearch) return;

    if ("zip" in initialSearch) {
      const key = `${state || "ALL"}:zip:${initialSearch.zip}`;
      if (inboundSearchKey.current === key) return;
      inboundSearchKey.current = key;
      autoSearchKey.current = "";
      setZip(initialSearch.zip);
      setMessage("");
      return;
    }

    const key = `${state || "ALL"}:coords:${initialSearch.latitude}:${initialSearch.longitude}`;
    if (inboundSearchKey.current === key) return;
    inboundSearchKey.current = key;
    void locate(initialSearch);
    // locate is intentionally keyed by the validated inbound search values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSearch, state]);

  useEffect(() => {
    const key = `${state || "ALL"}:${zip}`;
    if (zip.length !== 5 || autoSearchKey.current === key) return;
    const timer = window.setTimeout(() => {
      autoSearchKey.current = key;
      void locate({ zip });
    }, 120);
    return () => window.clearTimeout(timer);
    // locate is intentionally keyed by the stable search inputs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zip, state]);

  function submitZip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{5}$/.test(zip)) {
      setMessage("Enter a valid five-digit ZIP code.");
      return;
    }
    autoSearchKey.current = `${state || "ALL"}:${zip}`;
    void locate({ zip });
  }

  function useLocation() {
    setMessage("");
    if (!("geolocation" in navigator)) {
      setMessage("Location is unavailable. Enter a ZIP code instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        void locate({
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      () =>
        setMessage(
          "Location permission was not available. Enter a ZIP code instead.",
        ),
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    );
  }

  function clearFinder() {
    requestNumber.current += 1;
    autoSearchKey.current = "";
    setZip("");
    setResults([]);
    setSearching(false);
    setMessage("");
  }

  if (displayMode === "results-only") {
    return (
      <div className={`${styles.inlineResults} ${className}`}>
        <p aria-live="polite" className={styles.message} id={messageId}>
          {message}
        </p>
        <LocatorReadout compact results={results} searching={searching} />
      </div>
    );
  }

  return (
    <div className={className}>
      {missionControlIntro ? (
        <div className={styles.missionIntro}>
          <p className={styles.missionEyebrow}>Mission Control</p>
          <h2 className={styles.missionTitle}>Drop Your Coordinates.</h2>
          <p className={styles.missionSupport}>
            Find licensed retailers carrying Presidential products in your orbit.
          </p>
        </div>
      ) : null}
      {heading ? <p className={styles.heading}>{heading}</p> : null}
      <div
        className={
          missionControlIntro
            ? `${styles.controlGrid} ${styles.missionControlGrid} po-gold-thread-inlay`
            : styles.controlGrid
        }
      >
        <div className={styles.console}>
          <form className={styles.searchForm} onSubmit={submitZip}>
            <label htmlFor={zipInputId}>ENTER YOUR ZIP CODE HERE</label>
            <div className={styles.inputRow}>
              <input
                aria-describedby={messageId}
                autoComplete="postal-code"
                className="presidential-locator-zip-input"
                id={zipInputId}
                inputMode="numeric"
                maxLength={5}
                onChange={(event) => {
                  setZip(event.target.value.replace(/\D/g, "").slice(0, 5));
                  setMessage("");
                }}
                pattern="[0-9]{5}"
                placeholder="00000"
                type="text"
                value={zip}
              />
              <button
                aria-label="Go — search dispensaries"
                disabled={searching}
                type="submit"
              >
                GO!
              </button>
            </div>
            <style jsx>{`
              .presidential-locator-zip-input::placeholder {
                font-size: clamp(0.82rem, 3.6cqi, 1.35rem);
              }
            `}</style>
          </form>

          <div className={styles.actionRow}>
            <button
              className={styles.locationButton}
              onClick={clearFinder}
              type="button"
            >
              Clear
            </button>
            <button
              className={styles.locationButton}
              disabled={searching}
              onClick={useLocation}
              type="button"
            >
              Use My Location
            </button>
          </div>

          <p className={styles.repeatCta}>ENTER YOUR ZIP CODE HERE</p>

          <p aria-live="polite" className={styles.message} id={messageId}>
            {message}
          </p>
        </div>

        <LocatorReadout results={results} searching={searching} />
      </div>
    </div>
  );
}
