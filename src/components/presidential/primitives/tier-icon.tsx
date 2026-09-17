import type { CatalogTierSection } from "@/lib/catalog/tier-map";

export function TierIcon({ tier, size = 48 }: { readonly tier: CatalogTierSection; readonly size?: number }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.6,
  };

  return (
    <svg aria-hidden="true" height={size} viewBox="0 0 24 24" width={size}>
      {tier === "silver" ? (
        <path {...common} d="M4 8.5 8 4h8l4 4.5L12 20 4 8.5Zm0 0h16M8 4l4 16 4-16" />
      ) : tier === "gold" ? (
        <path {...common} d="M12 3C9 7.3 6 10.2 6 14a6 6 0 0 0 12 0c0-3.8-3-6.7-6-11Zm0 7v8" />
      ) : tier === "rose-gold" ? (
        <path {...common} d="m5 8 3 3 4-6 4 6 3-3-1.5 10h-11L5 8Zm2 13h10" />
      ) : (
        <path {...common} d="m5 5 14 14M19 5 5 19" />
      )}
    </svg>
  );
}
