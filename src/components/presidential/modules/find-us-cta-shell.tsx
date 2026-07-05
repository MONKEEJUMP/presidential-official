import { CtaLink } from "../primitives/cta-link";
import { Scene } from "../layout/scene";
import { SectionHeading } from "../primitives/section-heading";

export function FindUsCtaShell() {
  return (
    <Scene ariaLabelledBy="presidential-find-us-path" tone="quiet">
      <div className="mx-auto grid w-full max-w-6xl gap-6 border border-zinc-200 bg-white p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <SectionHeading
          as="h2"
          description="Use the official retail path to connect Presidential product interest with licensed retailers. Availability varies by licensed retailer."
          id="presidential-find-us-path"
          title="Find Presidential products"
        />
        <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
          <CtaLink href="/find-us" variant="primary">
            View Find Us retail path
          </CtaLink>
        </div>
      </div>
    </Scene>
  );
}
