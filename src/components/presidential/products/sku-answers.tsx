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
// 1014-MR-2LINK: one same-series sibling link for the weakest (2-inlink) loose Moon Rock pages.
const SERIES_SIBLING: Readonly<Record<string, { readonly series: string; readonly href: string; readonly label: string }>> = {
  "presidential-line-guava-haze": { series: "Presidential Line", href: "/moon-rocks/presidential-line-iced-lemon", label: "Iced Lemon Moon Rocks" },
  "presidential-line-iced-lemon": { series: "Presidential Line", href: "/moon-rocks/presidential-line-guava-haze", label: "Guava Haze Moon Rocks" },
  "xj-13": { series: "Gold Strain Series", href: "/moon-rocks/rainbow-belts", label: "Rainbow Belts Moon Rocks" },
  xxx: { series: "Gold Strain Series", href: "/moon-rocks/rainbow-belts", label: "Rainbow Belts Moon Rocks" },
};
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

// Wider match than packMarking: vault copy also says "marked Hybrid" / "pack marked Hybrid".
function descriptionMarking(name: string): string | undefined {
  const key = normalize(name);
  const found = new Set<string>();
  for (const product of vaultProducts) {
    if (normalize(product.strain) !== key) continue;
    const marking = /marked (Indica|Sativa|Hybrid)\b/.exec(vaultDescriptions[product.slug] ?? "")?.[1];
    if (marking) found.add(marking);
  }
  return found.size === 1 ? [...found][0] : undefined;
}

const CHERRY_GELATO_SIBLINGS = new Set(["24k", "blue-dream", "blue-raspberry", "cap-junky"]);

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
  const cherryGelatoMarking = slug === "cherry-gelato" ? descriptionMarking("Cherry Gelato") : undefined;
  const watermelonOffers = slug === "watermelon" ? offersFor(name) : [];
  const watermelonBlunt = watermelonOffers.find((offer) => offer.format === "Blunt");
  const skuOffers = slug === "strawberry" || slug === "gorilla-goo" || slug === "presidential-og" ? offersFor(name) : [];
  const strawberryPreRoll = slug === "strawberry" ? skuOffers.find((offer) => offer.format === "Pre-roll") : undefined;
  const strawberryBlunt = slug === "strawberry" ? skuOffers.find((offer) => offer.format === "Blunt") : undefined;
  const miniOffers = skuOffers.filter((offer) => offer.format.startsWith("Mini"));
  return (
    <div className="mt-8 border-t border-po-line pt-5">
      {slug === "watermelon" && series === "Silver Flavor Series" ? (
        <>
          <h2 className="font-display text-2xl uppercase leading-tight text-po-ink">What are Watermelon Moon Rocks?</h2>
          <p className="mt-3 text-sm leading-6 text-po-body">
            Moon rocks are cannabis flower coated with a concentrate and finished with a dry material such as kief.
            Watermelon is one of the flavor-led releases in the Silver Flavor Series, alongside Grape, Pineapple, and Peach
            Mango. See the <Link className={linkClass} href="/moon-rocks">Presidential Moon Rocks collection</Link>, the{" "}
            <Link className={linkClass} href="/learn/flavor-science">Flavor Science</Link> guide, and{" "}
            <Link className={linkClass} href="/learn/what-are-moon-rocks">What are moon rocks</Link> for the format itself.
          </p>
          {/* MR-LOW3: handling (source: /learn/what-are-moon-rocks) and formats (this page's own Formats data). */}
          <h2 className="mt-6 font-display text-2xl uppercase leading-tight text-po-ink">How to Handle Watermelon Moon Rocks</h2>
          <h3 className="mt-3 text-base font-semibold text-po-ink">How should Watermelon Moon Rocks be handled?</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Don&apos;t grind them: the concentrate layer gums up a grinder and strips the kief. Layer them in when rolling or
            packing a bowl instead.
          </p>
          {watermelonOffers.length > 0 ? (
            <>
              <h2 className="mt-6 font-display text-2xl uppercase leading-tight text-po-ink">Watermelon in Every Format</h2>
              <h3 className="mt-3 text-base font-semibold text-po-ink">What formats does Watermelon come in?</h3>
              <p className="mt-2 text-sm leading-6 text-po-body">
                {`Watermelon comes as loose Moon Rocks and as a ${listMaterials(watermelonOffers.map((offer) => offer.format))}.`}
                {watermelonBlunt ? (
                  <>
                    {" Watermelon cannabis flower also comes rolled as the "}
                    <Link className={linkClass} href={watermelonBlunt.href}>Watermelon blunt</Link>
                    {watermelonBlunt.weight ? `, ${watermelonBlunt.weight}` : ""}
                    {watermelonBlunt.build ? ` of ${listMaterials(watermelonBlunt.build.split("·").map((part) => part.trim()).filter(Boolean))}` : ""}
                    {" in a tobacco-free wrap."}
                  </>
                ) : null}
              </p>
            </>
          ) : null}
        </>
      ) : null}
      {slug === "pineapple" && series === "Silver Flavor Series" ? (
        <>
          <h2 className="font-display text-2xl uppercase leading-tight text-po-ink">What are Pineapple Moon Rocks?</h2>
          <p className="mt-3 text-sm leading-6 text-po-body">
            Moon rocks are cannabis flower coated with a concentrate and finished with a dry material such as kief. Each
            Pineapple moonrock is one of the flavor-led releases in the Silver Flavor Series, alongside Grape, Watermelon, and
            Peach Mango. Read <Link className={linkClass} href="/learn/what-are-moon-rocks">What are moon rocks</Link> for the
            format, or see the <Link className={linkClass} href="/moon-rocks">Presidential Moon Rocks collection</Link>.
          </p>
        </>
      ) : null}
      {materials ? (
        <>
          <h2 className={`${slug === "watermelon" || slug === "pineapple" ? "mt-6 " : ""}font-display text-2xl uppercase leading-tight text-po-ink`}>{`How are ${name} Moon Rocks made?`}</h2>
          <p className="mt-3 text-sm leading-6 text-po-body">
            {`${name} is made with ${materials}, layered the way `}
            <Link className={linkClass} href="/moon-rocks#moon-rocks-q-infused">every Presidential moon rock is built</Link>.
            {series === "Silver Flavor Series" ? (
              <>
                {" Its concentrate is "}
                <Link className={linkClass} href="/learn/what-is-thc-distillate">distillate</Link>.
              </>
            ) : null}
            {slug === "cherry-gelato" ? (
              <>
                {" See "}
                <Link className={linkClass} href="/learn/what-are-moon-rocks">how Moon Rocks are built</Link>.
              </>
            ) : null}
          </p>
        </>
      ) : null}
      {marking ? (
        <>
          <h2 className={`${materials || slug === "watermelon" ? "mt-6 " : ""}font-display text-2xl uppercase leading-tight text-po-ink`}>{`Is ${name} indica, sativa, or hybrid?`}</h2>
          <p className="mt-3 text-sm leading-6 text-po-body">{`Presidential packs mark ${name} as ${marking}.`}</p>
        </>
      ) : null}
      {/* SURFER-R10: Cereal Milk series, from its own build and the cereal-milk-pre-roll vault entry. */}
      {slug === "cereal-milk" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">Which series is Cereal Milk in?</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Cereal Milk belongs to the{" "}
            <Link className={linkClass} href="/moon-rocks/rose-gold">Rose Gold Connoisseur Series</Link>, built with flower,
            live rosin, and diamonds. It also comes as a{" "}
            <Link className={linkClass} href="/pre-rolls/cereal-milk">Cereal Milk pre-roll</Link>. See{" "}
            <Link className={linkClass} href="/learn/what-is-live-rosin">what live rosin is</Link> for the extract behind the
            series.
          </p>
        </>
      ) : null}
      {/* SURFER-R11: God's Gift series, from its own build and the gods-gift-pre-roll vault entry. */}
      {slug === "gods-gift" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">Which series is God&apos;s Gift in?</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            God&apos;s Gift belongs to the{" "}
            <Link className={linkClass} href="/moon-rocks/rose-gold">Rose Gold Connoisseur Series</Link>, made with flower,
            live rosin, and diamonds. It is also available as a{" "}
            <Link className={linkClass} href="/pre-rolls/gods-gift">God&apos;s Gift pre-roll</Link>. Read{" "}
            <Link className={linkClass} href="/learn/what-is-live-rosin">what live rosin is</Link> for the extract behind the
            series.
          </p>
        </>
      ) : null}
      {/* SURFER-R9: Cherry Gelato type from its vault pack descriptions ("marked Hybrid"). */}
      {slug === "cherry-gelato" && !marking && cherryGelatoMarking ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">Is Cherry Gelato indica, sativa, or hybrid?</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">{`Presidential packs mark Cherry Gelato as ${cherryGelatoMarking}.`}</p>
        </>
      ) : null}
      {/* InLinks r9: same-lineup link to Cherry Gelato from sibling strain pages. */}
      {CHERRY_GELATO_SIBLINGS.has(slug) ? (
        <p className="mt-6 text-sm leading-6 text-po-body">
          <Link className={linkClass} href="/moon-rocks/cherry-gelato">Cherry Gelato Moon Rocks</Link> is one of the collaboration releases.
        </p>
      ) : null}
      {/* MR-GSC-R2: strawberry pre-roll question, Gorilla Goo strain question, mini links (all from catalog data). */}
      {slug === "strawberry" && strawberryPreRoll ? (
        <>
          <h2 className="mt-6 font-display text-2xl uppercase leading-tight text-po-ink">Is Strawberry available as a pre-roll?</h2>
          <p className="mt-3 text-sm leading-6 text-po-body">
            {"Yes. Strawberry moonrocks also come rolled as the "}
            <Link className={linkClass} href={strawberryPreRoll.href}>Strawberry pre-roll</Link>
            {strawberryPreRoll.weight ? ` (${strawberryPreRoll.weight})` : ""}
            {strawberryBlunt ? (
              <>
                {" and the "}
                <Link className={linkClass} href={strawberryBlunt.href}>Strawberry blunt</Link>
                {strawberryBlunt.weight ? ` (${strawberryBlunt.weight})` : ""}
              </>
            ) : null}
            {". See all "}
            <Link className={linkClass} href="/pre-rolls">Presidential pre-rolls</Link>
            {" and "}
            <Link className={linkClass} href="/blunts">Moon Rock blunts</Link>.
          </p>
        </>
      ) : null}
      {slug === "gorilla-goo" && series && marking && materials ? (
        <>
          <h2 className="mt-6 font-display text-2xl uppercase leading-tight text-po-ink">What is the Gorilla Goo strain?</h2>
          <p className="mt-3 text-sm leading-6 text-po-body">
            {`Gorilla Goo is a ${series} release, marked ${marking} on Presidential packs. It is made with ${materials}.`}
          </p>
        </>
      ) : null}
      {slug === "presidential-og" && series ? (
        <>
          <h2 className="mt-6 font-display text-2xl uppercase leading-tight text-po-ink">What is the Presidential OG strain?</h2>
          <p className="mt-3 text-sm leading-6 text-po-body">
            {`Presidential OG is a ${series} release that carries the house name, and its pack prints the build.`}
          </p>
        </>
      ) : null}
      {(slug === "gorilla-goo" || slug === "presidential-og") && miniOffers.length > 0 ? (
        <p className="mt-6 text-sm leading-6 text-po-body">
          {`${name} also comes in the mini formats: `}
          {miniOffers.map((offer, index) => (
            <span key={offer.format}>
              {index > 0 ? " and " : ""}
              <Link className={linkClass} href={offer.href}>{`${name} ${offer.format}`}</Link>
            </span>
          ))}
          .
        </p>
      ) : null}
      {SERIES_SIBLING[slug] && SERIES_SIBLING[slug].series === series ? (
        <p className="mt-6 text-sm leading-6 text-po-body">
          {`${name} is part of the ${series}. Another release in the same series is `}
          <Link className={linkClass} href={SERIES_SIBLING[slug].href}>{SERIES_SIBLING[slug].label}</Link>.
        </p>
      ) : null}
    </div>
  );
}
