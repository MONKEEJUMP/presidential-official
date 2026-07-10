import Link from "next/link";

import type { SeoRouteRecord } from "@/lib/seo/route-types";

import { PageFrame } from "../layout/page-frame";
import { Scene } from "../layout/scene";
import { SceneStack } from "../layout/scene-stack";
import { CtaLink } from "../primitives/cta-link";
import { FindUsCtaShell } from "./find-us-cta-shell";

type PillarBreadcrumb = {
  readonly name: string;
  readonly path: string;
};

type PillarPlatformShellProps = {
  readonly route: SeoRouteRecord;
  readonly breadcrumbs: readonly PillarBreadcrumb[];
  readonly links: readonly SeoRouteRecord[];
};

type PillarContent = {
  readonly kicker: string;
  readonly intro: string;
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

type PillarRouteId = "moon-pods" | "orbit";

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
};

function getPillarContent(route: SeoRouteRecord): PillarContent {
  if (route.id !== "moon-pods" && route.id !== "orbit") {
    throw new Error(`PillarPlatformShell does not support route id: ${route.id}`);
  }

  return pillarContent[route.id];
}

export function PillarPlatformShell({
  route,
  breadcrumbs,
}: PillarPlatformShellProps) {
  const content = getPillarContent(route);
  const isMoonPods = route.id === "moon-pods";

  return (
    <PageFrame>
      <SceneStack>
        <section
          aria-labelledby={`${route.id}-platform-title`}
          className={[
            "relative isolate flex min-h-[calc(100svh-7rem)] overflow-hidden text-po-ink",
            isMoonPods ? "bg-po-brand" : "bg-po-silver",
          ].join(" ")}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[url('/brand/banner-palms-teal.webp')] bg-[length:auto_190%] bg-left bg-no-repeat opacity-35"
          />
          <div className="relative mx-auto flex w-full max-w-7xl flex-col justify-between gap-10 px-6 py-6 sm:px-10 lg:px-16 lg:py-8">
            <nav aria-label="Breadcrumb" className="text-sm text-po-body">
              <ol className="flex flex-wrap items-center gap-2">
                {breadcrumbs.map((breadcrumb, index) => {
                  const isCurrent = index === breadcrumbs.length - 1;

                  return (
                    <li key={breadcrumb.path} className="flex items-center gap-2">
                      {index > 0 ? (
                        <span aria-hidden="true" className="text-po-ink/50">
                          /
                        </span>
                      ) : null}
                      {isCurrent ? (
                        <span aria-current="page" className="font-semibold text-po-ink">
                          {breadcrumb.name}
                        </span>
                      ) : (
                        <Link
                          className="font-semibold text-po-ink underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-ink"
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

            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)] lg:items-end">
              <div className="max-w-5xl">
                <p className="text-xs font-black uppercase text-po-ink">
                  {content.kicker}
                </p>
                <h1
                  className="mt-5 font-display text-4xl uppercase leading-[0.9] text-po-ink sm:text-7xl lg:text-8xl"
                  id={`${route.id}-platform-title`}
                >
                  {route.h1}
                </h1>
              </div>

              <div className="border-t border-po-ink pt-5">
                <p className="text-xs font-black uppercase text-po-ink">
                  {content.mediaLabel}
                </p>
                <p className="mt-1 text-sm font-semibold text-po-ink">
                  {content.mediaNote}
                </p>
                <p className="mt-5 text-sm leading-6 text-po-body">
                  {route.description}
                </p>
                <p className="mt-4 text-sm leading-6 text-po-body">
                  {content.intro}
                </p>
                <div className="mt-6 grid gap-3">
                  <CtaLink
                    className="border-po-ink bg-po-ink text-po-on-dark hover:bg-po-canvas hover:text-po-ink"
                    href="/find-us"
                    variant="secondary"
                  >
                    Find Presidential products
                  </CtaLink>
                  <CtaLink
                    className="border-po-ink/40 text-po-ink hover:border-po-ink hover:text-po-ink"
                    href="/learn"
                    variant="secondary"
                  >
                    Learn Presidential
                  </CtaLink>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Scene
          ariaLabelledBy={`${route.id}-platform-lanes`}
          className="py-24 lg:py-32"
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

        <Scene
          ariaLabelledBy={`${route.id}-platform-rollout`}
          className="py-24 lg:py-32"
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

        <FindUsCtaShell compact />
      </SceneStack>
    </PageFrame>
  );
}
