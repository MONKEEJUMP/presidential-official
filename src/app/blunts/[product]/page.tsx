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

type BluntProductPageProps = {
  readonly params: Promise<{ readonly product: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return BLUNT_ARTWORKS.map((product) => ({ product: productSlug(product.id) }));
}

export async function generateMetadata({
  params,
}: BluntProductPageProps): Promise<Metadata> {
  const { product: slug } = await params;
  const product = findProductBySlug(BLUNT_ARTWORKS, slug);

  if (!product) return { robots: { index: false, follow: false } };

  const title = `${product.name} Blunt | Presidential`;
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
  const product = findProductBySlug(BLUNT_ARTWORKS, slug);

  if (!product) notFound();

  return (
    <PageFrame className="bg-[#06100f]">
      <CatalogProductPage
        categoryLabel="Blunts"
        categoryPath="/blunts"
        formatLabel="Presidential Moon Rock Blunt"
        product={product}
        products={BLUNT_ARTWORKS}
      />
    </PageFrame>
  );
}
