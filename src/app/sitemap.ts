import type { MetadataRoute } from "next";

import { buildPresidentialSitemap } from "@/lib/seo/sitemap";
import { newVaultProductPages } from '@/content/vault/catalog';

export default function sitemap(): MetadataRoute.Sitemap {
  return [...buildPresidentialSitemap(), ...['', '/blunts', '/pre-rolls', '/mini-blunts', '/mini-pre-rolls'].map(room => ({ url: `https://presidentialmoonrocks.com/presidential-art${room}`, changeFrequency: 'monthly' as const, priority: 0.6 })), ...newVaultProductPages.map(p => ({ url: `https://presidentialmoonrocks.com${p.productUrl}`, changeFrequency: 'monthly' as const, priority: 0.6 }))];
}

