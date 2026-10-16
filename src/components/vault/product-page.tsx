import type { Metadata } from 'next';
import Link from 'next/link';
import { CatalogProductPage } from '@/components/presidential/products/catalog-product-page';
import { PageFrame } from '@/components/presidential/layout/page-frame';
import type { ProductCategoryPath } from '@/lib/products/product-paths';
import { canonicalUrl } from '@/lib/seo/schema/constants';
import { imageAlt, vaultStrainSlug, type VaultProduct } from '@/content/vault/catalog';
import descriptions from '@/content/vault/descriptions.json';
import { vaultFormatHeading } from './format-cards';
import { vaultMetaDescription } from '@/content/vault/specs';

export function vaultProductMetadata(product: VaultProduct): Metadata {
  const title = `${product.strain} Moon Rock ${product.format} | Presidential`;
  // Sitebulb oct06d #1: the meta is a short spec summary; the full blurb stays on the page.
  const description = vaultMetaDescription(product) ?? (descriptions as Record<string, string>)[product.slug];
  const image = product.scenes[0] ?? product.pack;
  const canonical = canonicalUrl(product.productUrl);
  return { title, description, alternates: { canonical }, robots: { index: true, follow: true }, openGraph: { title, description, url: canonical, type: 'website', images: [{ url: canonicalUrl(image.full), alt: imageAlt(product, image) }] } };
}
// InLinks r10: the two weakest mini pre-roll pages, linked from their siblings.
const MINI_PRE_ROLL_LINKS = [
  { slug: '24k', label: '24K' },
  { slug: 'cherry-gelato', label: 'Cherry Gelato' },
] as const;

function MiniPreRollSiblings({ current }: { current: string }) {
  const links = MINI_PRE_ROLL_LINKS.filter((link) => link.slug !== current);
  return <p className="mx-auto w-full max-w-7xl px-6 pb-12 text-sm leading-6 text-white/80">More Mini Pre-Rolls:{' '}{links.map((link, index) => <span key={link.slug}>{index > 0 ? ' and ' : ''}<Link className="font-semibold underline underline-offset-4" href={`/mini-pre-rolls/${link.slug}`}>{link.label}</Link></span>)}.</p>;
}

export function VaultProductPage({ product }: { product: VaultProduct }) {
  const image = product.scenes[0] ?? product.pack;
  const categoryPath = `/${product.room}` as ProductCategoryPath;
  const record = { id: vaultStrainSlug(product), name: product.strain, edition: `Moon Rock ${product.format}`, description: (descriptions as Record<string, string>)[product.slug], src: image.full, alt: imageAlt(product, image) };
  // GSC 1012: no approved prices or reviews, so no Product schema (it requires offers/review/rating).
  return <PageFrame className="bg-[#06100f]"><CatalogProductPage categoryLabel={product.room.replaceAll('-', ' ')} categoryPath={categoryPath} backPath={product.format.startsWith('Mini') ? `/presidential-art/${product.room}` : categoryPath} collection={product.tier ?? undefined} formatLabel={`Presidential Moon Rock ${product.format}`} headingFormat={vaultFormatHeading(product.format)} product={record} products={[record]} vaultProduct={product} />{product.room === 'mini-pre-rolls' ? <MiniPreRollSiblings current={vaultStrainSlug(product)} /> : null}</PageFrame>;
}
