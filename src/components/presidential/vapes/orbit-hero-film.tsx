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

function FilmPlayer({ mobile, videoRef, paused, onPausedChange }: {
  mobile: boolean;
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
  const source = `/media/vapes/film/orbit-in-motion-${mobile ? 'mobile' : 'desktop'}-v1`;
  const playing = started && !paused;
  function togglePlayback() {
    const video = ref.current;
    if (!video) return;
    if (playing) { pauseRequested.current = true; video.pause(); onPausedChange(true); }
    else { pauseRequested.current = false; onPausedChange(false); void video.play().catch(() => onPausedChange(true)); }
  }
  return <>
    <video ref={attach} className={s.video} data-started={started} autoPlay={!paused} muted loop playsInline preload="none"
      aria-label="Orbit in Motion: Presidential vape finishes and product details"
      onPlay={event => { if (pauseRequested.current) event.currentTarget.pause(); }}
      onPlaying={() => setStarted(true)} onEmptied={() => setStarted(false)} onError={() => setStarted(false)}>
      <source src={`${source}.webm`} type="video/webm" />
      <source src={`${source}.mp4`} type="video/mp4" />
    </video>
    <button type="button" className={s.control} onClick={togglePlayback} aria-label={playing ? 'Pause hero film' : 'Play hero film'}>
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">{playing ? <path d="M5 3h3v14H5zM12 3h3v14h-3z" /> : <path d="m6 3 11 7-11 7z" />}</svg>
      <span>{playing ? 'Pause film' : 'Play film'}</span>
    </button>
  </>;
}

export function OrbitHeroFilm() {
  const container = useRef<HTMLDivElement | null>(null);
  const { canStream, videoRef } = useAdultVideoPlayback(container);
  const mobile = useSyncExternalStore(subscribeViewport, getMobileSnapshot, getServerSnapshot);
  const [posterReady, setPosterReady] = useState(false);
  const [paused, setPaused] = useState(false);
  return <div className={s.film} ref={container}>
    <Image className={s.poster} src="/media/vapes/film/orbit-in-motion-poster-v1.jpg" alt="Teal Presidential Orbit with Moon Pod, from the Orbit in Motion product film" width={1080} height={1080} sizes="(min-width: 1100px) 720px, (min-width: 760px) 56vw, 100vw" loading="eager" fetchPriority="high" onLoad={() => setPosterReady(true)} />
    {posterReady && canStream ? <FilmPlayer key={mobile ? 'mobile' : 'desktop'} mobile={mobile} videoRef={videoRef} paused={paused} onPausedChange={setPaused} /> : null}
  </div>;
}
