import Link from "next/link";

import { type AnswerItem, answerLinkClass as a } from "./answer-sections";

// SALVAGE 1006 /moon-pods sections. Sources: /moon-pods and /vapes copy (families,
// mouthpieces, Orbit), /presidential-thc extract copy, /find-us retailer copy, route meta.

export const MOON_PODS_ANSWERS: readonly AnswerItem[] = [
  {
    id: "moon-pods-q-what",
    question: "What are Presidential Moon Pods?",
    answer: (
      <p>
        Moon Pods are the Presidential pods shown with the <Link className={a} href="/orbit">Orbit</Link> device. They
        come in three families, each named for its extract: Liquid Diamonds (LD) with a teal mouthpiece, Live Resin (LRE)
        with a clear mouthpiece, and Live Rosin (LRO) with a smoked mouthpiece.
      </p>
    ),
  },
  {
    id: "moon-pods-q-moon-rocks",
    question: "How do Moon Pods relate to Presidential Moon Rocks?",
    answer: (
      <p>
        Both are built around the same extracts. In <Link className={a} href="/moon-rocks">Moon Rocks</Link>, live resin
        is the extract identified with the Gold Strain Series and live rosin with the Rose Gold Connoisseur Series, infused
        over flower. Moon Pods carry those extracts in the LRE and LRO families. THC is batch-specific, so read the package
        label and its test results.
      </p>
    ),
  },
  {
    id: "moon-pods-q-buy",
    question: "Where can I buy Moon Pods?",
    answer: (
      <p>
        Presidential is wholesale and sold through licensed retailers, and availability varies by retailer. Use the{" "}
        <Link className={a} href="/find-us">store finder</Link> to see licensed retailers carrying Presidential, then
        confirm Moon Pods stock with the store.
      </p>
    ),
  },
];
