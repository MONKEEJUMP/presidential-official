import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageFrame } from "@/components/presidential/layout/page-frame";
import { CatalogProductPage } from "@/components/presidential/products/catalog-product-page";
import { BLUNT_ARTWORKS } from "@/content/blunts-catalog";
import {
  findProductBySlug,
  productSlug,
} from "@/lib/products/product-paths";
import { canonicalUrl } from "@/lib/seo/schema/constants";
import { findNewVaultProduct, newVaultProductPages, vaultStrainSlug } from '@/content/vault/catalog';
import { VaultProductPage, vaultProductMetadata } from '@/components/vault/product-page';
import { buildFormatProductTitle } from '@/lib/seo/title-templates';

type BluntProductPageProps = {
  readonly params: Promise<{ readonly product: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return [...BLUNT_ARTWORKS.map((product) => ({ product: productSlug(product.id) })), ...newVaultProductPages.filter(p => p.room === 'blunts').map(p => ({ product: vaultStrainSlug(p) }))];
}

export async function generateMetadata({
  params,
}: BluntProductPageProps): Promise<Metadata> {
  const { product: slug } = await params;
  const vaultProduct = findNewVaultProduct('blunts', slug);
  if (vaultProduct) return vaultProductMetadata(vaultProduct);
  const product = findProductBySlug(BLUNT_ARTWORKS, slug);

  if (!product) return { robots: { index: false, follow: false } };

  const title = buildFormatProductTitle({ name: product.name, format: "Blunt", existing: `${product.name} Blunt | Presidential`,
    weight: product.edition.match(/^\d+(?:\.\d+)?g\b/)?.[0], extract: product.edition.split("·")[2]?.trim(), infused: /infused/i.test(product.edition) });
  const description = `Explore ${product.name}, a Presidential Moon Rock blunt. Review the format, infusion, flavor profile, and licensed-retailer path.`;
  const canonical = canonicalUrl(`/blunts/${slug}`);

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

export default async function BluntProductPage({ params }: BluntProductPageProps) {
  const { product: slug } = await params;
  const vaultProduct = findNewVaultProduct('blunts', slug);
  if (vaultProduct) return <VaultProductPage product={vaultProduct} />;
  const product = findProductBySlug(BLUNT_ARTWORKS, slug);

  if (!product) notFound();

  return (
    <PageFrame className="bg-[#06100f]">
      <CatalogProductPage
        categoryLabel="Blunts"
        categoryPath="/blunts"
        formatLabel="Presidential Moon Rock Blunt"
        headingFormat="Blunt"
        product={product}
        products={BLUNT_ARTWORKS}
      />
    </PageFrame>
  );
}
