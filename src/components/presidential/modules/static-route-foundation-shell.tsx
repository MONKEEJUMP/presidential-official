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
        title: "Approved-inbox gated intake",
        body: "The inquiry path stays inactive until the approved inbox is provisioned, and the website does not store inquiry details.",
      },
      {
        title: "Adult-use boundary",
        body: "The contact experience remains informational for adults 21+ where legal while final routing is confirmed.",
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

  if (route.kind === "contact") {
    return {
      title: "Contact readiness",
      body: "This page establishes the official contact destination with a first-party inquiry path that activates only after approved inbox provisioning.",
      items: [
        "Approved inbox required",
        "Spam controls included",
        "No CRM or newsletter embed",
        "No stored submission data",
      ],
    };
  }

  return null;
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

        {route.kind === "contact" ? (
          <Scene ariaLabelledBy="presidential-contact-inquiry" tone="quiet">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
              <SectionHeading
                as="h2"
                description="Prepare an official inquiry without storing the message in this website. The path activates only after the approved inbox is provisioned."
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
