import type { Metadata } from 'next';
import { CatalogProductPage } from '@/components/presidential/products/catalog-product-page';
import { PageFrame } from '@/components/presidential/layout/page-frame';
import type { ProductCategoryPath } from '@/lib/products/product-paths';
import { canonicalUrl } from '@/lib/seo/schema/constants';
import { imageAlt, vaultStrainSlug, type VaultProduct } from '@/content/vault/catalog';
import descriptions from '@/content/vault/descriptions.json';

export function vaultProductMetadata(product: VaultProduct): Metadata {
  const title = `${product.strain} Moon Rock ${product.format} | Presidential`;
  const description = (descriptions as Record<string, string>)[product.slug];
  const image = product.scenes[0] ?? product.pack;
  const canonical = canonicalUrl(product.productUrl);
  return { title, description, alternates: { canonical }, robots: { index: true, follow: true }, openGraph: { title, description, url: canonical, type: 'website', images: [{ url: canonicalUrl(image.full), alt: imageAlt(product, image) }] } };
}
export function VaultProductPage({ product }: { product: VaultProduct }) {
  const image = product.scenes[0] ?? product.pack;
  const categoryPath = `/${product.room}` as ProductCategoryPath;
  const record = { id: vaultStrainSlug(product), name: product.strain, edition: `Moon Rock ${product.format}`, description: (descriptions as Record<string, string>)[product.slug], src: image.full, alt: imageAlt(product, image) };
  return <PageFrame className="bg-[#06100f]"><CatalogProductPage categoryLabel={product.room.replaceAll('-', ' ')} categoryPath={categoryPath} backPath={product.format.startsWith('Mini') ? `/presidential-art/${product.room}` : categoryPath} collection={product.tier ?? undefined} formatLabel={`Presidential Moon Rock ${product.format}`} product={record} products={[record]} vaultProduct={product} /></PageFrame>;
}
