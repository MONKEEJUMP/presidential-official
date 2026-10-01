'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { productsInRoom, vaultProducts, vaultRooms, type VaultRoom } from '@/content/vault/catalog';
import { FramedPiece } from './framed-piece';
import { PieceViewer } from './viewer';

export function VaultRoomPage({ room }: { room: VaultRoom }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const roomProducts = productsInRoom(room.slug);
  const product = roomProducts.find(p => p.slug === params.get('piece'));
  const roomMenu = useRef<HTMLElement>(null);
  const openedHere = useRef(false);
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const header = document.querySelector('header.group\/header');
    if (!header) return;
    const observer = new ResizeObserver(() => { if (roomMenu.current) roomMenu.current.style.top = `${header.getBoundingClientRect().height}px`; });
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  const next = vaultRooms[vaultRooms.findIndex(r => r.slug === room.slug) + 1];
  function close() {
    if (openedHere.current) { openedHere.current = false; router.back(); }
    else router.replace(pathname, { scroll: false });
  }
  const nav = <nav className="vault-room-nav" aria-label="Room navigation"><Link href="/presidential-art">← THE VAULT</Link><Link href={next ? `/presidential-art/${next.slug}` : '/presidential-art'}>{next ? `NEXT ROOM: ${next.name.toUpperCase()} →` : 'BACK TO THE ENTRANCE →'}</Link></nav>;
  return <>
    <div ref={content} onClick={event => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a');
      if (link?.getAttribute('href')?.startsWith(`${pathname}?piece=`)) openedHere.current = true;
    }}>
      <nav ref={roomMenu} className="vault-room-menu" aria-label="Vault rooms">{vaultRooms.map(r => <Link href={`/presidential-art/${r.slug}`} key={r.slug} aria-current={r.slug === room.slug ? 'page' : undefined}><span>ROOM {r.numeral}</span>{r.name.toUpperCase()}</Link>)}</nav>
      <div className="vault-room-content">{nav}<header className="vault-room-heading"><p className="vault-eyebrow">ROOM {room.numeral}</p><h1>{room.name.toUpperCase()}</h1><span className="vault-rule" /><p>{roomProducts.length} WORKS</p></header>
        <section className="vault-room-featured"><p className="vault-eyebrow">FEATURED WORK</p><FramedPiece featured product={vaultProducts.find(p => p.slug === room.featured)!} /></section>
        <span className="vault-rule vault-gallery-rule" />
        <section className="vault-gallery" aria-label={`${room.name} gallery`}>{roomProducts.map(p => <FramedPiece product={p} key={p.slug} />)}</section>{nav}
      </div>
    </div>
    {product && <PieceViewer key={product.slug} product={product} room={room} close={close} />}
  </>;
}
