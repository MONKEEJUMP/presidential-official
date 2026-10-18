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

// Chief R29 ruling (pack labels): only these moon rock builds read "finished with kief or diamonds".
const KIEF_OR_DIAMOND_MOON_ROCKS = new Set(["24k", "blue-dream", "cap-junky"]);

function kiefOrDiamondBuild(name: string): string | undefined {
  const build = offersFor(name).find((offer) => offer.build)?.build;
  if (!build) return undefined;
  const parts = build.split("·").map((part) => part.trim()).filter((part) => part && !/^(diamonds|kief)$/i.test(part));
  return `${listMaterials(parts)}, finished with kief or diamonds`;
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
  const materials = (KIEF_OR_DIAMOND_MOON_ROCKS.has(slug) ? kiefOrDiamondBuild(name) : undefined) ?? madeWith(name, series);
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
            Moon rocks are cannabis flower coated with a concentrate and finished with kief.
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
            Moon rocks are cannabis flower coated with a concentrate and finished with kief. Each
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
                {" Its "}
                <Link className={linkClass} href="/learn/what-is-thc-distillate">concentrate is distillate</Link>.
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
      {/* SURFER-R13: 24K live resin H3, from 24K "What is in it" and "Where 24K sits in the catalogue". */}
      {slug === "24k" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">Why live resin in the Gold Strain Series?</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            24K belongs to the Gold Strain Series, which carries named strains, and live resin is the coat that appears across
            most of that series. Flower is the base, live resin is the coat, and it is finished with kief or diamonds. See the full{" "}
            <Link className={linkClass} href="/moon-rocks/gold">Gold Strain Series</Link> or read{" "}
            <Link className={linkClass} href="/learn/what-is-live-resin">What Is Live Resin</Link>.
          </p>
        </>
      ) : null}
      {/* SURFER-R17: Pineapple distillate H3, from its own page, /learn/what-is-live-resin and /moon-rocks/watermelon. */}
      {slug === "pineapple" && series === "Silver Flavor Series" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">Why distillate for a flavor-led moon rock?</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Pineapple is one of the flavor-led releases in the{" "}
            <Link className={linkClass} href="/moon-rocks/silver">Silver Flavor Series moon rocks</Link> lineup, and its concentrate
            is distillate. Distillate is stripped and refined until it is essentially neutral, so the series can lead with the
            flavor name rather than the strain; see{" "}
            <Link className={linkClass} href="/learn/what-is-thc-distillate">what THC distillate is</Link>. The build follows every
            Presidential moon rock: flower first, distillate carried through the flower, and kief as the finish. Don&apos;t grind
            them, because the concentrate layer gums up a grinder and strips the kief. Pineapple also comes rolled as a{" "}
            <Link className={linkClass} href="/pre-rolls/pineapple">Pineapple pre-roll</Link>.
          </p>
        </>
      ) : null}
      {/* SURFER-R17: NYC Diesel catalog H3, from its own page, /moon-rocks/24k and the label line. */}
      {slug === "nyc-diesel" && series === "Gold Strain Series" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">Where does NYC Diesel sit in the catalog?</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            NYC Diesel is a Gold Strain Series release{marking ? `, and Presidential packs mark it as ${marking}` : ""}. The{" "}
            <Link className={linkClass} href="/moon-rocks/gold">Gold Strain Series moon rocks</Link> carry named strains and are
            built on live resin: flower as the base, live resin as the coat, and diamonds as the crystalline outer layer that gives a
            Presidential Moon Rock its density; see{" "}
            <Link className={linkClass} href="/learn/what-is-live-resin">what live resin is</Link>. In the artwork, NYC Diesel belongs
            to the darker half of the catalog, set against the bright packs such as Papaya Punch and Cherry Gelato. It also comes as
            a <Link className={linkClass} href="/pre-rolls/nyc-diesel">NYC Diesel pre-roll</Link>. THC is batch-specific, so read
            the current package label and its test results.
          </p>
        </>
      ) : null}
      {/* SURFER-R16: Blue Dream Gold series H3, from its own page, /moon-rocks/24k and /learn. */}
      {slug === "blue-dream" && series === "Gold Strain Series" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">Why does Blue Dream sit in the Gold Strain Series?</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Blue Dream is a named strain, and the{" "}
            <Link className={linkClass} href="/moon-rocks/gold">Gold Strain Series moon rocks</Link> carry named strains rather than
            flavor names. Like the rest of the Gold series it is built on live resin: flower is the foundation, live resin is the
            coat, and it is finished with kief or diamonds; see{" "}
            <Link className={linkClass} href="/learn/what-are-moon-rocks">what moon rocks are</Link>. Presidential packs mark Blue
            Dream as Sativa, and the character reads as berry-soft sweetness carried over something distinctly herbal. It also comes
            as a <Link className={linkClass} href="/pre-rolls/blue-dream">Blue Dream pre-roll</Link>. THC is batch-specific, so
            read the current package label and its test results.
          </p>
        </>
      ) : null}
      {/* SURFER-R16: Grape Silver series H3, from its own page, /moon-rocks/watermelon and /learn/what-is-live-resin. */}
      {slug === "grape" && series === "Silver Flavor Series" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">What makes Grape a Silver Flavor Series moon rock?</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Grape is one of the flavor-led releases in the{" "}
            <Link className={linkClass} href="/moon-rocks/silver">Silver Flavor Series moon rocks</Link> lineup, alongside
            Watermelon, Pineapple, and Peach Mango. Its concentrate is distillate, which is stripped and refined until it is
            essentially neutral, so the series can lead with the flavor name; see{" "}
            <Link className={linkClass} href="/learn/what-is-thc-distillate">what THC distillate is</Link>. The build is the same as
            every Presidential moon rock: flower first, distillate carried through it, and kief as the finish. Don&apos;t grind
            them; the concentrate layer gums up a grinder and strips the kief. Grape also comes as a{" "}
            <Link className={linkClass} href="/pre-rolls/grape">Grape pre-roll</Link>.
          </p>
        </>
      ) : null}
      {/* SURFER-R15: King Louis live resin H3, from its own page, /learn and the label line. */}
      {slug === "king-louis" && series === "Gold Strain Series" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">Why does King Louis use live resin?</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            King Louis is a Gold Strain Series release, and the Gold series is built on live resin. Flower forms the body, live
            resin coats it, and diamonds, the crystalline concentrate, finish the outside. Those three stages, in that order, give a
            Presidential Moon Rock the density that makes it burn the way it does. King Louis is also one of a small number of
            Presidential releases with a second name on the pack: IN COLLABORATION WITH VLAD TV. It also runs as a{" "}
            <Link className={linkClass} href="/pre-rolls/king-louis">King Louis pre-roll</Link>. THC is batch-specific, so read the
            current package label and its test results. See{" "}
            <Link className={linkClass} href="/moon-rocks/gold">Gold Strain Series moon rocks</Link> and{" "}
            <Link className={linkClass} href="/learn/what-is-live-resin">what live resin is</Link>.
          </p>
        </>
      ) : null}
      {/* SURFER-R15: Watermelon distillate H3, from its own page, /learn/what-is-live-resin and /about. */}
      {slug === "watermelon" && series === "Silver Flavor Series" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">What does distillate do in a Silver moon rock?</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Watermelon is a flavor-led release in the{" "}
            <Link className={linkClass} href="/moon-rocks/silver">Silver Flavor Series moon rocks</Link> lineup, and its concentrate
            is distillate. Distillate is stripped and refined until it is essentially neutral, which lets the Silver series lead
            with flavor names such as Watermelon, Grape, Pineapple, and Peach Mango; see{" "}
            <Link className={linkClass} href="/learn/what-is-thc-distillate">what THC distillate is</Link>. The build is the same as
            every Presidential moon rock: flower first, distillate carried through it, and kief as the finish, as explained in{" "}
            <Link className={linkClass} href="/learn/what-are-moon-rocks">what moon rocks are</Link>. Don&apos;t grind them. The
            concentrate layer gums up a grinder and strips the kief, so layer pieces in when rolling or packing a bowl.
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
      {/* SURFER-R14: Gorilla Goo in the Gold Strain Series, from its own data, /moon-rocks/24k and /learn. */}
      {slug === "gorilla-goo" && series === "Gold Strain Series" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">How does Gorilla Goo fit the Gold Strain Series?</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Gorilla Goo is a Gold Strain Series release{marking ? `, and Presidential packs mark it as ${marking}` : ""}. Like the rest
            of the Gold series, it is built on live resin: flower forms the base, live resin is the coat, and diamonds are the
            crystalline finish, layered the way every Presidential moon rock is built. The Gold Strain Series carries named strains
            rather than flavor names, so the strain is the product&apos;s identity on the shelf. THC and cannabinoids are
            batch-specific, so read the current package label and its test results. Gorilla Goo also comes as a{" "}
            <Link className={linkClass} href="/mini-pre-rolls/gorilla-goo">Gorilla Goo mini pre-roll</Link> and a mini blunt. See{" "}
            <Link className={linkClass} href="/moon-rocks/gold">Gold Strain Series moon rocks</Link> and{" "}
            <Link className={linkClass} href="/learn/what-is-live-resin">what live resin is</Link>.
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
