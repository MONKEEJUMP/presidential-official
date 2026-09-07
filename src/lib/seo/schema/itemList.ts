import type { ItemList, ListItem, Thing, Organization, WithContext } from "schema-dts";
import { SCHEMA_CONTEXT, canonicalUrl } from "./constants";

type ItemListEntry = {
  name: string;
  path: string;
  areaServed?: readonly {city: string; state: string}[];
};

export function buildItemListSchema(
  name: string,
  items: readonly ItemListEntry[],
): WithContext<ItemList> {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "ItemList",
    name,
    itemListElement: items.map<ListItem>((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: item.areaServed ? {
        '@type': 'Organization', name: item.name, url: canonicalUrl(item.path),
        areaServed: item.areaServed.map(area=>({'@type':'Place',address:{'@type':'PostalAddress',addressLocality:area.city,addressRegion:area.state,addressCountry:'US'}})),
      } satisfies Organization : {
        "@type": "Thing",
        name: item.name,
        url: canonicalUrl(item.path),
      } satisfies Thing,
    })),
  };
}
