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
import { VaultSkuCopy } from './r34-copy';

export function vaultProductMetadata(product: VaultProduct): Metadata {
  const title = `${product.strain} Moon Rock ${product.format} | Presidential`;
  // Sitebulb oct06d #1: the meta is a short spec summary; the full blurb stays on the page.
  const description = vaultMetaDescription(product) ?? (descriptions as Record<string, string>)[product.slug];
  const image = product.scenes[0] ?? product.pack;
  const canonical = canonicalUrl(product.productUrl);
  return { title, description, alternates: { canonical }, robots: { index: true, follow: true }, openGraph: { title, description, url: canonical, type: 'website', images: [{ url: canonicalUrl(image.full), alt: imageAlt(product, image) }] } };
}
// InLinks r10/r11: the weakest mini pages, linked from their siblings (vault product names).
const MINI_SIBLING_LINKS: Readonly<Record<string, { readonly heading: string; readonly links: readonly { readonly slug: string; readonly label: string }[] }>> = {
  'mini-pre-rolls': { heading: 'More Mini Pre-Rolls', links: [{ slug: '24k', label: '24K' }, { slug: 'cherry-gelato', label: 'Cherry Gelato' }, { slug: 'gorilla-goo', label: 'Gorilla Goo' }, { slug: 'presidential-og', label: 'Presidential OG' }, { slug: 'skywalker', label: 'Skywalker' }] },
  'mini-blunts': { heading: 'More Mini Blunts', links: [{ slug: '24k', label: '24K' }] },
};

function MiniSiblings({ room, current }: { room: string; current: string }) {
  const group = MINI_SIBLING_LINKS[room];
  const links = group ? group.links.filter((link) => link.slug !== current) : [];
  if (!group || links.length === 0) return null;
  return <p className="mx-auto w-full max-w-7xl px-6 pb-12 text-sm leading-6 text-white/80">{group.heading}:{' '}{links.map((link, index) => <span key={link.slug}>{index > 0 ? (index === links.length - 1 ? ' and ' : ', ') : ''}<Link className="font-semibold underline underline-offset-4" href={`/${room}/${link.slug}`}>{link.label}</Link></span>)}.</p>;
}

// Sitebulb R34 A1: mini SKU back links go to the product list; this line keeps the art-room inlink.
const MINI_ART_ROOM: Readonly<Record<string, string>> = { 'mini-pre-rolls': 'mini pre-roll pack art', 'mini-blunts': 'mini blunt pack art' };
function MiniArtRoomLine({ room }: { room: string }) {
  const label = MINI_ART_ROOM[room];
  if (!label) return null;
  return <p className="mx-auto w-full max-w-7xl px-6 pb-6 text-sm leading-6 text-white/80">See this pack in the <Link className="font-semibold underline underline-offset-4" href={`/presidential-art/${room}`}>{label}</Link> room.</p>;
}

export function VaultProductPage({ product }: { product: VaultProduct }) {
  const image = product.scenes[0] ?? product.pack;
  const categoryPath = `/${product.room}` as ProductCategoryPath;
  const record = { id: vaultStrainSlug(product), name: product.strain, edition: `Moon Rock ${product.format}`, description: (descriptions as Record<string, string>)[product.slug], src: image.full, alt: imageAlt(product, image) };
  // GSC 1012: no approved prices or reviews, so no Product schema (it requires offers/review/rating).
  return <PageFrame className="bg-[#06100f]"><CatalogProductPage categoryLabel={product.room.replaceAll('-', ' ')} categoryPath={categoryPath} backPath={categoryPath} collection={product.tier ?? undefined} formatLabel={`Presidential Moon Rock ${product.format}`} headingFormat={vaultFormatHeading(product.format)} product={record} products={[record]} vaultProduct={product} /><VaultSkuCopy room={product.room} slug={vaultStrainSlug(product)} /><MiniArtRoomLine room={product.room} /><MiniSiblings room={product.room} current={vaultStrainSlug(product)} /></PageFrame>;
}
