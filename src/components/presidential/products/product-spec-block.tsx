import Link from "next/link";

import { BLUNT_ARTWORKS } from "@/content/blunts-catalog";
import { vaultProducts } from "@/content/vault/catalog";
import descriptions from "@/content/vault/descriptions.json";
import { resolveCatalogTier } from "@/lib/catalog/tier-map";
import { PRE_ROLL_ARTWORKS } from "@/lib/prerolls/catalog";
import { productDetailPath } from "@/lib/products/product-paths";

// Spec block for Moon Rocks SKU pages. Every value comes from existing product
// data (Sanity series, tier-map collaboration partner, and the pre-roll, blunt,
// and vault catalogs). A field with no data is left out rather than filled in.

type Offer = { readonly format: string; readonly weight?: string; readonly href: string };

const FORMAT_ORDER = ["Pre-roll", "Blunt", "Mini Pre-roll", "Mini Blunt"] as const;
const FORMAT_LABEL: Readonly<Record<string, string>> = {
  "Pre-roll": "Pre-Roll",
  Blunt: "Blunt",
  "Mini Pre-roll": "Mini Pre-Rolls",
  "Mini Blunt": "Mini Blunts",
};
const vaultDescriptions = descriptions as Readonly<Record<string, string>>;
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

function editionWeight(edition: string): string | undefined {
  return /^(\d+(?:\.\d+)?g)\b/.exec(edition)?.[1];
}

function descriptionWeight(text?: string): string | undefined {
  if (!text) return undefined;
  const pack = /three (\d+(?:\.\d+)?g) Moon Rock mini (?:blunts|pre-rolls), (\d+(?:\.\d+)?g) in total/i.exec(text);
  if (pack) return `3 × ${pack[1]} (${pack[2]} total)`;
  return /\b(\d+(?:\.\d+)?g) Moon Rock (?:blunt|pre-roll)\b/i.exec(text)?.[1];
}

function offersFor(name: string): readonly Offer[] {
  const key = normalize(name);
  const keys = new Set([key, key.replace(/^presidentialline/, "")]);
  const offers = new Map<string, Offer>();
  for (const product of PRE_ROLL_ARTWORKS) {
    if (keys.has(normalize(product.name))) {
      offers.set("Pre-roll", { format: "Pre-roll", weight: editionWeight(product.edition), href: productDetailPath("/pre-rolls", product.id) });
    }
  }
  for (const product of BLUNT_ARTWORKS) {
    if (keys.has(normalize(product.name))) {
      offers.set("Blunt", { format: "Blunt", weight: editionWeight(product.edition), href: productDetailPath("/blunts", product.id) });
    }
  }
  for (const product of vaultProducts) {
    if (keys.has(normalize(product.strain)) && !offers.has(product.format)) {
      offers.set(product.format, { format: product.format, weight: descriptionWeight(vaultDescriptions[product.slug]), href: product.productUrl });
    }
  }
  return FORMAT_ORDER.flatMap((format) => offers.get(format) ?? []);
}

export function ProductSpecBlock({
  name,
  series,
  slug,
}: {
  readonly name: string;
  readonly series?: string;
  readonly slug: string;
}) {
  const collabPartner = resolveCatalogTier({ line: "moon-rocks", series, slug }).entry.collabPartner;
  const isMoonRocks = !/pre-?roll|blunt/i.test(name);
  const offers = offersFor(name);
  const rows: { readonly label: string; readonly value: string }[] = [];
  if (series) rows.push({ label: "Series", value: series });
  if (isMoonRocks) rows.push({ label: "Format", value: "Moon Rocks" });
  if (collabPartner) rows.push({ label: "Collaboration", value: collabPartner });
  if (rows.length === 0 && offers.length === 0) return null;

  return (
    <div className="mt-8 border-t border-po-line pt-5">
      <p className="text-xs font-black uppercase text-po-brand-ink">Product specs</p>
      <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-sm text-po-ink">
        {rows.map((row) => (
          <div className="contents" key={row.label}>
            <dt className="font-semibold uppercase text-po-body">{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
        {offers.length > 0 ? (
          <div className="contents">
            <dt className="font-semibold uppercase text-po-body">Also as</dt>
            <dd>
              <ul className="flex flex-col gap-1">
                {offers.map((offer) => (
                  <li key={offer.format}>
                    <Link className="font-semibold underline decoration-po-brand underline-offset-4 hover:text-po-brand-ink" href={offer.href}>
                      {`${name} ${FORMAT_LABEL[offer.format] ?? offer.format}`}
                    </Link>
                    {offer.weight ? ` · ${offer.weight}` : null}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
