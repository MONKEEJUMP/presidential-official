import Link from "next/link";

import { ContactInquiryForm } from "@/app/contact/contact-inquiry-form";
import { PRESIDENTIAL_STATES } from "@/lib/find-us/states";
import type { LocatorInitialSearch } from "@/lib/locator/inbound-search";
import { readLocatorStateCounts } from "@/lib/locator/state-counts";
import { isLocatorStateCode } from "@/lib/locator/types";
import type { SeoRouteRecord } from "@/lib/seo/route-types";

import { PageFrame } from "../layout/page-frame";
import { LocatorConsole } from "../locator/locator-console";
import { Scene } from "../layout/scene";
import { SceneStack } from "../layout/scene-stack";
import { FindUsNationwideVideo } from "../media/find-us-nationwide-video";
import { CtaLink } from "../primitives/cta-link";
import {
  CinematicStateWall,
  type CinematicStateWallState,
} from "./cinematic-state-wall";
import { DispensariesStyleHero } from "./dispensaries-style-hero";
import { UsMapShell } from "./us-map-shell";

type SupportBreadcrumb = {
  readonly name: string;
  readonly path: string;
};

type SupportPanel = {
  readonly title: string;
  readonly body: string;
};

type SupportCallout = {
  readonly title: string;
  readonly body: string;
  readonly items: readonly string[];
};

type SupportRouteFoundationShellProps = {
  readonly route: SeoRouteRecord;
  readonly breadcrumbs: readonly SupportBreadcrumb[];
  readonly links: readonly SeoRouteRecord[];
  readonly panels: readonly SupportPanel[];
  readonly supportCallout: SupportCallout | null;
  readonly contactInquiryConfigured: boolean;
  readonly heroVariant?: "dispensaries";
  readonly locatorInitialSearch?: LocatorInitialSearch;
};

export async function SupportRouteFoundationShell({
  route,
  breadcrumbs,
  links,
  panels,
  supportCallout,
  contactInquiryConfigured,
  heroVariant,
  locatorInitialSearch,
}: SupportRouteFoundationShellProps) {
  if (route.kind !== "contact" && route.kind !== "store_locator") {
    throw new Error(
      "SupportRouteFoundationShell requires a contact or store-locator route record.",
    );
  }

  const stateCounts =
    route.kind === "store_locator" ? await readLocatorStateCounts() : null;
  const stateWallStates: CinematicStateWallState[] = stateCounts
    ? PRESIDENTIAL_STATES.flatMap((state) => {
        if (!isLocatorStateCode(state.code)) return [];
        return [
          {
            code: state.code,
            name: state.name,
            tagline: state.tagline,
            path: `/find-us/${state.slug}`,
            imageSrc: `/media/states/${state.slug}-hero.webp`,
            doorCount: stateCounts[state.code],
          },
        ];
      })
    : [];

  stateWallStates.sort((left, right) => {
    const leftIsLive = left.doorCount !== null && left.doorCount > 0;
    const rightIsLive = right.doorCount !== null && right.doorCount > 0;
    if (leftIsLive !== rightIsLive) return leftIsLive ? -1 : 1;
    if (leftIsLive && rightIsLive) {
      return (right.doorCount ?? 0) - (left.doorCount ?? 0);
    }
    return 0;
  });

  return (
    <PageFrame>
      <SceneStack>
        {heroVariant === "dispensaries" ? (
          <DispensariesStyleHero
            ariaLabelledBy="presidential-route-title"
            breadcrumbs={breadcrumbs}
            eyebrow="Official Presidential"
            leadMedia={
              route.kind === "store_locator" ? <FindUsNationwideVideo /> : undefined
            }
            mediaOnly={route.kind === "store_locator"}
            supportingText={[
              route.description,
              "A focused official section inside the Presidential digital experience for adults 21+ where legal.",
            ]}
            title={route.h1}
          />
        ) : (
          <section
          aria-labelledby="presidential-route-title"
          className="overflow-hidden bg-po-ink text-po-on-dark lg:min-h-[calc(100svh-7rem)]"
          >
            <div className="flex flex-col justify-between gap-14 px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
              <nav aria-label="Breadcrumb" className="text-sm text-po-on-dark-muted">
                <ol className="flex flex-wrap items-center gap-2">
                  {breadcrumbs.map((breadcrumb, index) => {
                    const isCurrent = index === breadcrumbs.length - 1;

                    return (
                      <li className="flex items-center gap-2" key={breadcrumb.path}>
                        {index > 0 ? (
                          <span aria-hidden="true" className="text-po-brand">
                            /
                          </span>
                        ) : null}
                        {isCurrent ? (
                          <span aria-current="page" className="text-po-on-dark">
                            {breadcrumb.name}
                          </span>
                        ) : (
                          <Link
                            className="font-semibold text-po-brand underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-brand"
                            href={breadcrumb.path}
                          >
                            {breadcrumb.name}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </nav>

              {route.kind === "store_locator" ? (
                <FindUsNationwideVideo />
              ) : null}

              <div className="max-w-4xl">
                <p className="text-xs font-black uppercase text-po-brand">
                  Official Presidential
                </p>
                <h1
                  className="mt-5 font-display text-4xl uppercase leading-[0.9] text-po-on-dark sm:text-6xl lg:text-7xl"
                  id="presidential-route-title"
                >
                  {route.h1}
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-po-on-dark-muted">
                  {route.description}
                </p>
                <p className="mt-6 max-w-xl text-sm leading-6 text-po-on-dark-muted">
                  A focused official section inside the Presidential digital
                  experience for adults 21+ where legal.
                </p>
              </div>
            </div>

          </section>
        )}

        {route.kind === "store_locator" ? (
          <section
            aria-label="Find a dispensary"
            className="po-gold-thread-inlay bg-po-ink text-po-on-dark"
            id="presidential-locator-console"
          >
            <div className="mx-auto w-full max-w-7xl px-[clamp(1.25rem,4vw,4rem)] py-[clamp(2rem,4vw,3.5rem)]">
              <LocatorConsole initialSearch={locatorInitialSearch} />
            </div>
          </section>
        ) : null}

        <Scene
          ariaLabelledBy="presidential-route-details"
          className="po-gold-thread-inlay py-24 lg:py-32"
          tone="default"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-14 lg:grid-cols-[minmax(260px,0.55fr)_1fr] lg:gap-20">
            <div>
              <p className="text-xs font-black uppercase text-po-brand-ink">
                Official path
              </p>
              <h2
                className="mt-5 font-display text-4xl uppercase leading-[0.92] text-po-ink sm:text-6xl"
                id="presidential-route-details"
              >
                Inside this section
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-po-body">
                A direct route into the Presidential brand, product, education,
                and retail ecosystem.
              </p>
              <p className="mt-6 text-sm font-medium text-po-muted">
                For adults 21+ where legal.
              </p>
            </div>

            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {panels.map((panel, index) => (
                <article className="border-t border-po-ink pt-5" key={panel.title}>
                  <p className="text-xs font-black text-po-brand-ink">
                    0{index + 1}
                  </p>
                  <h3 className="mt-10 text-xl font-semibold leading-snug text-po-ink">
                    {panel.title}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-po-body">
                    {panel.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </Scene>

        {route.kind === "store_locator" ? (
          <Scene
            ariaLabelledBy="presidential-find-us-map"
            className="po-gold-thread-inlay py-24 lg:py-32"
            tone="contrast"
          >
            <div className="mx-auto grid w-full max-w-7xl gap-14 lg:grid-cols-[minmax(0,0.7fr)_minmax(420px,0.8fr)] lg:items-center lg:gap-20">
              <div>
                <p className="text-xs font-black uppercase text-po-brand">
                  Find Presidential near you
                </p>
                <h2
                  className="mt-5 font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-6xl"
                  id="presidential-find-us-map"
                >
                  Eight states and growing
                </h2>
                <p className="mt-6 max-w-xl text-base leading-7 text-po-on-dark-muted">
                  Choose a state to step into its Presidential experience.
                  Licensed retailer listings publish per state once verified
                  sources are confirmed.
                </p>
              </div>
              <UsMapShell />
            </div>
          </Scene>
        ) : null}

        {route.kind === "store_locator" ? (
          <CinematicStateWall states={stateWallStates} />
        ) : null}

        {supportCallout ? (
          <Scene
            ariaLabelledBy="presidential-support-readiness"
            className="po-gold-thread-inlay py-24 lg:py-32"
            tone="contrast"
          >
            <div className="mx-auto grid w-full max-w-7xl gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(360px,0.65fr)] lg:gap-24">
              <div>
                <p className="text-xs font-black uppercase text-po-brand">
                  First-party retail path
                </p>
                <h2
                  className="mt-5 font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-6xl"
                  id="presidential-support-readiness"
                >
                  {supportCallout.title}
                </h2>
                <p className="mt-6 max-w-xl text-base leading-7 text-po-on-dark-muted">
                  {supportCallout.body}
                </p>
              </div>
              <ul className="border-t border-po-on-dark/20">
                {supportCallout.items.map((item, index) => (
                  <li
                    className="flex gap-5 border-b border-po-on-dark/20 py-6 text-sm font-semibold text-po-on-dark"
                    key={item}
                  >
                    <span aria-hidden="true" className="text-xs font-black text-po-brand">
                      0{index + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Scene>
        ) : null}

        {route.kind === "contact" && contactInquiryConfigured ? (
          <section
            aria-labelledby="presidential-contact-inquiry"
            className="po-gold-thread-inlay bg-po-brand px-6 py-24 text-po-ink sm:px-10 lg:px-16 lg:py-32"
          >
            <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(260px,0.55fr)_1fr] lg:gap-20">
              <div>
                <h2
                  className="font-display text-4xl uppercase leading-[0.92] sm:text-6xl"
                  id="presidential-contact-inquiry"
                >
                  Official inquiry path
                </h2>
              </div>
              <div className="border-t border-po-ink pt-6">
                <p className="max-w-xl text-base leading-7 text-po-brand-ink">
                  Email Presidential directly. Your message is handled by your
                  email provider and is not stored by this website.
                </p>
                <div className="mt-8">
                  <ContactInquiryForm configured={contactInquiryConfigured} />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {links.length > 0 ? (
          <Scene
            ariaLabelledBy="presidential-related-sections"
            className="po-gold-thread-inlay py-24 lg:py-32"
            tone="quiet"
          >
            <div className="mx-auto grid w-full max-w-7xl gap-14 lg:grid-cols-[minmax(260px,0.55fr)_1fr] lg:gap-20">
              <div>
                <h2
                  className="font-display text-4xl uppercase leading-[0.92] text-po-ink sm:text-6xl"
                  id="presidential-related-sections"
                >
                  Explore Presidential
                </h2>
                <p className="mt-6 max-w-md text-base leading-7 text-po-body">
                  Continue through official Presidential sections.
                </p>
              </div>
              <ul className="border-t border-po-line">
                {links.map((link) => (
                  <li className="border-b border-po-line py-5" key={link.id}>
                    <CtaLink
                      className="flex w-full justify-between text-po-ink hover:text-po-brand-ink"
                      href={link.path}
                      variant="text"
                    >
                      <span>{link.h1}</span>
                      <span aria-hidden="true" className="text-po-brand-ink">
                        /
                      </span>
                    </CtaLink>
                  </li>
                ))}
              </ul>
            </div>
          </Scene>
        ) : null}
      </SceneStack>
    </PageFrame>
  );
}
