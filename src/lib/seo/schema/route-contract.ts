import type { SeoRouteRecord, SeoSchemaType } from "../route-types";

export type RouteShellSchemaType = Extract<
  SeoSchemaType,
  "Organization" | "WebSite" | "WebPage" | "BreadcrumbList"
>;

export type RouteShellSchemaContract = {
  readonly schemaType: RouteShellSchemaType;
  readonly sourceFieldMap: Readonly<Record<string, string>>;
};

const ORGANIZATION_SOURCE_FIELD_MAP = {
  "@id": "schema.constants.ORGANIZATION_ID",
  name: "schema.constants.PRESIDENTIAL_NAME",
  url: "schema.constants.PRODUCTION_ORIGIN",
  description: "schema.constants.PRESIDENTIAL_DESCRIPTION",
} as const;

const WEBSITE_SOURCE_FIELD_MAP = {
  "@id": "schema.constants.WEBSITE_ID",
  name: "schema.constants.PRESIDENTIAL_NAME",
  url: "schema.constants.PRODUCTION_ORIGIN",
  "publisher.@id": "schema.constants.ORGANIZATION_ID",
} as const;

const WEBPAGE_SOURCE_FIELD_MAP = {
  "@id": "route.canonicalPath",
  url: "route.canonicalPath",
  name: "route.h1",
  description: "route.description",
  "isPartOf.@id": "schema.constants.WEBSITE_ID",
  "publisher.@id": "schema.constants.ORGANIZATION_ID",
} as const;

function buildBreadcrumbSourceFieldMap(
  route: SeoRouteRecord,
): Readonly<Record<string, string>> {
  const homeItem = {
    "itemListElement[0].name": "schema.routeShell.homeBreadcrumbName",
    "itemListElement[0].item": "schema.routeShell.homeBreadcrumbPath",
  };

  if (route.path === "/") {
    return homeItem;
  }

  return {
    ...homeItem,
    "itemListElement[1].name": "route.h1",
    "itemListElement[1].item": "route.canonicalPath",
  };
}

export function getEmittedRouteShellSchemaTypes(
  route: SeoRouteRecord,
): readonly RouteShellSchemaType[] {
  const schemaTypes: RouteShellSchemaType[] = [];

  if (route.path === "/") {
    schemaTypes.push("Organization", "WebSite");
  }

  if (route.schema.includes("WebPage")) {
    schemaTypes.push("WebPage");
  }

  if (route.schema.includes("BreadcrumbList")) {
    schemaTypes.push("BreadcrumbList");
  }

  return schemaTypes;
}

export function getExpectedRouteShellSchemaSourceFieldMap(
  route: SeoRouteRecord,
  schemaType: RouteShellSchemaType,
): Readonly<Record<string, string>> {
  switch (schemaType) {
    case "Organization":
      return ORGANIZATION_SOURCE_FIELD_MAP;
    case "WebSite":
      return WEBSITE_SOURCE_FIELD_MAP;
    case "WebPage":
      return WEBPAGE_SOURCE_FIELD_MAP;
    case "BreadcrumbList":
      return buildBreadcrumbSourceFieldMap(route);
  }
}

export function getRouteShellSchemaContracts(
  route: SeoRouteRecord,
): readonly RouteShellSchemaContract[] {
  return getEmittedRouteShellSchemaTypes(route).map((schemaType) => ({
    schemaType,
    sourceFieldMap: getExpectedRouteShellSchemaSourceFieldMap(route, schemaType),
  }));
}
