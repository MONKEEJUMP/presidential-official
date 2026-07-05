import { HomepageFoundationShell } from "@/components/presidential";
import {
  buildRouteShellJsonLd,
  JsonLd,
} from "@/lib/seo/schema";
import type { SeoRouteRecord } from "@/lib/seo/route-types";

type HomeRouteShellProps = {
  readonly route: SeoRouteRecord;
};

export function HomeRouteShell({ route }: HomeRouteShellProps) {
  if (route.id !== "home" || route.path !== "/") {
    throw new Error("HomeRouteShell requires the home route record.");
  }

  const jsonLdEntries = buildRouteShellJsonLd(route);

  return (
    <>
      {jsonLdEntries.map((entry) => (
        <JsonLd key={`${route.id}-${entry.id}`} data={entry.data} />
      ))}

      <HomepageFoundationShell route={route} />
    </>
  );
}
