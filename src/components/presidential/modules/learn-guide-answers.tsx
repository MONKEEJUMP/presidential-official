import Link from "next/link";

import { type AnswerItem, answerLinkClass as a } from "./answer-sections";

// SALVAGE 1006 sections for Sanity-owned learn guides, rendered under the Sanity body.
// Keyed by slug; any slug not listed here (including infusion-science) renders nothing.
// Sources: /presidential-thc extract, label and terpene sections; /learn/what-are-moon-rocks
// composition-line copy; /moon-pods and /vapes copy; /pre-rolls and /blunts product copy.

const extractsLine = (
  <>
    Distillate is a refined extract. Live resin is made from cannabis frozen at harvest rather than first dried and
    cured. Live rosin is a solventless extract: ice water, heat, and pressure are used instead of chemical solvents.
  </>
);

// MR-TOP50 L12: one "Presidential THC" link per guide, where the label sentence already fits.
const labelLine = (
  <>
    THC is batch-specific. A label may show delta-9 THC, THCa, and a calculated total THC value; read them with their
    units and the batch&apos;s test record. <Link className={a} href="/presidential-thc">Presidential THC</Link> explains
    those numbers.
  </>
);

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
            A Presidential pack prints a composition line. Diamonds are the finishing material on builds such as
            FLOWER · LIVE RESIN · DIAMONDS on Blue Dream, and
            FLOWER · LIQUID LIVE RESIN · DIAMONDS on Cap Junky. The build runs in layers: flower as the base, a
            concentrate coat over it, and the finish bonded to the coat.
          </p>
        ),
      },
      {
        id: "liquid-diamonds-q-product",
        question: "Which Presidential product is made with liquid diamonds?",
        answer: (
          <p>
            Liquid Diamonds (LD) is one of the <Link className={a} href="/moon-pods">Moon Pods</Link> families,
            shown with the <Link className={a} href="/orbit">Orbit</Link> device and marked by its teal mouthpiece. The
            other families are named for their extracts: Live Resin (LRE) and Live Rosin (LRO).
          </p>
        ),
      },
      {
        id: "liquid-diamonds-q-extracts",
        question: "How do liquid diamonds compare with distillate, live resin, and live rosin?",
        answer: (
          <>
            <p>
              Liquid diamonds name the LD Moon Pods family. On the flower side, the extract changes by product. {extractsLine}
            </p>
            <p>
              {labelLine} Presidential is sold through{" "}
              <Link className={a} href="/">licensed retailers</Link>.
            </p>
            <h3 className="text-xl font-semibold leading-snug text-po-ink">Heat and handling for diamond builds</h3>
            <p>
              Concentrates respond to heat differently from flower alone, so a gentle, even light matters. Rushing the flame can
              scorch the outer layer before the inside catches. The guide to the{" "}
              <Link className={a} href="/learn/different-extracts-need-different-heat">right temperature for each extract type</Link> explains why each
              concentrate prefers its own range. For background on a concentrate often discussed alongside diamonds, read the{" "}
              <Link className={a} href="/learn/what-is-live-resin">live resin background guide</Link>. Always check the pack&apos;s printed composition
              line to confirm whether diamonds are part of that build.
            </p>
          </>
        ),
      },
    ],
  },
  "what-are-moon-rocks": {
    eyebrow: "Moon Rocks questions",
    items: [
      {
        id: "what-are-moon-rocks-q-strain-type",
        question: "Do Presidential packs say indica, sativa, or hybrid?",
        answer: (
          <p>
            Yes. Each pack prints the strain type alongside the format line and the composition line. The{" "}
            <Link className={a} href="/moon-rocks/24k">24K</Link> pack, for example, is marked Indica. Every pack in the{" "}
            <Link className={a} href="/moon-rocks">Presidential Moon Rocks collection</Link> carries the same lines.
            The <Link className={a} href="/presidential-thc">Presidential THC guide</Link> explains the flower, concentrate, and kief or diamond finish roles behind them.
          </p>
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
          <>
            <p>
              Live resin is made from cannabis frozen at harvest rather than first dried and cured. <Link className={a} href="/learn/what-is-live-rosin">Live rosin</Link>{" "}
              is solventless: ice water, heat, and pressure are used instead of chemical solvents.
            </p>
            <h3 className="text-xl font-semibold leading-snug text-po-ink">Live resin compared with refined distillate</h3>
            <p>
              Live resin and distillate sit at opposite ends of how much plant character survives extraction. Live resin starts
              from plants frozen at harvest, so more of the plant&apos;s aroma carries through. Distillate is refined until it is
              close to neutral. The{" "}
              <Link className={a} href="/learn/what-is-thc-distillate">explainer on how distillate differs from resin</Link> covers that refining step.
              For how those aroma compounds affect what you taste, read{" "}
              <Link className={a} href="/learn/flavor-science">aroma compounds and how they reach the palate</Link>. The composition line on each pack
              names the extract used.
            </p>
          </>
        ),
      },
      {
        id: "live-resin-q-products",
        question: "Which Presidential products use live resin?",
        answer: (
          <p>
            <Link className={a} href="/moon-rocks/gold">Gold Strain Series</Link> Moon Rocks such as Blue Dream print FLOWER · LIVE RESIN · DIAMONDS.
            Gold Strain Series 1g pre-rolls, <Link className={a} href="/pre-rolls/xj-13">XJ-13 in paper</Link> among them, print their own build; 1.5g blunts come with live resin and
            diamonds; and Cap Junky prints liquid live resin. Live Resin (LRE) is also one of the{" "}
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
            Live rosin is a solventless extract. Ice water, heat, and pressure are used instead of chemical solvents. Heat matters again at the device:
            see <Link className={a} href="/learn/different-extracts-need-different-heat">why extract type changes the right temperature</Link>.
          </p>
        ),
      },
      {
        id: "live-rosin-q-compare",
        question: "How is live rosin different from live resin and distillate?",
        answer: (
          <>
            <p>{extractsLine}</p>
            <h3 className="text-xl font-semibold leading-snug text-po-ink">Rosin, resin and distillate side by side</h3>
            <p>
              Rosin is pressed with heat and pressure. Live resin is extracted from plants frozen at harvest. Distillate is
              refined until it is close to neutral in aroma. For the diamond side of a build, see{" "}
              <Link className={a} href="/learn/what-are-liquid-diamonds">how liquid diamonds compare</Link>. For the frozen-harvest method, read about{" "}
              <Link className={a} href="/learn/what-is-live-resin">frozen-harvest live resin, for comparison</Link>. For the most refined of the three,
              see <Link className={a} href="/learn/what-is-thc-distillate">refined distillate, for contrast</Link>. Whichever extract you are curious
              about, the composition line on the pack in hand names what that product uses.
            </p>
          </>
        ),
      },
      {
        id: "live-rosin-q-products",
        question: "Which Presidential products use live rosin?",
        answer: (
          <p>
            Rose Gold Connoisseur Series Moon Rocks such as{" "}
            <Link className={a} href="/moon-rocks/wedding-cake">the Wedding Cake Rose Gold jar</Link>, Rose Gold 1g pre-rolls, a
            live-rosin selection of 1.5g <Link className={a} href="/blunts">blunts</Link>, such as{" "}
            <Link className={a} href="/blunts/gods-gift">God&apos;s Gift in a hemp wrap</Link>, and the Live Rosin (LRO){" "}
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
            batch-specific, so read the label and its test record;{" "}
            <Link className={a} href="/presidential-thc">Presidential THC</Link> explains those numbers. Presidential is
            sold through{" "}
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
            Silver Flavor Series centers deliberate flavor profiles. The Gold
            Strain Series organizes strain-led releases, such as <Link className={a} href="/moon-rocks/24k">24K</Link>. The Rose Gold Connoisseur Series carries the connoisseur names. The{" "}
            <Link className={a} href="/presidential-thc">Presidential THC</Link> guide sets the three extracts side by
            side.
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
            package label and test record give the value for a specific product, and{" "}
            <Link className={a} href="/presidential-thc">Presidential THC</Link> covers the label numbers.
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
            A Presidential moon rock uses flower as the base, a concentrate coat over it, and a kief
            finish, kief being the collected trichome material. {extractsLine} More guides are in the{" "}
            <Link className={a} href="/learn">Learn hub</Link>.
          </p>
        ),
      },
    ],
  },
};
