import type { Product, WithContext } from "schema-dts";

import type { RoutePublicationGateInput } from "../metadata-types";
import type { SeoRouteRecord } from "../route-types";
import { buildInformationalProductSchema } from "./product";
import {
  buildRouteShellJsonLd,
  type RouteShellJsonLdData,
} from "./routeShell";

export type ProductRouteJsonLdData =
  | RouteShellJsonLdData
  | WithContext<Product>;

export type ProductRouteJsonLdEntry = {
  readonly id: string;
  readonly data: ProductRouteJsonLdData;
};

type BuildProductRouteJsonLdInput = {
  readonly route: SeoRouteRecord;
  readonly name: string;
  readonly description: string;
  readonly imageUrls: readonly string[];
  readonly publicRenderable: boolean;
  readonly gateInput?: RoutePublicationGateInput;
};

export function buildProductRouteJsonLd({
  route,
  name,
  description,
  imageUrls,
  publicRenderable,
  gateInput = {},
}: BuildProductRouteJsonLdInput): readonly ProductRouteJsonLdEntry[] {
  if (route.kind !== "product_detail") {
    throw new Error(`Product schema caller received a non-product route: ${route.path}`);
  }

  if (!publicRenderable) {
    return [];
  }

  const entries: ProductRouteJsonLdEntry[] = [
    ...buildRouteShellJsonLd(route, gateInput),
  ];

  if (entries.length === 0 || !route.schema.includes("Product")) {
    return entries;
  }

  entries.push({
    id: "product",
    data: buildInformationalProductSchema({
      path: route.canonicalPath,
      name,
      description,
      imageUrls,
    }),
  });

  return entries;
}
