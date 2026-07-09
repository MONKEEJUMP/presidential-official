import { PageFrame, Scene, SceneStack } from "@/components/presidential";
import { CtaLink } from "@/components/presidential/primitives/cta-link";
import { SectionHeading } from "@/components/presidential/primitives/section-heading";

type LocatorTemplateShellProps = {
  readonly title: string;
  readonly description: string;
  readonly scopeLabel: string;
  readonly scopeValue: string;
};

export function LocatorTemplateShell({
  title,
  description,
  scopeLabel,
  scopeValue,
}: LocatorTemplateShellProps) {
  return (
    <PageFrame>
      <SceneStack>
        <Scene ariaLabelledBy="presidential-locator-template-title" tone="default">
          <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)] lg:items-start">
            <div className="grid gap-6">
              <SectionHeading
                as="h1"
                description={description}
                id="presidential-locator-template-title"
                title={title}
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <CtaLink href="/find-us" variant="primary">
                  Return to Find Us
                </CtaLink>
              </div>
            </div>
            <aside className="border border-po-line bg-po-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-normal text-po-brand">
                {scopeLabel}
              </p>
              <p className="mt-3 text-xl font-semibold text-po-ink">
                {scopeValue}
              </p>
              <p className="mt-4 text-sm leading-6 text-po-body">
                Verified retailer records are required before local results are
                shown.
              </p>
            </aside>
          </div>
        </Scene>

        <Scene ariaLabelledBy="presidential-locator-data-boundary" tone="quiet">
          <div className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-3">
            <article className="border border-po-line bg-po-canvas p-5">
              <h2
                className="text-xl font-semibold leading-snug text-po-ink"
                id="presidential-locator-data-boundary"
              >
                Verified source required
              </h2>
              <p className="mt-3 text-sm leading-6 text-po-body">
                Local listings appear only after retailer records are confirmed
                for licensed retail use.
              </p>
            </article>
            <article className="border border-po-line bg-po-canvas p-5">
              <h2 className="text-xl font-semibold leading-snug text-po-ink">
                No customer rows
              </h2>
              <p className="mt-3 text-sm leading-6 text-po-body">
                Customer or account rows are not used as public retailer
                listings.
              </p>
            </article>
            <article className="border border-po-line bg-po-canvas p-5">
              <h2 className="text-xl font-semibold leading-snug text-po-ink">
                Retailer-dependent
              </h2>
              <p className="mt-3 text-sm leading-6 text-po-body">
                Product availability varies by licensed retailer and location.
              </p>
            </article>
          </div>
        </Scene>
      </SceneStack>
    </PageFrame>
  );
}
