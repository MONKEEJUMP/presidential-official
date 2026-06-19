import type { ItemList, ListItem, Thing, WithContext } from "schema-dts";
import { SCHEMA_CONTEXT, canonicalUrl } from "./constants";

type ItemListEntry = {
  name: string;
  path: string;
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
      item: {
        "@type": "Thing",
        name: item.name,
        url: canonicalUrl(item.path),
      } satisfies Thing,
    })),
  };
}

