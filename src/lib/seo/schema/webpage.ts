import type { WebPage, WithContext } from "schema-dts";
import {
  ORGANIZATION_ID,
  SCHEMA_CONTEXT,
  WEBSITE_ID,
  canonicalUrl,
} from "./constants";

type WebPageInput = {
  path: string;
  name: string;
  description: string;
  aboutId?: string;
};

// InLinks pid 50409 schema export (2026-10-06), merged into the existing
// WebPage node. Only entities that match the page's meaning are kept.
const WIKI = "https://en.wikipedia.org/wiki/";
const thing = (name: string, slug: string) => ({
  "@type": "Thing" as const,
  name,
  sameAs: `${WIKI}${slug}`,
});
const INLINKS_MENTIONS: Record<string, ReturnType<typeof thing>[]> = {
  "/about": [thing("flower", "Flower"), thing("kief", "Kief")],
  "/learn/what-are-moon-rocks": [thing("flower", "Flower"), thing("kief", "Kief")],
  "/moon-rocks/24k": [thing("flower", "Flower"), thing("strain", "Cannabis_strain")],
};

export function buildWebPageSchema({
  path,
  name,
  description,
  aboutId,
}: WebPageInput): WithContext<WebPage> {
  const url = canonicalUrl(path);
  const mentions = INLINKS_MENTIONS[path];

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORGANIZATION_ID },
    ...(aboutId ? { about: { "@id": aboutId } } : {}),
    ...(mentions ? { mentions } : {}),
  };
}

