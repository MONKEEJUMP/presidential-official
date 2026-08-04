import type {
  BreadcrumbList,
  Organization,
  WebPage,
  WebSite,
  WithContext,
} from "schema-dts";

import { assertMetadataTextSafe } from "../metadata-helpers";
import { getSitemapBlockReasons } from "../indexability";
import { buildRouteCanonicalUrl, isRouteTemplate } from "../route-helpers";
import type { RoutePublicationGateInput } from "../metadata-types";
import type { SeoRouteRecord, SeoSchemaType } from "../route-types";
import { getRoutePublicationGateBlockReasons } from "../source-records";
import { buildBreadcrumbSchema } from "./breadcrumb";
import { buildOrganizationSchema } from "./organization";
import { getEmittedRouteShellSchemaTypes } from "./route-contract";
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

export const ABOUT_ORGANIZATION_LOGO_PATH =
  "/media/brand/presidential-crest-master.png" as const;

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
  gateInput: RoutePublicationGateInput = {},
): readonly RouteShellJsonLdEntry[] {
  assertConcreteRouteShell(route);

  if (
    getRoutePublicationGateBlockReasons(
      route,
      gateInput.routePublicationRecords,
      gateInput.routePublicationContext,
    ).length > 0 ||
    getSitemapBlockReasons(route, gateInput).length > 0
  ) {
    return [];
  }

  const canonical = buildRouteCanonicalUrl(route);
  const entries: RouteShellJsonLdEntry[] = [];
  const emittedSchemaTypes = getEmittedRouteShellSchemaTypes(route);

  if (emittedSchemaTypes.includes("Organization")) {
    entries.push(
      {
        id: "organization",
        data: buildOrganizationSchema(
          route.path === "/about"
            ? { logoPath: ABOUT_ORGANIZATION_LOGO_PATH }
            : {},
        ),
      },
    );
  }

  if (route.path === "/" && emittedSchemaTypes.includes("WebSite")) {
    entries.push({ id: "website", data: buildWebsiteSchema() });
  }

  if (emittedSchemaTypes.includes("WebPage")) {
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

  if (emittedSchemaTypes.includes("BreadcrumbList")) {
    entries.push({
      id: "breadcrumb",
      data: buildBreadcrumbSchema(buildRouteShellBreadcrumbItems(route)),
    });
  }

  return entries;
}
