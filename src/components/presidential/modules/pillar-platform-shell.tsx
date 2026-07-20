import Link from "next/link";

import type { SeoRouteRecord } from "@/lib/seo/route-types";

import { PageFrame } from "../layout/page-frame";
import { Scene } from "../layout/scene";
import { SceneStack } from "../layout/scene-stack";
import { DispensariesStyleHero } from "./dispensaries-style-hero";
import { FindUsCtaShell } from "./find-us-cta-shell";

type PillarBreadcrumb = {
  readonly name: string;
  readonly path: string;
};

type PillarPlatformShellProps = {
  readonly route: SeoRouteRecord;
  readonly breadcrumbs: readonly PillarBreadcrumb[];
};

type PillarContent = {
  readonly kicker: string;
  readonly intro: string;
  readonly heroSupportingText?: readonly string[];
  readonly mediaLabel: string;
  readonly mediaNote: string;
  readonly lanesTitle: string;
  readonly lanesDescription: string;
  readonly lanes: readonly {
    readonly title: string;
    readonly body: string;
  }[];
  readonly rollout: readonly string[];
};

type PillarRouteId = "moon-pods" | "orbit" | "vapes";

const vapesProducts = [
  {
    href: "/moon-pods",
    title: "MOON PODS",
    tagline: "The Strongest Flavor Experience.",
  },
  {
    href: "/orbit",
    title: "ORBIT",
    tagline: "Designed For Flavor.",
  },
] as const;

const pillarContent: Record<PillarRouteId, PillarContent> = {
  "moon-pods": {
    kicker: "Presidential product pillar",
    intro:
      "Moon Pods now has an official section for product context, education paths, and licensed retailer discovery while catalog records stay under source confirmation.",
    mediaLabel: "Moon Pods platform",
    mediaNote: "Official product pillar stage",
    lanesTitle: "Moon Pods platform structure",
    lanesDescription:
      "This page gives Moon Pods a real home without publishing unsupported product claims.",
    lanes: [
      {
        title: "Product context",
        body: "A dedicated lane for approved Moon Pods facts, product family language, and future asset placement.",
      },
      {
        title: "Education path",
        body: "A clear bridge into the Learn hub for extract, format, and product-platform education once records are approved.",
      },
      {
        title: "Retail path",
        body: "A safe route toward licensed retailer discovery without purchase promises or unsupported product claims.",
      },
    ],
    rollout: [
      "Confirm official Moon Pods product facts",
      "Attach approved visuals and source records",
      "Connect to education and licensed retailer discovery",
    ],
  },
  orbit: {
    kicker: "Presidential technology platform",
    intro:
      "Orbit now has an official section for technology context, education paths, and future source-backed product details.",
    mediaLabel: "Orbit platform",
    mediaNote: "Official technology platform stage",
    lanesTitle: "Orbit platform structure",
    lanesDescription:
      "This page keeps Orbit facts controlled until source and compliance approval.",
    lanes: [
      {
        title: "Technology context",
        body: "A controlled lane for approved Orbit platform facts, feature language, and source-backed product details.",
      },
      {
        title: "Learning bridge",
        body: "A route into Learn content for approved extract and platform education without effect or medical claims.",
      },
      {
        title: "Retail connection",
        body: "A compliant path into licensed retailer discovery once verified retailer data is approved.",
      },
    ],
    rollout: [
      "Verify Orbit technology facts",
      "Attach approved product and platform assets",
      "Connect source-backed education and retail paths",
    ],
  },
  vapes: {
    kicker: "PRESIDENTIAL PRODUCT PLATFORM",
    intro:
      "Explore the Presidential vape lineup. Availability varies by licensed retailer.",
    heroSupportingText: [
      "Explore the Presidential vape lineup. Availability varies by licensed retailer.",
    ],
    mediaLabel: "",
    mediaNote: "",
    lanesTitle: "",
    lanesDescription: "",
    lanes: [],
    rollout: [],
  },
};

function getPillarContent(route: SeoRouteRecord): PillarContent {
  if (
    route.id !== "moon-pods" &&
    route.id !== "orbit" &&
    route.id !== "vapes"
  ) {
    throw new Error(`PillarPlatformShell does not support route id: ${route.id}`);
  }

  return pillarContent[route.id];
}

export function PillarPlatformShell({
  route,
  breadcrumbs,
}: PillarPlatformShellProps) {
  const content = getPillarContent(route);
  return (
    <PageFrame>
      <SceneStack>
        <DispensariesStyleHero
          ariaLabelledBy={`${route.id}-platform-title`}
          breadcrumbs={breadcrumbs}
          ctas={[
            {
              href: "/find-us",
              label: "Find Presidential products",
              tone: "primary",
            },
            {
              href: "/learn",
              label: "Learn Presidential",
              tone: "secondary",
            },
          ]}
          eyebrow={content.kicker}
          supportingText={
            content.heroSupportingText ?? [
              content.mediaLabel,
              content.mediaNote,
              route.description,
              content.intro,
            ]
          }
          title={route.h1}
        />

        {route.id === "vapes" ? (
          <Scene
            ariaLabel="Vapes products"
            className="py-12 sm:py-16 lg:py-20"
            tone="contrast"
          >
            <div className="mx-auto grid w-full max-w-7xl gap-5 sm:grid-cols-2 sm:gap-6">
              {vapesProducts.map((product) => (
                <Link
                  aria-label={`Explore ${product.title}`}
                  className="group block overflow-hidden rounded-[20px] border border-po-brand bg-po-ink transition-transform duration-200 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-po-brand motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:focus-visible:transform-none"
                  href={product.href}
                  key={product.href}
                >
                  <div
                    aria-hidden="true"
                    className="aspect-[16/6] border-b border-po-brand/50 bg-po-on-dark/[0.035]"
                  />
                  <div className="p-6 sm:p-8">
                    <h2 className="font-display text-[clamp(2.25rem,5vw,4.5rem)] font-bold uppercase leading-[0.88] text-po-on-dark transition-colors group-hover:text-po-brand">
                      {product.title}
                    </h2>
                    <p className="mt-4 font-sans text-[clamp(1rem,1.8vw,1.25rem)] leading-7 text-po-on-dark-muted">
                      {product.tagline}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Scene>
        ) : null}

        {content.lanes.length > 0 ? (
          <Scene
          ariaLabelledBy={`${route.id}-platform-lanes`}
          className="po-gold-thread-inlay py-24 lg:py-32"
          tone="default"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-14 lg:grid-cols-[minmax(260px,0.55fr)_1fr] lg:gap-20">
            <div>
              <p className="text-xs font-black uppercase text-po-brand-ink">
                Platform architecture
              </p>
              <h2
                className="mt-5 font-display text-4xl uppercase leading-[0.92] text-po-ink sm:text-6xl"
                id={`${route.id}-platform-lanes`}
              >
                {content.lanesTitle}
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-po-body">
                {content.lanesDescription}
              </p>
            </div>
            <div className="grid gap-10 sm:grid-cols-3">
              {content.lanes.map((lane, index) => (
                <article className="border-t border-po-ink pt-5" key={lane.title}>
                  <p className="text-xs font-black text-po-brand-ink">
                    0{index + 1}
                  </p>
                  <h3 className="mt-10 text-xl font-semibold leading-snug text-po-ink">
                    {lane.title}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-po-body">{lane.body}</p>
                </article>
              ))}
            </div>
          </div>
          </Scene>
        ) : null}

        {content.rollout.length > 0 ? (
          <Scene
          ariaLabelledBy={`${route.id}-platform-rollout`}
          className="po-gold-thread-inlay py-24 lg:py-32"
          tone="contrast"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(360px,0.65fr)] lg:items-end lg:gap-24">
            <div>
              <p className="text-xs font-black uppercase text-po-brand">
                Official source path
              </p>
              <h2
                className="mt-5 font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-6xl"
                id={`${route.id}-platform-rollout`}
              >
                Source-confirmed rollout
              </h2>
              <p className="mt-6 text-sm font-semibold text-po-on-dark-muted">
                {route.h1} source path
              </p>
              <p className="mt-2 text-sm text-po-on-dark-muted">Source path</p>
            </div>

            <ol className="border-t border-po-on-dark/20">
              {content.rollout.map((step, index) => (
                <li
                  className="flex items-center gap-5 border-b border-po-on-dark/20 py-6 text-sm font-semibold text-po-on-dark"
                  key={step}
                >
                  <span
                    aria-hidden="true"
                    className="text-xs font-black text-po-brand"
                  >
                    0{index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          </Scene>
        ) : null}

        <FindUsCtaShell className="po-gold-thread-inlay" compact />
      </SceneStack>
    </PageFrame>
  );
}
