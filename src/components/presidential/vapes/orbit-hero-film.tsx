'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useAdultVideoPlayback } from '@/lib/browser/adult-video-playback';
import s from './orbit-hero-film.module.css';

const mobileQuery = '(max-width: 759px)';
function subscribeViewport(callback: () => void) {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}
function getMobileSnapshot() { return window.matchMedia(mobileQuery).matches; }
function getServerSnapshot() { return false; }

function FilmPlayer({ source, label, hasWebm, showControl, videoRef, paused, onPausedChange }: {
  source: string;
  label: string;
  hasWebm: boolean;
  showControl: boolean;
  videoRef: (video: HTMLVideoElement | null) => void;
  paused: boolean;
  onPausedChange: (paused: boolean) => void;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const pauseRequested = useRef(paused);
  const [started, setStarted] = useState(false);
  useEffect(() => { pauseRequested.current = paused; if (paused) ref.current?.pause(); }, [paused]);
  const attach = useCallback((video: HTMLVideoElement | null) => {
    ref.current = video;
    videoRef(video);
  }, [videoRef]);
  const playing = started && !paused;
  function togglePlayback() {
    const video = ref.current;
    if (!video) return;
    if (playing) { pauseRequested.current = true; video.pause(); onPausedChange(true); }
    else { pauseRequested.current = false; onPausedChange(false); void video.play().catch(() => onPausedChange(true)); }
  }
  return <>
    <video ref={attach} className={s.video} data-started={started} autoPlay={!paused} muted loop playsInline preload="none"
      aria-label={label}
      onPlay={event => { if (pauseRequested.current) event.currentTarget.pause(); }}
      onPlaying={() => setStarted(true)} onEmptied={() => setStarted(false)} onError={() => setStarted(false)}>
      {hasWebm ? <source src={`${source}.webm`} type="video/webm" /> : null}
      <source src={`${source}.mp4`} type="video/mp4" />
    </video>
    {showControl ? <button type="button" className={s.control} onClick={togglePlayback} aria-label={playing ? 'Pause product film' : 'Play product film'}>
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">{playing ? <path d="M5 3h3v14H5zM12 3h3v14h-3z" /> : <path d="m6 3 11 7-11 7z" />}</svg>
      <span>{playing ? 'Pause film' : 'Play film'}</span>
    </button> : null}
  </>;
}

export function OrbitHeroFilm({ variant = 'education' }: { variant?: 'education' | 'blueprint' }) {
  const container = useRef<HTMLDivElement | null>(null);
  const { canStream, videoRef } = useAdultVideoPlayback(container);
  const mobile = useSyncExternalStore(subscribeViewport, getMobileSnapshot, getServerSnapshot);
  const [posterReady, setPosterReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const blueprint = variant === 'blueprint';
  const source = `/media/vapes/film/${blueprint ? 'orbit-blueprint' : 'orbit-in-motion'}-${mobile ? 'mobile' : 'desktop'}-${blueprint ? 'tm-v2' : 'v1'}`;
  const label = blueprint ? 'White Presidential Orbit with Moon Pod: blueprint product film' : 'Orbit in Motion: Presidential vape finishes and product details';
  return <div className={s.film} data-variant={variant} ref={container}>
    <Image className={s.poster} src={blueprint ? '/media/vapes/film/orbit-blueprint-poster-tm-v2.jpg' : '/media/vapes/film/orbit-in-motion-poster-v1.jpg'} alt={blueprint ? 'White Presidential Orbit with Moon Pod against the Presidential TM blueprint sign' : 'Teal Presidential Orbit with Moon Pod, from the Orbit in Motion product film'} width={blueprint ? 1920 : 1080} height={1080} sizes="(min-width: 1100px) 620px, (min-width: 760px) 44vw, 90vw" loading={blueprint ? 'eager' : 'lazy'} fetchPriority={blueprint ? 'high' : 'auto'} onLoad={() => setPosterReady(true)} />
    {posterReady && canStream ? <FilmPlayer key={`${variant}-${mobile ? 'mobile' : 'desktop'}`} source={source} label={label} hasWebm={!blueprint} showControl={!blueprint} videoRef={videoRef} paused={paused} onPausedChange={setPaused} /> : null}
  </div>;
}
