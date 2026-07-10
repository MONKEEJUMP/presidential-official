import Link from "next/link";

import type { SeoRouteRecord } from "@/lib/seo/route-types";

import { PageFrame } from "../layout/page-frame";
import { Scene } from "../layout/scene";
import { SceneStack } from "../layout/scene-stack";
import { MediaSlot } from "../media/media-slot";
import { CtaLink } from "../primitives/cta-link";
import { SectionHeading } from "../primitives/section-heading";
import { FindUsCtaShell } from "./find-us-cta-shell";

type MoonRocksBreadcrumb = {
  readonly name: string;
  readonly path: string;
};

type MoonRocksPlatformShellProps = {
  readonly route: SeoRouteRecord;
  readonly breadcrumbs: readonly MoonRocksBreadcrumb[];
  readonly links: readonly SeoRouteRecord[];
};

const productLanes = [
  {
    title: "Infused pre-rolls",
    body: "A clear product lane for Presidential pre-rolls, Moon Rocks education, and retailer discovery.",
  },
  {
    title: "Moon Rock blunts",
    body: "A focused path for blunt-format interest without sending visitors away from the official Presidential site.",
  },
  {
    title: "Series architecture",
    body: "Silver, Gold, and Rose Gold lanes give the product catalog room to grow as official product details are added.",
  },
] as const;

const ecosystemSteps = [
  "Learn what Moon Rocks are",
  "Explore related Presidential platforms",
  "Find licensed retailers",
] as const;

export function MoonRocksPlatformShell({
  route,
  breadcrumbs,
}: MoonRocksPlatformShellProps) {
  if (route.id !== "moon-rocks") {
    throw new Error("MoonRocksPlatformShell requires the Moon Rocks route record.");
  }

  return (
    <PageFrame>
      <SceneStack>
        <Scene ariaLabelledBy="presidential-moon-rocks-title" tone="default">
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
                  id="presidential-moon-rocks-title"
                  kicker="Presidential product platform"
                  title={route.h1}
                />
                <p className="max-w-2xl text-sm leading-6 text-po-muted">
                  Moon Rocks is the flagship Presidential product platform for
                  pre-rolls, blunts, learning, and licensed retailer discovery.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <CtaLink href="/find-us" variant="primary">
                    Find Presidential products
                  </CtaLink>
                  <CtaLink href="/learn" variant="secondary">
                    Learn about Moon Rocks
                  </CtaLink>
                </div>
              </div>

              <MediaSlot
                aspectClassName="aspect-[5/4]"
                backgroundImagePath="/brand/banner-palms-teal.webp"
                kind="wireframe_media_block"
                label="Moon Rocks platform"
                note="Presidential flagship product stage"
              />
            </div>
          </div>
        </Scene>

        <Scene ariaLabelledBy="presidential-moon-rocks-lanes" tone="quiet">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
            <SectionHeading
              as="h2"
              description="Product education, format clarity, related platforms, and retail discovery live here without turning the page into a transaction surface."
              id="presidential-moon-rocks-lanes"
              title="Inside the Moon Rocks platform"
            />
            <div className="grid gap-4 md:grid-cols-3">
              {productLanes.map((lane) => (
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

        <Scene ariaLabelledBy="presidential-moon-rocks-journey" tone="default">
          <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.72fr)] lg:items-center">
            <div className="flex flex-col gap-6">
              <SectionHeading
                as="h2"
                id="presidential-moon-rocks-journey"
                title="A cleaner customer path"
              />
              <ol className="grid gap-3">
                {ecosystemSteps.map((step, index) => (
                  <li
                    className="flex items-center gap-3 border border-po-line bg-po-canvas p-4 text-sm font-semibold text-po-ink"
                    key={step}
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center bg-po-brand text-po-on-dark"
                    >
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <MediaSlot
              aspectClassName="aspect-[4/3]"
              backgroundImagePath="/brand/banner-palms-teal.webp"
              kind="wireframe_media_block"
              label="Moon Rocks journey"
              note="Product path"
            />
          </div>
        </Scene>

        <FindUsCtaShell compact />
      </SceneStack>
    </PageFrame>
  );
}
