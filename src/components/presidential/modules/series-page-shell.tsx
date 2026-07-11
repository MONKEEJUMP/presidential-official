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
import { CtaLink } from "../primitives/cta-link";
import { SeriesCatalogSection, seriesMetaFor } from "./catalog-grid-shell";
import { FindUsCtaShell } from "./find-us-cta-shell";

type SeriesPageShellProps = {
  readonly route: SeoRouteRecord;
  readonly seriesName: string;
};

async function readSeriesItems(seriesName: string): Promise<{
  readonly items: readonly SanityCatalogItem[];
  readonly mode: "public" | "preview";
}> {
  const publicCatalog = await readPublicRenderableCatalogItems("/moon-rocks", {
    next: { tags: ["sanity-catalog-moon-rocks"] },
  });
  const publicItems = publicCatalog.items.filter(
    (item) => (item.series || "") === seriesName,
  );
  if (publicItems.length > 0) {
    return { items: publicItems, mode: "public" };
  }

  const draftCatalog = await readDraftCatalogItems("/moon-rocks", {
    next: { tags: ["sanity-catalog-moon-rocks-drafts"] },
  });
  if (draftCatalog.ok) {
    return {
      items: draftCatalog.items.filter(
        (item) => (item.series || "") === seriesName,
      ),
      mode: "preview",
    };
  }

  return { items: [], mode: "public" };
}

export async function SeriesPageShell({ route, seriesName }: SeriesPageShellProps) {
  const meta = seriesMetaFor(seriesName);
  const catalog = await readSeriesItems(seriesName);

  return (
    <PageFrame>
      <SceneStack>
        <Scene ariaLabelledBy="presidential-series-title" tone="default">
          <div className="mx-auto w-full max-w-7xl">
            <nav aria-label="Breadcrumb" className="text-sm text-po-brand-ink">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link
                    className="font-semibold underline-offset-4 hover:underline"
                    href="/moon-rocks"
                  >
                    Moon Rocks
                  </Link>
                </li>
                <li aria-hidden="true" className="text-po-body">
                  /
                </li>
                <li>
                  <span aria-current="page" className="font-semibold text-po-ink">
                    {route.h1}
                  </span>
                </li>
              </ol>
            </nav>

            <div className="mt-10 max-w-4xl">
              <span aria-hidden="true" className={`block h-2 w-24 ${meta.accentBar}`} />
              <h1
                className="mt-6 font-display text-5xl uppercase leading-[0.9] text-po-ink sm:text-7xl"
                id="presidential-series-title"
              >
                {route.h1}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-po-body">
                {meta.positioning}
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-po-body">
                {route.description}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:max-w-md">
                <CtaLink href="/find-us">Find Presidential near you</CtaLink>
                <CtaLink href="/moon-rocks" variant="secondary">
                  All Moon Rocks
                </CtaLink>
              </div>
            </div>
          </div>
        </Scene>

        {catalog.items.length > 0 ? (
          <Scene
            ariaLabelledBy={`catalog-${meta.anchor}`}
            className="py-20 lg:py-28"
            tone="default"
          >
            <div className="mx-auto w-full max-w-7xl">
              <SeriesCatalogSection
                headingLevel="h2"
                items={catalog.items}
                mode={catalog.mode}
                series={seriesName}
              />
            </div>
          </Scene>
        ) : (
          <Scene
            ariaLabelledBy="presidential-series-pending"
            className="py-20 lg:py-28"
            tone="default"
          >
            <div className="mx-auto w-full max-w-7xl border-t border-po-ink pt-6">
              <h2
                className="font-display text-2xl uppercase text-po-ink"
                id="presidential-series-pending"
              >
                Catalog in production
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-po-body">
                This series page unlocks its product catalog after owner and
                compliance approval.
              </p>
            </div>
          </Scene>
        )}

        <FindUsCtaShell compact />
      </SceneStack>
    </PageFrame>
  );
}
