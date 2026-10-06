import Link from 'next/link';
import { imageAlt, pieceHref, pieceLabel, type VaultImage, type VaultProduct } from '@/content/vault/catalog';

export function FramedArt({ product, image, full = false, className = '', priority = false }: { product: VaultProduct; image: VaultImage; full?: boolean; className?: string; priority?: boolean }) {
  return <div className={`vault-frame ${className}`}>
    {/* These authored WebPs already have responsive sizes and must retain their exact proportions. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={full ? image.full : image.gallery} width={full ? image.fullWidth : image.galleryWidth} height={full ? image.fullHeight : image.galleryHeight} alt={imageAlt(product, image)} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} draggable={false} />
  </div>;
}
export function Placard({ product }: { product: VaultProduct }) {
  return <div className="vault-placard"><span className="vault-piece-name">{product.strain}</span><span className="vault-piece-format">{pieceLabel(product)}</span></div>;
}
export function FramedPiece({ product, featured = false, entrance = false }: { product: VaultProduct; featured?: boolean; entrance?: boolean }) {
  const image = product.scenes[0] ?? product.pack;
  return <div className={`vault-piece ${featured ? 'vault-featured-piece' : ''} ${entrance ? 'vault-collection-piece' : ''}`}>
    <Link href={pieceHref(product)} scroll={false} className="vault-piece-art" aria-label={`Open ${product.strain} ${product.format} artwork`}><FramedArt product={product} image={image} full={featured} /></Link>
    <Link href={product.productUrl} className="vault-placard vault-placard-link"><span className="vault-piece-name">{product.strain}</span><span className="vault-piece-format">{pieceLabel(product)}</span></Link>
  </div>;
}
