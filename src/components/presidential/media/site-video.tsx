// Muted loop video primitive — 9083-CODE P2.4 (owner video ruling,
// 2026-07-11). Self-hosted web-optimized media from /public/media (CSP
// default-src 'self'), muted + looped + playsInline per the Blueprint's
// motion law, poster fallback always, lazy by default (preload="none";
// the hero passes "metadata" for a fast first paint).

export type SiteVideoSlug =
  | "presidential-hero"
  | "moon-rocks-film"
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
  return (
    <video
      aria-label={label}
      autoPlay
      className={className}
      loop
      muted
      playsInline
      poster={`/media/posters/${slug}.jpg`}
      preload={preload}
    >
      <source src={`/media/${slug}.webm`} type="video/webm" />
      <source src={`/media/${slug}.mp4`} type="video/mp4" />
    </video>
  );
}
