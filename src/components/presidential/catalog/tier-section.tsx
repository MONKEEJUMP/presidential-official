import Link from "next/link";

import {
  TIER_SECTION_PRESENTATION,
  type CatalogTierBadge,
  type CatalogTierSection,
} from "@/lib/catalog/tier-map";

import { TierIcon } from "../primitives/tier-icon";

const TIER_COLOR: Record<Exclude<CatalogTierSection, "more">, string> = {
  silver: "text-po-silver",
  gold: "text-po-gold",
  "rose-gold": "text-po-rose-gold",
  collabs: "text-[#d4b96a]",
};

export function TierBadge({ tier }: { readonly tier: CatalogTierBadge }) {
  if (!tier) return null;

  return (
    <span className="absolute left-3 top-3 z-10 flex items-center gap-1.5 bg-po-ink/90 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-po-on-dark">
      <TierIcon size={14} tier={tier} />
      {tier.replace("-", " ")}
    </span>
  );
}

export function TierSectionHeader({
  section,
  href,
  buttonLabel,
  tone = "dark",
}: {
  readonly section: Exclude<CatalogTierSection, "more">;
  readonly href?: string;
  readonly buttonLabel?: string;
  readonly tone?: "dark" | "light";
}) {
  const copy = TIER_SECTION_PRESENTATION[section];
  const ink = tone === "dark" ? "text-po-on-dark" : "text-po-ink";
  const body = tone === "dark" ? "text-po-on-dark-muted" : "text-po-body";
  const accent = TIER_COLOR[section];

  return (
    <header className="border-b-2 border-current pb-8">
      <div className={`flex items-center gap-4 ${accent}`}>
        <TierIcon tier={section} />
        <p className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.18em]">
          <span>{copy.eyebrowLead}</span>
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-current" />
          <span>{copy.eyebrowDetail}</span>
        </p>
      </div>
      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.42fr)] lg:items-end">
        <div>
          <h2 className={`font-display text-4xl uppercase leading-[0.94] sm:text-6xl ${ink}`}>
            {copy.headline}
          </h2>
          {copy.series ? (
            <p className={`mt-4 text-xs font-black uppercase tracking-[0.16em] ${accent}`}>
              {copy.series}
            </p>
          ) : null}
        </div>
        <div>
          <p className={`font-serif text-base leading-7 ${body}`}>{copy.description}</p>
          {href && buttonLabel ? (
            <Link className={`mt-5 inline-block text-xs font-black uppercase tracking-[0.08em] underline decoration-1 underline-offset-8 ${accent}`} href={href}>
              {buttonLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
