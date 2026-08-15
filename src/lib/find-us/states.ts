// Presidential priority-market map config — 9083-CODE P4 (owner rulings,
// 2026-08-15): the owner-approved footprint names seven priority markets,
// each with a locked theme world and a themed state-name display face
// (state-name headline ONLY; everything else stays Archivo Black + Inter).
// PAULIEWOOD adds or removes a market by editing exactly one entry below.
// Verified locator counts and searches render from the retailer database where
// live records exist; the theme configuration below never stores retailer data.

export type PresidentialStateTheme =
  | "golden-coast"
  | "desert-canyon"
  | "neon-nights"
  | "wild-west"
  | "great-lakes"
  | "empire-skyline"
  | "neon-palms"
  | "evergreen";

export type PresidentialState = {
  readonly code: string;
  readonly slug: string;
  readonly name: string;
  readonly theme: PresidentialStateTheme;
  readonly tagline: string;
  readonly world: string;
  readonly seoLine: string;
};

export const PRESIDENTIAL_STATES: readonly PresidentialState[] = [
  {
    code: "AZ",
    slug: "az",
    name: "Arizona",
    theme: "desert-canyon",
    tagline: "From the Canyon to the Cosmos – Presidential",
    world: "Sonoran desert at dusk — saguaro, sandstone, and a sky on fire.",
    seoLine:
      "Presidential Moon Rocks, infused prerolls, and tobacco-free blunts in Arizona — through licensed retailers, adults 21+.",
  },
  {
    code: "CA",
    slug: "ca",
    name: "California",
    theme: "golden-coast",
    tagline: "Pre-rolling High in the Golden State.",
    world: "Pacific surf, golden-hour beaches, and mountain ridgelines.",
    seoLine:
      "Presidential Moon Rocks, infused prerolls, and tobacco-free blunts in California — the brand's home state, through licensed retailers, adults 21+.",
  },
  {
    code: "MI",
    slug: "mi",
    name: "Michigan",
    theme: "great-lakes",
    tagline: "Motor City High. Presidential Octane.",
    world: "Lake horizons, summer docks, and spray off the wake.",
    seoLine:
      "Presidential Moon Rocks, infused prerolls, and tobacco-free blunts in Michigan — through licensed retailers, adults 21+.",
  },
  {
    code: "NV",
    slug: "nv",
    name: "Nevada",
    theme: "neon-nights",
    tagline: "From the Strip to Space – Presidential Moon Rocks Rock.",
    world: "The Strip at midnight — marquee glow against desert black.",
    seoLine:
      "Presidential Moon Rocks, infused prerolls, and tobacco-free blunts in Nevada — through licensed retailers, adults 21+.",
  },
  {
    code: "NY",
    slug: "ny",
    name: "New York",
    theme: "empire-skyline",
    tagline: "Skyscraper High. Presidential Grade.",
    world: "Manhattan at night — skyline grids and avenue light.",
    seoLine:
      "Presidential Moon Rocks, infused prerolls, and tobacco-free blunts in New York — through licensed retailers, adults 21+.",
  },
  {
    code: "OK",
    slug: "ok",
    name: "Oklahoma",
    theme: "wild-west",
    tagline: "The Sooner The Better. A Presidential High.",
    world: "Red-dirt plains, big skies, and frontier grit.",
    seoLine:
      "Presidential Moon Rocks, infused prerolls, and tobacco-free blunts in Oklahoma — through licensed retailers, adults 21+.",
  },
  {
    code: "WA",
    slug: "wa",
    name: "Washington",
    theme: "evergreen",
    tagline: "Evergreen State. Presidential High.",
    world: "",
    seoLine:
      "Presidential Moon Rocks, infused prerolls, and tobacco-free blunts in Washington — through licensed retailers, adults 21+.",
  },
] as const;

export function isPresidentialStateSlug(value: string): boolean {
  return PRESIDENTIAL_STATES.some((state) => state.slug === value.toLowerCase());
}

export function getPresidentialState(value: string): PresidentialState | null {
  const normalized = value.toLowerCase();

  return (
    PRESIDENTIAL_STATES.find(
      (state) => state.slug === normalized || state.code.toLowerCase() === normalized,
    ) || null
  );
}
