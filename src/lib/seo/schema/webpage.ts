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
};

export function buildWebPageSchema({
  path,
  name,
  description,
}: WebPageInput): WithContext<WebPage> {
  const url = canonicalUrl(path);

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORGANIZATION_ID },
  };
}

