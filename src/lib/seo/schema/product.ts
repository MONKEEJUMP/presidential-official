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
  offers?: never;
  price?: never;
  review?: never;
  reviews?: never;
  shippingDetails?: never;
};

type InformationalProductInput = BlockedCommerceFields & {
  path: string;
  name: string;
  description: string;
  imagePaths: readonly string[];
};

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
    image: input.imagePaths.map(canonicalUrl),
    brand,
  };
}

