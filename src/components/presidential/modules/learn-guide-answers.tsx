import Link from "next/link";

import { type AnswerItem, answerLinkClass as a } from "./answer-sections";

// SALVAGE 1006 sections for Sanity-owned learn guides, rendered under the Sanity body.
// Keyed by slug; any slug not listed here (including infusion-science) renders nothing.
// Sources: /presidential-thc extract, label and terpene sections; /learn/what-are-moon-rocks
// composition-line copy; /moon-pods and /vapes copy; /pre-rolls and /blunts product copy.

const extractsLine = (
  <>
    Distillate is the extract identified with the{" "}
    <Link className={a} href="/moon-rocks/silver">Silver Flavor Series</Link>. Live resin is identified with the{" "}
    <Link className={a} href="/moon-rocks/gold">Gold Strain Series</Link> and is made from cannabis frozen at harvest
    rather than first dried and cured. Live rosin is the solventless extract identified with the{" "}
    <Link className={a} href="/moon-rocks/rose-gold">Rose Gold Connoisseur Series</Link>: ice water, heat, and pressure
    are used instead of chemical solvents.
  </>
);

const labelLine =
  "THC is batch-specific. A label may show delta-9 THC, THCa, and a calculated total THC value; read them with their units and the batch's test record.";

export const LEARN_GUIDE_ANSWERS: Readonly<
  Partial<Record<string, { readonly eyebrow: string; readonly items: readonly AnswerItem[] }>>
> = {
  "what-are-liquid-diamonds": {
    eyebrow: "Liquid diamonds questions",
    items: [
      {
        id: "liquid-diamonds-q-pack",
        question: "Where do diamonds appear on a Presidential pack?",
        answer: (
          <p>
            Every Presidential pack prints a composition line. Diamonds are the dry finishing material on builds such as
            FLOWER · LIVE RESIN · DIAMONDS on <Link className={a} href="/moon-rocks/24k">24K</Link> and Blue Dream, and
            FLOWER · LIQUID LIVE RESIN · DIAMONDS on Cap Junky. The build is the same each time: flower as the base, a
            concentrate coat over it, and the finish bonded to the coat.
          </p>
        ),
      },
      {
        id: "liquid-diamonds-q-product",
        question: "Which Presidential product is made with liquid diamonds?",
        answer: (
          <p>
            Liquid Diamonds (LD) is one of the three <Link className={a} href="/moon-pods">Moon Pods</Link> families,
            shown with the <Link className={a} href="/orbit">Orbit</Link> device and marked by its teal mouthpiece. The
            other two families are named for their extracts: Live Resin (LRE) and Live Rosin (LRO).
          </p>
        ),
      },
      {
        id: "liquid-diamonds-q-extracts",
        question: "How do liquid diamonds compare with distillate, live resin, and live rosin?",
        answer: (
          <>
            <p>
              Liquid diamonds name the LD Moon Pods family. On the flower side, the extract changes by series. {extractsLine}
            </p>
            <p>
              {labelLine} Presidential is sold through{" "}
              <Link className={a} href="/">licensed retailers</Link>.
            </p>
          </>
        ),
      },
    ],
  },
  "what-is-live-resin": {
    eyebrow: "Live resin questions",
    items: [
      {
        id: "live-resin-q-rosin",
        question: "How is live resin different from live rosin?",
        answer: (
          <p>
            Live resin is made from cannabis frozen at harvest rather than first dried and cured, and it is the extract
            identified with the Gold Strain Series. <Link className={a} href="/learn/what-is-live-rosin">Live rosin</Link>{" "}
            is solventless: ice water, heat, and pressure are used instead of chemical solvents, and it is identified with
            the Rose Gold Connoisseur Series.
          </p>
        ),
      },
      {
        id: "live-resin-q-products",
        question: "Which Presidential products use live resin?",
        answer: (
          <p>
            <Link className={a} href="/moon-rocks/gold">Gold Strain Series</Link> Moon Rocks such as{" "}
            <Link className={a} href="/moon-rocks/24k">24K</Link> and Blue Dream print FLOWER · LIVE RESIN · DIAMONDS.
            Gold Strain Series 1g pre-rolls combine flower, live resin, and diamonds; 1.5g blunts come with live resin and
            diamonds; and Cap Junky prints liquid live resin. Live Resin (LRE) is also one of the three{" "}
            <Link className={a} href="/moon-pods">Moon Pods</Link> families.
          </p>
        ),
      },
      {
        id: "live-resin-q-label",
        question: "How do I check the THC and flavor of a live resin product?",
        answer: (
          <p>
            {labelLine} Flavor and aroma vary by batch, so the package and a{" "}
            <Link className={a} href="/">licensed retailer</Link> can confirm the current selection.
          </p>
        ),
      },
    ],
  },
  "what-is-live-rosin": {
    eyebrow: "Live rosin questions",
    items: [
      {
        id: "live-rosin-q-made",
        question: "How is live rosin made?",
        answer: (
          <p>
            Live rosin is a solventless extract. Ice water, heat, and pressure are used instead of chemical solvents. At
            Presidential it is the extract identified with the{" "}
            <Link className={a} href="/moon-rocks/rose-gold">Rose Gold Connoisseur Series</Link>.
          </p>
        ),
      },
      {
        id: "live-rosin-q-compare",
        question: "How is live rosin different from live resin and distillate?",
        answer: <p>{extractsLine}</p>,
      },
      {
        id: "live-rosin-q-products",
        question: "Which Presidential products use live rosin?",
        answer: (
          <p>
            Rose Gold Connoisseur Series Moon Rocks, Rose Gold 1g pre-rolls built from flower, live rosin, and diamonds, a
            live-rosin selection of 1.5g <Link className={a} href="/blunts">blunts</Link>, and the Live Rosin (LRO){" "}
            <Link className={a} href="/moon-pods">Moon Pods</Link> family with its smoked mouthpiece.
          </p>
        ),
      },
      {
        id: "live-rosin-q-label",
        question: "What does a live rosin pack tell you?",
        answer: (
          <p>
            The pack prints the strain type, the format line, and the composition line. THC and other cannabinoids are
            batch-specific, so read the label and its test record. Presidential is sold through{" "}
            <Link className={a} href="/">licensed retailers</Link>.
          </p>
        ),
      },
    ],
  },
  "flavor-science": {
    eyebrow: "Flavor questions",
    items: [
      {
        id: "flavor-q-terpenes",
        question: "What do terpenes contribute to flavor?",
        answer: (
          <p>
            Terpenes are volatile aromatic compounds that contribute to how cannabis smells and tastes. Heat, light, air,
            and time can change an aromatic profile.
          </p>
        ),
      },
      {
        id: "flavor-q-series",
        question: "How do the Presidential series differ on flavor?",
        answer: (
          <p>
            The catalog is organized by what goes into the product, so ingredients and flavor profiles can be compared. The
            Silver Flavor Series centers deliberate flavor profiles and is built on flower, distillate, and kief. The Gold
            Strain Series organizes strain-led releases, such as <Link className={a} href="/moon-rocks/24k">24K</Link>,
            around live resin. The Rose Gold Connoisseur Series features solventless live rosin.
          </p>
        ),
      },
      {
        id: "flavor-q-label",
        question: "Where do I find a product's flavor and terpene information?",
        answer: (
          <p>
            Read the package for the listed terpenes tied to that release and batch. Flavor and aroma vary by batch, so a{" "}
            <Link className={a} href="/">licensed retailer</Link> can confirm the current selection.
          </p>
        ),
      },
    ],
  },
  "different-extracts-need-different-heat": {
    eyebrow: "Extract and heat questions",
    items: [
      {
        id: "heat-q-thca",
        question: "What does heat do to THCa?",
        answer: (
          <p>
            Heat can convert THCa into delta-9 THC through decarboxylation. The conventional total-THC calculation applies
            a 0.877 conversion factor: total THC = (THCa × 0.877) + THC. The formula explains the calculation; the current
            package label and test record give the value for a specific product.
          </p>
        ),
      },
      {
        id: "heat-q-aroma",
        question: "Do heat, light, and air change aroma and flavor?",
        answer: (
          <p>
            Yes. Terpenes are volatile aromatic compounds, and heat, light, air, and time can change an aromatic profile.
          </p>
        ),
      },
      {
        id: "heat-q-flower",
        question: "Where do flower, trichomes, and extracts fit in?",
        answer: (
          <p>
            A Presidential moon rock uses flower as the base, a concentrate coat over it, and a dry finishing material such
            as kief, the collected trichome material. {extractsLine} More guides are in the{" "}
            <Link className={a} href="/learn">Learn hub</Link>.
          </p>
        ),
      },
    ],
  },
};
