'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import type { VapePage } from '@/lib/vapes/catalog';
import s from './showroom.module.css';

const VapeExperience = dynamic(
  () => import('./vape-experience').then((module) => module.VapeExperience),
  { ssr: false },
);

export function VapeExperienceLoader({ page }: { page: VapePage }) {
  const [ready, setReady] = useState(false);
  const boundary = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = boundary.current;
    if (!target || ready) return;
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
    <div id="explore" ref={boundary}>
      {ready ? (
        <VapeExperience page={page} />
      ) : (
        <section aria-labelledby="vape-explorer-placeholder" className={`${s.section} ${s.explorer}`}>
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
