import type { PresidentialStateSiteLink } from "@/lib/find-us/states";
import type { LocatorStateCode } from "@/lib/locator/types";

import { LocatorConsole } from "./locator-console";
import { SalesEmail } from "@/components/contact/sales-email";

type StateLocatorSectionProps = {
  readonly stateCode: LocatorStateCode;
  readonly stateName: string;
  readonly doorCount: number | null;
  readonly stateSiteLink: PresidentialStateSiteLink;
};

function StateSiteSentence({
  stateSiteLink,
}: {
  readonly stateSiteLink: PresidentialStateSiteLink;
}) {
  return (
    <>
      {stateSiteLink.before}
      {stateSiteLink.href ? (
        <a
          className="text-po-brand underline decoration-po-brand underline-offset-4 transition-colors hover:text-po-on-dark focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-brand"
          href={stateSiteLink.href}
        >
          {stateSiteLink.anchor}
        </a>
      ) : (
        stateSiteLink.anchor
      )}
      {stateSiteLink.after}
    </>
  );
}

export function StateLocatorSection({
  stateCode,
  stateName,
  doorCount,
  stateSiteLink,
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
          <p className="mt-6 max-w-xl text-base leading-7 text-po-on-dark-muted">
            <StateSiteSentence stateSiteLink={stateSiteLink} />
          </p>
        </div>
        <SalesEmail variant="strip" prefix="Want Presidential in your store? Email" className="mx-auto max-w-7xl" />
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
            here when live records are available.{" "}
            <StateSiteSentence stateSiteLink={stateSiteLink} />
          </p>
        </div>
        <SalesEmail variant="strip" prefix="Want Presidential in your store? Email" className="mx-auto max-w-7xl" />
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
        <SalesEmail variant="strip" align="left" prefix="Want Presidential in your store? Email" />

        <p className="mt-8 text-sm leading-6 text-po-on-dark-muted">
          <StateSiteSentence stateSiteLink={stateSiteLink} />{" "}
          Availability varies by licensed retailer. For adults 21+ where legal.
        </p>
      </div>
    </section>
  );
}
