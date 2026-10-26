import { findNewVaultProduct, vaultProducts, vaultStrainSlug, type VaultProduct } from '@/content/vault/catalog';

const PRESIDENTIAL_LINE_SLUGS = new Set([
  'garlic-cookies', 'ghost-haze-train', 'guava-haze', 'head-cheese',
  'iced-lemon', 'nino-brown', 'whoa-si-whoa',
]);

export function indexableProductHref(format: string, slug: string): string {
  const room = format.replace(/^\//, '');
  const strainSlug = slug.replace(/-title$/, '');
  const product = findNewVaultProduct(room, strainSlug);
  if (product) return product.productUrl;
  const moonRocksSlug = PRESIDENTIAL_LINE_SLUGS.has(strainSlug) ? `presidential-line-${strainSlug}` : strainSlug;
  return `/moon-rocks/${moonRocksSlug}`;
}

export function indexableVaultProductHref(product: VaultProduct): string;
export function indexableVaultProductHref(product: VaultProduct | undefined): string | undefined;
export function indexableVaultProductHref(product: VaultProduct | undefined): string | undefined {
  if (!product) return;
  return product.room === 'blunts' || product.room === 'pre-rolls'
    ? indexableProductHref(product.room, vaultStrainSlug(product))
    : product.productUrl;
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
export function vaultProductForAlt(alt: string): VaultProduct | undefined {
  const format = /mini blunts?/i.test(alt) ? 'Mini Blunt' : /mini pre-?rolls?/i.test(alt) ? 'Mini Pre-roll' : /pre-?rolls?/i.test(alt) ? 'Pre-roll' : /blunts?/i.test(alt) ? 'Blunt' : undefined;
  if (!format) return;
  const key = normalize(alt);
  const matches = vaultProducts.filter(p => p.format === format && key.includes(normalize(p.strain)));
  return matches.length === 1 ? matches[0] : undefined;
}
export function vaultProductForName(name: string, format: string): VaultProduct | undefined {
  const key = normalize(name);
  return vaultProducts.find(p => p.format === format && (normalize(p.strain) === key || p.strain === 'Presidential OG' && key === 'presidentialclassic'));
}
export function vaultProductForImage(src: string): VaultProduct | undefined {
  const tiles: Record<string, [string, string]> = {
    '/media/contact/collage/preroll-galactic-gas.webp': ['Galactic Gas', 'Pre-roll'],
    '/media/contact/collage/preroll-papaya-punch.webp': ['Papaya Punch', 'Pre-roll'],
    '/media/contact/collage/single-mini-cherry-gelato.webp': ['Cherry Gelato', 'Mini Blunt'],
    '/media/contact/collage/blunt-nyc-diesel.webp': ['NYC Diesel', 'Blunt'],
    '/media/contact/collage/blunt-blue-dream.webp': ['Blue Dream', 'Blunt'],
    '/media/contact/collage/blunt-cosmic-cookie.webp': ['Cosmic Cookies', 'Blunt'],
    '/media/contact/partner-cutouts/papaya-punch-blunt-package-cutout.webp': ['Papaya Punch', 'Blunt'],
    '/media/contact/partner-cutouts/cereal-milk-preroll-package-cutout.webp': ['Cereal Milk', 'Pre-roll'],
  };
  const tile = tiles[src];
  if (tile) return vaultProductForName(...tile);
  const candidates: [RegExp, string][] = [[/^\/media\/mini-blunt-(.+)\.(?:jpg|webp)$/, 'Mini Blunt'], [/^\/media\/preroll-(.+)\.(?:jpg|webp)$/, 'Pre-roll'], [/^\/media\/blunt-(.+)\.(?:jpg|webp)$/, 'Blunt'], [/^\/media\/pre-rolls\/(.+)\.webp$/, 'Pre-roll'], [/^\/media\/blunts\/(.+)\.webp$/, 'Blunt']];
  for (const [pattern, format] of candidates) {
    const matched = src.match(pattern);
    if (!matched) continue;
    let name = matched[1].replace(/-title$/, '').replace(/-(?:ca|nv)$/, '').replaceAll('-', ' ');
    if (name === 'presidential') name = 'Presidential OG';
    return vaultProductForName(name, format);
  }
}
