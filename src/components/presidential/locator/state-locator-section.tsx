import type { LocatorStateCode } from "@/lib/locator/types";

import { LocatorConsole } from "./locator-console";

type StateLocatorSectionProps = {
  readonly stateCode: LocatorStateCode;
  readonly stateName: string;
  readonly doorCount: number | null;
};

export function StateLocatorSection({
  stateCode,
  stateName,
  doorCount,
}: StateLocatorSectionProps) {
  const headingId = `presidential-${stateCode.toLowerCase()}-locator`;

  if (doorCount === null) {
    return (
      <section
        aria-labelledby={headingId}
        className="po-gold-thread-inlay bg-po-ink px-6 py-20 text-po-on-dark sm:px-10 lg:px-16 lg:py-28"
      >
        <div className="mx-auto w-full max-w-7xl border border-po-brand/30 bg-[#111313] px-6 py-12 sm:px-10 sm:py-16">
          <p className="text-xs font-black uppercase text-po-brand">
            Presidential in {stateName}
          </p>
          <h2
            className="mt-5 font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-6xl"
            id={headingId}
          >
            Locator status unavailable
          </h2>
        </div>
      </section>
    );
  }

  if (doorCount <= 0) {
    return (
      <section
        aria-labelledby={headingId}
        className="po-gold-thread-inlay bg-po-ink px-6 py-20 text-po-on-dark sm:px-10 lg:px-16 lg:py-28"
      >
        <div className="mx-auto w-full max-w-7xl border border-po-brand/30 bg-[#111313] px-6 py-12 sm:px-10 sm:py-16">
          <p className="text-xs font-black uppercase text-po-brand">
            Presidential in {stateName}
          </p>
          <h2
            className="mt-5 font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-6xl"
            id={headingId}
          >
            LANDING SOON
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-po-on-dark-muted">
            Verified licensed retailer listings for {stateName} will appear
            here when live records are available.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      className="po-gold-thread-inlay bg-po-ink px-6 py-20 text-po-on-dark sm:px-10 lg:px-16 lg:py-28"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-8 border border-po-brand/30 bg-[#111313] px-6 py-10 sm:px-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase text-po-brand">
              Verified licensed retail
            </p>
            <h2
              className="mt-5 font-display text-3xl uppercase leading-[0.95] text-po-on-dark sm:text-5xl"
              id={headingId}
            >
              Find Presidential in {stateName}
            </h2>
          </div>
          <div
            aria-label={`${doorCount} live retailer doors in ${stateName}`}
            className="border-t border-po-brand/40 pt-5 lg:min-w-56 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"
          >
            <p className="font-display text-5xl leading-none text-po-brand sm:text-6xl">
              {doorCount.toLocaleString("en-US")}
            </p>
            <p className="mt-2 text-xs font-black uppercase text-po-on-dark-muted">
              Live retailer doors
            </p>
          </div>
        </div>

        <div className="po-gold-thread-inlay pt-12 lg:pt-16">
          <LocatorConsole
            heading={`Search ${stateName}`}
            state={stateCode}
          />
        </div>

        <p className="mt-8 text-sm leading-6 text-po-on-dark-muted">
          Availability varies by licensed retailer. For adults 21+ where legal.
        </p>
      </div>
    </section>
  );
}
