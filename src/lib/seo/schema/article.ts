import type { Article, WithContext } from "schema-dts";
import { ORGANIZATION_ID, SCHEMA_CONTEXT, canonicalUrl } from "./constants";

type ArticleInput = {
  path: string;
  headline: string;
  description: string;
  imagePath: string;
  datePublished: string;
  dateModified?: string;
};

export function buildArticleSchema(input: ArticleInput): WithContext<Article> {
  const url = canonicalUrl(input.path);

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Article",
    "@id": `${url}#article`,
    url,
    headline: input.headline,
    description: input.description,
    image: canonicalUrl(input.imagePath),
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

