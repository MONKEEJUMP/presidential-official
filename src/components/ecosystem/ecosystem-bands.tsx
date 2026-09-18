import Image from "next/image";
import Link from "next/link";
import {
  CirclesThree,
  Crown,
  Diamond,
  Drop,
  Gauge,
  Gear,
  Lightning,
  SealCheck,
  Target,
  Thermometer,
} from "@phosphor-icons/react/ssr";

import styles from "./ecosystem-bands.module.css";

type Tier = "silver" | "gold" | "rose-gold";
type ExpressionKind = "moon-rocks" | "pre-rolls" | "blunts" | "vapes";

const VALUE_LINES = [
  { icon: Crown, label: "PREMIUM CRAFTSMANSHIP" },
  { icon: Target, label: "CONSISTENT EXPERIENCES" },
  { icon: Drop, label: "BUILT FOR THE OIL" },
  { icon: Gear, label: "DESIGNED TO PERFORM" },
  { icon: Diamond, label: "ELEVATED IN EVERY DETAIL" },
] as const;

const ARCHITECTURE_STEPS = [
  {
    number: "1",
    label: "ECOSYSTEM",
    sentence: "A unified brand built around exceptional cannabis experiences.",
  },
  {
    number: "2",
    label: "PLATFORMS",
    sentence: "Choose your experience format.",
  },
  {
    number: "3",
    label: "EXPERIENCE TIERS",
    sentence: "Choose your experience profile.",
  },
  {
    number: "4",
    label: "EXPRESSIONS",
    sentence: "Choose your preferred way to enjoy.",
  },
] as const;

const PLATFORM_FEATURES = [
  { icon: Thermometer, label: "Smart Heat Technology" },
  { icon: CirclesThree, label: "Three Experience Modes" },
  { icon: Drop, label: "Maximum Flavor" },
  { icon: Gauge, label: "Optimal Performance" },
] as const;

const TIERS = [
  {
    tier: "silver" as const,
    icon: Diamond,
    href: "/moon-rocks/silver",
    heading: "SILVER",
    extract: "LIQUID DIAMONDS",
    headline: "THE ULTIMATE FLAVOR & POTENCY EXPERIENCE",
    series: "Flavor Series",
    copy: [
      "Where Flavor Meets Potency.",
      "Maximum flavor. Maximum potency.",
      "The intersection of both.",
    ],
  },
  {
    tier: "gold" as const,
    icon: Drop,
    href: "/moon-rocks/gold",
    heading: "GOLD",
    extract: "LIVE RESIN",
    headline: "THE ULTIMATE FULL-SPECTRUM CANNABIS EXPERIENCE",
    series: "Strain Series",
    copy: [
      "Authentic Cannabis. Fully Expressed.",
      "Full-spectrum. Authentic strain expression.",
      "Potent. Balanced. True to the plant.",
    ],
  },
  {
    tier: "rose-gold" as const,
    icon: Crown,
    href: "/moon-rocks/rose-gold",
    heading: "ROSE GOLD",
    extract: "LIVE ROSIN",
    headline: "THE ULTIMATE SOLVENTLESS CANNABIS EXPERIENCE",
    series: "Connoisseur Series",
    copy: [
      "Crafted for the Purest Cannabis Experience.",
      "Solventless. Crafted with precision.",
      "True cannabis flavor. Potent.",
    ],
  },
] as const;

const EXPRESSIONS = {
  "moon-rocks": {
    heading: "2G MOON ROCKS™",
    subline: "The Ultimate Moon Rock.",
    copy: ["Maximum potency. Maximum flavor.", "The flagship experience."],
    chips: [
      ["SILVER", "silver"],
      ["GOLD", "gold"],
      ["ROSE GOLD", "rose-gold"],
    ] as const,
    image: {
      src: "/media/moon-rocks/cards/presidential-moon-rocks.webp",
      alt: "Presidential Moon Rocks flagship pack",
    },
    href: "/moon-rocks",
  },
  "pre-rolls": {
    heading: "MOON ROCK PREROLLS™",
    subline: "The Ultimate Preroll.",
    copy: ["Premium flower. Premium oil.", "Rolled to perfection."],
    chips: [
      ["SILVER", "silver"],
      ["GOLD", "gold"],
      ["ROSE GOLD", "rose-gold"],
    ] as const,
    image: {
      src: "/media/pre-rolls/presidential-og.webp",
      alt: "Presidential OG Moon Rock pre-roll",
    },
    href: "/pre-rolls",
  },
  blunts: {
    heading: "MOON ROCK BLUNTS™",
    subline: "The Ultimate Blunt.",
    copy: ["Premium flower. Premium oil.", "Slow burn. Maximum flavor."],
    chips: [
      ["SILVER", "silver"],
      ["GOLD", "gold"],
      ["ROSE GOLD", "rose-gold"],
    ] as const,
    image: {
      src: "/media/blunts/presidential-og.webp",
      alt: "Presidential OG Moon Rock blunt",
    },
    href: "/blunts",
  },
  vapes: {
    heading: "MOON PODS™ + ORBIT™",
    subline: "The Ultimate Oil System.",
    copy: [
      "Three experiences. One smart system.",
      "Maximum flavor. Maximum control.",
    ],
    chips: [
      ["SILVER MODE", "silver"],
      ["GOLD MODE", "gold"],
      ["ROSE GOLD MODE", "rose-gold"],
    ] as const,
    image: {
      src: "/media/vapes/showroom/teal-ld-home.webp",
      alt: "Teal Presidential Orbit with Moon Pod",
    },
    href: "/vapes",
  },
} as const;

const MOMENTS = [
  { icon: Lightning, label: "POTENCY", second: "You Can Feel" },
  { icon: Drop, label: "FLAVOR", second: "You Can Taste" },
  { icon: SealCheck, label: "QUALITY", second: "You Can Trust" },
  { icon: Target, label: "CONSISTENCY", second: "You Can Rely On" },
  { icon: Crown, label: "CRAFTSMANSHIP", second: "You Can See" },
] as const;

function BrandLockup() {
  return (
    <div className={styles.brandLockup}>
      <Image
        alt="Presidential crest"
        height={72}
        sizes="93px"
        src="/media/brand/presidential-crest-master.png"
        width={93}
      />
      <p>BUILT FOR THE OIL.</p>
    </div>
  );
}

function Wordmark({ height = 40 }: { readonly height?: 40 | 48 }) {
  const width = height === 48 ? 146 : 122;
  return (
    <Image
      alt="Presidential"
      className={styles.wordmark}
      height={height}
      sizes={`${width}px`}
      src="/media/brand/presidential-banner.png"
      width={width}
    />
  );
}

function CircledIcon({
  Icon,
  tone = "teal",
}: {
  readonly Icon: typeof Crown;
  readonly tone?: "gold" | "teal" | Tier;
}) {
  return (
    <span className={styles.circledIcon} data-tone={tone}>
      <Icon aria-hidden="true" size={28} weight="regular" />
    </span>
  );
}

function TierChips({
  chips,
}: {
  readonly chips: readonly (readonly [string, Tier])[];
}) {
  return (
    <div className={styles.chips}>
      {chips.map(([label, tier]) => (
        <span data-tier={tier} key={label}>
          {label}
        </span>
      ))}
    </div>
  );
}

function ClosingStrip({
  heading,
  scope,
}: {
  readonly heading: boolean;
  readonly scope: string;
}) {
  const choice = heading ? (
    <h2 id={`${scope}-closing-choice`}>
      CHOOSE YOUR EXPERIENCE. CHOOSE YOUR MOMENT.
    </h2>
  ) : (
    <p className={styles.closingChoice}>
      CHOOSE YOUR EXPERIENCE. CHOOSE YOUR MOMENT.
    </p>
  );

  return (
    <div className={styles.closingStrip}>
      <div className={styles.closingGoldLines}>
        <p>THREE EXPERIENCES.</p>
        <p>FOUR EXPRESSIONS.</p>
        <p>ONE STANDARD.</p>
      </div>
      <div className={styles.closingChoiceCell}>{choice}</div>
      <div className={styles.closingWordmark}>
        <Wordmark />
        <p>BUILT FOR THE OIL.</p>
      </div>
      <div className={styles.closingGoldLines}>
        <p>PASSION.</p>
        <p>PRECISION.</p>
        <p>PERFECTION.</p>
      </div>
    </div>
  );
}

function ExpressionCard({
  kind,
  linked = true,
  scope,
}: {
  readonly kind: ExpressionKind;
  readonly linked?: boolean;
  readonly scope: string;
}) {
  const expression = EXPRESSIONS[kind];
  const headingId = `${scope}-${kind}-heading`;
  const content = (
    <>
      <div className={styles.expressionMedia}>
        <Image
          alt={expression.image.alt}
          fill
          sizes="(min-width: 1180px) 22vw, (min-width: 720px) 45vw, 92vw"
          src={expression.image.src}
        />
      </div>
      <h3 id={headingId}>{expression.heading}</h3>
      <p className={styles.cardSubline}>{expression.subline}</p>
      <div className={styles.cardCopy}>
        {expression.copy.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <TierChips chips={expression.chips} />
    </>
  );

  return linked ? (
    <Link
      aria-labelledby={headingId}
      className={`${styles.card} ${styles.expressionCard} ${styles.linkedCard}`}
      href={expression.href}
    >
      {content}
    </Link>
  ) : (
    <article
      aria-labelledby={headingId}
      className={`${styles.card} ${styles.expressionCard}`}
    >
      {content}
    </article>
  );
}

function MomentGrid() {
  return (
    <div className={styles.momentGrid}>
      {MOMENTS.map(({ icon: Icon, label, second }) => (
        <article key={label}>
          <CircledIcon Icon={Icon} />
          <div>
            <h3>{label}</h3>
            <p>{second}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function HomeEcosystemBand() {
  return (
    <section
      aria-labelledby="home-ecosystem-heading"
      className={`${styles.band} ${styles.centeredBand}`}
    >
      <div className={styles.inner}>
        <BrandLockup />
        <h2 className={styles.heroHeading} id="home-ecosystem-heading">
          THE PRESIDENTIAL ECOSYSTEM™
        </h2>
        <p className={styles.goldLead}>
          ONE ECOSYSTEM. TWO PLATFORMS. THREE EXPERIENCES. FOUR EXPRESSIONS.
        </p>
        <div className={styles.introLines}>
          <p>A complete premium cannabis experience built for how consumers choose.</p>
          <p>Same quality. Same craftsmanship. Every time.</p>
        </div>
        <div className={styles.valueGrid}>
          {VALUE_LINES.map(({ icon: Icon, label }) => (
            <article key={label}>
              <CircledIcon Icon={Icon} tone="gold" />
              <h3>{label}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeArchitectureBand() {
  return (
    <section
      aria-labelledby="home-architecture-heading"
      className={styles.band}
    >
      <div className={styles.inner}>
        <h2 className={styles.bandHeading} id="home-architecture-heading">
          OUR BRAND ARCHITECTURE
        </h2>
        <div className={styles.architectureSteps}>
          {ARCHITECTURE_STEPS.map((step) => (
            <article key={step.number}>
              <p className={styles.stepNumber}>{step.number}</p>
              <h3>{step.label}</h3>
              <p>{step.sentence}</p>
            </article>
          ))}
        </div>
        <article className={`${styles.card} ${styles.ecosystemCard}`}>
          <div className={styles.ecosystemIdentity}>
            <div>
              <h3>1 ECOSYSTEM</h3>
              <Wordmark height={48} />
            </div>
            <p>A COMPLETE CANNABIS ECOSYSTEM.</p>
          </div>
          <div className={styles.ecosystemLines}>
            <p>Three experience tiers. Four expressions.</p>
            <p>All crafted with the same standards.</p>
            <p>All designed to elevate every moment.</p>
          </div>
          <div className={styles.goldStack}>
            <p>ONE STANDARD.</p>
            <p>ENDLESS CHOICE.</p>
            <p>ELEVATED ALWAYS.</p>
          </div>
        </article>
      </div>
    </section>
  );
}

export function HomePlatformsAndTiersBand() {
  return (
    <section className={`${styles.band} ${styles.longBand}`}>
      <div className={styles.inner}>
        <div aria-labelledby="home-platforms-heading">
          <h2 className={styles.numberedHeading} id="home-platforms-heading">
            2 PLATFORMS
          </h2>
          <p className={styles.sectionSubline}>Choose your experience format.</p>
          <div className={styles.platformGrid}>
            <Link
              aria-labelledby="home-moon-rocks-platform-heading"
              className={`${styles.card} ${styles.platformCard} ${styles.linkedCard}`}
              href="/moon-rocks"
            >
              <h3 id="home-moon-rocks-platform-heading">MOON ROCKS™ PLATFORM</h3>
              <p className={styles.cardSubline}>The Ultimate Flower Experience.</p>
            </Link>
            <Image
              alt="Presidential crest"
              className={styles.platformCrest}
              height={96}
              sizes="124px"
              src="/media/brand/presidential-crest-master.png"
              width={124}
            />
            <Link
              aria-labelledby="home-oil-platform-heading"
              className={`${styles.card} ${styles.platformCard} ${styles.linkedCard}`}
              href="/vapes"
            >
              <h3 id="home-oil-platform-heading">MOON PODS™ + ORBIT™ PLATFORM</h3>
              <p className={styles.cardSubline}>The Ultimate Oil Experience.</p>
              <h4>SMARTER SYSTEM. BETTER EXPERIENCE.</h4>
              <div className={styles.platformFeatures}>
                {PLATFORM_FEATURES.map(({ icon: Icon, label }) => (
                  <p key={label}>
                    <CircledIcon Icon={Icon} />
                    <span>{label}</span>
                  </p>
                ))}
              </div>
            </Link>
          </div>
        </div>

        <div aria-labelledby="home-tiers-heading" className={styles.tierPart}>
          <h2 className={styles.numberedHeading} id="home-tiers-heading">
            3 EXPERIENCE TIERS
          </h2>
          <p className={styles.sectionSubline}>Choose your experience profile.</p>
          <div className={styles.tierGrid}>
            {TIERS.map(({ icon: Icon, ...tier }) => (
              <Link
                aria-labelledby={`home-${tier.tier}-tier-heading`}
                className={`${styles.card} ${styles.tierCard} ${styles.linkedCard}`}
                data-tier={tier.tier}
                href={tier.href}
                key={tier.tier}
              >
                <CircledIcon Icon={Icon} tone={tier.tier} />
                <h3 id={`home-${tier.tier}-tier-heading`}>{tier.heading}</h3>
                <p className={styles.tierExtract}>{tier.extract}</p>
                <p className={styles.tierHeadline}>{tier.headline}</p>
                <p className={styles.tierSeries}>{tier.series}</p>
                <div className={styles.cardCopy}>
                  {tier.copy.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeExpressionsBand() {
  return (
    <section
      aria-labelledby="home-expressions-heading"
      className={styles.band}
    >
      <div className={styles.inner}>
        <h2 className={styles.numberedHeading} id="home-expressions-heading">
          4 EXPRESSIONS
        </h2>
        <p className={styles.sectionSubline}>Choose your preferred way to enjoy.</p>
        <div className={styles.expressionGrid} data-count="4">
          {(Object.keys(EXPRESSIONS) as ExpressionKind[]).map((kind) => (
            <ExpressionCard kind={kind} key={kind} scope="home-expression" />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ExperienceEveryMomentBand({
  scope,
}: {
  readonly scope: "home" | "moon-rocks";
}) {
  return (
    <section
      aria-labelledby={`${scope}-experience-heading`}
      className={styles.band}
    >
      <div className={styles.inner}>
        <h2 className={styles.bandHeading} id={`${scope}-experience-heading`}>
          EXPERIENCE EVERY MOMENT
        </h2>
        <MomentGrid />
        <ClosingStrip heading={false} scope={scope} />
      </div>
    </section>
  );
}

export function MoonRocksPlatformBand() {
  return (
    <section
      aria-labelledby="moon-rocks-platform-band-heading"
      className={styles.band}
    >
      <div className={styles.inner}>
        <h2 className={styles.bandHeading} id="moon-rocks-platform-band-heading">
          MOON ROCKS™ PLATFORM
        </h2>
        <p className={styles.sectionSubline}>The Ultimate Flower Experience.</p>
        <p className={styles.goldLead}>
          ONE ECOSYSTEM. TWO PLATFORMS. THREE EXPERIENCES. FOUR EXPRESSIONS.
        </p>
        <div className={styles.expressionGrid} data-count="3">
          <ExpressionCard kind="moon-rocks" linked={false} scope="moon-platform" />
          <ExpressionCard kind="pre-rolls" scope="moon-platform" />
          <ExpressionCard kind="blunts" scope="moon-platform" />
        </div>
      </div>
    </section>
  );
}

export function ProductExpressionBand({
  product,
}: {
  readonly product: "pre-rolls" | "blunts";
}) {
  const expression = EXPRESSIONS[product];
  return (
    <section
      aria-labelledby={`${product}-expression-band-heading`}
      className={`${styles.band} ${styles.centeredBand}`}
    >
      <div className={`${styles.inner} ${styles.productExpression}`}>
        <p className={styles.eyebrow}>MOON ROCKS™ PLATFORM</p>
        <h2 className={styles.bandHeading} id={`${product}-expression-band-heading`}>
          {expression.heading}
        </h2>
        <p className={styles.sectionSubline}>{expression.subline}</p>
        <div className={styles.cardCopy}>
          {expression.copy.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <TierChips chips={expression.chips} />
      </div>
    </section>
  );
}

export function ClosingStripBand({
  scope,
}: {
  readonly scope: "pre-rolls" | "blunts";
}) {
  return (
    <section
      aria-labelledby={`${scope}-closing-choice`}
      className={`${styles.band} ${styles.compactBand}`}
    >
      <div className={styles.inner}>
        <ClosingStrip heading scope={scope} />
      </div>
    </section>
  );
}
