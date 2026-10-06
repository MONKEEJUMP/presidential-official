import { vaultProducts } from "@/content/vault/catalog";
import descriptions from "@/content/vault/descriptions.json";

// SKU-page answers built from data: the shared moon rock build (/moon-rocks/rose-gold
// copy), the series extract (/presidential-thc), and the vault pack marking.

const SERIES_EXTRACT: Readonly<Record<string, string>> = {
  "Silver Flavor Series": "distillate",
  "Gold Strain Series": "live resin",
  "Rose Gold Connoisseur Series": "solventless live rosin",
};
const vaultDescriptions = descriptions as Readonly<Record<string, string>>;
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

function packMarking(name: string): string | undefined {
  const key = normalize(name);
  const found = new Set<string>();
  for (const product of vaultProducts) {
    if (normalize(product.strain) !== key) continue;
    const marking = /marked (Indica|Sativa|Hybrid) on the pack/.exec(vaultDescriptions[product.slug] ?? "")?.[1];
    if (marking) found.add(marking);
  }
  return found.size === 1 ? [...found][0] : undefined;
}

export function SkuAnswers({ name, series }: { readonly name: string; readonly series?: string }) {
  if (/pre-?roll|blunt/i.test(name)) return null;
  const extract = series ? SERIES_EXTRACT[series] : undefined;
  const marking = packMarking(name);
  return (
    <div className="mt-8 border-t border-po-line pt-5">
      <h2 className="font-display text-2xl uppercase leading-tight text-po-ink">{`How are ${name} Moon Rocks made?`}</h2>
      <p className="mt-3 text-sm leading-6 text-po-body">
        Every Presidential moon rock is built the same way: flower as the base, a concentrate coat applied over it, and a
        dry finishing material bonded to the coat. The pack prints which materials fill those roles.
        {extract && series ? ` ${name} is in the ${series}, the series identified with ${extract}.` : null}
      </p>
      {marking ? (
        <>
          <h2 className="mt-6 font-display text-2xl uppercase leading-tight text-po-ink">{`Is ${name} indica, sativa, or hybrid?`}</h2>
          <p className="mt-3 text-sm leading-6 text-po-body">{`Presidential packs mark ${name} as ${marking}.`}</p>
        </>
      ) : null}
    </div>
  );
}
