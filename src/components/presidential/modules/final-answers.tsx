import Link from "next/link";

import { type AnswerItem, answerLinkClass as a } from "./answer-sections";

// SALVAGE 1006 final pass: home (Surfer questions) and /orbit (California / Los Angeles,
// retailer link). Sources: homepage "Product clarity" copy, /presidential-thc extract copy,
// vault format weights, /vapes and /orbit showroom copy, /our-story and /about origin copy.

export const HOME_ANSWERS: readonly AnswerItem[] = [
  {
    id: "home-q-moon-rocks",
    question: "What are Presidential Moon Rocks?",
    answer: (
      <p>
        Presidential Moon Rocks are cannabis flower coated with a concentrate, such as distillate or live resin, and
        finished with kief or diamonds, with the materials printed on each package. The same infused build carries into
        1g <Link className={a} href="/pre-rolls">infused pre-rolls</Link>, 1.5g blunts in a tobacco-free blunt wrap, Mini
        Pre-Rolls (3 × 0.5g) and Mini Blunts (3 × 0.7g). Browse the{" "}
        <Link className={a} href="/moon-rocks">Presidential Moon Rocks collection</Link>.
      </p>
    ),
  },
  {
    id: "home-q-strain",
    question: "What strain is Presidential?",
    answer: (
      <p>
        Presidential is the brand, not a strain; <Link className={a} href="/about">about Presidential</Link> covers the
        company. Each product names its own strain on the pack, along with its strain type:{" "}
        <Link className={a} href="/moon-rocks/24k">24K</Link>, for example, is marked Indica. THC and other cannabinoids,
        the chemical compounds listed on a cannabis label, are batch-specific, and burn and potency are not universal
        across the line, so the package and batch record for the product in hand control those facts.
      </p>
    ),
  },
];

export const ORBIT_ANSWERS: readonly AnswerItem[] = [
  {
    id: "orbit-q-what",
    question: "What is the Presidential Orbit?",
    answer: (
      <p>
        Orbit is the Presidential vape device that <Link className={a} href="/moon-pods">Moon Pods</Link> are shown with. It
        comes in four finishes: Black, Silver, Teal, and White. Moon Pods come in three families: Liquid Diamonds (LD), Live
        Resin (LRE), and Live Rosin (LRO).
      </p>
    ),
  },
  {
    id: "orbit-q-brand",
    question: "Who makes Orbit, and where is it sold?",
    answer: (
      <p>
        Orbit is part of the Presidential platform alongside Moon Rocks and Moon Pods. Presidential started in Los Angeles,
        California, in 2012, and it sells through <Link className={a} href="/">licensed retailers</Link>; availability
        varies by retailer.
      </p>
    ),
  },
];
