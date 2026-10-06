import Link from "next/link";

import { type AnswerItem, answerLinkClass as a } from "./answer-sections";

// SALVAGE 1006 content. Sources: /moon-rocks/rose-gold build copy, /presidential-thc
// extract and kief copy, /blunts and /pre-rolls product copy, vault mini-pack data,
// /about (Los Angeles, California, 2012, founders), /find-us retailer copy.

export const MOON_ROCKS_ANSWERS: readonly AnswerItem[] = [
  {
    id: "moon-rocks-q-strain",
    question: "What strain is Presidential?",
    answer: (
      <p>
        Presidential is a cannabis brand, not a strain. Moon Rocks is the product format, and each Presidential moon rock
        carries its own named strain, such as <Link className={a} href="/moon-rocks/24k">24K</Link>,{" "}
        <Link className={a} href="/moon-rocks/blue-dream">Blue Dream</Link>, or{" "}
        <Link className={a} href="/moon-rocks/wedding-cake">Wedding Cake</Link>. The pack prints the strain name and the
        materials in the build.
      </p>
    ),
  },
  {
    id: "moon-rocks-q-infused",
    question: "How is a moon rock infused?",
    answer: (
      <>
        <p>
          Every Presidential moon rock is built the same way: flower as the base, a concentrate coat applied over it, and a
          dry finishing material bonded to the coat. Presidential calls this framework the Presidential Infusion System™.
        </p>
        <p>
          The concentrate follows the series: distillate in the{" "}
          <Link className={a} href="/moon-rocks/silver">Silver Flavor Series</Link>, live resin in the{" "}
          <Link className={a} href="/moon-rocks/gold">Gold Strain Series</Link>, and solventless live rosin in the{" "}
          <Link className={a} href="/moon-rocks/rose-gold">Rose Gold Connoisseur Series</Link>. The finish is printed on
          the pack: kief on builds such as FLOWER · DISTILLATE · KIEF, diamonds on builds such as FLOWER · LIVE RESIN ·
          DIAMONDS. Kief is the collected trichome material used for the exterior finish.
        </p>
      </>
    ),
  },
  {
    id: "moon-rocks-q-blunt-wrap",
    question: "What are Moon Rock blunts wrapped in?",
    answer: (
      <p>
        A Presidential Moon Rock blunt brings cannabis flower and concentrate together in a tobacco-free wrap. Each single
        blunt contains 1.5g. See the <Link className={a} href="/blunts">blunts lineup</Link>, or the{" "}
        <Link className={a} href="/mini-blunts">Mini Blunts</Link>: three 0.7g Moon Rock mini blunts, 2.1g in total.
      </p>
    ),
  },
];

export const ABOUT_ANSWERS: readonly AnswerItem[] = [
  {
    id: "about-q-founded",
    question: "Who founded the Presidential cannabis brand?",
    answer: (
      <p>
        Everett Smith and John Zapp started Presidential in Los Angeles, California, in 2012. The brand makes Moon Rocks
        such as <Link className={a} href="/moon-rocks/24k">24K</Link>, infused pre-rolls, tobacco-free blunts, and{" "}
        <Link className={a} href="/mini-blunts">Mini Blunts</Link>.
      </p>
    ),
  },
  {
    id: "about-q-infusion",
    question: "How does the Presidential infusion process work?",
    answer: (
      <p>
        Each infused product starts with cannabis flower, adds a concentrate (distillate, live resin, or live rosin,
        depending on the series), and finishes with the dry material named on the package, such as kief. Presidential calls
        this the Presidential Infusion System™. THC is batch-specific, so the current package label and its test results
        are the reference for a specific product.
      </p>
    ),
  },
  {
    id: "about-q-where-to-buy",
    question: "Where can customers buy Presidential?",
    answer: (
      <p>
        Presidential is wholesale and does not sell direct. Customers buy it from licensed retailers: enter a zip code on
        the <Link className={a} href="/">Presidential home page</Link> or in the{" "}
        <Link className={a} href="/find-us">store finder</Link> to see the nearest licensed retailers carrying Presidential.
        Stock shifts by store and by day, so confirm the selection with the store.
      </p>
    ),
  },
];

export const PRE_ROLL_ANSWERS: readonly AnswerItem[] = [
  {
    id: "pre-rolls-q-what",
    question: "What is a Presidential pre-roll?",
    answer: (
      <p>
        A Presidential pre-roll is a 1g Moon Rock pre-roll: cannabis flower combined with concentrate, prepared in rolling
        paper. Some menus list them as infused joints. The build follows the series: flower, distillate, and kief in the
        Silver Flavor Series; flower, live resin, and diamonds in the Gold Strain Series; and flower, live rosin, and
        diamonds in the Rose Gold Connoisseur Series. The House Line adds{" "}
        <Link className={a} href="/moon-rocks/presidential-prerolls">Presidential Prerolls</Link>.
      </p>
    ),
  },
  {
    id: "pre-rolls-q-compare",
    question: "How do pre-rolls compare with mini pre-rolls and blunts?",
    answer: (
      <p>
        <Link className={a} href="/mini-pre-rolls">Mini pre-rolls</Link> come as three 0.5g Moon Rock mini pre-rolls,
        1.5g in total. A Moon Rock <Link className={a} href="/blunts">blunt</Link> holds 1.5g in a tobacco-free wrap.
        Every format comes from Presidential, the Los Angeles, California cannabis brand, and is sold through licensed
        retailers.
      </p>
    ),
  },
];
