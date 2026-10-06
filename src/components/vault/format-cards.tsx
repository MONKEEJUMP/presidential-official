import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import shared from '@/components/presidential/prerolls/preroll-experience.module.css';
import { imageAlt, newVaultProductPages, type VaultProduct } from '@/content/vault/catalog';
import descriptions from '@/content/vault/descriptions.json';

export function vaultFormatHeading(format: string): string {
  return format.replace('Pre-roll', 'Pre-Roll');
}

function vaultTierSection(product: VaultProduct): 'gold' | 'rose-gold' | 'more' {
  if (product.tier === 'Live Resin') return 'gold';
  if (product.tier === 'Live Rosin') return 'rose-gold';
  return 'more';
}

export function VaultFormatCard({ product }: { product: VaultProduct }) {
  const image = product.scenes[0] ?? product.pack;
  const description = (descriptions as Record<string, string>)[product.slug];
  return (
    <article className={shared.artCardPortrait}>
      <Link aria-label={`View ${product.strain} product page`} className={shared.artCardImage} href={product.productUrl}>
        <Image alt={imageAlt(product, image)} fill sizes="(max-width: 700px) 46vw, (max-width: 1100px) 44vw, 29vw" src={image.full} />
      </Link>
      <div className={shared.artCardCopy}>
        <p>{`Presidential Moon Rock ${vaultFormatHeading(product.format)}`}</p>
        <h3><Link className="text-inherit no-underline" href={product.productUrl}>{product.strain}</Link></h3>
        {product.tier ? <span>{product.tier}</span> : null}
        {description ? <p>{description}</p> : null}
      </div>
    </article>
  );
}

// Vault SKUs with their own product page that the hand-built hub catalog does not list yet.
export function buildVaultCardsBySection(room: string): Partial<Record<string, ReactNode>> {
  const groups: Record<string, VaultProduct[]> = {};
  for (const product of newVaultProductPages.filter((p) => p.room === room)) {
    (groups[vaultTierSection(product)] ??= []).push(product);
  }
  return Object.fromEntries(
    Object.entries(groups).map(([section, products]) => [
      section,
      products.map((product) => <VaultFormatCard key={product.slug} product={product} />),
    ]),
  );
}
