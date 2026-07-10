import Link from "next/link";

import { isContactInquiryConfigured } from "@/app/contact/contact-inquiry-config";
import { ContactInquiryForm } from "@/app/contact/contact-inquiry-form";
import type { SeoRouteRecord } from "@/lib/seo/route-types";

import { PageFrame } from "../layout/page-frame";
import { Scene } from "../layout/scene";
import { SceneStack } from "../layout/scene-stack";
import { MediaSlot } from "../media/media-slot";
import { CtaLink } from "../primitives/cta-link";
import { SectionHeading } from "../primitives/section-heading";

type StaticRouteBreadcrumb = {
  readonly name: string;
  readonly path: string;
};

type StaticRouteFoundationShellProps = {
  readonly route: SeoRouteRecord;
  readonly breadcrumbs: readonly StaticRouteBreadcrumb[];
  readonly links: readonly SeoRouteRecord[];
};

type StaticRoutePanel = {
  readonly title: string;
  readonly body: string;
};

type StaticRouteCallout = {
  readonly title: string;
  readonly body: string;
  readonly items: readonly string[];
};

function getRouteBackgroundImagePath(route: SeoRouteRecord): "/brand/banner-about-us-contact-header.webp" | "/brand/banner-palms-teal.webp" {
  return route.kind === "brand_story" || route.kind === "contact"
    ? "/brand/banner-about-us-contact-header.webp"
    : "/brand/banner-palms-teal.webp";
}

function getRoutePanels(route: SeoRouteRecord): readonly StaticRoutePanel[] {
  if (route.kind === "store_locator") {
    return [
      {
        title: "Verified retailer records",
        body: "Retailer listings appear only after the source records are verified for licensed retail use.",
      },
      {
        title: "Local route structure",
        body: "State, city, and retailer detail routes are planned for verified records, not customer-account rows.",
      },
      {
        title: "Availability boundary",
        body: "Product availability stays framed as retailer-dependent until approved retailer data is connected.",
      },
    ];
  }

  if (route.kind === "brand_story") {
    return [
      {
        title: "Official story",
        body: "Presidential is presented as the parent brand behind Moon Rocks, pre-rolls, blunts, Moon Pods, and Orbit.",
      },
      {
        title: "Brand context",
        body: "The story connects the company, the products, and the official retail path in one first-party source.",
      },
    ];
  }

  if (route.kind === "learn_hub") {
    return [
      {
        title: "Education hub",
        body: "Guides explain Moon Rocks, infused pre-rolls, live resin, live rosin, liquid diamonds, and Orbit in plain language.",
      },
      {
        title: "Product context",
        body: "Learning paths connect directly to Presidential product platforms and the retail path.",
      },
    ];
  }

  if (route.kind === "contact") {
    return [
      {
        title: "Official contact path",
        body: "Customer care, wholesale, press, and brand inquiries stay organized under one official Presidential route.",
      },
      {
        title: "Official brand channels",
        body: "Official Presidential contact details will appear here when they are available.",
      },
      {
        title: "Adult-use boundary",
        body: "This informational website is intended for adults 21+ where legal.",
      },
    ];
  }

  return [
    {
      title: "Product information",
      body: "Explore Presidential product platforms, related education, and the retail path from one official page.",
    },
    {
      title: "Official source path",
      body: "Each product platform connects back to the brand, the learning hub, and licensed retailer discovery.",
    },
  ];
}

function getRouteSupportCallout(route: SeoRouteRecord): StaticRouteCallout | null {
  if (route.kind === "store_locator") {
    return {
      title: "Locator readiness",
      body: "Find authentic Presidential products through a first-party retail path once verified retailer records are ready. This page does not expose unverified retailer rows or generate local listing pages.",
      items: [
        "Verified retailer source required",
        "State and city pages stay gated",
        "Retailer detail pages stay gated",
        "Local listing markup stays off",
      ],
    };
  }

  return null;
}

function EditorialRouteFoundationShell({
  route,
  breadcrumbs,
  links,
  panels,
}: StaticRouteFoundationShellProps & {
  readonly panels: readonly StaticRoutePanel[];
}) {
  return (
    <PageFrame>
      <SceneStack>
        <section
          aria-labelledby="presidential-route-title"
          className="grid overflow-hidden bg-po-ink text-po-on-dark lg:min-h-[calc(100svh-7rem)] lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.62fr)]"
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

          <div className="relative min-h-64 bg-po-brand lg:min-h-full">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[url('/brand/banner-palms-teal.webp')] bg-[length:auto_190%] bg-left bg-no-repeat opacity-55"
            />
            <div
              aria-label="Presidential"
              className="po-brand-mark absolute inset-10 bg-contain bg-center bg-no-repeat"
              role="img"
            />
          </div>
        </section>

        <Scene
          ariaLabelledBy="presidential-route-details"
          className="py-24 lg:py-32"
          tone="default"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-14 lg:grid-cols-[minmax(260px,0.55fr)_1fr] lg:gap-20">
            <div>
              <p className="text-xs font-black uppercase text-po-brand-ink">
                Official context
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

            <div className="grid gap-10 sm:grid-cols-2">
              {panels.map((panel, index) => (
                <article className="border-t border-po-ink pt-5" key={panel.title}>
                  <p className="text-xs font-black text-po-brand-ink">
                    0{index + 1}
                  </p>
                  <h3 className="mt-10 text-2xl font-semibold leading-snug text-po-ink">
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

        {links.length > 0 ? (
          <Scene
            ariaLabelledBy="presidential-related-sections"
            className="py-24 lg:py-32"
            tone="contrast"
          >
            <div className="mx-auto grid w-full max-w-7xl gap-14 lg:grid-cols-[minmax(260px,0.55fr)_1fr] lg:gap-20">
              <div>
                <p className="text-xs font-black uppercase text-po-brand">
                  Continue the official path
                </p>
                <h2
                  className="mt-5 font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-6xl"
                  id="presidential-related-sections"
                >
                  Explore Presidential
                </h2>
                <p className="mt-6 max-w-md text-base leading-7 text-po-on-dark-muted">
                  Continue through official Presidential sections.
                </p>
              </div>
              <ul className="border-t border-po-on-dark/20">
                {links.map((link) => (
                  <li className="border-b border-po-on-dark/20" key={link.id}>
                    <CtaLink
                      className="flex w-full justify-between border-0 px-0 py-5 text-left text-po-on-dark hover:text-po-brand"
                      href={link.path}
                      variant="text"
                    >
                      <span>{link.h1}</span>
                      <span aria-hidden="true" className="text-po-brand">
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

export function StaticRouteFoundationShell({
  route,
  breadcrumbs,
  links,
}: StaticRouteFoundationShellProps) {
  const panels = getRoutePanels(route);
  const supportCallout = getRouteSupportCallout(route);
  const contactInquiryConfigured =
    route.kind === "contact" ? isContactInquiryConfigured() : false;

  if (route.kind === "brand_story" || route.kind === "learn_hub") {
    return (
      <EditorialRouteFoundationShell
        breadcrumbs={breadcrumbs}
        links={links}
        panels={panels}
        route={route}
      />
    );
  }

  return (
    <PageFrame>
      <SceneStack>
        <Scene ariaLabelledBy="presidential-route-title" tone="default">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
            {breadcrumbs.length > 1 ? (
              <nav aria-label="Breadcrumb" className="text-sm text-po-muted">
                <ol className="flex flex-wrap items-center gap-2">
                  {breadcrumbs.map((breadcrumb, index) => {
                    const isCurrent = index === breadcrumbs.length - 1;

                    return (
                      <li key={breadcrumb.path} className="flex items-center gap-2">
                        {index > 0 ? (
                          <span aria-hidden="true" className="text-po-subtle">
                            /
                          </span>
                        ) : null}
                        {isCurrent ? (
                          <span aria-current="page" className="text-po-body">
                            {breadcrumb.name}
                          </span>
                        ) : (
                          <Link
                            href={breadcrumb.path}
                            className="font-medium text-po-brand-ink underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-brand"
                          >
                            {breadcrumb.name}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            ) : null}

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] lg:items-center">
              <div className="flex flex-col gap-6">
                <SectionHeading
                  as="h1"
                  description={route.description}
                  id="presidential-route-title"
                  kicker="Official Presidential"
                  title={route.h1}
                />
                <p className="max-w-2xl text-sm leading-6 text-po-muted">
                  A focused official section inside the Presidential digital
                  experience for adults 21+ where legal.
                </p>
              </div>

              <MediaSlot
                aspectClassName="aspect-[4/3]"
                backgroundImagePath={getRouteBackgroundImagePath(route)}
                kind="wireframe_media_block"
                label={`${route.h1} media`}
                note="Presidential section visual"
              />
            </div>
          </div>
        </Scene>

        <Scene ariaLabelledBy="presidential-route-details" tone="quiet">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
            <SectionHeading
              as="h2"
              description="A direct route into the Presidential brand, product, education, and retail ecosystem."
              id="presidential-route-details"
              title="Inside this section"
            />
            <div className="grid gap-4 md:grid-cols-3">
              {panels.map((panel) => (
                <article
                  className="border border-po-line bg-po-canvas p-5"
                  key={panel.title}
                >
                  <h3 className="text-xl font-semibold leading-snug text-po-ink">
                    {panel.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-po-body">
                    {panel.body}
                  </p>
                </article>
              ))}
            </div>
            <p className="text-sm font-medium text-po-muted">
              For adults 21+ where legal.
            </p>
          </div>
        </Scene>

        {supportCallout ? (
          <Scene ariaLabelledBy="presidential-support-readiness" tone="default">
            <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(320px,0.58fr)] lg:items-start">
              <div className="border border-po-brand-line bg-po-brand-soft p-6">
                <SectionHeading
                  as="h2"
                  description={supportCallout.body}
                  id="presidential-support-readiness"
                  title={supportCallout.title}
                />
              </div>
              <ul className="grid gap-3">
                {supportCallout.items.map((item) => (
                  <li
                    className="border border-po-line bg-po-canvas px-4 py-3 text-sm font-semibold text-po-ink"
                    key={item}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Scene>
        ) : null}

        {route.kind === "contact" && contactInquiryConfigured ? (
          <Scene ariaLabelledBy="presidential-contact-inquiry" tone="quiet">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
              <SectionHeading
                as="h2"
                description="Email Presidential directly. Your message is handled by your email provider and is not stored by this website."
                id="presidential-contact-inquiry"
                title="Official inquiry path"
              />
              <ContactInquiryForm configured={contactInquiryConfigured} />
            </div>
          </Scene>
        ) : null}

        {links.length > 0 ? (
          <Scene ariaLabelledBy="presidential-related-sections" tone="default">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
              <SectionHeading
                as="h2"
                description="Continue through official Presidential sections."
                id="presidential-related-sections"
                title="Explore Presidential"
              />
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {links.map((link) => (
                  <li key={link.id}>
                    <CtaLink href={link.path} variant="secondary">
                      {link.h1}
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
