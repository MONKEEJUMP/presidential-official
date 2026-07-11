// Presidential priority-market map config — 9083-CODE P4 (owner input,
// 2026-07-11): the client-approved Scope of Work names eight priority markets.
// PAULIEWOOD adds or removes a market by editing exactly one line below.
// Retailer data stays OFF everywhere: state pages are brand/theme experiences
// until a verified retailer source exists (customer PII is never public).

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
};

export const PRESIDENTIAL_STATES: readonly PresidentialState[] = [
  { code: "AZ", slug: "az", name: "Arizona", theme: "desert-canyon", tagline: "Desert sun. Canyon calm." },
  { code: "CA", slug: "ca", name: "California", theme: "golden-coast", tagline: "Golden coast. Where Presidential began." },
  { code: "FL", slug: "fl", name: "Florida", theme: "neon-palms", tagline: "Palms and neon. Miami energy." },
  { code: "MI", slug: "mi", name: "Michigan", theme: "great-lakes", tagline: "Great Lakes summers." },
  { code: "NV", slug: "nv", name: "Nevada", theme: "neon-nights", tagline: "Desert nights that never dim." },
  { code: "NY", slug: "ny", name: "New York", theme: "empire-skyline", tagline: "Empire state of mind." },
  { code: "OK", slug: "ok", name: "Oklahoma", theme: "wild-west", tagline: "Wide open. Wild West." },
  { code: "WA", slug: "wa", name: "Washington", theme: "evergreen", tagline: "Evergreen Pacific Northwest." },
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
