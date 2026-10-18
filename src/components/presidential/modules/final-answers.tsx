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
        finished with kief, with the materials printed on each package. The same infused build carries into
        1g <Link className={a} href="/pre-rolls">Presidential pre-rolls</Link>, 1.5g{" "}
        <Link className={a} href="/blunts">Moon Rock blunts</Link> in a tobacco-free blunt wrap, Mini Pre-Rolls (3 × 0.5g)
        and Mini Blunts (3 × 0.7g). Browse the{" "}
        <Link className={a} href="/moon-rocks">Presidential Moon Rocks collection</Link>.
      </p>
    ),
  },
  {
    id: "home-q-strain",
    question: "What strain is Presidential?",
    answer: (
      <>
        <p>
          Presidential is the brand, not a strain; <Link className={a} href="/about">about Presidential</Link> covers the
          company. Each product names its own strain on the pack, along with its strain type:{" "}
          <Link className={a} href="/moon-rocks/24k">24K</Link>, for example, is marked Indica. THC and other cannabinoids,
          the chemical compounds listed on a cannabis label, are batch-specific, and burn and potency are not universal
          across the line, so the package and batch record for the product in hand control those facts.
        </p>
        {/* SURFER-R21: home label-reading H3 (facts from this page: strain answer, Moon Rocks answer, tier tiles). */}
        <h3 className="mt-8 text-2xl font-semibold leading-snug text-po-ink">How do you read a Presidential package label?</h3>
        <p>
          Start with the strain name and the strain type printed on the pack: the pack for{" "}
          <Link className={a} href="/moon-rocks/24k">24K Indica moon rocks</Link>, for example, names 24K and marks it Indica.
          Next, find the build. Each package names the materials in its infused construction: flower, then a concentrate such as
          distillate or live resin, then a kief finish, which is{" "}
          <Link className={a} href="/learn/what-are-moon-rocks">what moon rocks are</Link>. The tier shows the extract
          family: Silver is distillate, Gold is live resin, and Rose Gold is live rosin. THC and the other cannabinoids are
          the chemical compounds listed on a cannabis label. They are batch-specific, so read the current package label and
          its test results rather than a general number. Presidential is sold through licensed retailers in{" "}
          <Link className={a} href="/find-us">select state markets</Link>.
        </p>
        {/* SURFER-R27: "presidential flower" H3 (facts: Moon Rocks answer, tier tiles, mini catalog; moon rock copy says "finished with kief"). */}
        <h3 className="mt-8 text-2xl font-semibold leading-snug text-po-ink">What is Presidential flower?</h3>
        <p>
          Presidential flower is the cannabis flower at the base of every Presidential moon rock. Each moon rock starts with
          that flower, adds a concentrate coat, and is finished with kief, with the build printed on the pack. The tier names
          the extract: Silver is distillate, Gold is live resin, and Rose Gold is live rosin. The same flower also goes into
          Moon Rock pre-rolls, blunts and minis; browse the{" "}
          <Link className={a} href="/moon-rocks">Presidential Moon Rocks collection</Link> or{" "}
          <Link className={a} href="/mini-blunts">Presidential mini blunts</Link>. Mini availability depends on the flavor;
          Blue Raspberry, for example, has no mini. THC values are batch-specific, so read the current label. Presidential
          sells through licensed retailers in <Link className={a} href="/find-us">select state markets</Link>.
        </p>
        {/* SURFER-R31: "presidential flower" jar H3 (facts: tier tiles, pack build lines; 24K prints FLOWER · LIVE RESIN · DIAMONDS). */}
        <h3 className="mt-8 text-2xl font-semibold leading-snug text-po-ink">From the flower to the jar you pick</h3>
        <p>
          Every Presidential Moon Rock starts as cannabis flower. What changes from jar to jar is the concentrate carried through
          it and the outer layer. Silver jars use distillate, Gold jars use live resin, and Rose Gold jars use live rosin, and
          across the lineup the outside is kief or diamonds, depending on the label. That&apos;s why the jar label matters more than
          the word &quot;flower&quot; on a menu: it names the series and the build. Read the jar label for the build, then compare
          strain-led options on the <Link className={a} href="/moon-rocks/gold">Gold live resin collection</Link>, or start with
          the 24K jar, which is finished with diamonds.
        </p>
      </>
    ),
  },
  // ROUND2 MR 1 (Surfer 16649274): format-only answer; sources /about infusion copy and /learn/what-are-moon-rocks.
  {
    id: "home-q-worth-it",
    question: "Are moon rocks worth it?",
    answer: (
      <p>
        That comes down to the format you want. A moon rock is not plain flower: it is cannabis flower coated with a
        concentrate and finished with kief, three layers in one product.
        Presidential&apos;s <Link className={a} href="/about#about-craft-title">infusion process</Link> runs in that
        order: flower, then concentrate, then the kief finish. Read <Link className={a} href="/learn/what-are-moon-rocks">what moon rocks are</Link> for
        how the format differs from flower alone.
      </p>
    ),
  },
  // MR-AHREFS-R3 ("presidential weed"): origin facts as published on /about and the Orbit answers.
  {
    id: "home-q-weed-brand",
    question: "Is Presidential a weed brand?",
    answer: (
      <p>
        Yes. Presidential is a cannabis brand that started in Los Angeles, California, in 2012, and it is known for Moon
        Rocks. Read <Link className={a} href="/about">about Presidential</Link> or{" "}
        <Link className={a} href="/presidential-cannabis">Presidential cannabis</Link> for the company and its lineup.
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
    // SURFER-R11: from "What is the Presidential Orbit?" and the /moon-pods families answer.
    id: "orbit-q-moon-pods",
    question: "How do Orbit and Moon Pods work together?",
    answer: (
      <p>
        Orbit is the device and Moon Pods are the pods shown with it. Each pod family is named for its extract: Liquid
        Diamonds (LD), Live Resin (LRE), and Live Rosin (LRO). See the <Link className={a} href="/moon-pods">Moon Pods</Link>{" "}
        page for the pod families and the <Link className={a} href="/vapes">vapes</Link> page for the full platform.
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
