import Link from "next/link";

import { type AnswerItem, answerLinkClass as a } from "./answer-sections";

// SALVAGE 1006 content, plus MR-TOP50 (Oct 8) query-owner sections and anchors. Sources: /moon-rocks/rose-gold build copy, /presidential-thc
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
    id: "moon-rocks-q-strains",
    question: "Presidential Moon Rock strains by series",
    answer: (
      <p>
        Presidential weed strains are grouped into three series. The Silver Flavor Series carries flavor-led releases such
        as Grape, <Link className={a} href="/moon-rocks/pineapple">Pineapple</Link>, and{" "}
        <Link className={a} href="/moon-rocks/watermelon">Watermelon</Link>. The Gold Strain Series carries named strains
        such as Blue Dream, <Link className={a} href="/moon-rocks/gorilla-goo">Gorilla Goo</Link>, and NYC Diesel. The Rose
        Gold Connoisseur Series carries Cereal Milk, God&apos;s Gift, and White Walker.
      </p>
    ),
  },
  {
    id: "moon-rocks-q-flower",
    question: "What is Presidential flower?",
    answer: (
      <p>
        Presidential flower is the cannabis flower at the base of every Presidential moon rock. It is moon rock infused:
        a concentrate coat goes over the flower, and a dry finish such as kief or diamonds is bonded to that coat. The pack
        prints the build, for example FLOWER · LIVE RESIN · DIAMONDS on 24K. THC is batch-specific, so read the package
        label and its test results; <Link className={a} href="/presidential-thc">Presidential THC flower</Link> explains
        those label numbers.
      </p>
    ),
  },
  {
    id: "moon-rocks-q-formats",
    question: "Do Presidential Moon Rocks come in other formats?",
    answer: (
      <p>
        Yes. The same build is rolled into 1g <Link className={a} href="/pre-rolls">Moon Rock pre-rolls</Link>, 1.5g
        blunts in a tobacco-free wrap, <Link className={a} href="/mini-pre-rolls">Mini Pre-Rolls</Link> (three 0.5g, 1.5g
        in total), and <Link className={a} href="/mini-blunts">Presidential Mini Blunts</Link> (three 0.7g, 2.1g in
        total).
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
    id: "moon-rocks-q-live-resin",
    question: "Are Presidential Moon Rocks made with live resin?",
    answer: (
      <p>
        The <Link className={a} href="/moon-rocks/gold">Gold Strain Series</Link> are the live resin Moon Rocks: packs such
        as 24K and Blue Dream print FLOWER · LIVE RESIN · DIAMONDS. The Silver Flavor Series uses distillate, and the Rose
        Gold Connoisseur Series uses solventless live rosin.
      </p>
    ),
  },
  {
    id: "moon-rocks-q-rx",
    question: "Are Presidential RX Moon Rocks the same product?",
    answer: (
      <p>
        Presidential RX is the name on one of the official Presidential profiles; the Moon Rocks on this page are the
        official Presidential lineup. <Link className={a} href="/about">Presidential RX</Link> is explained on the About
        page.
      </p>
    ),
  },
  {
    id: "moon-rocks-q-blunt-wrap",
    question: "What are Moon Rock blunts wrapped in?",
    answer: (
      <p>
        A Presidential Moon Rock blunt brings cannabis flower and concentrate together in a tobacco-free wrap. Each single
        blunt contains 1.5g. See the <Link className={a} href="/blunts">Moon Rock blunts lineup</Link>.
      </p>
    ),
  },
];

export const ABOUT_ANSWERS: readonly AnswerItem[] = [
  // MR-ABOUT-MOONROCKS (Oct 9): company, logo and Moon Rocks questions. Sources: /about hero,
  // /our-story ("helped invent a category"), /learn pack architecture, live ™ names.
  {
    id: "about-q-at-a-glance",
    question: "The Presidential Cannabis Company at a Glance",
    answer: (
      <p>
        Presidential is a Los Angeles cannabis company, started in 2012. As{" "}
        <Link className={a} href="/our-story">Our Story</Link> tells it, Presidential helped invent a category: infused
        cannabis products. It builds three formats under one standard, Moon Rocks™, infused pre-rolls, and tobacco-free
        blunts, across the Silver Flavor, Gold Strain, and Rose Gold Connoisseur series, and it sells only through licensed
        retailers.
      </p>
    ),
  },
  {
    id: "about-q-company",
    question: "Is Presidential a cannabis company or a product line?",
    answer: (
      <p>
        A company. Presidential is the cannabis company; Moon Rocks™ is its flagship product platform. Pre-rolls, blunts,
        Mini Blunts, Mini Pre-Rolls, and Moon Pods for the Orbit device are its other product lines.
      </p>
    ),
  },
  {
    id: "about-q-moon-rocks",
    question: "Is Presidential the same as Presidential Moon Rocks?",
    answer: (
      <p>
        Yes. Presidential is the brand, and{" "}
        <Link className={a} href="/moon-rocks">Presidential Moon Rocks</Link> is its flagship product and the name of this
        official site. The infused pre-rolls and blunts carry the same moon rock build.
      </p>
    ),
  },
  {
    id: "about-q-logo",
    question: "What is the Presidential cannabis logo?",
    answer: (
      <p>
        The Presidential logo is the crest shown at the top of this page. On every pack, the silver crown crest carries the
        PRESIDENTIAL banner. The ™ symbol appears on the names Moon Rocks™ and Presidential Infusion System™.
      </p>
    ),
  },
  {
    id: "about-q-weed-brand",
    question: "What is the Presidential weed brand?",
    answer: (
      <p>
        Presidential is the cannabis company, and the weed brand, behind{" "}
        <Link className={a} href="/presidential-cannabis">Presidential cannabis</Link>: Moon Rocks, infused pre-rolls
        (joints), tobacco-free blunts, Mini Blunts, Mini Pre-Rolls, and Moon Pods for the Orbit device. Every infused
        product follows the Presidential Infusion System™. The company is wholesale and sells through licensed
        dispensaries, not direct. Many menus list these formats as Presidential THC; see{" "}
        <Link className={a} href="/presidential-thc">what Presidential THC means</Link>.
      </p>
    ),
  },
  {
    id: "about-q-rx",
    question: "Is Presidential RX the same brand?",
    answer: (
      <p>
        Presidential RX is the name on one of the owner-approved official Presidential profiles, the Presidential RX
        Facebook page. It is listed with the brand&apos;s other official profiles on{" "}
        <Link className={a} href="/our-story">Our Story</Link>.
      </p>
    ),
  },
  {
    id: "about-q-founded",
    question: "Who founded the Presidential cannabis brand?",
    answer: (
      <p>
        Everett Smith and John Zapp founded Presidential in Los Angeles, California, in 2012. The brand works across
        product categories built on cannabis flower: <Link className={a} href="/moon-rocks">Moon Rocks</Link> such as{" "}
        <Link className={a} href="/moon-rocks/24k">24K</Link>, <Link className={a} href="/pre-rolls">infused pre-rolls</Link>,
        tobacco-free blunts, and <Link className={a} href="/mini-blunts">Mini Blunts</Link>.
      </p>
    ),
  },
  {
    id: "about-q-flavors",
    question: "What flavors and strains does Presidential make?",
    answer: (
      <p>
        The Silver Flavor Series carries flavor-led releases such as Grape, Pineapple,{" "}
        <Link className={a} href="/moon-rocks/watermelon">Watermelon</Link>, and Peach Mango. The Gold Strain Series
        carries named strains built on live resin, such as 24K and Blue Dream. Presidential Classic, the house recipe, is
        made with flower, distillate, and kief.
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
        A Presidential pre-roll is a ready-rolled joint: a 1g Moon Rock pre-roll of cannabis flower combined with
        concentrate, prepared in rolling paper. Some menus list them as infused joints. The House Line adds{" "}
        <Link className={a} href="/moon-rocks/presidential-prerolls">Presidential Prerolls Moon Rocks</Link>.
      </p>
    ),
  },
  {
    id: "pre-rolls-q-made",
    question: "How are Presidential pre rolls made?",
    answer: (
      <p>
        Every Presidential pre-roll follows the same infusion process as a Presidential moon rock: cannabis flower as the
        base, a concentrate infused over it, and a dry finish. The pack prints the build, for example FLOWER · DISTILLATE ·
        KIEF on Grape, FLOWER · LIVE RESIN · DIAMONDS on Blue Dream, and FLOWER · LIVE ROSIN · DIAMONDS on Wedding Cake.
        Presidential pre rolls are sold through licensed dispensaries; the{" "}
        <Link className={a} href="/find-us">store finder</Link> lists licensed retailers carrying Presidential.
      </p>
    ),
  },
  {
    id: "pre-rolls-q-moon-rock",
    question: "Is a Moon Rock pre-roll the same as a Presidential pre-roll?",
    answer: (
      <p>
        Yes. Presidential pre-rolls are sold as Moon Rock pre-rolls: the moon rock build in a finished 1g roll. The
        unrolled format is in the{" "}
        <Link className={a} href="/moon-rocks">Presidential Moon Rocks collection</Link>.
      </p>
    ),
  },
  {
    id: "pre-rolls-q-compare",
    question: "How do pre-rolls compare with mini pre-rolls and blunts?",
    answer: (
      <p>
        <Link className={a} href="/mini-pre-rolls">Mini pre-rolls</Link> come as three 0.5g Moon Rock mini pre-rolls,
        1.5g in total. <Link className={a} href="/blunts">Moon Rock blunts</Link> hold 1.5g in a tobacco-free wrap.
        Every format comes from Presidential, the Los Angeles, California cannabis brand, and is sold through licensed
        retailers.
      </p>
    ),
  },
];
