import type { Thing, WithContext } from "schema-dts";

type JsonLdProps<T extends Thing> = {
  data: WithContext<T>;
};

export function serializeJsonLd<T extends Thing>(data: WithContext<T>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd<T extends Thing>({ data }: JsonLdProps<T>) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

