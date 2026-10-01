import artwork from './artwork.json';

export type VaultProduct = (typeof artwork)[number];
export type VaultImage = VaultProduct['pack'];
export const vaultProducts = artwork;
export const vaultRooms = [
  { slug: 'blunts', name: 'Blunts', numeral: 'I', format: 'Blunt', featured: 'galactic-gas-blunt' },
  { slug: 'pre-rolls', name: 'Pre-rolls', numeral: 'II', format: 'Pre-roll', featured: 'king-louis-pre-roll' },
  { slug: 'mini-blunts', name: 'Mini Blunts', numeral: 'III', format: 'Mini Blunt', featured: '24k-mini-blunt' },
  { slug: 'mini-pre-rolls', name: 'Mini Pre-rolls', numeral: 'IV', format: 'Mini Pre-roll', featured: 'xxx-mini-pre-roll' },
] as const;
export type VaultRoom = (typeof vaultRooms)[number];
const miniOrder = ['24K', 'Cherry Gelato', 'Gorilla Goo', 'Pink Cookies', 'Presidential OG', 'Skywalker', 'XJ13', 'Waui', 'XXX'];
export function productsInRoom(room: string) {
  return vaultProducts.filter(p => p.room === room).sort((a, b) => room === 'mini-pre-rolls' ? miniOrder.indexOf(a.strain) - miniOrder.indexOf(b.strain) : a.strain.localeCompare(b.strain));
}
export function pieceHref(product: VaultProduct) {
  return `/presidential-art/${product.room}?piece=${encodeURIComponent(product.slug)}`;
}
export function pieceLabel(product: { format: string; tier: string | null }) {
  return `MOON ROCK ${product.format.toUpperCase()}${product.tier ? ` · ${product.tier.toUpperCase()}` : ''}`;
}
export function imageAlt(product: VaultProduct, image: VaultImage) {
  return `${product.strain} Moon Rock ${product.format} ${image.kind === 'pack' ? 'pack' : 'artwork by Presidential'}`;
}
export const procession = vaultRooms.flatMap(room => productsInRoom(room.slug).flatMap(product => product.scenes.map(image => ({ product, image }))));
const kingIndex = procession.findIndex(p => p.product.slug === 'king-louis-blunt');
// Start with King Louis; the remaining pieces keep their relative room order.
export const entrancePieces = [procession[kingIndex], ...procession.filter((_, i) => i !== kingIndex)];
