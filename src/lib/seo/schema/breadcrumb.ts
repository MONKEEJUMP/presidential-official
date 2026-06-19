import type { BreadcrumbList, ListItem, WithContext } from "schema-dts";
import { SCHEMA_CONTEXT, canonicalUrl } from "./constants";

type BreadcrumbItem = {
  name: string;
  path: string;
};

export function buildBreadcrumbSchema(
  items: readonly BreadcrumbItem[],
): WithContext<BreadcrumbList> {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map<ListItem>((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}

