import Link from "next/link";

import type { SeoRouteRecord } from "@/lib/seo/route-types";

import { PageFrame } from "../layout/page-frame";
import { Scene } from "../layout/scene";
import { SceneStack } from "../layout/scene-stack";
import { MediaSlot } from "../media/media-slot";
import { CtaLink } from "../primitives/cta-link";
import { SectionHeading } from "../primitives/section-heading";
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

  return (
    <PageFrame>
      <SceneStack>
        <Scene ariaLabelledBy={`${route.id}-platform-title`} tone="default">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
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
                          className="font-medium text-po-brand hover:text-po-brand"
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

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)] lg:items-center">
              <div className="flex flex-col gap-6">
                <SectionHeading
                  as="h1"
                  description={route.description}
                  id={`${route.id}-platform-title`}
                  kicker={content.kicker}
                  title={route.h1}
                />
                <p className="max-w-2xl text-sm leading-6 text-po-muted">
                  {content.intro}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <CtaLink href="/find-us" variant="primary">
                    Find Presidential products
                  </CtaLink>
                  <CtaLink href="/learn" variant="secondary">
                    Learn Presidential
                  </CtaLink>
                </div>
              </div>

              <MediaSlot
                aspectClassName="aspect-[5/4]"
                kind="product_visual_placeholder"
                label={content.mediaLabel}
                note={content.mediaNote}
              />
            </div>
          </div>
        </Scene>

        <Scene ariaLabelledBy={`${route.id}-platform-lanes`} tone="quiet">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
            <SectionHeading
              as="h2"
              description={content.lanesDescription}
              id={`${route.id}-platform-lanes`}
              title={content.lanesTitle}
            />
            <div className="grid gap-4 md:grid-cols-3">
              {content.lanes.map((lane) => (
                <article
                  className="border border-po-line bg-po-canvas p-5 shadow-sm"
                  key={lane.title}
                >
                  <h3 className="text-xl font-semibold leading-snug text-po-ink">
                    {lane.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-po-body">
                    {lane.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </Scene>

        <Scene ariaLabelledBy={`${route.id}-platform-rollout`} tone="default">
          <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.72fr)] lg:items-center">
            <div className="flex flex-col gap-6">
              <SectionHeading
                as="h2"
                id={`${route.id}-platform-rollout`}
                title="Source-confirmed rollout"
              />
              <ol className="grid gap-3">
                {content.rollout.map((step, index) => (
                  <li
                    className="flex items-center gap-3 border border-po-line bg-po-canvas p-4 text-sm font-semibold text-po-ink"
                    key={step}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-po-brand text-white">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <MediaSlot
              aspectClassName="aspect-[4/3]"
              kind="wireframe_media_block"
              label={`${route.h1} source path`}
              note="Source path"
            />
          </div>
        </Scene>

        <FindUsCtaShell compact />
      </SceneStack>
    </PageFrame>
  );
}
