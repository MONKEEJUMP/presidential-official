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
const BLUNT_BUILDS = Object.entries(
  BLUNT_EDITION_BUILDS.reduce<Record<string, number>>((builds, build) => {
    builds[build] = (builds[build] ?? 0) + 1;
    return builds;
  }, {}),
);

// MR-GSC-R2: series-to-build map from blunts-catalog editions.
const BLUNT_SERIES_ANSWER: AnswerItem = {
  id: "blunts-q-series",
  question: "Which infused blunt is in each series?",
  answer: (
    <p>
      Every Presidential infused blunt is 1.5g in a tobacco-free wrap. The{" "}
      <Link className={a} href="/moon-rocks/silver">Silver Flavor Series</Link> blunts carry fruit names.{" "}
      <Link className={a} href="/moon-rocks/gold">Gold Strain Series</Link> blunts such as Blue Dream
      are flower, live resin, and diamonds. The{" "}
      <Link className={a} href="/moon-rocks/rose-gold">Rose Gold Connoisseur Series</Link> blunts carry the
      connoisseur names.
    </p>
  ),
};

export const BLUNT_ANSWERS: readonly AnswerItem[] = [
  {
    id: "blunts-q-inside",
    question: "What's inside a Presidential Moon Rock blunt?",
    answer: (
      <p>
        A Presidential Moon Rock blunt is 1.5g of the moon rock build in a tobacco-free wrap: cannabis flower, a concentrate
        infused over it, and a kief or diamond finish. Each moonrock blunt pack prints its build, for example FLOWER · DISTILLATE · KIEF
        on Watermelon, FLOWER · LIVE RESIN · DIAMONDS on Blue Dream, and FLOWER · LIVE ROSIN · DIAMONDS on Wedding Cake. The
        unrolled format is in the{" "}
        <Link className={a} href="/moon-rocks">Presidential Moon Rocks collection</Link>, and a selection of pack designs is in the{" "}
        <Link className={a} href="/presidential-art/blunts">Presidential blunt pack art</Link> gallery. The company behind the packs is{" "}
        <Link className={a} href="/about">the Presidential brand</Link>.
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
        Yes. Every Presidential Moon Rock blunt is rolled in a tobacco-free wrap, and each
        edition on this page states it: one 1.5g Moon Rock blunt in a tobacco-free wrap.
      </p>
    ),
  },
  {
    id: "blunts-q-review",
    question: "Presidential Moon Rock blunt review: what's in each pack?",
    answer: (
      <>
        <p>
          Every edition is one 1.5g Moon Rock
          blunt: cannabis flower with a concentrate infused over it, in a tobacco-free wrap. The
          editions use these builds:
        </p>
        <ul className="list-disc pl-6">
          {BLUNT_BUILDS.map(([build]) => (
            <li key={build}>{build}</li>
          ))}
        </ul>
        <p>
          THC is batch-specific, so read the package label and its test results, and check stock at a{" "}
          <Link className={a} href="/find-us">licensed retailer</Link>.
        </p>
      </>
    ),
  },
  BLUNT_SERIES_ANSWER,
];

export const MINI_BLUNT_ANSWERS: readonly AnswerItem[] = [
  {
    id: "mini-blunts-q-vs-blunt",
    question: "Mini blunt vs full blunt: what's the difference?",
    answer: (
      <p>
        A Presidential Mini Blunts pack holds three 0.7g Moon Rock mini blunts, 2.1g in total.{" "}
        <Link className={a} href="/blunts">Full-size Moon Rock blunts</Link> hold 1.5g in a single roll. Each mini blunt
        is flower, live resin, and diamonds in a tobacco-free wrap, the same layered build as a{" "}
        <Link className={a} href="/moon-rocks">Presidential Moon Rock</Link>: a smaller version of the same object, not a cheaper
        one. The packs are in the{" "}
        <Link className={a} href="/presidential-art/mini-blunts">Presidential mini blunt pack art</Link> gallery.
      </p>
    ),
  },
];

export const VAPES_ANSWERS: readonly AnswerItem[] = [
  {
    id: "vapes-q-system",
    question: "Presidential Vapes: Orbit and Moon Pods",
    answer: (
      <>
      <p>
        Presidential vapes are a two-part system. <Link className={a} href="/orbit">Orbit</Link> is the device, in four
        finishes: Black, Silver, Teal, and White. <Link className={a} href="/moon-pods">Moon Pods</Link> are the pods,
        in extract families: Liquid Diamonds (LD) with a teal mouthpiece, Live Resin (LRE) with a clear mouthpiece,
        and Live Rosin (LRO) with a smoked mouthpiece.
      </p>
      {/* SURFER-R14: heat modes, from the /vapes multi-mode section and answers. */}
      <h3 className="mt-6 text-base font-semibold">Why does each Moon Pod family get its own heat mode?</h3>
      <p className="mt-2">
        <Link className={a} href="/learn/different-extracts-need-different-heat">Different extracts need different heat</Link>.
        Orbit has three modes, one for each Moon Pod family: Liquid Diamond Mode (LD), Live Resin Mode (LR), and Live Rosin Mode
        (LRO). Press the device button three times, then select the oil type, and the device applies the optimized heat for that
        extract. Live Rosin Mode runs at a lower temperature to preserve natural flavor and terpenes; see{" "}
        <Link className={a} href="/learn/what-is-live-rosin">what live rosin is</Link>. Orbit is the reusable device, and Moon Pods
        are the pods you replace, so <Link className={a} href="/moon-pods">explore Moon Pods</Link> for each family. THC is
        batch-specific, so read the package label and its test results.
      </p>
      </>
    ),
  },
  {
    id: "vapes-q-what",
    question: "Does Presidential make THC vapes?",
    answer: (
      <p>
        Yes. Presidential vapes are <Link className={a} href="/moon-pods">Moon Pods</Link>, shown with the{" "}
        <Link className={a} href="/orbit">Orbit</Link> device. Moon Pods come in families named for their extract:
        Liquid Diamonds (LD), Live Resin (LRE), and Live Rosin (LRO). THC is batch-specific, so read the package label and
        its test results.
      </p>
    ),
  },
  // MR-GSC-R2: Orbit battery/pod model and the LR mode label, from the /vapes copy.
  {
    id: "vapes-q-disposable",
    question: "Is Orbit a disposable vape?",
    answer: (
      <p>
        No. The Moon Pods vape system pairs a reusable battery with disposable pods: <Link className={a} href="/orbit">Orbit</Link>{" "}
        is the reusable device, and <Link className={a} href="/moon-pods">Moon Pods</Link> are the pods you replace.
      </p>
    ),
  },
  {
    id: "vapes-q-lr",
    question: "What does LR mean on a Presidential vape?",
    answer: (
      <p>
        LR is Orbit&apos;s Live Resin Mode, one of three modes alongside Liquid Diamond Mode (LD) and Live Rosin Mode (LRO).
        Read <Link className={a} href="/learn/what-is-live-resin">what live resin is</Link> for the extract behind the name.
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
