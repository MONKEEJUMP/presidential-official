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
  | "evergreen";

export type PresidentialStateSiteLink = {
  readonly before: string;
  readonly anchor: string;
  readonly after: string;
  readonly href?: string;
};

export type PresidentialState = {
  readonly code: string;
  readonly slug: string;
  readonly name: string;
  readonly theme: PresidentialStateTheme;
  readonly tagline: string;
  readonly world: string;
  readonly seoLine: string;
  readonly siteLink: PresidentialStateSiteLink;
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
    siteLink: {
      before: "",
      anchor: "Presidential THC Arizona",
      after: " covers the state on its own site.",
      href: "https://presidentialthcarizona.com/",
    },
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
    siteLink: {
      before: "The full California retail network has its own home at ",
      anchor: "Presidential THC California",
      after: ".",
      href: "https://presidentialthccalifornia.com/",
    },
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
    siteLink: {
      before: "Michigan's retail network has its own home at ",
      anchor: "Presidential THC Michigan",
      after: ".",
      href: "https://presidentialthcmichigan.com/",
    },
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
    siteLink: {
      before: "",
      anchor: "Presidential in Nevada",
      after: " runs its own site for the state.",
      href: "https://presidentialthcnevada.com/",
    },
  },
  {
    code: "NY",
    slug: "ny",
    name: "New York",
    theme: "empire-skyline",
    tagline: "Skyscraper High. Presidential Grade.",
    world: "Manhattan at night — skyline grids and avenue light.",
    seoLine:
      "Find Presidential Moon Rocks, infused prerolls, and tobacco-free blunts near you in New York through licensed retailers. Adults 21+ where legal.",
    siteLink: {
      before: "New York has its own Presidential site at ",
      anchor: "Presidential THC New York",
      after: ".",
      href: "https://presidentialthcnewyork.com/",
    },
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
    siteLink: {
      before: "",
      anchor: "Presidential THC Oklahoma",
      after:
        " carries the statewide retail map, grouped by Oklahoma's tourism regions.",
    },
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
    siteLink: {
      before: "",
      anchor: "Presidential THC Washington",
      after: " is live ahead of the state's market opening.",
      href: "https://presidentialthcwashington.com/",
    },
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
