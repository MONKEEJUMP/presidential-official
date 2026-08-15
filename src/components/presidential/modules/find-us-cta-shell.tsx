import Link from "next/link";

import { CtaLink } from "../primitives/cta-link";
import { Scene } from "../layout/scene";

type FindUsCtaShellProps = {
  readonly compact?: boolean;
  readonly className?: string;
};

const FIND_US_STATE_LINKS = [
  { href: "/find-us/az", label: "Arizona" },
  { href: "/find-us/ca", label: "California" },
  { href: "/find-us/mi", label: "Michigan" },
  { href: "/find-us/nv", label: "Nevada" },
  { href: "/find-us/ny", label: "New York" },
  { href: "/find-us/ok", label: "Oklahoma" },
  { href: "/find-us/wa", label: "Washington" },
] as const;

export function FindUsCtaShell({
  compact = false,
  className = "",
}: FindUsCtaShellProps) {
  return (
    <Scene
      ariaLabelledBy="presidential-find-us-path"
      className={[className, compact ? "py-16" : "py-24 lg:py-32"]
        .filter(Boolean)
        .join(" ")}
      tone="contrast"
    >
      <div
        className={[
          "mx-auto w-full max-w-7xl",
          compact ? "" : "grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.5fr)] lg:items-end",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div>
          <h2
            className={
              compact
                ? "max-w-4xl font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-6xl lg:text-7xl"
                : "max-w-[12ch] font-display text-[clamp(3.25rem,6vw,6rem)] font-bold uppercase leading-[0.86] text-po-on-dark"
            }
            id="presidential-find-us-path"
          >
            Find Presidential products.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-7 text-po-on-dark-muted">
            Use the official retail path to connect product interest with
            verified licensed retailer information. Availability varies by retailer.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CtaLink href="/find-us" variant="primary">
              View the Find Us path
            </CtaLink>
            <CtaLink href="/contact" variant="contrast">
              Contact Presidential
            </CtaLink>
          </div>
        </div>

        {compact ? null : (
          <div className="po-gold-thread-inlay-vertical self-stretch pl-6 lg:pl-10">
            <ul className="flex h-full flex-col justify-between gap-3">
              {FIND_US_STATE_LINKS.map((state) => (
                <li key={state.href}>
                  <Link
                    className="block font-display text-4xl uppercase leading-none text-po-brand transition-colors hover:text-po-on-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-brand"
                    href={state.href}
                  >
                    {state.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Scene>
  );
}
