import {
  CmsHomepageModuleRenderer,
  MoonRocksPlatformShell,
  PageFrame,
  PillarPlatformShell,
  SceneStack,
  StaticRouteFoundationShell,
} from "@/components/presidential";
import { OurStoryPrerollGraphicsGrid } from "@/components/presidential/modules/our-story-preroll-graphics-grid";
import { readPublicRenderableSitePage } from "@/lib/cms";
import {
  buildRouteShellBreadcrumbItems,
  buildRouteShellJsonLd,
  JsonLd,
} from "@/lib/seo/schema";
import { getStaticRouteShellLinks } from "@/lib/seo/route-page";
import type { SeoRouteRecord } from "@/lib/seo/route-types";
import type { LocatorInitialSearch } from "@/lib/locator/inbound-search";

type PresidentialRouteShellProps = {
  route: SeoRouteRecord;
  locatorInitialSearch?: LocatorInitialSearch;
};

type CmsProductRoute = "moon-rocks" | "moon-pods" | "orbit";
type CmsSupportRoute = "contact" | "find-us";

const cmsSiteRouteIds = new Set([
  "moon-rocks",
  "moon-pods",
  "orbit",
  "our-story",
  "learn",
  "find-us",
  "contact",
]);

function routeToSanitySlug(route: SeoRouteRecord): string {
  return route.path.replace(/^\//, "");
}

function routeToCmsProductRoute(route: SeoRouteRecord): CmsProductRoute | undefined {
  return route.id === "moon-rocks" || route.id === "moon-pods" || route.id === "orbit"
    ? route.id
    : undefined;
}

function routeToCmsSupportRoute(route: SeoRouteRecord): CmsSupportRoute | undefined {
  return route.id === "contact" || route.id === "find-us"
    ? route.id
    : undefined;
}

export async function PresidentialRouteShell({
  locatorInitialSearch,
  route,
}: PresidentialRouteShellProps) {
  const links = getStaticRouteShellLinks(route);
  const jsonLdEntries = buildRouteShellJsonLd(route);
  const breadcrumbs = buildRouteShellBreadcrumbItems(route);
  const usesPillarPlatformShell =
    route.id === "moon-pods" || route.id === "orbit";
  const sanitySlug = routeToSanitySlug(route);
  const cmsPage = cmsSiteRouteIds.has(route.id)
    ? await readPublicRenderableSitePage(sanitySlug, {
        next: { tags: [`sanity-site-page-${route.id}`] },
      })
    : null;
  const cmsModules = cmsPage?.modules.length ? cmsPage.modules : null;

  return (
    <>
      {jsonLdEntries.map((entry) => (
        <JsonLd key={`${route.id}-${entry.id}`} data={entry.data} />
      ))}

      {cmsModules ? (
        <PageFrame>
          <SceneStack>
            <CmsHomepageModuleRenderer
              modules={cmsModules}
              productRoute={routeToCmsProductRoute(route)}
              supportRoute={routeToCmsSupportRoute(route)}
            />
            {route.id === "our-story" ? <OurStoryPrerollGraphicsGrid /> : null}
          </SceneStack>
        </PageFrame>
      ) : route.id === "moon-rocks" ? (
        <MoonRocksPlatformShell
          breadcrumbs={breadcrumbs}
          route={route}
        />
      ) : usesPillarPlatformShell ? (
        <PillarPlatformShell
          breadcrumbs={breadcrumbs}
          route={route}
        />
      ) : (
        <StaticRouteFoundationShell
          breadcrumbs={breadcrumbs}
          links={links}
          locatorInitialSearch={locatorInitialSearch}
          route={route}
        />
      )}
    </>
  );
}
