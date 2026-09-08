'use client';

import dynamic from 'next/dynamic';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { VapePage } from '@/lib/vapes/catalog';
import { decodeVapeFragment } from './vape-fragment';
import s from './showroom.module.css';

const VapeExperience = dynamic(
  () => import('./vape-experience').then((module) => module.VapeExperience),
  { ssr: false },
);
const DEFERRED_SECTION_IDS = ['moon-pods', 'orbit', 'details', 'designs'] as const;

export function VapeExperienceLoader({ page }: { page: VapePage }) {
  const [ready, setReady] = useState(false);
  const boundary = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (page !== 'vapes' || window.location.hash) return;
    const previousRestoration = window.history.scrollRestoration;
    const resetScroll = () => {
      if (!window.location.hash) window.scrollTo(0, 0);
    };
    window.history.scrollRestoration = 'manual';
    resetScroll();
    const frame = window.requestAnimationFrame(resetScroll);
    window.addEventListener('pageshow', resetScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('pageshow', resetScroll);
      window.history.scrollRestoration = previousRestoration;
    };
  }, [page]);

  useEffect(() => {
    const target = boundary.current;
    if (!target || ready) return;
    const fragment = decodeVapeFragment(window.location.hash);
    if (DEFERRED_SECTION_IDS.some((id) => id === fragment)) {
      queueMicrotask(() => setReady(true));
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setReady(true);
        observer.disconnect();
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [ready]);

  return (
    <div id="explore" ref={boundary} style={{ scrollMarginTop: '148px' }}>
      {ready ? (
        <VapeExperience page={page} />
      ) : (
        <section aria-labelledby="vape-explorer-placeholder" className={`${s.section} ${s.explorer}`}>
          <div aria-hidden="true" className="sr-only">
            {DEFERRED_SECTION_IDS.map((id) => <span id={id} key={id} />)}
          </div>
          <div className={s.sectionHeading}>
            <div>
              <p className={s.eyebrow}>The product explorer</p>
              <h2 id="vape-explorer-placeholder">Your Orbit.<br /><span>Your perspective.</span></h2>
            </div>
            <button className={s.primaryButton} type="button" onClick={() => setReady(true)}>Load the interactive explorer</button>
          </div>
        </section>
      )}
    </div>
  );
}
