import Link from "next/link";

import { vaultProducts } from "@/content/vault/catalog";
import descriptions from "@/content/vault/descriptions.json";

import { offersFor } from "./product-spec-block";

// SKU-page answers built from each product's own data: its "Made with" build from the
// pre-roll/blunt catalogs (or its series extract), and the vault pack marking.

const SERIES_EXTRACT: Readonly<Record<string, string>> = {
  "Silver Flavor Series": "distillate",
  "Gold Strain Series": "live resin",
  "Rose Gold Connoisseur Series": "solventless live rosin",
};
const vaultDescriptions = descriptions as Readonly<Record<string, string>>;
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const linkClass = "font-semibold text-po-ink underline decoration-po-brand underline-offset-4";

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

function listMaterials(parts: readonly string[]): string {
  const words = parts.map((part) => part.toLowerCase());
  return words.length > 1 ? `${words.slice(0, -1).join(", ")}${words.length > 2 ? "," : ""} and ${words.at(-1)}` : words[0] ?? "";
}

function madeWith(name: string, series?: string): string | undefined {
  const build = offersFor(name).find((offer) => offer.build)?.build;
  if (build) return listMaterials(build.split("·").map((part) => part.trim()).filter(Boolean));
  const extract = series ? SERIES_EXTRACT[series] : undefined;
  return extract ? `flower and ${extract}` : undefined;
}

export function SkuAnswers({ name, series, slug }: { readonly name: string; readonly series?: string; readonly slug: string }) {
  if (/pre-?roll|blunt/i.test(name)) return null;
  const materials = madeWith(name, series);
  const marking = packMarking(name);
  const watermelonBlunt = slug === "watermelon" ? offersFor(name).find((offer) => offer.format === "Blunt") : undefined;
  return (
    <div className="mt-8 border-t border-po-line pt-5">
      {slug === "watermelon" && series === "Silver Flavor Series" ? (
        <>
          <h2 className="font-display text-2xl uppercase leading-tight text-po-ink">What are Watermelon Moon Rocks?</h2>
          <p className="mt-3 text-sm leading-6 text-po-body">
            Moon rocks are cannabis flower coated with a concentrate and finished with a dry material such as kief.
            Watermelon is one of the flavor-led releases in the Silver Flavor Series, alongside Grape, Pineapple, and Peach
            Mango. See the <Link className={linkClass} href="/moon-rocks">Presidential Moon Rocks collection</Link> and the{" "}
            <Link className={linkClass} href="/learn/flavor-science">Flavor Science</Link> guide.
          </p>
          {watermelonBlunt ? (
            <>
              <h2 className="mt-6 font-display text-2xl uppercase leading-tight text-po-ink">Does Watermelon come already rolled?</h2>
              <p className="mt-3 text-sm leading-6 text-po-body">
                Yes. Watermelon cannabis flower also comes rolled as the{" "}
                <Link className={linkClass} href={watermelonBlunt.href}>Watermelon Blunt</Link>
                {watermelonBlunt.weight ? `, ${watermelonBlunt.weight} in a tobacco-free wrap.` : ", in a tobacco-free wrap."}
              </p>
            </>
          ) : null}
        </>
      ) : null}
      {materials ? (
        <>
          <h2 className={`${slug === "watermelon" ? "mt-6 " : ""}font-display text-2xl uppercase leading-tight text-po-ink`}>{`How are ${name} Moon Rocks made?`}</h2>
          <p className="mt-3 text-sm leading-6 text-po-body">
            {`${name} is made with ${materials}, layered the way `}
            <Link className={linkClass} href="/moon-rocks#moon-rocks-q-infused">every Presidential moon rock is built</Link>.
          </p>
        </>
      ) : null}
      {marking ? (
        <>
          <h2 className={`${materials || slug === "watermelon" ? "mt-6 " : ""}font-display text-2xl uppercase leading-tight text-po-ink`}>{`Is ${name} indica, sativa, or hybrid?`}</h2>
          <p className="mt-3 text-sm leading-6 text-po-body">{`Presidential packs mark ${name} as ${marking}.`}</p>
        </>
      ) : null}
    </div>
  );
}
