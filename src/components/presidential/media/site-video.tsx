"use client";

// Muted loop video primitive — 9083-CODE P2.4 (owner video ruling,
// 2026-07-11). Self-hosted web-optimized media from /public/media (CSP
// default-src 'self'), muted + looped + playsInline per the Blueprint's
// motion law and poster fallback always.

import { useAdultVideoPlayback } from "@/lib/browser/adult-video-playback";

export type SiteVideoSlug =
  | "moon-rocks-film"
  | "moon-rock-blunt-hero"
  | "nationwide-map"
  | "flavor-blunts"
  | "strains-horizontal"
  | "strains-vertical";

type SiteVideoProps = {
  readonly slug: SiteVideoSlug;
  readonly label: string;
  readonly className?: string;
  readonly preload?: "none" | "metadata";
};

export function SiteVideo({
  slug,
  label,
  className = "",
  preload = "none",
}: SiteVideoProps) {
  const { canStream, videoRef } = useAdultVideoPlayback();

  return (
    <video
      aria-label={label}
      autoPlay={canStream}
      className={className}
      loop
      muted
      playsInline
      poster={`/media/posters/${slug}.jpg`}
      preload={canStream ? preload : "none"}
      ref={videoRef}
    >
      {canStream ? (
        <>
          <source src={`/media/${slug}.webm`} type="video/webm" />
          <source src={`/media/${slug}.mp4`} type="video/mp4" />
        </>
      ) : null}
    </video>
  );
}
