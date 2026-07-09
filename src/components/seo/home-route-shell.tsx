import {
  CmsHomepageModuleRenderer,
  HomepageFoundationShell,
  PageFrame,
  SceneStack,
} from "@/components/presidential";
import { readPublicRenderableHomepage } from "@/lib/cms";
import {
  buildRouteShellJsonLd,
  JsonLd,
} from "@/lib/seo/schema";
import type { SeoRouteRecord } from "@/lib/seo/route-types";

type HomeRouteShellProps = {
  readonly route: SeoRouteRecord;
};

export async function HomeRouteShell({ route }: HomeRouteShellProps) {
  if (route.id !== "home" || route.path !== "/") {
    throw new Error("HomeRouteShell requires the home route record.");
  }

  const homepage = await readPublicRenderableHomepage({ next: { tags: ["sanity-homepage"] } });
  const jsonLdEntries = buildRouteShellJsonLd(route);
  const cmsModules = homepage.modules.length ? homepage.modules : null;

  return (
    <>
      {jsonLdEntries.map((entry) => (
        <JsonLd key={`${route.id}-${entry.id}`} data={entry.data} />
      ))}

      {cmsModules ? (
        <PageFrame>
          <SceneStack>
            <CmsHomepageModuleRenderer modules={cmsModules} />
          </SceneStack>
        </PageFrame>
      ) : (
        <HomepageFoundationShell route={route} />
      )}
    </>
  );
}
