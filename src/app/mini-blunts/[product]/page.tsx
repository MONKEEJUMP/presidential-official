import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findNewVaultProduct, newVaultProductPages, vaultStrainSlug } from '@/content/vault/catalog';
import { VaultProductPage, vaultProductMetadata } from '@/components/vault/product-page';

export const dynamicParams = false;
export function generateStaticParams() { return newVaultProductPages.filter(p => p.room === 'mini-blunts').map(p => ({ product: vaultStrainSlug(p) })); }
export async function generateMetadata({ params }: { params: Promise<{ product: string }> }): Promise<Metadata> {
  const { product: slug } = await params;
  const product = findNewVaultProduct('mini-blunts', slug);
  if (!product) notFound();
  return vaultProductMetadata(product);
}
export default async function Page({ params }: { params: Promise<{ product: string }> }) {
  const { product: slug } = await params;
  const product = findNewVaultProduct('mini-blunts', slug);
  if (!product) notFound();
  return <VaultProductPage product={product} />;
}
