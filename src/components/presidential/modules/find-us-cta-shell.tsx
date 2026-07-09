import { CtaLink } from "../primitives/cta-link";
import { Scene } from "../layout/scene";
import { SectionHeading } from "../primitives/section-heading";

export function FindUsCtaShell() {
  return (
    <Scene ariaLabelledBy="presidential-find-us-path" tone="quiet">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1fr)] lg:items-center">
        <div className="flex flex-col gap-6">
          <SectionHeading
            as="h2"
            description="Use the official retail path to connect Presidential product interest with licensed retailers. Availability varies by licensed retailer."
            id="presidential-find-us-path"
            title="Find Presidential products"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <CtaLink href="/find-us" variant="primary">
              View Find Us retail path
            </CtaLink>
            <CtaLink href="/contact" variant="secondary">
              Contact Presidential
            </CtaLink>
          </div>
        </div>

        <div className="relative overflow-hidden border border-zinc-200 bg-white p-5 shadow-sm">
          <div
            aria-hidden="true"
            className="grid min-h-72 grid-cols-5 gap-2 border border-zinc-100 bg-zinc-50 p-4"
          >
            {Array.from({ length: 25 }).map((_, index) => (
              <span
                className={[
                  "min-h-10 border border-zinc-200 bg-white",
                  index === 6 || index === 12 || index === 18
                    ? "bg-emerald-900"
                    : "",
                  index === 8 || index === 16 ? "bg-amber-300" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={index}
              />
            ))}
          </div>
          <div className="absolute inset-x-8 bottom-8 border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-normal text-emerald-800">
              Retail path
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-700">
              Retail discovery will use verified licensed retailer records.
              Availability varies by licensed retailer.
            </p>
          </div>
        </div>
      </div>
    </Scene>
  );
}
