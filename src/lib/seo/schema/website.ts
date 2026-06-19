import type { WebSite, WithContext } from "schema-dts";
import {
  ORGANIZATION_ID,
  PRESIDENTIAL_NAME,
  PRODUCTION_ORIGIN,
  SCHEMA_CONTEXT,
  WEBSITE_ID,
} from "./constants";

export function buildWebsiteSchema(): WithContext<WebSite> {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: PRESIDENTIAL_NAME,
    url: PRODUCTION_ORIGIN,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

