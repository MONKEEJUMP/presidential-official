'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import styles from './homepage-artwork-showcase.module.css';

const pieces = [
  { src: '/media/vault/piece-077-full.webp', href: '/pre-rolls/gorilla-goo', alt: 'Gorilla Goo Moon Rock Pre-roll artwork by Presidential', width: 1200, height: 1362 },
  { src: '/media/vault/piece-003-full.webp', href: '/blunts/cereal-milk', alt: 'Cereal Milk Moon Rock Blunt artwork by Presidential', width: 1080, height: 1440 },
  { src: '/media/vault/piece-078-full.webp', href: '/pre-rolls/pink-cookies', alt: 'Pink Cookies Moon Rock Pre-roll artwork by Presidential', width: 1200, height: 1362 },
  { src: '/media/vault/piece-039-full.webp', href: '/blunts/skywalker', alt: 'Skywalker Moon Rock Blunt artwork by Presidential', width: 1200, height: 1200 },
] as const;

export function HomepageArtworkShowcase() {
  const frame = useRef<HTMLAnchorElement>(null);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const images = Array.from(frame.current!.querySelectorAll('img'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false;
    let decoding = false;
    let running = false;
    let current = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    function advance() {
      if (disposed || reduced.matches) return;
      current = (current + 1) % pieces.length;
      setIndex(current);
      // One second of concurrent opacity transitions, then two seconds at rest.
      timer = setTimeout(advance, 3000);
    }
    function start() {
      if (disposed || running || decoding || reduced.matches || images.some(image => !image.complete || !image.naturalWidth)) return;
      decoding = true;
      void Promise.all(images.map(image => image.decode())).then(() => {
        decoding = false;
        if (disposed || running || reduced.matches) return;
        running = true;
        timer = setTimeout(advance, 2000);
      }).catch(() => { decoding = false; });
    }
    function preferenceChanged() {
      clearTimeout(timer);
      running = false;
      current = 0;
      setIndex(0);
      start();
    }
    images.forEach(image => image.addEventListener('load', start));
    reduced.addEventListener('change', preferenceChanged);
    const readyCheck = requestAnimationFrame(start);
    return () => { disposed = true; clearTimeout(timer); cancelAnimationFrame(readyCheck); images.forEach(image => image.removeEventListener('load', start)); reduced.removeEventListener('change', preferenceChanged); };
  }, []);
  return <Link ref={frame} className={styles.frame} href={pieces[index].href} aria-label={pieces[index].alt} data-hero-showcase data-piece-index={index + 1}>
    <div className={styles.canvas}>{pieces.map((piece, i) => (
      // Existing authored WebPs keep the exact originals' proportions.
      // eslint-disable-next-line @next/next/no-img-element
      <img key={piece.src} className={styles.art} src={piece.src} width={piece.width} height={piece.height} alt={piece.alt} loading="eager" decoding="async" fetchPriority={i === 0 ? 'high' : undefined} aria-hidden={i !== index} data-active={i === index} draggable={false} />
    ))}</div>
  </Link>;
}
