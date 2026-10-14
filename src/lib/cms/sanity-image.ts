const SANITY_IMAGE_ORIGIN = "https://cdn.sanity.io/images/";
const SANITY_IMAGE_MAX_WIDTH = 1600;

// Sanity's image CDN resizes and re-encodes (auto=format serves WebP/AVIF), so a large Sanity PNG
// is delivered capped at 1600px instead of passing the full original through /_next/image.
// Plain props (no loader function), so it is safe in Server Components.
export function sanityImage<T>(src: T): { src: T | string; unoptimized?: true } {
  if (typeof src !== "string" || !src.startsWith(SANITY_IMAGE_ORIGIN)) return { src };
  const url = new URL(src);
  url.searchParams.set("w", String(SANITY_IMAGE_MAX_WIDTH));
  url.searchParams.set("q", "75");
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "max");
  return { src: url.toString(), unoptimized: true };
}
