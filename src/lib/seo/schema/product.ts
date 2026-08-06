import type { Brand, Product, WithContext } from "schema-dts";
import {
  ORGANIZATION_ID,
  PRESIDENTIAL_NAME,
  SCHEMA_CONTEXT,
  canonicalUrl,
} from "./constants";

type BlockedCommerceFields = {
  aggregateRating?: never;
  availability?: never;
  price?: never;
  review?: never;
  reviews?: never;
  shippingDetails?: never;
};

type InformationalProductInput = BlockedCommerceFields & {
  path: string;
  name: string;
  description: string;
  imageUrls: readonly string[];
};

function approvedProductImageUrl(value: string): string {
  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return canonicalUrl(value);
  }

  const parsed = new URL(value);
  const isApprovedSanityAsset =
    parsed.protocol === "https:" &&
    parsed.hostname === "cdn.sanity.io" &&
    parsed.pathname.startsWith("/images/4bl3xvem/production/");

  if (!isApprovedSanityAsset) {
    throw new Error(`Unapproved Product schema image URL: ${value}`);
  }

  return parsed.toString();
}

export function buildInformationalProductSchema(
  input: InformationalProductInput,
): WithContext<Product> {
  const url = canonicalUrl(input.path);
  const brand: Brand = {
    "@type": "Brand",
    "@id": ORGANIZATION_ID,
    name: PRESIDENTIAL_NAME,
  };

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Product",
    "@id": `${url}#product`,
    url,
    name: input.name,
    description: input.description,
    ...(input.imageUrls.length > 0
      ? { image: input.imageUrls.map(approvedProductImageUrl) }
      : {}),
    brand,
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStoreOnly",
      url: canonicalUrl("/find-us"),
      seller: { "@id": ORGANIZATION_ID },
    },
  };
}
