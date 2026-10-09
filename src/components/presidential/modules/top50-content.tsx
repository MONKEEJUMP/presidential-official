import Link from "next/link";

import { type AnswerItem, answerLinkClass as a } from "./answer-sections";

// MR-TOP50 (Oct 8): question-led sections for the query-owner pages /blunts,
// /mini-blunts and /vapes. Sources: blunts-catalog.ts editions (weights and
// builds), vault mini-pack data (specs.json), /moon-pods and /orbit copy.

export const BLUNT_ANSWERS: readonly AnswerItem[] = [
  {
    id: "blunts-q-inside",
    question: "What's inside a Presidential Moon Rock blunt?",
    answer: (
      <p>
        A Presidential Moon Rock blunt is 1.5g of the moon rock build in a tobacco-free wrap: cannabis flower, a concentrate
        infused over it, and a dry finish. Each moonrock blunt pack prints its build, for example FLOWER · DISTILLATE · KIEF
        on Watermelon, FLOWER · LIVE RESIN · DIAMONDS on Blue Dream, and FLOWER · LIVE ROSIN · DIAMONDS on Wedding Cake. The
        unrolled format is in the{" "}
        <Link className={a} href="/moon-rocks">Presidential Moon Rocks collection</Link>.
      </p>
    ),
  },
  {
    id: "blunts-q-vs-pre-rolls",
    question: "Moon Rock blunts vs pre-rolls: what's the difference?",
    answer: (
      <p>
        Both carry the same moon rock build; choosing a Presidential pre-roll or blunt comes down to size and wrap.{" "}
        <Link className={a} href="/pre-rolls">Moon Rock pre-rolls</Link> hold 1g in rolling paper, a Moon Rock blunt
        holds 1.5g in a tobacco-free wrap, and{" "}
        <Link className={a} href="/mini-blunts">Presidential Mini Blunts</Link> split 2.1g into three 0.7g mini blunts.
      </p>
    ),
  },
];

export const MINI_BLUNT_ANSWERS: readonly AnswerItem[] = [
  {
    id: "mini-blunts-q-vs-blunt",
    question: "Mini blunt vs full blunt: what's the difference?",
    answer: (
      <p>
        A Presidential Mini Blunts pack holds three 0.7g Moon Rock mini blunts, 2.1g in total.{" "}
        <Link className={a} href="/blunts">Full-size Moon Rock blunts</Link> hold 1.5g in a single roll. Each mini blunt
        is flower, live resin, and diamonds in a tobacco-free wrap: a smaller version of the same object, not a cheaper
        one.
      </p>
    ),
  },
];

export const VAPES_ANSWERS: readonly AnswerItem[] = [
  {
    id: "vapes-q-what",
    question: "Does Presidential make THC vapes?",
    answer: (
      <p>
        Yes. Presidential vapes are <Link className={a} href="/moon-pods">Moon Pods</Link>, shown with the{" "}
        <Link className={a} href="/orbit">Orbit</Link> device. Moon Pods come in three families named for their extract:
        Liquid Diamonds (LD), Live Resin (LRE), and Live Rosin (LRO). THC is batch-specific, so read the package label and
        its test results.
      </p>
    ),
  },
];
