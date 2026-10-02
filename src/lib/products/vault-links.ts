import { vaultProducts, type VaultProduct } from '@/content/vault/catalog';

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
