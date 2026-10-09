import Link from "next/link";

import { BLUNT_ARTWORKS } from "@/content/blunts-catalog";
import { newVaultProductPages } from "@/content/vault/catalog";
import { vaultSpecs } from "@/content/vault/specs";

import { type AnswerItem, answerLinkClass as a } from "./answer-sections";

// MR-TOP50 (Oct 8): question-led sections for the query-owner pages /blunts,
// /mini-blunts and /vapes. Sources: blunts-catalog.ts editions (weights and
// builds), vault mini-pack data (specs.json), /moon-pods and /orbit copy.
// MR-NEXT (Oct 9) extends /blunts and /vapes from the same sources only.

// Infusion builds of every edition shown on /blunts: the blunts-catalog.ts editions
// plus the Vault blunt SKUs that buildVaultCardsBySection("blunts") adds (specs.json).
const BLUNT_EDITION_BUILDS: readonly string[] = [
  ...BLUNT_ARTWORKS.map((blunt) => blunt.edition.replace("1.5g infused blunt · ", "")),
  ...newVaultProductPages
    .filter((product) => product.room === "blunts")
    .flatMap((product) => {
      const madeWith = vaultSpecs(product)?.madeWith;
      return madeWith ? [madeWith.join(" · ")] : [];
    }),
];
const BLUNT_EDITION_COUNT = BLUNT_EDITION_BUILDS.length;
const BLUNT_BUILDS = Object.entries(
  BLUNT_EDITION_BUILDS.reduce<Record<string, number>>((builds, build) => {
    builds[build] = (builds[build] ?? 0) + 1;
    return builds;
  }, {}),
);

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
        Both carry the same moon rock build, so the main difference between a Presidential pre-roll and blunt is size and
        wrap.{" "}
        <Link className={a} href="/pre-rolls">Moon Rock pre-rolls</Link> hold 1g in rolling papers, a Moon Rock blunt
        holds 1.5g in a tobacco-free wrap with no tobacco leaf, and{" "}
        <Link className={a} href="/mini-blunts">Presidential Mini Blunts</Link> split 2.1g into three 0.7g mini blunts.
      </p>
    ),
  },
  {
    id: "blunts-q-pre-roll-a-blunt",
    question: "Is a pre-roll considered a blunt?",
    answer: (
      <p>
        Not in the Presidential lineup. A Presidential pre-roll is 1g of Moon Rock rolled in paper; a Presidential blunt is
        1.5g of Moon Rock in a tobacco-free wrap. The wrap is what separates the two formats.
      </p>
    ),
  },
  {
    id: "blunts-q-without-tobacco",
    question: "Can you make blunts without tobacco?",
    answer: (
      <p>
        Yes. Every Presidential Moon Rock blunt is rolled in a tobacco-free wrap, and each of the {BLUNT_EDITION_COUNT}{" "}
        editions on this page states it: one 1.5g Moon Rock blunt in a tobacco-free wrap.
      </p>
    ),
  },
  {
    id: "blunts-q-review",
    question: "Presidential Moon Rock blunt review: what's in each pack?",
    answer: (
      <>
        <p>
          This page does not publish reviews or ratings; it lists what each pack states. Every edition is one 1.5g Moon Rock
          blunt: cannabis flower with a concentrate infused over it, in a tobacco-free wrap. The {BLUNT_EDITION_COUNT}{" "}
          editions use these builds:
        </p>
        <ul className="list-disc pl-6">
          {BLUNT_BUILDS.map(([build, count]) => (
            <li key={build}>
              {build}: {count} {count === 1 ? "edition" : "editions"}
            </li>
          ))}
        </ul>
        <p>
          THC is batch-specific, so read the package label and its test results, and check stock at a{" "}
          <Link className={a} href="/find-us">licensed retailer</Link>.
        </p>
      </>
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
    id: "vapes-q-system",
    question: "Presidential Vapes: Orbit and Moon Pods",
    answer: (
      <p>
        Presidential vapes are a two-part system. <Link className={a} href="/orbit">Orbit</Link> is the device, in four
        finishes: Black, Silver, Teal, and White. <Link className={a} href="/moon-pods">Moon Pods</Link> are the pods,
        in three extract families: Liquid Diamonds (LD) with a teal mouthpiece, Live Resin (LRE) with a clear mouthpiece,
        and Live Rosin (LRO) with a smoked mouthpiece.
      </p>
    ),
  },
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
  {
    id: "vapes-q-buy",
    question: "Where can I buy Presidential vapes?",
    answer: (
      <p>
        Presidential vapes are sold through licensed retailers, and availability varies by retailer.{" "}
        <Link className={a} href="/find-us">Find a retailer</Link> carrying Presidential, then confirm Orbit and Moon Pods
        stock with the store.
      </p>
    ),
  },
];
