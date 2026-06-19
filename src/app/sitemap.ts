import type { MetadataRoute } from "next";

import { buildPresidentialSitemap } from "@/lib/seo/sitemap";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildPresidentialSitemap();
}

