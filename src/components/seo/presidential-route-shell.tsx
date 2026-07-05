import { StaticRouteFoundationShell } from "@/components/presidential";
import {
  buildRouteShellBreadcrumbItems,
  buildRouteShellJsonLd,
  JsonLd,
} from "@/lib/seo/schema";
import { getStaticRouteShellLinks } from "@/lib/seo/route-page";
import type { SeoRouteRecord } from "@/lib/seo/route-types";

type PresidentialRouteShellProps = {
  route: SeoRouteRecord;
};

export function PresidentialRouteShell({ route }: PresidentialRouteShellProps) {
  const links = getStaticRouteShellLinks(route);
  const jsonLdEntries = buildRouteShellJsonLd(route);
  const breadcrumbs = buildRouteShellBreadcrumbItems(route);

  return (
    <>
      {jsonLdEntries.map((entry) => (
        <JsonLd key={`${route.id}-${entry.id}`} data={entry.data} />
      ))}

      <StaticRouteFoundationShell
        breadcrumbs={breadcrumbs}
        links={links}
        route={route}
      />
    </>
  );
}
