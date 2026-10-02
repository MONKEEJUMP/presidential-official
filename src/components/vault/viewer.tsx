'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { pieceLabel, type VaultProduct, type VaultRoom } from '@/content/vault/catalog';
import { FramedArt } from './framed-piece';

export function PieceViewer({ product, room, close }: { product: VaultProduct; room: VaultRoom; close: () => void }) {
  const [version, setVersion] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const closing = useRef(false);
  const n = product.scenes.length;
  const image = product.scenes[version] ?? product.pack;
  const description = n === 0 ? `The ${product.strain} Moon Rock Mini Pre-roll pack portrait.` : `${n === 1 ? 'The original artwork' : `${n} original artworks`} for the ${product.strain} Moon Rock ${product.format}, shown with its clean pack portrait.`;
  useEffect(() => {
    const node = dialog.current!;
    const previousFocus = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    node.showModal();
    return () => { node.close(); document.body.style.overflow = oldOverflow; previousFocus?.focus({ preventScroll: true }); };
  }, []);
  function requestClose() {
    if (closing.current) return;
    closing.current = true;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animation = dialog.current!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced ? 0 : 180, easing: 'ease-out', fill: 'forwards' });
    void animation.finished.then(close).catch(close);
  }
  return <dialog ref={dialog} className="vault-viewer" aria-labelledby="vault-piece-title" onCancel={event => { event.preventDefault(); requestClose(); }}>
    <div className="vault-viewer-top"><p className="vault-eyebrow">ROOM {room.numeral} · {room.name.toUpperCase()}</p><button onClick={requestClose} autoFocus aria-label="Close piece viewer">CLOSE <span aria-hidden="true">✕</span></button></div>
    <div className="vault-viewer-body"><div className="vault-viewer-stage"><FramedArt product={product} image={image} full priority /></div><div className="vault-viewer-details">
      <p className="vault-eyebrow">{pieceLabel({ ...product, tier: null })}</p><h2 id="vault-piece-title">{product.strain}</h2>{product.tier && <p className="vault-viewer-tier"><span aria-hidden="true">●</span> {product.tier}</p>}<span className="vault-rule" /><p className="vault-description">{description}</p>
      {n > 0 && <div className="vault-pack-portrait"><FramedArt product={product} image={product.pack} full /><span>THE PACK</span></div>}
      {product.productUrl && <Link className="vault-product-button" href={product.productUrl}>VIEW PRODUCT</Link>}
      <button className="vault-back-button" type="button" onClick={requestClose}>← BACK</button>
      {n > 1 && <div className="vault-versions"><p>VERSION {version + 1} OF {n}</p><div>{product.scenes.map((scene, i) => <button key={scene.full} onClick={() => setVersion(i)} aria-label={`Show version ${i + 1}`} aria-pressed={version === i}><FramedArt product={product} image={scene} /></button>)}</div></div>}
    </div></div>
  </dialog>;
}
