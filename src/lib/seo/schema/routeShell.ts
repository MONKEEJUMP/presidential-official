import type {
  BreadcrumbList,
  Organization,
  WebPage,
  WebSite,
  WithContext,
} from "schema-dts";

import { assertMetadataTextSafe } from "../metadata-helpers";
import { buildRouteCanonicalUrl, isRouteTemplate } from "../route-helpers";
import type { SeoRouteRecord, SeoSchemaType } from "../route-types";
import { getRoutePublicationGateBlockReasons } from "../source-records";
import { buildBreadcrumbSchema } from "./breadcrumb";
import { buildOrganizationSchema } from "./organization";
import { buildWebPageSchema } from "./webpage";
import { buildWebsiteSchema } from "./website";

export type RouteShellBreadcrumbItem = {
  name: string;
  path: string;
};

export type RouteShellJsonLdData = WithContext<
  Organization | WebSite | WebPage | BreadcrumbList
>;

export type RouteShellJsonLdEntry = {
  id: string;
  data: RouteShellJsonLdData;
};

export const ROUTE_SHELL_SUPPRESSED_SCHEMA_TYPES = [
  "AboutPage",
  "Article",
  "ContactPage",
  "ItemList",
  "LocalBusiness",
  "Product",
] as const satisfies readonly SeoSchemaType[];

function assertConcreteRouteShell(route: SeoRouteRecord): SeoRouteRecord {
  if (isRouteTemplate(route)) {
    throw new Error(
      `Cannot build route shell schema for unresolved template route: ${route.path}`,
    );
  }

  return route;
}

function getSafeRouteShellName(route: SeoRouteRecord): string {
  return assertMetadataTextSafe(route.h1, "title");
}

function getSafeRouteShellDescription(route: SeoRouteRecord): string {
  return assertMetadataTextSafe(route.description, "description");
}

export function getSuppressedRouteShellSchemaTypes(
  route: SeoRouteRecord,
): readonly SeoSchemaType[] {
  return route.schema.filter((schemaType) =>
    ROUTE_SHELL_SUPPRESSED_SCHEMA_TYPES.includes(
      schemaType as (typeof ROUTE_SHELL_SUPPRESSED_SCHEMA_TYPES)[number],
    ),
  );
}

export function buildRouteShellBreadcrumbItems(
  route: SeoRouteRecord,
): readonly RouteShellBreadcrumbItem[] {
  assertConcreteRouteShell(route);

  if (route.path === "/") {
    return [{ name: "Presidential", path: "/" }];
  }

  return [
    { name: "Presidential", path: "/" },
    { name: getSafeRouteShellName(route), path: route.canonicalPath },
  ];
}

export function buildRouteShellJsonLd(
  route: SeoRouteRecord,
): readonly RouteShellJsonLdEntry[] {
  assertConcreteRouteShell(route);

  if (getRoutePublicationGateBlockReasons(route).length > 0) {
    return [];
  }

  const canonical = buildRouteCanonicalUrl(route);
  const entries: RouteShellJsonLdEntry[] = [];

  if (route.path === "/") {
    entries.push(
      { id: "organization", data: buildOrganizationSchema() },
      { id: "website", data: buildWebsiteSchema() },
    );
  }

  if (route.schema.includes("WebPage")) {
    const webPageSchema = buildWebPageSchema({
      path: route.canonicalPath,
      name: getSafeRouteShellName(route),
      description: getSafeRouteShellDescription(route),
    });

    if (webPageSchema.url !== canonical) {
      throw new Error(`Route shell WebPage canonical mismatch: ${route.path}`);
    }

    entries.push({ id: "webpage", data: webPageSchema });
  }

  if (route.schema.includes("BreadcrumbList")) {
    entries.push({
      id: "breadcrumb",
      data: buildBreadcrumbSchema(buildRouteShellBreadcrumbItems(route)),
    });
  }

  return entries;
}
