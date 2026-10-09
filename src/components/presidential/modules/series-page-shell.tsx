import {
  readDraftCatalogItems,
  readPublicRenderableCatalogItems,
  catalogItemSlug,
  type SanityCatalogItem,
} from "@/lib/cms/catalog";
import { resolveCatalogTier } from "@/lib/catalog/tier-map";
import {
  filterCatalogSeriesProducts,
  type CatalogSeriesDefinition,
} from "@/lib/catalog/series-registry";
import {
  buildRouteShellJsonLd,
  JsonLd,
} from "@/lib/seo/schema";
import type { SeoRouteRecord } from "@/lib/seo/route-types";

import { PageFrame } from "../layout/page-frame";
import { Scene } from "../layout/scene";
import { SceneStack } from "../layout/scene-stack";
import { SiteVideo, type SiteVideoSlug } from "../media/site-video";
import { SeriesCatalogSection, seriesMetaFor } from "./catalog-grid-shell";
import { DispensariesStyleHero } from "./dispensaries-style-hero";
import { FindUsCtaShell } from "./find-us-cta-shell";
import { ParentLearnGuideLink } from "./learn-guide-discovery";
import { RepoOwnedPageCopy } from "./repo-owned-page-copy";

// Filename-evidence film placement (9083-CODE video ruling, 2026-07-11):
// "Blunt-Flavors" -> the flavor-first Silver series page.
const SERIES_FILMS: Record<string, { slug: SiteVideoSlug; label: string }> = {
  "Silver Flavor Series": {
    slug: "flavor-blunts",
    label: "Presidential flavor blunts film loop",
  },
};

// Sitebulb oct06d #4: factual intros for the two thin line hubs. Members are the
// active rows in approved-public-routes.ts (retired releases are excluded since
// 1008-004); partners are the ones named in the repo-owned partner roster copy.
const SERIES_INTROS: Partial<Record<string, string>> = {
  "presidential-line":
    "The Presidential Line is the set of named Presidential Moon Rock strains that sit outside the Silver, Gold and Rose Gold series: Garlic Cookies, Ghost Haze Train, Guava Haze, Head Cheese, Iced Lemon, Nino Brown and Whoa Si Whoa. They are partner releases: Nature's Chemistry on Garlic Cookies and Ghost Haze Train, Polaris Cannabis on Head Cheese, Ball Family Farms on Nino Brown, Top Shelf Cultivation on Whoa Si Whoa, and Platinum on Guava Haze and Iced Lemon. Retired releases are no longer listed.",
  "presidential-house-line":
    "The Presidential House Line is the original set of Presidential formats: Moon Rocks, infused pre-rolls and blunts, the formats that built the Presidential name. Each House Line product is sold under the Presidential name itself rather than a strain or partner name. Availability varies by licensed retailer.",
};

type SeriesPageShellProps = {
  readonly definition: CatalogSeriesDefinition;
  readonly route: SeoRouteRecord;
};

async function readSeriesItems(definition: CatalogSeriesDefinition): Promise<{
  readonly items: readonly SanityCatalogItem[];
  readonly mode: "public" | "preview";
}> {
  // Owner ruling: retired products are excluded, including Presidential Line.
  const keepActive = (item: SanityCatalogItem) =>
    !resolveCatalogTier({
      line: "moon-rocks",
      series: item.series,
      slug: catalogItemSlug(item),
    }).entry.retired;
  const publicCatalog = await readPublicRenderableCatalogItems("/moon-rocks", {
    next: { tags: ["sanity-catalog-moon-rocks"] },
  });
  const publicItems = filterCatalogSeriesProducts(definition, publicCatalog.items).filter(keepActive);
  if (publicItems.length > 0) {
    return { items: publicItems, mode: "public" };
  }

  const draftCatalog = await readDraftCatalogItems("/moon-rocks", {
    next: { tags: ["sanity-catalog-moon-rocks-drafts"] },
  });
  if (draftCatalog.ok) {
    return {
      items: filterCatalogSeriesProducts(definition, draftCatalog.items).filter(keepActive),
      mode: "preview",
    };
  }

  return { items: [], mode: "public" };
}

export async function SeriesPageShell({
  definition,
  route,
}: SeriesPageShellProps) {
  const seriesName = definition.productFilter.series;
  const title = route?.h1 || definition.title;
  const description = route?.description || definition.description;
  const meta = seriesMetaFor(seriesName);
  const catalog = await readSeriesItems(definition);
  const film = SERIES_FILMS[seriesName];
  const jsonLdEntries = buildRouteShellJsonLd(route);
  const repoCopyPath =
    definition.slug === "rose-gold"
      ? "/moon-rocks/rose-gold"
      : definition.slug === "presidential-x-thc-design"
        ? "/moon-rocks/presidential-x-thc-design"
        : null;

  return (
    <>
      {jsonLdEntries.map((entry) => (
        <JsonLd key={`${route.id}-${entry.id}`} data={entry.data} />
      ))}

      <PageFrame>
        <SceneStack>
        <DispensariesStyleHero
          ariaLabelledBy="presidential-series-title"
          breadcrumbs={[
            { name: "Moon Rocks", path: "/moon-rocks" },
            { name: title, path: definition.path },
          ]}
          ctas={[
            {
              href: "/find-us",
              label: "Find Presidential near you",
              tone: "primary",
            },
            {
              href: "/moon-rocks",
              label: "All Moon Rocks",
              tone: "secondary",
            },
          ]}
          eyebrow={definition.cardEyebrow}
          fitLongTitle
          leadMedia={
            film ? (
              <section aria-labelledby="presidential-series-film">
              <p
                className="text-xs font-black uppercase text-po-brand"
                id="presidential-series-film"
              >
                The film
              </p>
              <div className="mt-6 overflow-hidden bg-po-ink">
                <SiteVideo
                  className="aspect-video w-full object-cover"
                  label={film.label}
                  slug={film.slug}
                />
              </div>
              </section>
            ) : undefined
          }
          supportingText={SERIES_INTROS[definition.slug] ? [meta.positioning, description, SERIES_INTROS[definition.slug]] : [meta.positioning, description]}
          title={title}
        />

        {repoCopyPath ? <RepoOwnedPageCopy path={repoCopyPath} /> : null}

        {catalog.items.length > 0 ? (
          <Scene
            ariaLabelledBy={`catalog-${meta.anchor}`}
            className="po-gold-thread-inlay py-20 lg:py-28"
            tone="default"
          >
            <div className="mx-auto w-full max-w-7xl">
              <SeriesCatalogSection
                headingLevel="h2"
                items={catalog.items}
                mode={catalog.mode}
                series={seriesName}
                heading={definition.title}
              />
            </div>
          </Scene>
        ) : (
          <Scene
            ariaLabelledBy="presidential-series-pending"
            className="po-gold-thread-inlay py-20 lg:py-28"
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

        <ParentLearnGuideLink parentPath={definition.path} />

        <FindUsCtaShell
          className="po-gold-thread-inlay"
          compact
          sourcePath={route.path}
        />
        </SceneStack>
      </PageFrame>
    </>
  );
}
