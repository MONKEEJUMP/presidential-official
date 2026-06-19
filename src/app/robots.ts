import type { MetadataRoute } from "next";

import { buildPresidentialRobots } from "@/lib/seo/robots";

export default function robots(): MetadataRoute.Robots {
  return buildPresidentialRobots();
}

