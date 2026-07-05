import Link from "next/link";

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

function getRoutePanels(route: SeoRouteRecord): readonly StaticRoutePanel[] {
  if (route.kind === "store_locator") {
    return [
      {
        title: "Licensed retail path",
        body: "Find authentic Presidential products at licensed retailers after store data is verified and cleared for public use.",
      },
      {
        title: "Local experience",
        body: "Retailer and location experiences will open only after each source is verified.",
      },
    ];
  }

  if (route.kind === "brand_story") {
    return [
      {
        title: "Official story",
        body: "Company story material will appear as executive and brand materials are finalized.",
      },
      {
        title: "Brand context",
        body: "Presidential background details will stay source-backed and public-safe.",
      },
    ];
  }

  if (route.kind === "learn_hub") {
    return [
      {
        title: "Education hub",
        body: "Learning material will appear as guides are finalized and reviewed for public use.",
      },
      {
        title: "Product context",
        body: "Educational paths will connect to official Presidential product platforms without medical or effect claims.",
      },
    ];
  }

  if (route.kind === "contact") {
    return [
      {
        title: "Official contact path",
        body: "Official contact information will appear as company details are finalized.",
      },
      {
        title: "Brand inquiries",
        body: "The contact experience will support adults 21+ where legal.",
      },
    ];
  }

  return [
    {
      title: "Product information",
      body: "Product information will appear as materials are finalized.",
    },
    {
      title: "Official source path",
      body: "Public details will stay connected to finalized Presidential materials.",
    },
  ];
}

export function StaticRouteFoundationShell({
  route,
  breadcrumbs,
  links,
}: StaticRouteFoundationShellProps) {
  const panels = getRoutePanels(route);

  return (
    <PageFrame>
      <SceneStack>
        <Scene ariaLabelledBy="presidential-route-title" tone="default">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
            {breadcrumbs.length > 1 ? (
              <nav aria-label="Breadcrumb" className="text-sm text-zinc-600">
                <ol className="flex flex-wrap items-center gap-2">
                  {breadcrumbs.map((breadcrumb, index) => {
                    const isCurrent = index === breadcrumbs.length - 1;

                    return (
                      <li key={breadcrumb.path} className="flex items-center gap-2">
                        {index > 0 ? (
                          <span aria-hidden="true" className="text-zinc-400">
                            /
                          </span>
                        ) : null}
                        {isCurrent ? (
                          <span aria-current="page" className="text-zinc-800">
                            {breadcrumb.name}
                          </span>
                        ) : (
                          <Link
                            href={breadcrumb.path}
                            className="font-medium text-emerald-800 hover:text-emerald-900"
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
                <p className="max-w-2xl text-sm leading-6 text-zinc-600">
                  Official details are organized here as materials are finalized.
                </p>
              </div>

              <MediaSlot
                aspectClassName="aspect-[4/3]"
                kind="wireframe_media_block"
                label={`${route.h1} media`}
              >
                <span>Materials are being finalized.</span>
              </MediaSlot>
            </div>
          </div>
        </Scene>

        <Scene ariaLabelledBy="presidential-route-details" tone="quiet">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
            <SectionHeading
              as="h2"
              description="Public information will remain source-backed and public-safe."
              id="presidential-route-details"
              title="Official route details"
            />
            <div className="grid gap-4 md:grid-cols-2">
              {panels.map((panel) => (
                <article
                  className="border border-zinc-200 bg-white p-5"
                  key={panel.title}
                >
                  <h3 className="text-xl font-semibold leading-snug text-zinc-950">
                    {panel.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-700">
                    {panel.body}
                  </p>
                </article>
              ))}
            </div>
            <p className="text-sm font-medium text-zinc-600">
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
