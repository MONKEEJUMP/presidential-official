import Link from "next/link";

import { isContactInquiryConfigured } from "@/app/contact/contact-inquiry-config";
import type { LocatorInitialSearch } from "@/lib/locator/inbound-search";
import type { SeoRouteRecord } from "@/lib/seo/route-types";

import { PageFrame } from "../layout/page-frame";
import { Scene } from "../layout/scene";
import { SceneStack } from "../layout/scene-stack";
import { MediaSlot } from "../media/media-slot";
import { CtaLink } from "../primitives/cta-link";
import { InContentText } from "../primitives/in-content-text";
import { SectionHeading } from "../primitives/section-heading";
import { DispensariesStyleHero } from "./dispensaries-style-hero";
import { LearnGuideIndex } from "./learn-guide-discovery";
import { OurStoryPrerollGraphicsGrid } from "./our-story-preroll-graphics-grid";
import { OurStoryAuthoritySources } from "./our-story-authority-sources";
import { RepoOwnedPageCopy } from "./repo-owned-page-copy";
import { SupportRouteFoundationShell } from "./support-route-foundation-shell";

type StaticRouteBreadcrumb = {
  readonly name: string;
  readonly path: string;
};

type StaticRouteFoundationShellProps = {
  readonly route: SeoRouteRecord;
  readonly breadcrumbs: readonly StaticRouteBreadcrumb[];
  readonly links: readonly SeoRouteRecord[];
  readonly locatorInitialSearch?: LocatorInitialSearch;
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
        title: "Find the real thing",
        body: "Every location here is an official, licensed Presidential retailer — verified at the source. No scraped lists, no lookalikes, no dead ends. When you find us, you find the real house stocking the real product. Authenticity, confirmed before you ever walk in the door.",
      },
      {
        title: "Find your nearest door",
        body: "One search, one job: getting you from your zip code to the closest Presidential, fast. Search from downtown LA or the middle of Montana — we rank the nearest official retailers by distance and point the way. Coast to coast, your next Presidential run is always one search away.",
      },
      {
        title: "Find it all, right here",
        body: "This is the official home of everything Presidential — the products, the story, the standard, and the shops that carry it. Explore the lineup, learn the craft, then find your closest door. Stock shifts by store and by day, so lock the final details with your retailer. Everything Presidential, all in one place.",
      },
    ];
  }

  if (route.id === "our-story") {
    return [
      {
        title: "Where it started",
        body: "Los Angeles, 2012. Founders Everett Smith and John Zapp built cannabis the way the great houses build anything worth owning — obsessively, no shortcuts. They didn't just launch a brand; they helped father the infused-product category in Southern California. Presidential was premium before 'premium cannabis' was a phrase.",
      },
      {
        title: "How it's built",
        body: "A Presidential Moon Rock isn't flower with a dusting on top. It's the Presidential Infusion System™ — premium flower, rich resin, and a coat of the finest kief, fused into one complete product. Three layers, one hit, engineered for flavor and strength you actually feel. That's what Cannabis Evolved means — and why Moon Rocks earned the name.",
      },
      {
        title: "The reputation",
        body: "Presidential became the house behind the World's Strongest™ pre-rolls and the moon rock blunt the whole market tried to copy — carried across 400+ licensed California retailers. The reputation wasn't marketed into existence. It was earned, one pack at a time.",
      },
      {
        title: "The culture",
        body: "Presidential never stayed in its lane. In West Hollywood, it opened Esco's — a New York-style pizzeria — and the Presidential Suite, a speakeasy-style lounge you enter through an NYC subway car built inside the restaurant. A brand this obsessed with experience was never going to stop at the product.",
      },
      {
        title: "What's next",
        body: "Today Presidential is a full platform — Moon Rocks, Moon Pods, and Orbit — each engineered around flavor, all carrying the same standard. The belief that started it in 2012 hasn't moved: build it better, expect more, never miss. Then. Now. Next.",
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
        <DispensariesStyleHero
          afterContent={
            route.id === "our-story" ? <OurStoryPrerollGraphicsGrid /> : undefined
          }
          ariaLabelledBy="presidential-route-title"
          breadcrumbs={breadcrumbs}
          eyebrow="Official Presidential"
          supportingText={
            route.id === "our-story"
              ? [
                  "Los Angeles, 2012. Two founders, Everett Smith and John Zapp, set out with one stubborn belief: cannabis deserves better. Not better marketing — better cannabis. They weren't interested in growing flower and calling it premium; they wanted to build the best product on the shelf and obsess over every gram to get there. What they made didn't just sell — it helped invent a category. Presidential became one of the founding fathers of the infused-product market in Southern California: the house behind the World's Strongest™ pre-rolls and the moon rock blunt the whole industry spent the next decade trying to copy, stocked across 400+ licensed California retailers from MedMen and Stiiizy to Catalyst and March & Ash. But Presidential never chased the copies. It kept chasing better — better flavor, greater consistency, a premium experience pack after pack, no misses. More than a decade later, that obsession has grown into a full platform: Moon Rocks, Moon Pods, and Orbit. The name on the box hasn't changed, and neither has the standard behind it. Cannabis Evolved. Expect More. Because Presidential Doesn't Miss.",
                ]
              : [
                  route.description,
                  "A focused official section inside the Presidential digital experience for adults 21+ where legal.",
                ]
          }
          title={route.h1}
        />

        <Scene
          ariaLabelledBy="presidential-route-details"
          className="po-gold-thread-inlay py-24 lg:py-32"
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
                    <InContentText sourcePath={route.path} value={panel.body} />
                  </p>
                </article>
              ))}
            </div>
          </div>
        </Scene>

        {route.id === "our-story" ? <OurStoryAuthoritySources /> : null}

        {route.kind === "learn_hub" ? (
          <>
            <RepoOwnedPageCopy path="/learn" />
            <LearnGuideIndex />
          </>
        ) : null}

        {links.length > 0 ? (
          <Scene
            ariaLabelledBy="presidential-related-sections"
            className="po-gold-thread-inlay py-24 lg:py-32"
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
  locatorInitialSearch,
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

  if (route.kind === "contact" || route.kind === "store_locator") {
    return (
      <SupportRouteFoundationShell
        breadcrumbs={breadcrumbs}
        contactInquiryConfigured={contactInquiryConfigured}
        heroVariant="dispensaries"
        links={links}
        locatorInitialSearch={locatorInitialSearch}
        panels={panels}
        route={route}
        supportCallout={supportCallout}
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
