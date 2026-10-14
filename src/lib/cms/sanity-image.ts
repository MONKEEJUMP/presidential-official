const SANITY_IMAGE_ORIGIN = "https://cdn.sanity.io/images/";
const SANITY_IMAGE_MAX_WIDTH = 1600;

// Caps the upstream Sanity asset (resized and re-encoded as WebP by Sanity's CDN) before
// next/image optimizes it, so a multi-megabyte PNG original never goes through /_next/image.
// Next optimization stays on, so the responsive srcset and `sizes` still apply.
export function sanityImage<T>(src: T): { src: T | string } {
  if (typeof src !== "string" || !src.startsWith(SANITY_IMAGE_ORIGIN)) return { src };
  const url = new URL(src);
  url.searchParams.set("w", String(SANITY_IMAGE_MAX_WIDTH));
  url.searchParams.set("fit", "max");
  url.searchParams.set("fm", "webp");
  url.searchParams.set("q", "80");
  return { src: url.toString() };
}
