import type { Metadata } from 'next';
import { VaultEntrance } from '@/components/vault/entrance';
import { buildSocialMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbSchema, buildWebPageSchema, JsonLd } from '@/lib/seo/schema';

const TITLE = 'The Presidential Vault | Moon Rock Pack Art Collection';
const DESCRIPTION = 'Explore the complete Presidential art collection. Step into four gallery rooms of Moon Rock Blunts, Pre-rolls, Mini Blunts and Mini Pre-rolls.';
const CANONICAL = 'https://presidentialmoonrocks.com/presidential-art';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  robots: { index: true, follow: true },
  ...buildSocialMetadata({ title: TITLE, description: DESCRIPTION, url: CANONICAL }),
};

// 1014-MR-SEOMATOR: WebPage + BreadcrumbList (no Product, no FAQPage).
export default function VaultPage() {
  return (
    <>
      <JsonLd data={buildWebPageSchema({ path: '/presidential-art', name: 'Presidential Art', description: DESCRIPTION })} />
      <JsonLd data={buildBreadcrumbSchema([{ name: 'Presidential', path: '/' }, { name: 'Presidential Art', path: '/presidential-art' }])} />
      <VaultEntrance />
    </>
  );
}
