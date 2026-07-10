import { CtaLink } from "../primitives/cta-link";
import { Scene } from "../layout/scene";

type FindUsCtaShellProps = {
  readonly compact?: boolean;
};

export function FindUsCtaShell({ compact = false }: FindUsCtaShellProps) {
  return (
    <Scene
      ariaLabelledBy="presidential-find-us-path"
      className={compact ? "py-16" : "py-24 lg:py-32"}
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
            className="max-w-4xl font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-6xl lg:text-7xl"
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
          <div className="border-l border-po-brand pl-6 lg:pl-10">
            <p className="font-display text-4xl uppercase leading-none text-po-brand">
              California
            </p>
            <p className="mt-5 text-sm leading-6 text-po-on-dark-muted">
              Verified locations will appear only as approved retailer records become available.
            </p>
          </div>
        )}
      </div>
    </Scene>
  );
}
