// Themed state-name display faces — 9083-CODE P4 typography ruling
// (2026-07-11). Each face applies to the state-name headline ONLY; all other
// type stays Clash Display + Source Serif 4. All eight are SIL Open Font License
// families from Google Fonts, self-hosted as exact-glyph woff2 subsets
// (state-name glyphs only, 1.8-7.2KB each). preload:false = a page downloads
// only the face its own headline uses.
//
// Record of choice + license (all OFL):
//   CA Pacifico (surf brush script)   NV Monoton (neon-tube marquee)
//   AZ Bevan (sun-baked slab)         OK Rye (western wanted-poster slab)
//   MI Fredoka 600 (lake-summer round) NY Anton (Broadway grotesque)
//   FL Limelight (Miami deco marquee) WA Fjalla One (ranger-poster condensed)

import localFont from "next/font/local";

const pacifico = localFont({
  src: "../../fonts/state/ca.woff2",
  display: "swap",
  preload: false,
  fallback: ["cursive"],
});

const monoton = localFont({
  src: "../../fonts/state/nv.woff2",
  display: "swap",
  preload: false,
  fallback: ["sans-serif"],
});

const bevan = localFont({
  src: "../../fonts/state/az.woff2",
  display: "swap",
  preload: false,
  fallback: ["serif"],
});

const rye = localFont({
  src: "../../fonts/state/ok.woff2",
  display: "swap",
  preload: false,
  fallback: ["serif"],
});

const fredoka = localFont({
  src: "../../fonts/state/mi.woff2",
  display: "swap",
  preload: false,
  fallback: ["sans-serif"],
});

const anton = localFont({
  src: "../../fonts/state/ny.woff2",
  display: "swap",
  preload: false,
  fallback: ["sans-serif"],
});

const limelight = localFont({
  src: "../../fonts/state/fl.woff2",
  display: "swap",
  preload: false,
  fallback: ["serif"],
});

const fjallaOne = localFont({
  src: "../../fonts/state/wa.woff2",
  display: "swap",
  preload: false,
  fallback: ["sans-serif"],
});

const STATE_FONT_CLASSES: Record<string, string> = {
  ca: pacifico.className,
  nv: monoton.className,
  az: bevan.className,
  ok: rye.className,
  mi: fredoka.className,
  ny: anton.className,
  fl: limelight.className,
  wa: fjallaOne.className,
};

export function stateFontClass(slug: string): string {
  return STATE_FONT_CLASSES[slug] || "";
}
