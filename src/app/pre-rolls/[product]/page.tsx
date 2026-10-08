import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageFrame } from "@/components/presidential/layout/page-frame";
import { CatalogProductPage } from "@/components/presidential/products/catalog-product-page";
import { PRE_ROLL_ARTWORKS } from "@/lib/prerolls/catalog";
import {
  findProductBySlug,
  productSlug,
} from "@/lib/products/product-paths";
import { canonicalUrl } from "@/lib/seo/schema/constants";
import { findNewVaultProduct, newVaultProductPages, vaultStrainSlug } from '@/content/vault/catalog';
import { VaultProductPage, vaultProductMetadata } from '@/components/vault/product-page';

type PreRollProductPageProps = {
  readonly params: Promise<{ readonly product: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return [...PRE_ROLL_ARTWORKS.map((product) => ({ product: productSlug(product.id) })), ...newVaultProductPages.filter(p => p.room === 'pre-rolls').map(p => ({ product: vaultStrainSlug(p) }))];
}

export async function generateMetadata({
  params,
}: PreRollProductPageProps): Promise<Metadata> {
  const { product: slug } = await params;
  const vaultProduct = findNewVaultProduct('pre-rolls', slug);
  if (vaultProduct) return vaultProductMetadata(vaultProduct);
  const product = findProductBySlug(PRE_ROLL_ARTWORKS, slug);

  if (!product) return { robots: { index: false, follow: false } };

  const title = `${product.name} Pre-Roll | Presidential`;
  const description = `Explore ${product.name}, a Presidential Moon Rock pre-roll. Review the format, infusion, flavor profile, and licensed-retailer path.`;
  const canonical = canonicalUrl(`/pre-rolls/${slug}`);

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      images: [{ url: canonicalUrl(product.src), alt: product.alt }],
    },
  };
}

export default async function PreRollProductPage({ params }: PreRollProductPageProps) {
  const { product: slug } = await params;
  const vaultProduct = findNewVaultProduct('pre-rolls', slug);
  if (vaultProduct) return <VaultProductPage product={vaultProduct} />;
  const product = findProductBySlug(PRE_ROLL_ARTWORKS, slug);

  if (!product) notFound();

  return (
    <PageFrame className="bg-[#06100f]">
      <CatalogProductPage
        categoryLabel="Pre-Rolls"
        categoryPath="/pre-rolls"
        collection={product.collection}
        formatLabel="Presidential Moon Rock Pre-Roll"
        headingFormat="Pre-Roll"
        product={product}
        products={PRE_ROLL_ARTWORKS}
      />
    </PageFrame>
  );
}
