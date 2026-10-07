'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useAdultVideoPlayback } from '@/lib/browser/adult-video-playback';
import styles from './homepage-artwork-showcase.module.css';

const SHOWCASE_VIDEO = '/media/homepage/presidential-pre-roll-showcase-15s.mp4';
const SHOWCASE_POSTER = '/media/vault/piece-077-full.webp';

export function HomepageArtworkShowcase() {
  const frame = useRef<HTMLAnchorElement>(null);
  const { canStream, videoRef } = useAdultVideoPlayback(frame);

  useEffect(() => {
    const node = frame.current!;
    const left = node.parentElement!;
    const box = node.closest('section[aria-label="Welcome to Presidential"]')?.querySelector<HTMLElement>('.po-teal-pinstripe');
    const topPair = box?.previousElementSibling;
    if (!box || !topPair) return;
    const update = () => {
      const height = box.getBoundingClientRect().height;
      left.style.setProperty('--hero-box-height', `${height}px`);
      left.style.setProperty('--hero-frame-width', `${Math.max(0, height - 46) * 1200 / 1362 + 46}px`);
      left.style.setProperty('--hero-top-height', `${topPair.getBoundingClientRect().height}px`);
    };
    const observer = new ResizeObserver(update);
    observer.observe(box);
    observer.observe(topPair);
    return () => observer.disconnect();
  }, []);

  return (
    <Link
      ref={frame}
      className={styles.frame}
      href="/pre-rolls"
      aria-label="Explore Presidential Moon Rock pre-rolls"
      data-hero-showcase
    >
      <div className={styles.canvas}>
        <video
          aria-hidden="true"
          autoPlay={canStream}
          className={styles.video}
          disablePictureInPicture
          loop
          muted
          playsInline
          poster={SHOWCASE_POSTER}
          preload={canStream ? "auto" : "none"}
          ref={videoRef}
        >
          {canStream ? <source src={SHOWCASE_VIDEO} type="video/mp4" /> : null}
        </video>
      </div>
    </Link>
  );
}
