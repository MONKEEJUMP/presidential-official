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
  const origin = useRef<{ kind: 'room' | 'entrance'; y: number; href: string } | null>(null);
  const restore = useRef<{ y?: number; href: string } | null>(null);
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const header = document.querySelector('header[data-desktop]');
    if (!header) return;
    const observer = new ResizeObserver(() => { if (roomMenu.current) roomMenu.current.style.top = `${header.getBoundingClientRect().height}px`; });
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (product) {
      if (origin.current) return;
      try {
        const saved = sessionStorage.getItem('presidential-vault-origin');
        sessionStorage.removeItem('presidential-vault-origin');
        if (!saved) return;
        const entry = JSON.parse(saved);
        if (entry.href === `${pathname}?piece=${encodeURIComponent(product.slug)}` && typeof entry.y === 'number' && Date.now() - entry.time < 60000) {
          origin.current = { kind: 'entrance', y: entry.y, href: entry.href };
        }
      } catch { /* A direct link uses the room/piece fallback. */ }
      return;
    }
    origin.current = null;
    const pending = restore.current;
    if (!pending) return;
    restore.current = null;
    const frame = requestAnimationFrame(() => {
      const piece = Array.from(content.current?.querySelectorAll<HTMLAnchorElement>('a') ?? []).find(a => a.getAttribute('href') === pending.href);
      piece?.focus({ preventScroll: true });
      if (pending.y !== undefined) window.scrollTo({ top: pending.y, behavior: 'instant' });
      else piece?.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
    return () => cancelAnimationFrame(frame);
  }, [product, pathname]);
  const next = vaultRooms[vaultRooms.findIndex(r => r.slug === room.slug) + 1];
  function close() {
    if (!product) return;
    const from = origin.current;
    if (from?.kind === 'entrance') {
      try { sessionStorage.setItem('presidential-vault-return', JSON.stringify({ y: from.y, href: from.href })); } catch { /* Keep native history restoration. */ }
      router.back();
    } else if (from?.kind === 'room') {
      restore.current = { y: from.y, href: from.href };
      router.back();
    } else {
      restore.current = { href: `${pathname}?piece=${encodeURIComponent(product.slug)}` };
      router.replace(pathname, { scroll: false });
    }
  }
  const nav = <nav className="vault-room-nav" aria-label="Room navigation"><Link href="/presidential-art">← THE VAULT</Link><Link href={next ? `/presidential-art/${next.slug}` : '/presidential-art'}>{next ? `NEXT ROOM: ${next.name.toUpperCase()} →` : 'BACK TO THE ENTRANCE →'}</Link></nav>;
  return <>
    <div ref={content} onClick={event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a');
      const href = link?.getAttribute('href');
      if (href?.startsWith(`${pathname}?piece=`)) origin.current = { kind: 'room', y: window.scrollY, href };
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
