'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { entrancePieces, pieceHref, vaultProducts, vaultRooms, productsInRoom } from '@/content/vault/catalog';
import { FramedArt, FramedPiece, Placard } from './framed-piece';

export function VaultEntrance() {
  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [fading, setFading] = useState(false);
  const position = useRef(0);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer: ReturnType<typeof setInterval> | undefined;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const configure = () => {
      clearInterval(timer); clearTimeout(settle);
      if (reduced.matches) { setPrevious(null); setFading(false); return; }
      timer = setInterval(() => {
        if (document.hidden) return;
        setPrevious(position.current);
        position.current = (position.current + 1) % entrancePieces.length;
        setIndex(position.current);
        setFading(true);
        settle = setTimeout(() => { setPrevious(null); setFading(false); }, 1200);
      }, 6000);
    };
    configure(); reduced.addEventListener('change', configure);
    return () => { clearInterval(timer); clearTimeout(settle); reduced.removeEventListener('change', configure); };
  }, []);
  const current = entrancePieces[index];
  const prior = previous === null ? null : entrancePieces[previous];
  return <div className="vault-entrance">
    <header className="vault-title-block"><p className="vault-eyebrow">THE COLLECTION</p><h1>THE PRESIDENTIAL VAULT</h1><span className="vault-rule" /><p className="vault-intro">The complete collection of Presidential art.</p></header>
    <section className="vault-masterpiece" aria-label="The collection procession">
      <Link href={pieceHref(current.product)} className="vault-procession-stage vault-piece" aria-label={`Open ${current.product.strain} ${current.product.format} artwork`}>
        <div className={`vault-procession-current ${fading ? 'vault-dissolving' : ''}`} key={index}><FramedArt product={current.product} image={current.image} full priority /></div>
        {prior && <div className="vault-procession-prior" aria-hidden="true"><FramedArt product={prior.product} image={prior.image} full /></div>}
      </Link>
      <Placard product={current.product} /><p className="vault-piece-count">PIECE {String(index + 1).padStart(2, '0')} OF {entrancePieces.length}</p>
    </section>
    <section className="vault-masterpieces"><p className="vault-eyebrow">FEATURED MASTERPIECES</p><h2>From the Collection</h2><div className="vault-masterpieces-row">{['gods-gift-blunt', '24k-blunt', 'gorilla-goo-pre-roll'].map(slug => <FramedPiece key={slug} product={vaultProducts.find(p => p.slug === slug)!} entrance />)}</div></section>
    <nav className="vault-entrance-rooms" aria-label="Enter the Vault rooms"><p className="vault-eyebrow">ENTER THE VAULT</p><div>{vaultRooms.map(room => <Link key={room.slug} href={`/presidential-art/${room.slug}`}><span>ROOM {room.numeral}</span><strong>{room.name}</strong><small>{productsInRoom(room.slug).length} WORKS</small></Link>)}</div></nav>
  </div>;
}
