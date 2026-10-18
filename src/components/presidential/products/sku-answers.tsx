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

// Chief R30 ruling (pack labels): these single jars print FLOWER · LIVE RESIN · DIAMONDS (no kief), so they read "finished with diamonds".
const DIAMOND_FINISH_MOON_ROCKS = new Set(["24k", "blue-dream", "cap-junky"]);
// Chief R38 ruling (pack label): the Pink Cookies jar prints FLOWER · DISTILLATE · KIEF.
const LABEL_BUILD_OVERRIDES: Record<string, string> = { "pink-cookies": "flower and distillate, finished with kief" };

function diamondFinishBuild(name: string): string | undefined {
  const build = offersFor(name).find((offer) => offer.build)?.build;
  if (!build) return undefined;
  const parts = build.split("·").map((part) => part.trim()).filter((part) => part && !/^(diamonds|kief)$/i.test(part));
  return `${listMaterials(parts)}, finished with diamonds`;
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
  const materials = LABEL_BUILD_OVERRIDES[slug] ?? (DIAMOND_FINISH_MOON_ROCKS.has(slug) ? diamondFinishBuild(name) : undefined) ?? madeWith(name, series);
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
            most of that series. Flower is the base, live resin is the coat, and it is finished with diamonds. See the full{" "}
            <Link className={linkClass} href="/moon-rocks/gold">Gold Strain Series</Link> or read{" "}
            <Link className={linkClass} href="/learn/what-is-live-resin">What Is Live Resin</Link>.
          </p>
        </>
      ) : null}
      {/* SURFER-R35: Garlic Cookies H3 (jar label FLOWER · DISTILLATE · KIEF; pre-roll and blunt match; Head Cheese is a Polaris release). */}
      {slug === "presidential-line-garlic-cookies" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">Garlic Cookies and its Presidential Line neighbor</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Garlic Cookies is a Presidential Line release made with Nature&apos;s Chemistry. It opens pungent and herbal, with a
            doughy sweetness underneath. The jar label reads flower, distillate, and kief, so these moon rocks are finished with
            kief. Distillate is the refined concentrate inside, and the explainer on{" "}
            <Link className={linkClass} href="/learn/what-is-thc-distillate">how distillate is refined</Link> covers how it&apos;s
            made. The same name also comes as a pre-roll and a blunt with the same distillate and kief build. For another savory
            Presidential Line name, see the{" "}
            <Link className={linkClass} href="/moon-rocks/presidential-line-head-cheese">Head Cheese moon rocks</Link>, a Polaris
            collaboration with its own label. Batch figures are on the package, so read it and confirm current selection with the
            store.
          </p>
        </>
      ) : null}
      {/* SURFER-R35: XJ-13 H3 (jar and every XJ-13 format: flower, live resin, diamonds). */}
      {slug === "xj-13" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">What live resin brings to XJ-13</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            XJ-13 sits in the Gold Strain Series, with a citrus-forward, clean profile. The jar label reads flower, live resin, and
            diamonds, and the same build carries into the XJ-13 pre-roll, blunt, mini pre-rolls, and mini blunts. Live resin is
            made from plants frozen at harvest, and it is the extract identified with the Gold Strain Series. The{" "}
            <Link className={linkClass} href="/learn/what-is-live-resin">guide to how live resin is made</Link> goes deeper. For
            another Gold jar that follows its own diamond label, compare the{" "}
            <Link className={linkClass} href="/moon-rocks/24k">24K moon rocks</Link>. Some searchers know the brand as Presidential
            RX. It&apos;s the same Presidential, so search by the XJ-13 name and confirm current selection with the store.
          </p>
        </>
      ) : null}
      {/* SURFER-R36: Cereal Milk, Pink Cookies, Skywalker and Tropical H3s (labels from each live product page). */}
      {slug === "cereal-milk" && series === "Rose Gold Connoisseur Series" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">Cereal Milk inside the Rose Gold series</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Cereal Milk is a Rose Gold Connoisseur Series name, marked Hybrid on Presidential packs. Its profile is sweet, lactic,
            and faintly grainy. The jar label reads flower, live rosin, and diamonds, and the same build carries into the Cereal
            Milk pre-roll and blunt. Live rosin is the solventless concentrate behind the series, pressed with ice water, heat, and
            pressure instead of chemical solvents. Anyone searching for cereal moon rocks can compare it with other Rose Gold jars
            like <Link className={linkClass} href="/moon-rocks/wedding-cake">Wedding Cake moon rocks</Link> or{" "}
            <Link className={linkClass} href="/moon-rocks/cosmic-cookies">Cosmic Cookies moon rocks</Link>. Read the batch label on the exact jar, then
            confirm with the store before you go.
          </p>
        </>
      ) : null}
      {slug === "pink-cookies" && series === "Gold Strain Series" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">Pink Cookies, jar and roll</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Pink Cookies is a Gold Strain Series name, marked Indica on Presidential packs, with a sweet, doughy, rich profile. The
            jar label reads flower and distillate, finished with kief. The pre-roll, blunt, mini pre-rolls, and mini blunts read
            flower, live resin, and diamonds, so the jar is the format built on distillate. That makes it worth reading the label on each
            format separately. Shoppers searching for the Presidential pink strain can start with the jar, then read{" "}
            <Link className={linkClass} href="/learn/what-is-live-resin">how live resin is extracted</Link> for the concentrate in the rolls. For what the
            refined concentrate in the jar is, see the <Link className={linkClass} href="/learn/what-is-thc-distillate">distillate guide</Link>. Confirm
            current selection with the store.
          </p>
        </>
      ) : null}
      {slug === "skywalker" && series === "Gold Strain Series" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">Skywalker and its Rove neighbors</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Skywalker is a Gold Strain Series name from the Rove collaboration. It runs earthy and full-spectrum with a clean,
            almost cool finish. The jar label reads flower, live resin, and diamonds, and the same build carries into the Skywalker
            pre-roll, blunt, mini pre-rolls, and mini blunts. On the official Presidential Moon Rocks website, each format has its
            own page and label. For the concentrate behind every format, see the{" "}
            <Link className={linkClass} href="/learn/what-is-live-resin">primer on live resin extraction</Link>. For another Rove release in the Gold series,
            compare the <Link className={linkClass} href="/moon-rocks/waui">Waui moon rocks</Link>. Read the label on the exact pack and confirm current
            selection with the store.
          </p>
        </>
      ) : null}
      {slug === "tropical" && series === "Silver Flavor Series" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">Tropical among the Silver flavors</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Tropical is a Silver Flavor Series name that layers citrus, stone fruit, and something faintly floral into one profile.
            The jar label reads flower, distillate, and kief, so these moon rocks are finished with kief, and the Tropical blunt
            shares the same build. Distillate is the refined concentrate that defines the Silver series. For how the three layers
            come together, see <Link className={linkClass} href="/learn/what-are-moon-rocks">the three-layer moon rock build</Link>. If you like a single-fruit
            name instead of a blend, compare <Link className={linkClass} href="/moon-rocks/pineapple">the Pineapple Silver jar</Link>, another Silver release.
            Shoppers using the Presidential Moon Rocks website can check the label here, then find a licensed retailer and confirm
            with the store.
          </p>
        </>
      ) : null}
      {/* SURFER-R37: Presidential Line H3s (Head Cheese: live resin + diamonds; Whoa Si Whoa and Nino Brown: distillate + kief). */}
      {slug === "presidential-line-head-cheese" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">Head Cheese in jar and blunt form</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Head Cheese is a Presidential Line collaboration with Polaris. The jar is built from flower, live resin, and diamonds,
            and its aroma is funky and savory. The same build also
            comes rolled as a 1.5g Head Cheese blunt. For more jars that use live resin, browse the{" "}
            <Link className={linkClass} href="/moon-rocks/gold">Gold live resin jars</Link>. Live resin starts from plants frozen at harvest, a
            step laid out in the <Link className={linkClass} href="/learn/what-is-live-resin">frozen-at-harvest extract guide</Link>. THC figures are
            batch-specific, so read the current package label and its test results, and confirm stock with the store.
          </p>
        </>
      ) : null}
      {slug === "presidential-line-whoa-si-whoa" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">What goes into a Whoa Si Whoa jar</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Whoa Si Whoa is a Presidential Line collaboration with Top Shelf Cultivation. The jar is built from flower and
            distillate, then finished with kief. Its aroma is loud and fruit-forward. Distillate
            is a refined cannabis concentrate, and the <Link className={linkClass} href="/learn/what-is-thc-distillate">distillate basics guide</Link> explains
            how it is made and where it sits among Presidential concentrates. To compare it with jars built on live resin, see the{" "}
            <Link className={linkClass} href="/moon-rocks/gold">Gold Strain Series jars</Link>. Read the current package label for batch test results.
          </p>
        </>
      ) : null}
      {slug === "presidential-line-nino-brown" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">Nino Brown&apos;s build and aroma</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Nino Brown is a Presidential Line collaboration with Ball Family Farms. The jar is flower and distillate finished with
            kief, with a dark, earthy aroma and a sweetness that shows up late. Kief, the collected trichome material, forms the
            outer layer. For a refresher on the concentrate inside, the{" "}
            <Link className={linkClass} href="/learn/what-is-thc-distillate">guide to THC distillate</Link> covers how it is refined. Collectors comparing
            Presidential Line names can also look at the{" "}
            <Link className={linkClass} href="/moon-rocks/presidential-line-head-cheese">Head Cheese collaboration jar</Link>, which uses live resin and diamonds
            instead. Test results are batch-specific, so read the current package label.
          </p>
        </>
      ) : null}
      {/* SURFER-R38: MR jar H3s (Crescendo construction line softened; Waui list adds the blunt). */}
      {slug === "presidential-line-ghost-haze-train" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">Inside a Ghost Haze Train jar</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Ghost Haze Train is a Presidential Line collaboration with Nature&apos;s Chemistry. The label lists flower and distillate, finished with kief, and the aroma is bright, spiced, and haze-forward. Distillate is a refined concentrate, and the <Link className={linkClass} href="/learn/what-is-thc-distillate">guide to how distillate is refined</Link> explains the process from start to finish. Kief, the collected trichome material, forms the dusty outer layer you see in the jar. The same partner also appears on <Link className={linkClass} href="/moon-rocks/presidential-line-garlic-cookies">Garlic Cookies, another Nature&apos;s Chemistry jar</Link>, which leans savory. Cannabinoid content is batch-specific, so read the current package label and its test results, and confirm stock with the store.
          </p>
        </>
      ) : null}
      {slug === "orange-push-pop" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">The Orange Push Pop build</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Orange Push Pop sits in the Gold Strain Series, and the jar is made with flower, live resin, and diamonds. The aroma is creamsicle-bright citrus over something soft and close to vanilla. Live resin starts with plants frozen at harvest instead of dried and cured, and the <Link className={linkClass} href="/learn/what-is-live-resin">explainer on what live resin is</Link> walks through why that step matters for aroma. The same strain also comes as a 1g pre-roll and a 1.5g blunt, each listed with flower, live resin, and diamonds. Cannabinoid content changes by batch, so check the package label and its test results, and ask the store what is on hand.
          </p>
        </>
      ) : null}
      {slug === "sfv-og" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">SFV OG and its OG neighbor</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            SFV OG takes its name from the San Fernando Valley, and the jar is made with flower, live resin, and diamonds. Presidential packs mark it as Hybrid, and the aroma runs pine, fuel, and dry earth. It is part of the Gold Strain Series, where OG profiles have company. Shoppers who like that piney, fuel-forward style can compare it with <Link className={linkClass} href="/moon-rocks/presidential-og">Presidential OG in the Gold series</Link>. Both carry the series&apos; live resin build. Pre-roll and blunt versions of SFV OG list the same flower, live resin, and diamonds. Read the current label for batch test results, and confirm with the store which formats it carries.
          </p>
        </>
      ) : null}
      {slug === "peach-mango" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">Peach Mango beside other Silver fruit</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Peach Mango is a Silver Flavor Series jar made with flower and distillate, finished with kief. Peach brings a soft sweetness and mango adds warmth, so the aroma lands somewhere ripe and easygoing. Silver is the flavor-first tier, and its fruit names sit side by side on the shelf. For a broader fruit blend from the same series, look at <Link className={linkClass} href="/moon-rocks/tropical">Tropical, a Silver jar with a citrus and stone-fruit aroma</Link>. Peach Mango also comes as a 1g pre-roll and a 1.5g blunt, both listed with flower, distillate, and kief. Cannabinoid content is batch-specific, so read the package label and its test results before buying.
          </p>
        </>
      ) : null}
      {slug === "cosmic-cookies" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">Cosmic Cookies in the Rose Gold series</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Cosmic Cookies belongs to the Rose Gold Connoisseur Series, and the jar is made with flower, live rosin, and diamonds. Presidential packs mark it as Hybrid. The aroma keeps the doughy sweetness of the cookie family, with a cooler, mineral note underneath. Live rosin is the solventless extract that defines Rose Gold, pressed with ice water, heat, and pressure. Another sweet, dessert-leaning name in the same series is <Link className={linkClass} href="/moon-rocks/cereal-milk">Cereal Milk, a Rose Gold jar</Link>, with a lactic, grainy aroma. Cosmic Cookies also comes as a 1g pre-roll and a 1.5g blunt with live rosin and diamonds. Check the label for batch test results.
          </p>
        </>
      ) : null}
      {slug === "crescendo" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">How Crescendo fits the Gold Strain Series</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Crescendo is a Gold Strain Series jar made with flower, live resin, and diamonds, and Presidential packs mark it as Sativa. Its aroma builds gradually rather than opening all at once. Gold groups cannabis-first strain names around live resin, so shoppers can compare jars on aroma. For another Gold name with an earthy profile and a cool finish, see <Link className={linkClass} href="/moon-rocks/skywalker">Skywalker in the Gold Strain Series</Link>. Crescendo is also offered as a 1g pre-roll and a 1.5g blunt, both listed with flower, live resin, and diamonds. Read the package label for batch test results, and confirm stock with the store.
          </p>
        </>
      ) : null}
      {slug === "waui" ? (
        <>
          <h3 className="mt-6 text-base font-semibold text-po-ink">What makes the Waui jar</h3>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Waui is a Gold Strain Series jar made in collaboration with Rove, and the label lists flower, live resin, and diamonds. The aroma is bright and tropical, sweeter than the denser Gold names. Live resin is extracted from plants frozen at harvest, and the <Link className={linkClass} href="/learn/what-is-live-resin">overview of live resin extraction</Link> covers how that preserves aroma. Shoppers drawn to the tropical side can also compare the distillate-based <Link className={linkClass} href="/moon-rocks/tropical">Tropical jar in the Silver series</Link>. Waui also appears in pre-roll, blunt, mini pre-roll, and mini blunt formats; each pack prints its own build, so read the label before buying and confirm current stock with the store.
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
            coat, and it is finished with diamonds; see{" "}
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
      {/* SURFER-R34: Strawberry Silver H2, after the pre-roll FAQ (Sitebulb R34 B20/B21) (Silver Flavor Series: distillate, finished with kief). */}
      {slug === "strawberry" ? (
        <>
          <h2 className="mt-6 font-display text-2xl uppercase leading-tight text-po-ink">Strawberry next to the other Silver flavors</h2>
          <p className="mt-2 text-sm leading-6 text-po-body">
            Strawberry is one of the fruit names in the Silver Flavor Series, built on distillate and finished with kief. If you
            like its ripe, restrained profile, compare it with the{" "}
            <Link className={linkClass} href="/moon-rocks/watermelon">Silver Watermelon jar</Link>, another fruit-led Silver
            release. For how the three layers come together in any jar, read{" "}
            <Link className={linkClass} href="/learn/what-are-moon-rocks">how a moon rock is layered</Link>. THC figures are
            batch-specific, so read the current package label.
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
