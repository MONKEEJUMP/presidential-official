import Link from "next/link";

import {
  readDraftCatalogItems,
  readPublicRenderableCatalogItems,
  type SanityCatalogItem,
} from "@/lib/cms/catalog";
import type { SeoRouteRecord } from "@/lib/seo/route-types";

import { PageFrame } from "../layout/page-frame";
import { Scene } from "../layout/scene";
import { SceneStack } from "../layout/scene-stack";
import { SiteVideo } from "../media/site-video";
import { CtaLink } from "../primitives/cta-link";
import { SeriesSelectorShell } from "./catalog-grid-shell";
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

async function readCatalogForShell(): Promise<{
  readonly items: readonly SanityCatalogItem[];
  readonly mode: "public" | "preview";
}> {
  const publicCatalog = await readPublicRenderableCatalogItems("/moon-rocks", {
    next: { tags: ["sanity-catalog-moon-rocks"] },
  });
  if (publicCatalog.items.length > 0) {
    return { items: publicCatalog.items, mode: "public" };
  }

  const draftCatalog = await readDraftCatalogItems("/moon-rocks", {
    next: { tags: ["sanity-catalog-moon-rocks-drafts"] },
  });
  if (draftCatalog.ok && draftCatalog.items.length > 0) {
    return { items: draftCatalog.items, mode: "preview" };
  }

  return { items: [], mode: "public" };
}

export async function MoonRocksPlatformShell({
  route,
  breadcrumbs,
}: MoonRocksPlatformShellProps) {
  if (route.id !== "moon-rocks") {
    throw new Error("MoonRocksPlatformShell requires the Moon Rocks route record.");
  }

  const catalog = await readCatalogForShell();

  return (
    <PageFrame>
      <SceneStack>
        <section
          aria-labelledby="presidential-moon-rocks-title"
          className="relative isolate flex min-h-[calc(100svh-7rem)] overflow-hidden bg-po-brand text-po-ink"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[url('/brand/banner-palms-teal.webp')] bg-[length:auto_190%] bg-left bg-no-repeat opacity-45"
          />
          <div className="relative mx-auto flex w-full max-w-7xl flex-col justify-between gap-10 px-6 py-6 sm:px-10 lg:px-16 lg:py-8">
            <nav aria-label="Breadcrumb" className="text-sm text-po-brand-ink">
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

            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.38fr)] lg:items-end">
              <div className="max-w-5xl">
                <p className="text-xs font-black uppercase text-po-ink">
                  Presidential product platform
                </p>
                <h1
                  className="mt-5 font-display text-4xl uppercase leading-[0.9] text-po-ink sm:text-7xl lg:text-8xl"
                  id="presidential-moon-rocks-title"
                >
                  {route.h1}
                </h1>
                <p className="mt-5 max-w-3xl font-display text-2xl uppercase leading-tight text-po-ink sm:text-4xl">
                  The Highest Form Of Cannabis.
                </p>
              </div>
              <div className="border-t border-po-ink pt-5">
                <p className="text-sm leading-6 text-po-brand-ink">
                  {route.description}
                </p>
                <p className="mt-4 text-sm leading-6 text-po-brand-ink">
                  Moon Rocks is the flagship Presidential product platform for
                  pre-rolls, blunts, learning, and licensed retailer discovery.
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
                    Learn about Moon Rocks
                  </CtaLink>
                </div>
              </div>
            </div>
          </div>
        </section>

        {catalog.items.length > 0 ? (
          <Scene
            ariaLabelledBy="presidential-moon-rocks-catalog"
            className="py-24 lg:py-32"
            tone="default"
          >
            <div className="mx-auto w-full max-w-7xl">
              <div className="mb-14 max-w-3xl">
                <p className="text-xs font-black uppercase text-po-brand-ink">
                  The catalog
                </p>
                <h2
                  className="mt-5 font-display text-4xl uppercase leading-[0.92] text-po-ink sm:text-6xl"
                  id="presidential-moon-rocks-catalog"
                >
                  Every Presidential strain
                </h2>
                <p className="mt-6 text-base leading-7 text-po-body">
                  Silver, Gold, and Rose Gold series — one official catalog.
                  Choose a series to explore every strain. Availability varies
                  by licensed retailer.
                </p>
              </div>
              <SeriesSelectorShell items={catalog.items} />
            </div>
          </Scene>
        ) : null}

        <Scene
          ariaLabelledBy="presidential-moon-rocks-packaging"
          className="py-24 lg:py-32"
          tone="contrast"
        >
          <div className="mx-auto w-full max-w-7xl">
            <p className="text-xs font-black uppercase text-po-brand">
              The packaging
            </p>
            <h2
              className="mt-5 max-w-3xl font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-6xl"
              id="presidential-moon-rocks-packaging"
            >
              Built to be seen
            </h2>
            <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.6fr)]">
              <div className="overflow-hidden border border-po-on-dark/20">
                <SiteVideo
                  className="aspect-video h-full w-full object-cover"
                  label="Presidential strain packaging film, widescreen loop"
                  slug="strains-horizontal"
                />
              </div>
              <div className="overflow-hidden border border-po-on-dark/20">
                <SiteVideo
                  className="aspect-[9/16] h-full w-full object-cover"
                  label="Presidential strain packaging film, portrait loop"
                  slug="strains-vertical"
                />
              </div>
            </div>
          </div>
        </Scene>

        <Scene
          ariaLabelledBy="presidential-moon-rocks-lanes"
          className="py-24 lg:py-32"
          tone="default"
        >
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[minmax(260px,0.55fr)_1fr] lg:gap-20">
              <div>
                <p className="text-xs font-black uppercase text-po-brand-ink">
                  Product architecture
                </p>
                <h2
                  className="mt-5 font-display text-4xl uppercase leading-[0.92] text-po-ink sm:text-6xl"
                  id="presidential-moon-rocks-lanes"
                >
                  Inside the Moon Rocks platform
                </h2>
                <p className="mt-6 max-w-md text-base leading-7 text-po-body">
                  Product education, format clarity, related platforms, and
                  retail discovery live here without turning the page into a
                  transaction surface.
                </p>
              </div>
              <div className="grid gap-10 sm:grid-cols-3">
                {productLanes.map((lane, index) => (
                  <article
                    className="border-t border-po-ink pt-5"
                    key={lane.title}
                  >
                    <p className="text-xs font-black text-po-brand-ink">
                      0{index + 1}
                    </p>
                    <h3 className="mt-10 text-xl font-semibold leading-snug text-po-ink">
                      {lane.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-po-body">
                      {lane.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </Scene>

        <Scene
          ariaLabelledBy="presidential-moon-rocks-journey"
          className="py-24 lg:py-32"
          tone="contrast"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(360px,0.65fr)] lg:items-end lg:gap-24">
            <div>
              <p className="text-xs font-black uppercase text-po-brand">
                Explore Presidential
              </p>
              <h2
                className="mt-5 font-display text-4xl uppercase leading-[0.92] text-po-on-dark sm:text-6xl lg:text-7xl"
                id="presidential-moon-rocks-journey"
              >
                A cleaner customer path
              </h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-po-on-dark-muted">
                Move from product understanding to related Presidential
                platforms and licensed retail discovery through one official
                source.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <CtaLink href="/moon-pods" variant="contrast">
                  Explore Moon Pods
                </CtaLink>
                <CtaLink href="/orbit" variant="contrast">
                  Explore Orbit
                </CtaLink>
              </div>
            </div>

            <ol className="border-t border-po-on-dark/20">
              {ecosystemSteps.map((step, index) => (
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
